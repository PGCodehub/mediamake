import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AssemblyAI } from 'assemblyai';
import { captionMutator } from '@microfox/datamotion';
import {
  TranscriptionSentenceSchema,
  TranscriptionWordSchema,
} from '@/components/editor/presets/types';

// --- AssemblyAI Schemas ---
const AssemblyAIWordSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
  confidence: z.number(),
});

const AssemblyAIUtteranceSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
  words: z.array(AssemblyAIWordSchema),
});

// --- Request/Response Schemas ---
const TranscriptionRequestSchema = z.object({
  audioUrl: z.string().startsWith('https://'),
  language: z.string().optional(),
});

const TranscriptionResponseSchema = z.object({
  id: z.string(),
  language_code: z.string(),
  success: z.boolean(),
  captions: z.array(TranscriptionSentenceSchema),
  error: z.string().optional(),
});

// --- Types ---
type AssemblyAIWord = z.infer<typeof AssemblyAIWordSchema>;
type AssemblyAIUtterance = z.infer<typeof AssemblyAIUtteranceSchema>;
type Word = z.infer<typeof TranscriptionWordSchema>;
type Caption = z.infer<typeof TranscriptionSentenceSchema>;
type TranscriptionRequest = z.infer<typeof TranscriptionRequestSchema>;

export const generateCaptions = (utterances: AssemblyAIUtterance[]) => {
  let captions: Caption[] = utterances.map(
    (utterance: AssemblyAIUtterance, index: number): Caption => {
      const words: Word[] = utterance.words.map((word: AssemblyAIWord) => ({
        text: word.text,
        start: (word.start - utterance.start) / 1000,
        absoluteStart: word.start / 1000,
        end: (word.end - utterance.start) / 1000,
        absoluteEnd: word.end / 1000,
        duration: (word.end - word.start) / 1000,
        confidence: word.confidence,
      }));

      return {
        id: `caption-${index}`,
        text: utterance.text,
        start: utterance.start / 1000,
        absoluteStart: utterance.start / 1000,
        end: utterance.end / 1000,
        absoluteEnd: utterance.end / 1000,
        duration: (utterance.end - utterance.start) / 1000,
        words: words,
      };
    },
  );
  if (captions.length === 1 && captions[0].words.length > 10) {
    captions = captionMutator(captions, {
      maxCharactersPerSentence: 50,
      maxSentenceDuration: 2,
      minSentenceDuration: 0.5,
      splitStrategy: 'smart',
    });
  }
  return captions;
};
