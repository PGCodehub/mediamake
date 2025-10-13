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
  AiRouterTools['analyzeTranscriptionMetadata']['output'];

/**
 * Analyzes transcription sentences for lyricography metadata
 * @param assemblyIdOrSentences Either assemblyId string or array of sentence strings
 * @param shouldGenerateOverallAnalysis Whether to generate overall analysis
 * @returns Promise with metadata analysis results
 */
export async function analyzeTranscriptionMetadata(
  assemblyIdOrSentences: string | string[],
  shouldGenerateOverallAnalysis: boolean = false,
  userRequest?: string,
): Promise<AiRouterTools['analyzeTranscriptionMetadata']['output'] | null> {
  try {
    const response = await fetch('/api/studio/chat/agent/transcription-meta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        typeof assemblyIdOrSentences === 'string'
          ? {
              assemblyId: assemblyIdOrSentences,
              overallAnalysis: shouldGenerateOverallAnalysis,
              userRequest,
            }
          : {
              sentences: assemblyIdOrSentences,
              overallAnalysis: shouldGenerateOverallAnalysis,
              userRequest,
            },
      ),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = (await response.json()) as UIMessage<
      any,
      any,
      Pick<AiRouterTools, 'analyzeTranscriptionMetadata'>
    >[];
    if (result.length > 0) {
      const output = result[0].parts.find(
        p => p.type === 'tool-analyzeTranscriptionMetadata',
      )?.output as AiRouterTools['analyzeTranscriptionMetadata']['output'];
      return output;
    }
    return null;
  } catch (error) {
    console.error('Error analyzing transcription metadata:', error);
    throw error;
  }
}

/**
 * Converts TranscriptionSentence array to string array for analysis
 * @param transcriptionSentences Array of TranscriptionSentence objects
 * @returns Array of sentence strings
 */
export function extractSentencesFromTranscription(
  transcriptionSentences: TranscriptionSentence[],
): string[] {
  return transcriptionSentences.map(sentence => sentence.text.trim());
}

/**
 * Gets sentences with high emotional strength (7+)
 * @param analysisResult The metadata analysis result
 * @returns Array of high-impact sentences
 */
export function getHighImpactSentences(
  analysisResult: TranscriptionMetadataResult,
): SentenceAnalysis[] {
  return (
    analysisResult?.sentences?.filter(
      sentence => sentence.metadata.strength >= 7,
    ) || []
  );
}

/**
 * Groups sentences by emotional feel
 * @param analysisResult The metadata analysis result
 * @returns Object with feel as key and array of sentences as value
 */
export function groupSentencesByFeel(
  analysisResult: TranscriptionMetadataResult,
): Record<string, SentenceAnalysis[]> {
  return analysisResult.sentences.reduce(
    (acc, sentence) => {
      const feel = sentence.metadata.keywordFeel;
      if (!acc[feel]) {
        acc[feel] = [];
      }
      acc[feel].push(sentence);
      return acc;
    },
    {} as Record<string, SentenceAnalysis[]>,
  );
}

/**
 * Gets the dominant emotional feel from the analysis
 * @param analysisResult The metadata analysis result
 * @returns The most common emotional feel
 */
export function getDominantFeel(
  analysisResult: TranscriptionMetadataResult,
): string {
  const feelCounts = analysisResult.dominantFeel;
  return Object.entries(feelCounts).reduce((a, b) =>
    feelCounts[a[0]] > feelCounts[b[0]] ? a : b,
  )[0];
}

/**
 * Creates a summary of the analysis for display
 * @param analysisResult The metadata analysis result
 * @returns Formatted summary string
 */
export function createAnalysisSummary(
  analysisResult: TranscriptionMetadataResult,
): string {
  const dominantFeel = getDominantFeel(analysisResult);
  const highImpactCount = getHighImpactSentences(analysisResult).length;

  const usageAccumulated = analysisResult.sentences.reduce(
    (acc, sentence) => {
      return {
        inputTokens: acc.inputTokens + sentence.usage.inputTokens,
        outputTokens: acc.outputTokens + sentence.usage.outputTokens,
        reasoningTokens:
          acc.reasoningTokens + (sentence.usage.reasoningTokens || 0),
        cachedInputTokens:
          acc.cachedInputTokens + (sentence.usage.cachedInputTokens || 0),
        totalTokens: acc.totalTokens + sentence.usage.totalTokens,
      };
    },
    {
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      cachedInputTokens: 0,
      totalTokens: 0,
    },
  );

  return `Analysis Summary:
• Total sentences: ${analysisResult.totalSentences}
• High impact sentences: ${highImpactCount}
• Dominant feel: ${dominantFeel}
• Average strength: ${analysisResult.averageStrength.toFixed(1)}/10
• Average confidence: ${analysisResult.confidence?.toFixed(2) || 'N/A'}
• Overall Usage: ${usageAccumulated.totalTokens} tokens
• Input tokens: ${usageAccumulated.inputTokens}
• Output tokens: ${usageAccumulated.outputTokens}
• Reasoning tokens: ${usageAccumulated.reasoningTokens}
• Cached input tokens: ${usageAccumulated.cachedInputTokens}
• Key themes: ${analysisResult.overallAnalysis?.keyThemes.join(', ')}
• Emotional arc: ${analysisResult.overallAnalysis?.emotionalArc}
• Overall mood: ${analysisResult.overallAnalysis?.overallMood}
• Recommended structure: ${analysisResult.overallAnalysis?.recommendedStructure}
`;
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
