'use server';

import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Safely configure ffmpeg paths (optional in serverless environments)
let ffmpegConfigured = false;

function configureFfmpegPaths() {
  if (ffmpegConfigured) return;

  try {
    // Dynamic import with try-catch to handle missing binaries in serverless
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    const ffprobeInstaller = require('@ffprobe-installer/ffprobe');

    if (ffmpegInstaller?.path) {
      ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    }
    if (ffprobeInstaller?.path) {
      ffmpeg.setFfprobePath(ffprobeInstaller.path);
    }
    ffmpegConfigured = true;
  } catch (error) {
    // Silently ignore if ffmpeg/ffprobe installers are not available
    // This is expected in some serverless environments
    console.warn(
      'ffmpeg/ffprobe installers not available, using system binaries if available:',
      error instanceof Error ? error.message : String(error),
    );
    ffmpegConfigured = true; // Mark as configured to avoid repeated warnings
  }
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  bitRate?: number;
  frameRate?: number;
}

export interface FrameExtractionOptions {
  pickFrame: 'start' | 'end' | 'middle';
  duration: number;
}

/**
 * Get video metadata using ffprobe
 */
export async function getVideoMetadata(
  videoUrl: string,
): Promise<VideoMetadata> {
  configureFfmpegPaths();

  return new Promise<VideoMetadata>((resolve, reject) => {
    // Add timeout and better error handling
    const timeout = setTimeout(() => {
      reject(
        new Error('ffprobe timeout - video metadata request took too long'),
      );
    }, 30000); // 30 second timeout

    ffmpeg.ffprobe(
      videoUrl,
      [
        '-tls_verify',
        '0', // Disable TLS certificate verification
        '-protocol_whitelist',
        'file,http,https,tcp,tls',
        '-timeout',
        '30000',
      ],
      (err, data) => {
        clearTimeout(timeout);

        if (err) {
          console.error('ffprobe error for URL:', videoUrl);
          console.error('ffprobe error details:', err.message);

          // Check for specific SSL/TLS errors
          if (err.message.includes('TLS') || err.message.includes('SSL')) {
            return reject(
              new Error(
                `SSL/TLS connection failed for video URL. This might be due to network issues or the video server's SSL configuration. Original error: ${err.message}`,
              ),
            );
          }

          // Check for timeout errors
          if (
            err.message.includes('timeout') ||
            err.message.includes('ETIMEDOUT')
          ) {
            return reject(
              new Error(
                `Video metadata request timed out. The video server might be slow or unreachable. Original error: ${err.message}`,
              ),
            );
          }

          return reject(
            new Error(`Failed to get video metadata: ${err.message}`),
          );
        }

        const videoStream = data.streams.find(
          stream => stream.codec_type === 'video',
        );

        if (!videoStream) {
          return reject(new Error('No video stream found in the provided URL'));
        }

        const duration = data.format.duration || 0;
        const width = videoStream.width || 0;
        const height = videoStream.height || 0;
        const bitRate = data.format.bit_rate;
        const frameRate = videoStream.avg_frame_rate
          ? eval(videoStream.avg_frame_rate)
          : undefined;

        resolve({
          duration,
          width,
          height,
          bitRate,
          frameRate,
        });
      },
    );
  });
}

/**
 * Extract a frame from video at specified time
 */
export async function extractFrame(
  videoUrl: string,
  options: FrameExtractionOptions,
): Promise<string> {
  configureFfmpegPaths();

  const { pickFrame, duration } = options;

  let frameTime = 0;
  if (pickFrame === 'start') {
    frameTime = 0;
  } else if (pickFrame === 'end') {
    frameTime = Math.max(0, duration - 1);
  } else if (pickFrame === 'middle') {
    frameTime = duration / 2;
  }

  const tempFramePath = path.join(os.tmpdir(), `frame-${Date.now()}.jpg`);

  return new Promise<string>((resolve, reject) => {
    // Add timeout for frame extraction
    const timeout = setTimeout(() => {
      reject(
        new Error(
          'Frame extraction timeout - ffmpeg took too long to extract frame',
        ),
      );
    }, 60000); // 60 second timeout for frame extraction

    ffmpeg(videoUrl)
      .inputOptions([
        '-tls_verify',
        '0', // Disable TLS certificate verification
        '-protocol_whitelist',
        'file,http,https,tcp,tls',
        '-timeout',
        '30000',
      ])
      .seekInput(frameTime)
      .frames(1)
      .output(tempFramePath)
      .on('end', () => {
        clearTimeout(timeout);
        resolve(tempFramePath);
      })
      .on('error', err => {
        clearTimeout(timeout);
        console.error('ffmpeg frame extraction error for URL:', videoUrl);
        console.error('ffmpeg error details:', err.message);

        // Check for specific SSL/TLS errors
        if (err.message.includes('TLS') || err.message.includes('SSL')) {
          return reject(
            new Error(
              `SSL/TLS connection failed during frame extraction. This might be due to network issues or the video server's SSL configuration. Original error: ${err.message}`,
            ),
          );
        }

        // Check for timeout errors
        if (
          err.message.includes('timeout') ||
          err.message.includes('ETIMEDOUT')
        ) {
          return reject(
            new Error(
              `Frame extraction timed out. The video server might be slow or unreachable. Original error: ${err.message}`,
            ),
          );
        }

        return reject(new Error(`Failed to extract frame: ${err.message}`));
      })
      .run();
  });
}

/**
 * Read frame as base64 string
 */
export async function readFrameAsBase64(framePath: string): Promise<string> {
  const frameBuffer = fs.readFileSync(framePath);
  return frameBuffer.toString('base64');
}

/**
 * Clean up temporary frame file
 */
export async function cleanupFrame(framePath: string): Promise<void> {
  try {
    fs.unlinkSync(framePath);
  } catch (error) {
    console.warn('Failed to cleanup frame file:', error);
  }
}
