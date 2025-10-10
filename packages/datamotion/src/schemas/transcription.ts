import z from 'zod';

export const TranscriptionWordSchema = z.object({
  text: z.string(),
  start: z.number(),
  absoluteStart: z.number(),
  end: z.number(),
  absoluteEnd: z.number(),
  duration: z.number(),
  confidence: z.number(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type TranscriptionWord = z.infer<typeof TranscriptionWordSchema>;

export const TranscriptionSentenceSchema = z.object({
  id: z.string(),
  text: z.string(),
  start: z.number(),
  absoluteStart: z.number(),
  end: z.number(),
  absoluteEnd: z.number(),
  duration: z.number(),
  words: z.array(TranscriptionWordSchema),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type TranscriptionSentence = z.infer<typeof TranscriptionSentenceSchema>;
