import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Transcription, VideoGeneration } from '@/app/types/transcription';
import { HEYGEN_API_BASE_URL, HEYGEN_API_VERSION } from '@/components/transcriber/video/heygen-config';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId parameter is required' },
        { status: 400 }
      );
    }
    
    // Check for API key
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'HEYGEN_API_KEY not configured' },
        { status: 500 }
      );
    }
    
    // Call HeyGen API to check video status
    // Note: Status endpoint uses v1, not v2!
    const statusUrl = `${HEYGEN_API_BASE_URL}/v1/video_status.get?video_id=${videoId}`;
    console.log('Checking HeyGen video status:', statusUrl);
    
    const heygenResponse = await fetch(statusUrl, {
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
      
      // Try to parse as JSON, otherwise use the text
      let errorMessage = 'Failed to fetch video status';
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
    
    if (!heygenData.data) {
      return NextResponse.json(
        { error: 'Invalid response from HeyGen' },
        { status: 500 }
      );
    }
    
    const videoData = heygenData.data;
    const status = videoData.status; // 'pending', 'processing', 'completed', 'failed'
    
    // Map HeyGen status to our status
    let mappedStatus: 'processing' | 'completed' | 'failed';
    if (status === 'completed') {
      mappedStatus = 'completed';
    } else if (status === 'failed') {
      mappedStatus = 'failed';
    } else {
      mappedStatus = 'processing';
    }
    
    // If video is completed or failed, update the transcription
    if (mappedStatus === 'completed' || mappedStatus === 'failed') {
      const db = await getDatabase();
      const collection = db.collection<Transcription>('transcriptions');
      
      // Find transcription with this video
      const transcription = await collection.findOne({
        'videos.id': videoId,
      });
      
      if (transcription) {
        // Update the video record
        const updatedVideos = transcription.videos?.map((video) => {
          if (video.id === videoId) {
            return {
              ...video,
              status: mappedStatus,
              videoUrl: mappedStatus === 'completed' ? videoData.video_url : undefined,
              thumbnailUrl: mappedStatus === 'completed' ? videoData.thumbnail_url : undefined,
              error: mappedStatus === 'failed' ? videoData.error?.message || 'Video generation failed' : undefined,
            };
          }
          return video;
        });
        
        await collection.updateOne(
          { _id: transcription._id },
          {
            $set: {
              videos: updatedVideos,
              updatedAt: new Date(),
            },
          }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      videoId,
      status: mappedStatus,
      videoUrl: videoData.video_url,
      thumbnailUrl: videoData.thumbnail_url,
      error: videoData.error?.message,
      duration: videoData.duration,
    });
  } catch (error: any) {
    console.error('Error checking video status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check video status' },
      { status: 500 }
    );
  }
}

