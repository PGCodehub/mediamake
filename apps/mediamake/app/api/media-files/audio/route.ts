import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getAudioMetadata,
  analyzeAudioContent,
} from '@/app/ai/agents/analysis/audioAnalysisHelpers';

// Request schema
const AudioTechnicalAnalysisRequestSchema = z.object({
  audioUrl: z.string().url('Must be a valid URL'),
  analysisOptions: z
    .object({
      extractWaveform: z.boolean().default(true),
      analyzeFrequency: z.boolean().default(true),
      detectBeats: z.boolean().default(true),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioUrl, analysisOptions } =
      AudioTechnicalAnalysisRequestSchema.parse(body);

    console.log('🎵 Processing technical analysis for:', audioUrl);

    // Get audio metadata
    console.log('📊 Getting audio metadata...');
    const audioMetadata = await getAudioMetadata(audioUrl);
    console.log('📊 Audio metadata retrieved:', {
      duration: audioMetadata.duration,
      sampleRate: audioMetadata.sampleRate,
      channels: audioMetadata.channels,
      format: audioMetadata.format,
    });

    // Perform technical analysis
    console.log('🔬 Performing technical audio analysis...');
    const technicalAnalysis = await analyzeAudioContent(
      audioUrl,
      analysisOptions || {
        extractWaveform: true,
        analyzeFrequency: true,
        detectBeats: true,
      },
    );

    console.log('🔬 Technical analysis completed:', {
      hasWaveform: !!technicalAnalysis.waveform,
      hasFrequencyData: !!technicalAnalysis.frequencyData,
      hasBeats: !!technicalAnalysis.beats,
      waveformLength: technicalAnalysis.waveform?.length || 0,
      frequencyDataLength: technicalAnalysis.frequencyData?.length || 0,
      beatsCount: technicalAnalysis.beats?.length || 0,
    });

    const result = {
      success: true,
      audioUrl,
      metadata: {
        duration: audioMetadata.duration,
        sampleRate: audioMetadata.sampleRate,
        channels: audioMetadata.channels,
        bitRate: audioMetadata.bitRate,
        format: audioMetadata.format,
        codec: audioMetadata.codec,
        fileSize: audioMetadata.fileSize,
      },
      technicalAnalysis: {
        waveform: technicalAnalysis.waveform,
        frequencyData: technicalAnalysis.frequencyData,
        beats: technicalAnalysis.beats,
        analysis: technicalAnalysis.analysis,
      },
    };

    const response = NextResponse.json(result);

    // Add cache headers for frontend caching
    response.headers.set('Cache-Control', 'public, max-age=86400'); // 24 hours
    response.headers.set('ETag', `"${Date.now()}-${audioUrl.length}"`);
    response.headers.set('Last-Modified', new Date().toUTCString());

    return response;
  } catch (error) {
    console.error('Error in audio technical analysis API:', error);
    return NextResponse.json(
      {
        success: false,
        audioUrl: 'unknown',
        metadata: {
          duration: 0,
          sampleRate: 0,
          channels: 0,
        },
        technicalAnalysis: {
          analysis: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
