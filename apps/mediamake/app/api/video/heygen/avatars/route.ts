import { NextRequest, NextResponse } from 'next/server';
import { HEYGEN_API_BASE_URL, HEYGEN_API_VERSION } from '@/components/transcriber/video/heygen-config';

export async function GET(req: NextRequest) {
  try {
    // Check for API key
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'HEYGEN_API_KEY not configured' },
        { status: 500 }
      );
    }
    
    // Call HeyGen API to get available avatars
    const avatarsUrl = `${HEYGEN_API_BASE_URL}/${HEYGEN_API_VERSION}/avatars`;
    console.log('Fetching HeyGen avatars:', avatarsUrl);
    
    const heygenResponse = await fetch(avatarsUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'application/json',
      },
    });
    
    // Get response text first to handle HTML error pages
    const responseText = await heygenResponse.text();
    
    if (!heygenResponse.ok) {
      console.error('HeyGen API error response:', responseText.substring(0, 500));
      
      let errorMessage = 'Failed to fetch avatars';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
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
    
    if (!heygenData.data) {
      return NextResponse.json(
        { error: 'Invalid response from HeyGen' },
        { status: 500 }
      );
    }
    
    // Return avatar list
    return NextResponse.json({
      success: true,
      avatars: heygenData.data.avatars || [],
    });
  } catch (error: any) {
    console.error('Error fetching avatars:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch avatars' },
      { status: 500 }
    );
  }
}

