import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { MediaFile } from '@/app/types/media';
import { getClientId } from '@/lib/auth-utils';
import { encryptWebhookSecret } from '@/lib/webhook-auth';

// POST /api/media-files/[id]/segmentation - Generate segmentation for a media file (async with webhook)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    console.log('[Segmentation] Processing request for media file:', id);

    if (!ObjectId.isValid(id)) {
      console.error('[Segmentation] Invalid media file ID:', id);
      return NextResponse.json(
        { error: 'Invalid media file ID', details: 'The provided ID is not a valid MongoDB ObjectId' },
        { status: 400 },
      );
    }

    const clientId = getClientId(request);
    const db = await getDatabase();
    const collection = db.collection<MediaFile>('mediaFiles');

    // Get the media file
    const mediaFile = await collection.findOne({ _id: new ObjectId(id) });

    if (!mediaFile) {
      console.error('[Segmentation] Media file not found:', id);
      return NextResponse.json(
        { error: 'Media file not found', details: `No media file found with ID: ${id}` },
        { status: 404 },
      );
    }

    console.log('[Segmentation] Media file found:', {
      id,
      contentType: mediaFile.contentType,
      filePath: mediaFile.filePath,
    });

    // Only process images
    if (mediaFile.contentType !== 'image') {
      console.error('[Segmentation] Wrong content type:', mediaFile.contentType);
      return NextResponse.json(
        { error: 'Segmentation only supported for images', details: `Content type is ${mediaFile.contentType}` },
        { status: 400 },
      );
    }

    if (!mediaFile.filePath) {
      console.error('[Segmentation] No file path found');
      return NextResponse.json(
        { error: 'Media file has no file path', details: 'The media file does not have a valid file path' },
        { status: 400 },
      );
    }

    // Generate unique request ID
    const requestId = `seg-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Store request info for webhook processing
    const requestsCollection = db.collection('segmentationRequests');
    await requestsCollection.insertOne({
      requestId,
      mediaFileId: id,
      clientId: clientId || 'default',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      status: 'pending',
    });

    // Build webhook URL and encrypt API key
    const webhookApiKey = process.env.DEV_API_KEY || process.env.WEBHOOK_API_KEY;
    
    if (!webhookApiKey) {
      await requestsCollection.deleteOne({ requestId });
      return NextResponse.json(
        { error: 'WEBHOOK_API_KEY or DEV_API_KEY not configured' },
        { status: 500 },
      );
    }

    // Check if MEDIA_HELPER_SECRET is configured
    if (!process.env.MEDIA_HELPER_SECRET) {
      await requestsCollection.deleteOne({ requestId });
      return NextResponse.json(
        { error: 'MEDIA_HELPER_SECRET not configured' },
        { status: 500 },
      );
    }

    // Encrypt the API key using JWT
    const webhookSecret = encryptWebhookSecret(webhookApiKey);
    
    if (!webhookSecret) {
      await requestsCollection.deleteOne({ requestId });
      return NextResponse.json(
        { error: 'Failed to encrypt webhook secret' },
        { status: 500 },
      );
    }
    
    const baseWebhookUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
    const webhookUrl = `${baseWebhookUrl}/api/media-files/segmentation/webhook`;

    // Call the foregroundCutSimple API with webhook
    const baseUrl = request.nextUrl.origin;
    console.log('[Segmentation] Calling BiRefNet API with webhook:', {
      baseUrl,
      imageUrl: mediaFile.filePath,
      webhookUrl,
      requestId,
    });

    const segmentationResponse = await fetch(
      `${baseUrl}/api/foregroundCutSimple`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: mediaFile.filePath,
          output_mask: true,
          refine_foreground: true,
          output_format: 'png',
          webhookUrl,
          webhookSecret,
          requestId,
        }),
      },
    );

    console.log('[Segmentation] BiRefNet API response status:', segmentationResponse.status);

    if (!segmentationResponse.ok) {
      const errorData = await segmentationResponse.json();
      console.error('[Segmentation] BiRefNet API error:', errorData);
      await requestsCollection.deleteOne({ requestId });
      return NextResponse.json(
        {
          error: 'Segmentation failed',
          details: errorData.message || errorData.error || 'BiRefNet API returned an error',
        },
        { status: segmentationResponse.status },
      );
    }

    const segmentationData = await segmentationResponse.json();
    console.log('[Segmentation] BiRefNet API accepted request:', {
      success: segmentationData.success,
      requestId,
    });

    // Return immediately with request ID for polling
    return NextResponse.json({
      success: true,
      message: 'Segmentation request accepted',
      requestId,
      status: 'processing',
    });
  } catch (error) {
    console.error('[Segmentation] Error generating segmentation:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate segmentation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// GET /api/media-files/[id]/segmentation - Get segmentation status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid media file ID' },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const collection = db.collection<MediaFile>('mediaFiles');
    const mediaFile = await collection.findOne({ _id: new ObjectId(id) });

    if (!mediaFile) {
      return NextResponse.json(
        { error: 'Media file not found' },
        { status: 404 },
      );
    }

    // Check if segmentation exists
    const hasSegmentation = !!(mediaFile.metadata as any)?.segmentation;

    return NextResponse.json({
      success: true,
      hasSegmentation,
      segmentation: hasSegmentation ? (mediaFile.metadata as any).segmentation : null,
    });
  } catch (error) {
    console.error('[Segmentation] Error checking segmentation status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check segmentation status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
