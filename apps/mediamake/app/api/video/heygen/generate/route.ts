import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getDatabase } from '@/lib/mongodb';
import { Transcription, VideoGeneration } from '@/app/types/transcription';
import { buildHeyGenVideoRequest, HEYGEN_API_BASE_URL, HEYGEN_API_VERSION } from '@/components/transcriber/video/heygen-config';

// Increase route execution time for video generation
export const maxDuration = 300; // 5 minutes

// Request schema
const GenerateVideoRequestSchema = z.object({
  transcriptionId: z.string(),
  avatarId: z.string(),
  avatarStyle: z.string(),
  resolution: z.string().optional(),
  background: z.object({
    type: z.enum(['color', 'image']),
    value: z.string(),
  }),
  useWebhook: z.boolean().optional().default(true), // Use webhook by default
});

type GenerateVideoRequest = z.infer<typeof GenerateVideoRequestSchema>;

export async function POST(req: NextRequest) {
  try {
    const body: GenerateVideoRequest = await req.json();
    
    // Validate request
    const validatedRequest = GenerateVideoRequestSchema.parse(body);
    const { transcriptionId, avatarId, avatarStyle, resolution, background, useWebhook } = validatedRequest;
    
    // Check for API key
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'HEYGEN_API_KEY not configured' },
        { status: 500 }
      );
    }
    
    // Validate transcription ID
    if (!ObjectId.isValid(transcriptionId)) {
      return NextResponse.json(
        { error: 'Invalid transcription ID' },
        { status: 400 }
      );
    }
    
    // Fetch transcription from database
    const db = await getDatabase();
    const collection = db.collection<Transcription>('transcriptions');
    const transcription = await collection.findOne({ _id: new ObjectId(transcriptionId) });
    
    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      );
    }
    
    if (!transcription.audioUrl) {
      return NextResponse.json(
        { error: 'No audio URL found in transcription' },
        { status: 400 }
      );
    }
    
    // Build HeyGen API request
    const heygenRequest = buildHeyGenVideoRequest(
      transcription.audioUrl,
      avatarId,
      avatarStyle,
      background,
      resolution
    );
    
    // Add webhook callback URL if enabled
    if (useWebhook) {
      // Get the base URL from the request
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      const host = req.headers.get('host');
      const webhookUrl = `${protocol}://${host}/api/video/heygen/webhook`;
      
      heygenRequest.callback_id = transcriptionId; // Track transcription ID for webhook
      heygenRequest.webhook_url = webhookUrl;
      
      console.log('Webhook URL configured:', webhookUrl);
    }
    
    // Call HeyGen API to generate video
    const generateUrl = `${HEYGEN_API_BASE_URL}/${HEYGEN_API_VERSION}/video/generate`;
    console.log('Calling HeyGen API:', generateUrl);
    console.log('Request payload:', JSON.stringify(heygenRequest, null, 2));
    
    const heygenResponse = await fetch(generateUrl, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(heygenRequest),
    });
    
    // Get response text first to handle HTML error pages
    const responseText = await heygenResponse.text();
    
    if (!heygenResponse.ok) {
      console.error('HeyGen API error response:', responseText.substring(0, 500));
      
      // Try to parse as JSON, otherwise use the text
      let errorMessage = 'Failed to generate video with HeyGen';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // If it's HTML, extract a meaningful message
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
          errorMessage = `HeyGen API returned HTML (${heygenResponse.status}). Check API key and endpoint.`;
        } else {
          errorMessage = responseText.substring(0, 200);
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: heygenResponse.status }
      );
    }
    
    // Parse successful response
    let heygenData;
    try {
      heygenData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse HeyGen response:', responseText.substring(0, 500));
      return NextResponse.json(
        { error: 'Invalid JSON response from HeyGen' },
        { status: 500 }
      );
    }
    
    if (!heygenData.data?.video_id) {
      return NextResponse.json(
        { error: 'No video ID returned from HeyGen' },
        { status: 500 }
      );
    }
    
    const videoId = heygenData.data.video_id;
    
    // Create video generation record
    const videoGeneration: VideoGeneration = {
      id: videoId,
      provider: 'heygen',
      status: 'processing',
      config: {
        avatarId,
        avatarStyle,
        resolution,
        background,
      },
      createdAt: new Date(),
    };
    
    // Update transcription with video generation record
    const existingVideos = transcription.videos || [];
    const updatedVideos = [...existingVideos, videoGeneration];
    
    await collection.updateOne(
      { _id: new ObjectId(transcriptionId) },
      {
        $set: {
          videos: updatedVideos,
          updatedAt: new Date(),
        },
      }
    );
    
    return NextResponse.json({
      success: true,
      videoId,
      message: 'Video generation started',
      useWebhook,
      webhookConfigured: useWebhook,
    });
  } catch (error: any) {
    console.error('Error generating video:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    );
  }
}

