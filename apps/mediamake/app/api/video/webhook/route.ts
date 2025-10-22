import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { MediaFile } from '@/app/types/media';

// Type definitions for the WebAction Recorder webhook payload
interface WebhookPayload {
  event: 'recording.completed' | 'recording.failed';
  status: 'success' | 'error';
  data: RecordingResponse;
  requestId?: string;
}

interface RecordingResponse {
  success: boolean;
  videoUrl?: string;
  duration?: number;
  size?: number;
  format?: string;
  resolution?: string;
  recordedAt?: string;
  error?: string;
  message?: string;
  code?: number;
}

// POST /api/video/webhook - Process webhook data from WebAction Recorder
export async function POST(request: NextRequest) {
  try {
    // The WebAction Recorder API already decrypted the JWT
    // We receive the plain API key in the Authorization header
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey) {
      console.error('No Authorization header provided');
      return NextResponse.json(
        { error: 'Unauthorized - No API key provided' },
        { status: 401 },
      );
    }

    // Validate API key matches expected key
    const validApiKey = process.env.DEV_API_KEY || process.env.WEBHOOK_API_KEY;
    
    if (apiKey !== validApiKey) {
      console.error('API key does not match expected key');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 },
      );
    }

    console.log('Webhook authenticated successfully');
    
    const rawBody = await request.text();

    // Parse the JSON payload
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('Invalid JSON payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 },
      );
    }

    const { event, status, data, requestId } = payload;

    // Validate required fields
    if (!event || !status || !data) {
      return NextResponse.json(
        { error: 'Invalid payload: missing required fields' },
        { status: 400 },
      );
    }

    console.log(`Processing webhook event: ${event} with status: ${status}`);

    // If recording failed, log the error and return success (webhook received)
    if (event === 'recording.failed' || status === 'error' || !data.success) {
      console.error('Recording failed:', data.error || data.message);
      return NextResponse.json({
        success: true,
        message: 'Webhook received, recording failed',
        error: data.error || data.message,
      });
    }

    // Validate video URL
    if (!data.videoUrl) {
      console.error('No video URL in successful recording');
      return NextResponse.json(
        { error: 'No video URL provided' },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    
    // Retrieve tags and clientId from temporary storage FIRST
    const { tags, clientId } = await getRequestData(requestId, db);
    
    const collection = db.collection('mediaFiles');

    // Check if media file with this requestId already exists (idempotency)
    if (requestId) {
      const existingFile = await collection.findOne({
        'metadata.requestId': requestId,
        clientId: clientId || 'default',
      });

      if (existingFile) {
        console.log(
          `Media file with requestId ${requestId} already exists, skipping`,
        );
        return NextResponse.json({
          success: true,
          message: 'Media file already exists',
          mediaFileId: existingFile._id,
        });
      }
    }

    // Generate filename from URL or use timestamp
    const fileName = data.videoUrl.split('/').pop() || `recording-${Date.now()}.mp4`;

    // Create media file entry
    const mediaFile: MediaFile = {
      tags: tags.length > 0 ? tags : ['webrecorder'], // Default tag if none found
      clientId: clientId || 'default',
      contentType: 'video',
      contentMimeType: data.format === 'webm' ? 'video/webm' : 'video/mp4',
      contentSubType: 'recorded',
      contentSource: 'webrecorder',
      contentSourceUrl: data.videoUrl,
      fileName,
      fileSize: data.size || 0,
      filePath: data.videoUrl,
      metadata: {
        duration: data.duration,
        resolution: data.resolution,
        format: data.format,
        recordedAt: data.recordedAt,
        requestId,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as MediaFile;

    // Insert the media file
    const result = await collection.insertOne(mediaFile);

    console.log(
      `Created media file with ID: ${result.insertedId} for recording: ${requestId}`,
    );

    // Clean up temporary request data
    if (requestId) {
      await cleanupRequestData(requestId, db);
    }

    return NextResponse.json({
      success: true,
      message: 'Recording processed successfully',
      mediaFileId: result.insertedId,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      {
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// Helper function to retrieve request data (tags and clientId)
async function getRequestData(
  requestId: string | undefined,
  db: any
): Promise<{ tags: string[]; clientId: string }> {
  if (!requestId) {
    return { tags: [], clientId: 'default' };
  }

  try {
    const collection = db.collection('webRecorderRequests');
    const requestData = await collection.findOne({ requestId });
    
    if (requestData) {
      return {
        tags: requestData.tags || [],
        clientId: requestData.clientId || 'default',
      };
    }
  } catch (error) {
    console.error('Error retrieving request data:', error);
  }

  return { tags: [], clientId: 'default' };
}

// Helper function to clean up temporary request data
async function cleanupRequestData(requestId: string, db: any): Promise<void> {
  try {
    const collection = db.collection('webRecorderRequests');
    await collection.deleteOne({ requestId });
  } catch (error) {
    console.error('Error cleaning up request data:', error);
  }
}

