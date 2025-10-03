import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AI_ANALYSIS_CONFIG } from '@/lib/sparkbaord/config';

// Request body schema for URL indexing
const IndexingRequestSchema = z.object({
  siteLinks: z.array(z.string().url('Must be a valid URL')),
  indexingLimit: z.number().min(1).max(100).default(10),
  tags: z.array(z.string()).optional().default([]),
  crawlVideos: z.boolean().default(true),
  dbFolder: z.string().default('mediamake/scraped/default'),
});

// Response schema for indexing trigger
const IndexingResponseSchema = z.object({
  indexingId: z.string(),
  message: z.string().optional(),
  processedCount: z.number().optional(),
});

// Response schema for indexing status check
const IndexingStatusSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      indexing: z.object({
        progress: z.number(),
        isFullyIndexed: z.boolean(),
      }),
      results: z.array(z.any()).optional(),
    })
    .optional(),
  error: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!AI_ANALYSIS_CONFIG.apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI_ANALYSIS_API_KEY not configured',
        },
        { status: 500 },
      );
    }

    const body = await req.json();
    const validatedBody = IndexingRequestSchema.parse(body);

    const { siteLinks, indexingLimit, tags, crawlVideos, dbFolder } =
      validatedBody;

    // Call the AI analysis service to trigger indexing
    const response = await fetch(
      `${AI_ANALYSIS_CONFIG.baseUrl}/images/trigger`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_ANALYSIS_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          siteLinks,
          indexingLimit,
          tags,
          crawlVideos,
          dbFolder,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `AI analysis indexing failed with status ${response.status}:`,
        errorText,
      );
      return NextResponse.json(
        {
          success: false,
          error: `Indexing failed: ${response.status} ${errorText}`,
        },
        { status: response.status },
      );
    }

    const responseData = await response.json();
    const validatedResponse = IndexingResponseSchema.parse(responseData);

    if (!validatedResponse.indexingId) {
      return NextResponse.json(
        {
          success: false,
          error: validatedResponse.message || 'Indexing failed',
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      indexingId: validatedResponse.indexingId,
      message: 'Indexing started successfully',
    });
  } catch (error) {
    console.error('Indexing error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${error.issues.map((e: any) => e.message).join(', ')}`,
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

export async function GET(req: NextRequest) {
  try {
    if (!AI_ANALYSIS_CONFIG.apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI_ANALYSIS_API_KEY not configured',
        },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(req.url);
    const indexingId = searchParams.get('indexingId');
    const topK = searchParams.get('topK');

    if (!indexingId) {
      return NextResponse.json(
        {
          success: false,
          error: 'indexingId parameter is required',
        },
        { status: 400 },
      );
    }

    // Call the AI analysis service to check indexing status
    const response = await fetch(
      `${AI_ANALYSIS_CONFIG.baseUrl}/images/index?indexingId=${indexingId}&topK=${topK || 10}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_ANALYSIS_CONFIG.apiKey}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `AI analysis status check failed with status ${response.status}:`,
        errorText,
      );
      return NextResponse.json(
        {
          success: false,
          error: `Status check failed: ${response.status} ${errorText}`,
        },
        { status: response.status },
      );
    }

    const responseData = await response.json();
    const validatedResponse = IndexingStatusSchema.parse(responseData);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Status check error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${error.issues.map((e: any) => e.message).join(', ')}`,
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
