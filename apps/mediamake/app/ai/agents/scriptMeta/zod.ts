import { z } from 'zod/v4';

// Common input schema for all scriptMeta agents
export const ScriptMetaInputSchema = z.object({
  transcriptionId: z.string().optional(),
  sentences: z.array(z.string()).optional(),
  userRequest: z.string().optional(),
});

// Base sentence metadata schema - each agent will extend this
export const BaseSentenceMetadataSchema = z.object({
  // This will be extended by each specific agent
});

// Common sentence structure
export const SentenceSchema = z.object({
  sentenceIndex: z.number(),
  originalText: z.string(),
  metadata: z.any(), // Will be the specific agent's metadata schema
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
    reasoningTokens: z.number().optional(),
    cachedInputTokens: z.number().optional(),
    totalTokens: z.number(),
  }),
});

// Transcription info schema
export const TranscriptionInfoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

// Common output schema for all scriptMeta agents
export const ScriptMetaOutputSchema = z.object({
  sentences: z.array(SentenceSchema),
  transcriptionInfo: TranscriptionInfoSchema.optional(),
  totalSentences: z.number(),
  averageStrength: z.number(),
  confidence: z.number(),
  dominantFeel: z.record(z.string(), z.number()),
});

// Type exports
export type ScriptMetaInput = z.infer<typeof ScriptMetaInputSchema>;
export type ScriptMetaOutput = z.infer<typeof ScriptMetaOutputSchema>;
export type Sentence = z.infer<typeof SentenceSchema>;
export type TranscriptionInfo = z.infer<typeof TranscriptionInfoSchema>;
