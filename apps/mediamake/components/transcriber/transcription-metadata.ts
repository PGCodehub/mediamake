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
