import { NextRequest, NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import { path as ffprobePath } from '@ffprobe-installer/ffprobe';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

export async function POST(req: NextRequest) {
  try {
    const { src } = await req.json();
    if (!src) {
      return NextResponse.json({ error: 'src is required' }, { status: 400 });
    }

    const metadata = await new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
      ffmpeg.ffprobe(src, (err, data) => {
        if (err) {
          return reject(err);
        }
        resolve(data);
      });
    });

    const videoStream = metadata.streams.find(
      (stream) => stream.codec_type === 'video',
    );

    if (!videoStream) {
      return NextResponse.json(
        { error: 'No video stream found in the media' },
        { status: 400 },
      );
    }

    const {
      duration,
      size,
      bit_rate: bitRate,
    } = metadata.format;

    const {
      width,
      height,
      display_aspect_ratio: displayAspectRatio,
      avg_frame_rate: avgFrameRate,
    } = videoStream;

    const frameRate = avgFrameRate
      ? eval(avgFrameRate).toFixed(2)
      : undefined;
    const mediaInfo = {
      duration,
      size,
      bitRate,
      width,
      height,
      displayAspectRatio,
      frameRate,
    }
    console.log("media data for ", src, ": ", JSON.stringify(mediaInfo, null, 2))

    return NextResponse.json(mediaInfo);
  } catch (error) {
    console.error('Error fetching media info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media info' },
      { status: 500 },
    );
  }
}
