import { bundle } from '@remotion/bundler';
import {
  renderMedia,
  selectComposition,
  renderStill,
} from '@remotion/renderer';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { enableTailwind } from '@remotion/tailwind-v4';

interface LocalRenderRequest {
  compositionId: string;
  inputProps?: Record<string, any>;
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores';
  audioCodec?: 'aac' | 'mp3' | 'pcm-16' | 'opus';
  renderType?: 'video' | 'audio' | 'still';
  outputLocation?: string;
  fileName?: string;
  frameTime?: number; // Frame time in seconds for still image rendering
}

export const POST = async (req: NextRequest) => {
  try {
    const {
      compositionId,
      inputProps = {},
      codec = 'h264',
      audioCodec = 'aac',
      renderType = 'video',
      outputLocation,
      fileName,
      frameTime = 0,
    }: LocalRenderRequest = await req.json();

    // Validate required fields
    if (!compositionId) {
      return NextResponse.json(
        { error: 'Composition ID is required' },
        { status: 400 },
      );
    }

    // Validate render type
    if (!['video', 'audio', 'still'].includes(renderType)) {
      return NextResponse.json(
        { error: 'Render type must be video, audio, or still' },
        { status: 400 },
      );
    }

    console.log('Starting local render...');
    console.log('Composition ID:', compositionId);
    console.log('Codec:', codec);
    console.log('Audio Codec:', audioCodec);
    console.log('Render Type:', renderType);
    console.log('Input Props:', inputProps);

    // Create bundle
    const bundleLocation = await bundle({
      entryPoint: path.resolve('./components/remotion/index.ts'),
      webpackOverride: config => enableTailwind(config),
    });

    console.log('Bundle created at:', bundleLocation);

    // Get the composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    console.log('Composition selected:', composition);

    // Determine output location
    const outputDir = outputLocation || './out';
    const outputFileName = fileName || `${compositionId}-${Date.now()}`;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let result;

    if (renderType === 'still') {
      // Render still image
      const stillOutputPath = path.join(outputDir, `${outputFileName}.png`);

      await renderStill({
        composition,
        serveUrl: bundleLocation,
        output: stillOutputPath,
        inputProps,
        frame: Math.round(frameTime * composition.fps), // Convert seconds to frame number
        logLevel: 'error',
      });

      result = {
        type: 'still',
        outputPath: stillOutputPath,
        fileName: `${outputFileName}.png`,
        composition: composition,
      };
    } else if (renderType === 'audio') {
      // Render audio only
      const audioOutputPath = path.join(
        outputDir,
        `${outputFileName}.${audioCodec === 'aac' ? 'm4a' : audioCodec}`,
      );

      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: 'h264', // Still need video codec for audio rendering
        audioCodec,
        outputLocation: audioOutputPath,
        inputProps,
        // Audio-only rendering
        imageFormat: 'jpeg',
        jpegQuality: 1,
        videoBitrate: '1k', // Very low bitrate for audio-only
        audioBitrate: '128k',
        logLevel: 'error',
      });

      result = {
        type: 'audio',
        outputPath: audioOutputPath,
        fileName: `${outputFileName}.${audioCodec === 'aac' ? 'm4a' : audioCodec}`,
        composition: composition,
      };
    } else {
      // Render video (default)
      const videoOutputPath = path.join(outputDir, `${outputFileName}.mp4`);

      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec,
        audioCodec,
        outputLocation: videoOutputPath,
        inputProps,
        logLevel: 'error',
      });

      result = {
        type: 'video',
        outputPath: videoOutputPath,
        fileName: `${outputFileName}.mp4`,
        composition: composition,
      };
    }

    console.log('Render completed successfully!');
    console.log('Output:', result.outputPath);

    return NextResponse.json({
      success: true,
      message: `${renderType} render completed successfully`,
      result,
    });
  } catch (error) {
    console.error('Local render error:', error);
    return NextResponse.json(
      {
        error: 'Local render failed',
        message: (error as Error).message,
        stack:
          process.env.NODE_ENV === 'development'
            ? (error as Error).stack
            : undefined,
      },
      { status: 500 },
    );
  }
};
