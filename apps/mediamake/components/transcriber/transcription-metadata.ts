import { AiRouterTools } from '@/app/ai';
import { TranscriptionSentence } from '@microfox/datamotion';
import { ToolResultPart, ToolUIPart, UIMessage } from 'ai';

// Types for the metadata analysis results
export interface SentenceMetadata {
  keyword: string;
  strength: number; // 1-10 scale
  keywordFeel:
    | 'joyful'
    | 'melancholic'
    | 'energetic'
    | 'calm'
    | 'dramatic'
    | 'romantic'
    | 'aggressive'
    | 'hopeful'
    | 'nostalgic'
    | 'mysterious'
    | 'triumphant'
    | 'sorrowful'
    | 'playful'
    | 'intense'
    | 'peaceful';
  confidence: number; // 0-1 scale
}

export interface SentenceAnalysis {
  sentenceIndex: number;
  originalText: string;
  metadata: SentenceMetadata;
}

export interface OverallAnalysis {
  overallMood: string;
  recommendedStructure: string;
  keyThemes: string[];
  emotionalArc: string;
}

export type TranscriptionMetadataResult =
  AiRouterTools['analyzeTranscriptionMusicMetadata']['output'];

/**
 * Analyzes transcription sentences for lyricography metadata
 * @param transcriptionIdOrSentences Either transcriptionId string or array of sentence strings
 * @param shouldGenerateOverallAnalysis Whether to generate overall analysis
 * @returns Promise with metadata analysis results
 */
export async function analyzeTranscriptionMetadata(
  transcriptionIdOrSentences: string | string[],
  shouldGenerateOverallAnalysis: boolean = false,
  userRequest?: string,
): Promise<
  AiRouterTools['analyzeTranscriptionMusicMetadata']['output'] | null
> {
  try {
    const response = await fetch(
      '/api/studio/chat/agent/script-meta/music/keyword',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          typeof transcriptionIdOrSentences === 'string'
            ? {
                transcriptionId: transcriptionIdOrSentences,
                overallAnalysis: shouldGenerateOverallAnalysis,
                userRequest,
              }
            : {
                sentences: transcriptionIdOrSentences,
                overallAnalysis: shouldGenerateOverallAnalysis,
                userRequest,
              },
        ),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = (await response.json()) as UIMessage<
      any,
      any,
      Pick<AiRouterTools, 'analyzeTranscriptionMusicMetadata'>
    >[];
    if (result.length > 0) {
      const output = result[0].parts.find(
        p => p.type === 'tool-analyzeTranscriptionMusicMetadata',
      )?.output as AiRouterTools['analyzeTranscriptionMusicMetadata']['output'];
      return output;
    }
    return null;
  } catch (error) {
    console.error('Error analyzing transcription metadata:', error);
    throw error;
  }
}

/**
 * Fixes transcription errors using AI
 * @param assemblyId AssemblyAI transcription ID to fix
 * @param userRequest Optional user-specific request for transcription processing
 * @param userWrittenTranscription Optional user's written version for reference
 * @returns Promise with transcription fix results
 */
export async function fixTranscriptionErrors(
  assemblyId: string,
  userRequest?: string,
  userWrittenTranscription?: string,
): Promise<AiRouterTools['fixTranscription']['output'] | null> {
  try {
    const response = await fetch('/api/studio/chat/agent/transcription-fixer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assemblyId,
        userRequest,
        userWrittenTranscription,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = (await response.json()) as UIMessage<
      any,
      any,
      Pick<AiRouterTools, 'fixTranscription'>
    >[];
    if (result.length > 0) {
      const output = result[0].parts.find(
        p => p.type === 'tool-fixTranscription',
      )?.output as AiRouterTools['fixTranscription']['output'];
      return output;
    }
    return null;
  } catch (error) {
    console.error('Error fixing transcription:', error);
    throw error;
  }
}
