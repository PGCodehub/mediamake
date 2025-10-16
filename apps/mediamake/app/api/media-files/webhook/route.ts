import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { MediaFile, RagImageMetadata } from '@/app/types/media';
import { getClientId } from '@/lib/auth-utils';
import crypto from 'crypto';

// Type definitions for the webhook payload
interface WebhookDoc {
  id: string;
  metadata: RagImageMetadata;
  doc: string;
}

interface IndexRequest {
  query?: string;
  siteLink: string;
  platform: string;
  platformId: string;
  platformUrl: string;
  indexingLimit?: number;
  indexingId?: string;
  userTags?: string[];
  dbFolder?: string;
  webhookUrl?: string;
  webhookSecret?: string;
}

interface WebhookPayload {
  docs: WebhookDoc[];
  indexRequest: IndexRequest;
}

// Convert RAG metadata to MediaFile format
function convertRagToMediaFile(
  doc: WebhookDoc,
  indexRequest: IndexRequest,
  clientId: string,
): MediaFile {
  const { metadata } = doc;

  // Extract tags from various sources
  const tags: string[] = [];

  // Add user tags from index request
  if (indexRequest.userTags?.length) {
    tags.push(...indexRequest.userTags);
  }

  // Add user tags from metadata
  if (metadata.userTags?.length) {
    tags.push(...metadata.userTags);
  }

  // Remove duplicates and ensure all tags are strings
  const uniqueTags = [...new Set(tags)].filter(tag => typeof tag === 'string');

  // Determine content type from metadata
  let contentType: 'video' | 'audio' | 'image' | 'document' | 'unknown' =
    'unknown';
  if (metadata.mediaType) {
    switch (metadata.mediaType.toLowerCase()) {
      case 'image':
        contentType = 'image';
        break;
      case 'video':
        contentType = 'video';
        break;
      case 'audio':
        contentType = 'audio';
        break;
      default:
        contentType = 'unknown';
    }
  } else if (metadata.mimeType) {
    if (metadata.mimeType.startsWith('image/')) {
      contentType = 'image';
    } else if (metadata.mimeType.startsWith('video/')) {
      contentType = 'video';
    } else if (metadata.mimeType.startsWith('audio/')) {
      contentType = 'audio';
    }
  }
  // Create file path from src or use a generated path
  const filePath = metadata.src || `webhook/${doc.id}`;

  // Generate filename from URL or use ID
  const fileName = doc.id
    ? doc.id
    : metadata.src
      ? metadata.src.split('/').pop() || `webhook-${doc.id}`
      : `webhook-${doc.id}`;

  return {
    tags: uniqueTags,
    clientId,
    contentMimeType: metadata.mimeType || 'image/jpeg',
    contentSubType: 'indexed',
    contentSource: metadata.platform || 'web',
    contentSourceUrl:
      metadata.pagePermalink || metadata.platformUrl || metadata.src,
    fileName,
    fileSize: 0,
    contentType,
    metadata: {
      ...metadata,
    },
    filePath,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as MediaFile;
}

// POST /api/media-files/webhook - Process webhook data and create media files
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientId(request);
    console.log('clientId', clientId);
    console.log('Processing webhook request', clientId);
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

    const { docs, indexRequest } = payload;

    // Validate required fields
    if (!docs || !Array.isArray(docs)) {
      return NextResponse.json(
        { error: 'Invalid payload: docs must be an array' },
        { status: 400 },
      );
    }

    console.log(
      `Processing webhook with ${docs.length} documents for client: ${clientId}`,
    );

    const db = await getDatabase();
    const collection = db.collection('mediaFiles');

    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      errorCount: 0,
      errorDetails: [] as string[],
    };

    // Process all documents in parallel
    const processDoc = async (doc: WebhookDoc) => {
      try {
        // Check if media file already exists
        const existingFile = await collection.findOne({
          fileName: doc.id,
          clientId: clientId || 'default',
        });

        if (existingFile) {
          console.log(
            `Media file with webhook ID ${doc.id} already exists, skipping`,
          );
          return { status: 'skipped', docId: doc.id };
        }

        // Convert RAG data to MediaFile format
        const mediaFile = convertRagToMediaFile(
          doc,
          indexRequest,
          clientId || 'default',
        );

        // Insert the media file
        const result = await collection.insertOne(mediaFile);

        console.log(
          `Created media file with ID: ${result.insertedId} for webhook doc: ${doc.id}`,
        );
        return {
          status: 'created',
          docId: doc.id,
          insertedId: result.insertedId,
        };
      } catch (error) {
        console.error(`Error processing doc ${doc.id}:`, error);
        return {
          status: 'error',
          docId: doc.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    };

    // Process all documents in parallel
    const docResults = await Promise.all(docs.map(processDoc));

    // Aggregate results
    docResults.forEach(result => {
      results.processed++;
      switch (result.status) {
        case 'created':
          results.created++;
          break;
        case 'skipped':
          results.skipped++;
          break;
        case 'error':
          results.errorCount++;
          results.errorDetails.push(`Doc ${result.docId}: ${result.error}`);
          break;
      }
    });

    console.log(`Webhook processing completed:`, results);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} documents`,
      results: {
        processed: results.processed,
        created: results.created,
        skipped: results.skipped,
        errors: results.errorCount,
        errorDetails: results.errorDetails,
      },
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
