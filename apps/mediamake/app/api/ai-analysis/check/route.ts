import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AI_ANALYSIS_CONFIG } from '@/lib/sparkbaord/config';

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
    console.log('responseData - indexing status check', responseData);
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
