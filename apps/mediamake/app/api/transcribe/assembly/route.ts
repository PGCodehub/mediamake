import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AssemblyAI } from 'assemblyai';
import { captionMutator } from '@microfox/datamotion';

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
export const TranscriptionWordSchema = z.object({
  text: z.string(),
  start: z.number(),
  absoluteStart: z.number().optional(),
  end: z.number(),
  absoluteEnd: z.number().optional(),
  duration: z.number(),
  confidence: z.number(),
});

export type TranscriptionWord = z.infer<typeof TranscriptionWordSchema>;

export const TranscriptionSentenceSchema = z.object({
  id: z.string(),
  text: z.string(),
  start: z.number(),
  absoluteStart: z.number().optional(),
  end: z.number(),
  absoluteEnd: z.number().optional(),
  duration: z.number(),
  words: z.array(TranscriptionWordSchema),
});

export type TranscriptionSentence = z.infer<typeof TranscriptionSentenceSchema>;

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
/**
 * Transcribes an audio file using AssemblyAI.
 */
async function transcribeAudio(
  audioUrl: string,
  language?: string,
): Promise<
  Partial<{ captions: Caption[]; id: string; language_code: string }>
> {
  const assemblyAIKey = process.env.ASSEMBLYAI_API_KEY ?? '';

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

    const captions = generateCaptions(transcript.utterances);

    // Validate the output with Zod before returning
    return {
      id: transcript.id,
      language_code: transcript.language_code,
      captions: z.array(TranscriptionSentenceSchema).parse(captions),
    };
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

    const { audioUrl, language } = validatedRequest;

    // Perform transcription
    const { captions, id, language_code } = await transcribeAudio(
      audioUrl,
      language,
    );

    // Return successful response
    const response = TranscriptionResponseSchema.parse({
      success: true,
      id,
      language_code,
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

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  const assemblyAIKey = process.env.ASSEMBLYAI_API_KEY ?? '';
  const client = new AssemblyAI({ apiKey: assemblyAIKey });

  if (!id) {
    const allTranscripts = await client.transcripts.list();
    return NextResponse.json({ transcripts: allTranscripts }, { status: 200 });
  }

  const transcript = await client.transcripts.get(id);

  if (!transcript) {
    return NextResponse.json(
      { error: 'Transcript not found.' },
      { status: 404 },
    );
  }
  if (!transcript.utterances) {
    return NextResponse.json(
      { error: 'Utterance data is missing from the AssemblyAI response.' },
      { status: 400 },
    );
  }

  const captions = generateCaptions(transcript.utterances);
  return NextResponse.json({
    id,
    language_code: transcript.language_code,
    success: true,
    captions,
    audio_url: transcript.audio_url,
  });
};
