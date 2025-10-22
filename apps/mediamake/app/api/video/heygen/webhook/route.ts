import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Transcription } from '@/app/types/transcription';

// Webhook endpoint for HeyGen video generation events
// Events: avatar_video.success, avatar_video.fail
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('Received HeyGen webhook:', JSON.stringify(body, null, 2));
    
    const { event_type, event_data } = body;
    
    if (!event_data?.video_id) {
      console.error('No video_id in webhook data');
      return NextResponse.json({ error: 'No video_id provided' }, { status: 400 });
    }
    
    const videoId = event_data.video_id;
    
    // Determine status based on event type
    let status: 'completed' | 'failed';
    let videoUrl: string | undefined;
    let thumbnailUrl: string | undefined;
    let error: string | undefined;
    
    if (event_type === 'avatar_video.success') {
      status = 'completed';
      videoUrl = event_data.video_url;
      thumbnailUrl = event_data.thumbnail_url;
    } else if (event_type === 'avatar_video.fail') {
      status = 'failed';
      error = event_data.error?.message || 'Video generation failed';
    } else {
      console.log('Unknown event type:', event_type);
      return NextResponse.json({ message: 'Event type not handled' }, { status: 200 });
    }
    
    // Update transcription in database
    const db = await getDatabase();
    const collection = db.collection<Transcription>('transcriptions');
    
    // Find transcription with this video
    const transcription = await collection.findOne({
      'videos.id': videoId,
    });
    
    if (!transcription) {
      console.error('Transcription not found for video:', videoId);
      return NextResponse.json({ error: 'Transcription not found' }, { status: 404 });
    }
    
    // Update the video record
    const updatedVideos = transcription.videos?.map((video) => {
      if (video.id === videoId) {
        return {
          ...video,
          status,
          videoUrl,
          thumbnailUrl,
          error,
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
    
    console.log(`Updated video ${videoId} with status: ${status}`);
    
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error: any) {
    console.error('Error processing HeyGen webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification (if needed)
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'HeyGen webhook endpoint is active',
    events: ['avatar_video.success', 'avatar_video.fail'],
  });
}

