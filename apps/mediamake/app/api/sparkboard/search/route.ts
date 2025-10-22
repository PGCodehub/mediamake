import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AI_ANALYSIS_CONFIG } from '@/lib/sparkbaord/config';
import {
  SearchQuerySchema,
  SearchResponseSchema,
  ErrorResponseSchema,
} from '@/lib/sparkbaord/types';
import { getDatabase } from '@/lib/mongodb';
import { getClientId } from '@/lib/auth-utils';
import { MediaFile, RagImageMetadata } from '@/app/types/media';
import { ObjectId } from 'mongodb';

// Convert search result to MediaFile format
function convertSearchResultToMediaFile(
  searchResult: any,
  clientId: string,
): MediaFile {
  const metadata = searchResult.metadata || {};

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
  const filePath = metadata.src || `search/${searchResult.id}`;

  // Generate filename from URL or use ID
  const fileName = searchResult.id
    ? String(searchResult.id)
    : metadata.src
      ? metadata.src.split('/').pop() || `search-${searchResult.id}`
      : `search-${searchResult.id}`;

  return {
    _id: new ObjectId(), // Generate random ObjectId for new files
    tags: [],
    clientId,
    contentMimeType: metadata.mimeType || 'image/jpeg',
    contentSubType: 'full',
    contentSource: metadata.platform || 'sparkboard-search',
    contentSourceUrl:
      metadata.pagePermalink || metadata.platformUrl || metadata.src || '',
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

export async function GET(req: NextRequest) {
  try {
    // Check if API key is configured
    if (!AI_ANALYSIS_CONFIG.apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'SPARKBOARD_API_KEY not configured',
        },
        { status: 500 },
      );
    }

    // Get client ID
    const clientId = getClientId(req) || 'default';

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = SearchQuerySchema.parse(queryParams);
    const { searchType, ...searchApiParams } = validatedParams;

    // Build the search URL with query parameters (excluding searchType)
    const searchUrl = new URL(`${AI_ANALYSIS_CONFIG.baseUrl}/search/images`);

    // Add all validated parameters to the URL (excluding searchType)
    Object.entries(searchApiParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchUrl.searchParams.set(key, String(value));
      }
    });

    // Make the request to the AI analysis service
    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_ANALYSIS_CONFIG.apiKey}`,
      },
    });

    // Handle different response status codes
    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Search request failed with status ${response.status}:`,
        errorText,
      );

      // Parse error response if possible
      let errorMessage = `Search failed: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = `${errorMessage} ${errorText}`;
      }

      // Return appropriate error response based on status code
      if (response.status === 400) {
        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: response.status },
      );
    }

    // Parse and validate the successful response
    const responseData = await response.json();
    const validatedResponse = responseData;

    // Get database connection
    const db = await getDatabase();
    const collection = db.collection('mediaFiles');

    // Process search results based on searchType
    const processedResults: MediaFile[] = [];

    for (const searchResult of validatedResponse.data.results) {
      //   console.log(searchResult);
      // Check if this search result exists in the database
      const existingMediaFile = await collection.findOne({
        filePath: searchResult.metadata?.src,
        ...(searchType === 'clientFiles' ? { clientId: clientId } : {}),
      });

      if (existingMediaFile) {
        // File exists in database
        if (searchType === 'clientFiles') {
          processedResults.push(existingMediaFile as MediaFile);
        } else if (searchType === 'mediaFiles') {
          // Include all files from database (no client ID check)
          processedResults.push(existingMediaFile as MediaFile);
        } else if (searchType === 'allFiles') {
          // Include all files from database
          processedResults.push(existingMediaFile as MediaFile);
        }
      } else {
        // File doesn't exist in database
        if (searchType === 'allFiles') {
          // Convert search result to MediaFile format
          const mediaFile = convertSearchResultToMediaFile(
            searchResult,
            clientId,
          );
          processedResults.push(mediaFile);
        }
        // For clientFiles and mediaFiles, we only return existing files from DB
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results: processedResults,
        total: processedResults.length,
        searchType,
        clientId,
      },
    });
  } catch (error) {
    console.error('Search error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => {
        const path = issue.path.join('.');
        return `${path}: ${issue.message}`;
      });

      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${errorMessages.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Handle other errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
