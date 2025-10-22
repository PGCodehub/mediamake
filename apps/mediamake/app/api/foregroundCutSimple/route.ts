import { NextRequest, NextResponse } from 'next/server';

// POST /api/foregroundCutSimple - Remove background from image
export async function POST(request: NextRequest) {
  try {
    console.log('[BiRefNet] Received background removal request');

    // Get environment variables (server-side only)
    const baseUrl = process.env.MEDIA_HELPER_URL;
    const apiKey = process.env.MEDIA_HELPER_API_KEY;

    console.log('[BiRefNet] Configuration check:', {
      hasBaseUrl: !!baseUrl,
      hasApiKey: !!apiKey,
      baseUrl: baseUrl ? `${baseUrl.substring(0, 20)}...` : 'not set',
    });

    if (!baseUrl) {
      console.error('[BiRefNet] MEDIA_HELPER_URL not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'CONFIGURATION_ERROR',
          message: 'MEDIA_HELPER_URL environment variable not set',
          code: 500,
        },
        { status: 500 },
      );
    }

    if (!apiKey) {
      console.error('[BiRefNet] MEDIA_HELPER_API_KEY not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'CONFIGURATION_ERROR',
          message: 'MEDIA_HELPER_API_KEY environment variable not set',
          code: 500,
        },
        { status: 500 },
      );
    }

    // Parse request body
    const body = await request.json();
    console.log('[BiRefNet] Request parameters:', {
      image_url: body.image_url?.substring(0, 50) + '...',
      model: body.model,
      output_mask: body.output_mask,
      hasWebhook: !!body.webhookUrl,
    });
    const {
      image_url,
      model = 'General Use (Light)',
      operating_resolution,
      output_mask = true,
      refine_foreground = true,
      sync_mode = false,
      output_format = 'png',
      webhookUrl,
      webhookSecret,
      requestId,
    } = body;

    if (!image_url) {
      console.error('[BiRefNet] No image_url provided');
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'image_url is required',
          code: 400,
        },
        { status: 400 },
      );
    }

    // Call the external BiRefNet API
    const externalUrl = `${baseUrl}/api/foregroundCutSimple`;
    console.log('[BiRefNet] Calling external BiRefNet API:', externalUrl);

    // Build request body
    const requestBody: any = {
      image_url,
      model,
      operating_resolution,
      output_mask,
      refine_foreground,
      sync_mode,
      output_format,
    };

    // Add webhook parameters if provided
    if (webhookUrl) {
      requestBody.webhookUrl = webhookUrl;
      requestBody.webhookSecret = webhookSecret;
      requestBody.requestId = requestId;
      console.log('[BiRefNet] Including webhook parameters');
    }

    const response = await fetch(externalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[BiRefNet] External API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[BiRefNet] External API failed with status ${response.status}:`,
        errorText,
      );

      return NextResponse.json(
        {
          success: false,
          error: 'PROCESSING_ERROR',
          message: `Background removal failed: ${errorText}`,
          code: response.status,
        },
        { status: response.status },
      );
    }

    const result = await response.json();
    console.log('[BiRefNet] External API success, returning result');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in foregroundCutSimple endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'PROCESSING_ERROR',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 500,
      },
      { status: 500 },
    );
  }
}

// GET /api/foregroundCutSimple - Get API documentation
export async function GET() {
  return NextResponse.json({
    name: 'BiRefNet Background Removal API',
    description:
      'Remove background from images using BiRefNet AI model. Returns foreground cutout, mask image, and background-only image.',
    endpoints: {
      POST: {
        description: 'Remove background from an image',
        parameters: {
          image_url: 'URL of the image to process (required)',
          model:
            'Model to use: General Use (Light), General Use (Light 2K), General Use (Heavy), Matting, Portrait (default: General Use (Light))',
          operating_resolution:
            'Resolution: 1024x1024 or 2048x2048 (auto-detected if not provided)',
          output_mask: 'Whether to output mask image (default: true)',
          refine_foreground:
            'Whether to refine foreground edges (default: true)',
          sync_mode: 'Return as data URI (default: false)',
          output_format: 'Output format: webp, png, gif (default: png)',
        },
        response: {
          success: 'boolean',
          image: 'Foreground cutout with transparent background',
          mask_image: 'Black and white mask (if output_mask is true)',
          background_image:
            'Background only with foreground removed (if output_mask is true)',
        },
      },
    },
  });
}

