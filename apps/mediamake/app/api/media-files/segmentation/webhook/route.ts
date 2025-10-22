import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { MediaFile } from '@/app/types/media';

interface SegmentationWebhookPayload {
  event: 'segmentation.completed' | 'segmentation.failed';
  status: 'success' | 'error';
  requestId: string;
  data?: {
    success: boolean;
    image?: {
      url: string;
      width: number;
      height: number;
      content_type: string;
      file_name: string;
    };
    mask_image?: {
      url: string;
      width: number;
      height: number;
      content_type: string;
      file_name: string;
    };
    background_image?: {
      url: string;
      width: number;
      height: number;
      content_type: string;
      file_name: string;
    };
    error?: string;
    message?: string;
  };
}

async function getRequestData(
  requestId: string | undefined,
  db: any
): Promise<{ mediaFileId: string; clientId: string }> {
  if (!requestId) {
    throw new Error('No requestId provided');
  }

  const requestsCollection = db.collection('segmentationRequests');
  const requestData = await requestsCollection.findOne({ requestId });

  if (!requestData) {
    throw new Error(`No segmentation request found for requestId: ${requestId}`);
  }

  return {
    mediaFileId: requestData.mediaFileId,
    clientId: requestData.clientId,
  };
}

// POST /api/media-files/segmentation/webhook - Webhook for segmentation results
export async function POST(request: NextRequest) {
  try {
    console.log('[Segmentation Webhook] Received webhook request');

    // Verify authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Segmentation Webhook] Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Extract the API key from Bearer token
    // The external API has already decrypted our webhookSecret and is sending the actual API key
    const apiKey = authHeader.substring(7); // Remove 'Bearer '

    // Verify the API key matches our expected key
    const expectedApiKey = process.env.DEV_API_KEY || process.env.WEBHOOK_API_KEY;
    if (apiKey !== expectedApiKey) {
      console.error('[Segmentation Webhook] API key mismatch');
      return NextResponse.json(
        { error: 'Unauthorized: Invalid API key' },
        { status: 401 }
      );
    }

    console.log('[Segmentation Webhook] Authorization verified');

    // Parse webhook payload
    const payload: SegmentationWebhookPayload = await request.json();
    console.log('[Segmentation Webhook] Payload:', {
      event: payload.event,
      status: payload.status,
      requestId: payload.requestId,
      hasData: !!payload.data,
    });

    // Get request data from database
    const db = await getDatabase();
    const { mediaFileId, clientId } = await getRequestData(payload.requestId, db);

    console.log('[Segmentation Webhook] Found request data:', {
      mediaFileId,
      clientId,
    });

    // Update request status
    const requestsCollection = db.collection('segmentationRequests');
    await requestsCollection.updateOne(
      { requestId: payload.requestId },
      {
        $set: {
          status: payload.status === 'success' ? 'completed' : 'failed',
          updatedAt: new Date(),
          result: payload.data,
        },
      }
    );

    if (payload.status === 'success' && payload.data?.success) {
      // Extract segmentation results
      const segmentation = {
        foreground: {
          url: payload.data.image?.url || '',
          width: payload.data.image?.width || 0,
          height: payload.data.image?.height || 0,
          content_type: payload.data.image?.content_type || 'image/png',
          file_name: payload.data.image?.file_name || 'foreground.png',
        },
        background: {
          url: payload.data.background_image?.url || '',
          width: payload.data.background_image?.width || 0,
          height: payload.data.background_image?.height || 0,
          content_type: payload.data.background_image?.content_type || 'image/png',
          file_name: payload.data.background_image?.file_name || 'background.png',
        },
        mask: {
          url: payload.data.mask_image?.url || '',
          width: payload.data.mask_image?.width || 0,
          height: payload.data.mask_image?.height || 0,
          content_type: payload.data.mask_image?.content_type || 'image/png',
          file_name: payload.data.mask_image?.file_name || 'mask.png',
        },
      };

      // Update media file with segmentation data
      console.log('[Segmentation Webhook] Updating media file with segmentation data');
      const mediaCollection = db.collection<MediaFile>('mediaFiles');
      const updateResult = await mediaCollection.findOneAndUpdate(
        { _id: new ObjectId(mediaFileId) },
        {
          $set: {
            'metadata.segmentation': segmentation,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      if (!updateResult) {
        console.error('[Segmentation Webhook] Failed to update media file');
        return NextResponse.json(
          { error: 'Failed to update media file' },
          { status: 500 }
        );
      }

      console.log('[Segmentation Webhook] Successfully updated media file with segmentation');

      return NextResponse.json({
        success: true,
        message: 'Segmentation data saved successfully',
        mediaFileId,
      });
    } else {
      // Handle failure
      console.error('[Segmentation Webhook] Segmentation failed:', payload.data?.error || payload.data?.message);

      return NextResponse.json({
        success: false,
        message: 'Segmentation failed',
        error: payload.data?.error || payload.data?.message || 'Unknown error',
      });
    }
  } catch (error) {
    console.error('[Segmentation Webhook] Error processing webhook:', error);
    return NextResponse.json(
      {
        error: 'Failed to process segmentation webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

