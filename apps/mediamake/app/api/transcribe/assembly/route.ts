import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AssemblyAI } from 'assemblyai';

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

// --- Transcription Schemas ---
const WordSchema = z.object({
  word: z.string(),
  startTime: z.number(),
  endTime: z.number(),
});

const CaptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  words: z.array(WordSchema),
});

// --- Request/Response Schemas ---
const TranscriptionRequestSchema = z.object({
  audioUrl: z.string().url('Invalid audio URL'),
  apiKey: z.string().optional(),
  language: z.string().optional(),
});

const TranscriptionResponseSchema = z.object({
  success: z.boolean(),
  captions: z.array(CaptionSchema),
  error: z.string().optional(),
});

// --- Types ---
type AssemblyAIWord = z.infer<typeof AssemblyAIWordSchema>;
type AssemblyAIUtterance = z.infer<typeof AssemblyAIUtteranceSchema>;
type Word = z.infer<typeof WordSchema>;
type Caption = z.infer<typeof CaptionSchema>;
type TranscriptionRequest = z.infer<typeof TranscriptionRequestSchema>;

/**
 * Transcribes an audio file using AssemblyAI.
 */
async function transcribeAudio(
  audioUrl: string,
  apiKey: string,
  language?: string,
): Promise<Caption[]> {
  const assemblyAIKey = apiKey || process.env.ASSEMBLYAI_API_KEY;

  if (!assemblyAIKey) {
    throw new Error('AssemblyAI API key is required.');
  }

  const client = new AssemblyAI({ apiKey: assemblyAIKey });

  try {
    console.log(`Starting AssemblyAI transcription for: ${audioUrl}`);

    const params: any = {
      audio: audioUrl,
      speech_model: 'universal',
      speaker_labels: true,
    };

    if (language) {
      params.language_code = language;
      console.log(`Using language hint: ${language}`);
    }

    const transcript = await client.transcripts.transcribe(params);

    if (transcript.status === 'error') {
      throw new Error(`AssemblyAI transcription failed: ${transcript.error}`);
    }

    if (!transcript.utterances) {
      throw new Error(
        'Utterance data is missing from the AssemblyAI response.',
      );
    }

    console.log('Successfully received transcription from AssemblyAI');

    const captions: Caption[] = transcript.utterances.map(
      (utterance: AssemblyAIUtterance, index: number): Caption => {
        const words: Word[] = utterance.words.map((word: AssemblyAIWord) => ({
          word: word.text,
          startTime: word.start / 1000,
          endTime: word.end / 1000,
        }));

        return {
          id: `caption-${index}`,
          text: utterance.text,
          startTime: utterance.start / 1000,
          endTime: utterance.end / 1000,
          words: words,
        };
      },
    );

    // Validate the output with Zod before returning
    return z.array(CaptionSchema).parse(captions);
  } catch (error) {
    console.error('An error occurred during AssemblyAI transcription:', error);
    throw new Error('Failed to transcribe audio with AssemblyAI.');
  }
}

export const POST = async (req: NextRequest) => {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validatedRequest = TranscriptionRequestSchema.parse(body);

    const { audioUrl, apiKey, language } = validatedRequest;

    // Perform transcription
    const captions = await transcribeAudio(audioUrl, apiKey || '', language);

    // Return successful response
    const response = TranscriptionResponseSchema.parse({
      success: true,
      captions,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Transcription error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${error.issues.map((e: any) => e.message).join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Handle other errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
};
