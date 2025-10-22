import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getClientId } from '@/lib/auth-utils';
import { encryptWebhookSecret } from '@/lib/webhook-auth';

// POST /api/video/record - Create a recording job
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientId(request);
    
    // Get environment variables (server-side only)
    const baseUrl = process.env.MEDIA_HELPER_URL;
    const apiKey = process.env.MEDIA_HELPER_API_KEY;
    
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'MEDIA_HELPER_URL environment variable not set' },
        { status: 500 },
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'MEDIA_HELPER_API_KEY environment variable not set' },
        { status: 500 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { recordingRequest, tags } = body;

    if (!recordingRequest || !tags) {
      return NextResponse.json(
        { error: 'Missing recordingRequest or tags' },
        { status: 400 },
      );
    }

    // Generate unique request ID
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Store tags and client info for webhook processing
    const db = await getDatabase();
    const requestsCollection = db.collection('webRecorderRequests');
    await requestsCollection.insertOne({
      requestId,
      tags,
      clientId: clientId || 'default',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Build webhook URL and encrypt API key
    const webhookApiKey = process.env.DEV_API_KEY || process.env.WEBHOOK_API_KEY;
    
    if (!webhookApiKey) {
      return NextResponse.json(
        { error: 'WEBHOOK_API_KEY or DEV_API_KEY not configured' },
        { status: 500 },
      );
    }

    // Check if MEDIA_HELPER_SECRET is configured
    if (!process.env.MEDIA_HELPER_SECRET) {
      return NextResponse.json(
        { error: 'MEDIA_HELPER_SECRET not configured' },
        { status: 500 },
      );
    }

    // Encrypt the API key using JWT
    const webhookSecret = encryptWebhookSecret(webhookApiKey);
    
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Failed to encrypt webhook secret' },
        { status: 500 },
      );
    }
    
    const baseWebhookUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
    const webhookUrl = `${baseWebhookUrl}/api/video/webhook`;

    // Prepare the payload with encrypted webhook secret
    const payload = {
      ...recordingRequest,
      webhookUrl,
      webhookSecret, // Encrypted API key
      requestId,
    };

    console.log('Sending recording request to WebAction Recorder API:', JSON.stringify(payload, null, 2));
    console.log('Target URL:', `${baseUrl}/api/record`);
    console.log('Base URL from env:', baseUrl);

    // Call WebAction Recorder API
    const response = await fetch(`${baseUrl}/api/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WebAction Recorder API error:', response.status, errorText);
      
      // Clean up stored request data on error
      await requestsCollection.deleteOne({ requestId });
      
      return NextResponse.json(
        { 
          error: 'Failed to create recording job',
          details: errorText,
          status: response.status,
        },
        { status: response.status },
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: result.success || false,
      message: result.message,
      jobId: result.jobId,
      requestId,
    });
  } catch (error) {
    console.error('Error creating recording job:', error);
    
    // Check for SSL/TLS errors
    if (error instanceof Error) {
      if (error.message.includes('SSL') || error.message.includes('certificate') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          {
            error: 'Connection error to WebAction Recorder API',
            details: error.message,
            hint: 'Check that MEDIA_HELPER_URL is correct (http:// vs https://) and the API is running',
          },
          { status: 503 },
        );
      }
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// GET /api/video/record?jobId=xxx - Get recording job status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 },
      );
    }

    const baseUrl = process.env.MEDIA_HELPER_URL;
    const apiKey = process.env.MEDIA_HELPER_API_KEY;

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Media Helper API not configured' },
        { status: 500 },
      );
    }

    const response = await fetch(`${baseUrl}/api/record/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to get job status', details: errorText },
        { status: response.status },
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting job status:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

