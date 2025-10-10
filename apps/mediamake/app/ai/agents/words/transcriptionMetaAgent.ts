import { AiRouter } from '@microfox/ai-router';
import { z } from 'zod/v4';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { TranscriptionSentence } from '@microfox/datamotion';
import { getDatabase } from '@/lib/mongodb';
import { Transcription } from '@/app/types/transcription';
import dedent from 'dedent';

/**
 * Transcription Meta Agent - /transcription-meta
 * Geerate Ai metadata for each sentence in the transcription (with word highlights)
 */

const aiRouter = new AiRouter();

// Schema for sentence metadata analysis
const SentenceMetadataSchema = z.object({
  keyword: z.string().describe('The most impactful keyword in the sentence'),
  strength: z
    .number()
    .min(1)
    .max(10)
    .describe('The emotional/impact strength of the keyword (1-10 scale)'),
  splitParts: z
    .array(z.string())
    .describe('The parts of the sentence split into'),
  // fullFeel: z
  //   .enum([
  //     'joyful',
  //     'melancholic',
  //     'energetic',
  //     'calm',
  //     'dramatic',
  //     'romantic',
  //     'aggressive',
  //     'hopeful',
  //     'nostalgic',
  //     'mysterious',
  //     'triumphant',
  //     'sorrowful',
  //     'playful',
  //     'intense',
  //     'peaceful',
  //   ])
  //   .describe('The emotional feel/mood of the sentence'),
  keywordFeel: z
    .enum([
      'joyful',
      'melancholic',
      'energetic',
      'calm',
      'dramatic',
      'romantic',
      'aggressive',
      'hopeful',
      'nostalgic',
      'mysterious',
      'triumphant',
      'sorrowful',
      'playful',
      'intense',
      'peaceful',
    ])
    .describe('The emotional feel/mood of the keyword'),
  // parts: z
  //   .array(z.string())
  //   .describe(
  //     'The scentence split into multiple parts if it make sense to split for impact/readability.',
  //   ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence level in the analysis (0-1)'),
});

const OverallAnalysisSchema = z.object({
  overallMood: z
    .string()
    .describe('The overall mood/theme of the entire transcription'),
  recommendedStructure: z
    .string()
    .describe('Recommended structure for lyricography'),
  keyThemes: z
    .array(z.string())
    .describe('Main themes identified in the transcription'),
  emotionalArc: z
    .string()
    .describe('The emotional journey/arc of the transcription'),
});

const TranscriptionInfoSchema = z.object({
  title: z
    .string()
    .describe(
      'A compelling, descriptive title for the transcription (max 100 characters)',
    ),
  description: z
    .string()
    .describe(
      'A comprehensive description of the transcription content (2-3 sentences, max 300 characters)',
    ),
  keywords: z
    .array(z.string())
    .describe(
      '5-10 relevant keywords that describe the content, themes, and topics',
    ),
});

const TranscriptionMetadataSchema = z.object({
  sentences: z.array(
    z.object({
      sentenceIndex: z.number(),
      originalText: z.string(),
      metadata: SentenceMetadataSchema,
      usage: z.object({
        inputTokens: z.number(),
        outputTokens: z.number(),
        reasoningTokens: z.number().optional(),
        cachedInputTokens: z.number().optional(),
        totalTokens: z.number(),
      }),
    }),
  ),
  overallAnalysis: OverallAnalysisSchema.optional(),
  transcriptionInfo: TranscriptionInfoSchema.optional(),
  totalSentences: z.number(),
  averageStrength: z.number(),
  confidence: z.number(),
  dominantFeel: z.record(z.string(), z.number()),
});

export const transcriptionMetaAgent = aiRouter
  .agent('/', async ctx => {
    try {
      console.log('ctx', ctx);
      ctx.response.writeMessageMetadata({
        loader: 'Analyzing transcription metadata...',
      });

      const { assemblyId, sentences, overallAnalysis } = ctx.request.params as {
        assemblyId?: string;
        sentences?: string[];
        overallAnalysis?: boolean;
      };

      let sentencesToAnalyze: string[] = [];

      if (assemblyId) {
        // Get database connection
        const db = await getDatabase();
        const collection = db.collection<Transcription>('transcriptions');

        // Find transcription by assemblyId
        const transcription = await collection.findOne({ assemblyId });

        if (!transcription) {
          throw new Error('Transcription not found');
        }

        if (!transcription.captions || transcription.captions.length === 0) {
          throw new Error('No captions found in transcription');
        }

        // Extract sentences from captions
        sentencesToAnalyze = transcription.captions.map(
          caption => caption.text,
        );
      } else if (
        sentences &&
        Array.isArray(sentences) &&
        sentences.length > 0
      ) {
        sentencesToAnalyze = sentences;
      } else {
        throw new Error(
          'Invalid input: either assemblyId or sentences array is required',
        );
      }

      // Analyze each sentence for metadata
      const analysisResults = await Promise.all(
        sentencesToAnalyze.map(async (sentence, index) => {
          try {
            const result = await generateObject({
              model: google('gemini-2.5-flash'),
              schema: SentenceMetadataSchema,
              prompt: `Analyze this sentence for lyricography metadata:

Sentence: "${sentence}"

Please analyze this sentence and provide:
1. The most impactful keyword that would be impactful in that scentence ( it can also be a noun - name, place, thing, etc, verb, etc..)
2. The emotional strength/power of that keyword (1-10 scale)
3. The emotional feel/mood of the keyword
4. Your confidence in this analysis

For Split Parts:
- Assume you are requested to write the scentenc on a screen in stylised form, divide the one scenten into parts to suit the needs.
- Take the keyword into consideration as well, keyowords are usually shown twice the size of the other words.
- Not every scentence need to be split, as some scentences are single words or very short.
- try your best to split evenly, but take the expression of the scentence into consideration.
- MOST IMPORTANT: SPlit it so it is easy to read by human.

Consider:
- What is the most emotionally resonant word in this sentence?
- How strong is the emotional impact of that keyword?
- What emotional tone does this keyword convey?
- How confident are you in this analysis?`,
              maxRetries: 2,
            });

            return {
              sentenceIndex: index,
              originalText: sentence,
              metadata: result.object,
              usage: result.usage,
            };
          } catch (error) {
            console.error(`Error analyzing sentence ${index}:`, error);
            // Fallback metadata for failed analysis
            return {
              sentenceIndex: index,
              originalText: sentence,
              metadata: {
                keyword: sentence.split(' ')[0] || 'unknown',
                strength: 5,
                keywordFeel: 'calm' as const,
                confidence: 0.3,
              },
              usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                cachedInputTokens: 0,
                reasoningTokens: 0,
              },
            };
          }
        }),
      );

      let overallAnalysisObject = undefined;
      let transcriptionInfoObject = undefined;

      // Generate overall analysis
      if (overallAnalysis) {
        const overallAnalysisResult = await generateObject({
          model: google('gemini-2.5-flash'),
          schema: OverallAnalysisSchema as any,
          prompt: `Based on the following sentence analysis, provide an overall assessment:

${analysisResults
  .map(
    result =>
      `Sentence ${result.sentenceIndex}: "${result.originalText}"
   - Keyword: ${result.metadata.keyword}
   - Strength: ${result.metadata.strength}/10
   - Keyword Feel: ${result.metadata.keywordFeel}
   - Confidence: ${result.metadata.confidence}`,
  )
  .join('\n\n')}

Provide an overall analysis of the transcription's mood, structure recommendations, key themes, and emotional arc.`,
          maxRetries: 2,
        });
        overallAnalysisObject = overallAnalysisResult.object;
        console.log('overallUsgae', overallAnalysisResult.usage);
      }

      // Generate transcription info (title, description, keywords) - always generate this
      const transcriptionInfoResult = await generateObject({
        model: google('gemini-2.5-flash'),
        schema: TranscriptionInfoSchema as any,
        prompt: dedent`Based on the following transcription content, generate a title, description, and keywords:

Transcription Content:
${sentencesToAnalyze.join(' ')}

Please provide:
1. A compelling, descriptive title (max 100 characters)
2. A comprehensive description of the content (2-3 sentences, max 300 characters)
3. 5-10 relevant keywords that describe the content (music, narrative, monologue, self-talk, podcast etc...), themes, and topics

Make the title engaging and descriptive. The description should summarize the main content and themes. Keywords should be relevant for search and categorization.`,
        maxRetries: 2,
      });
      transcriptionInfoObject = transcriptionInfoResult.object;
      console.log('transcriptionInfoUsage', transcriptionInfoResult.usage);
      const result = {
        sentences: analysisResults,
        overallAnalysis: overallAnalysisObject,
        transcriptionInfo: transcriptionInfoObject,
        totalSentences: sentencesToAnalyze.length,
        averageStrength:
          analysisResults.reduce((sum, r) => sum + r.metadata.strength, 0) /
          analysisResults.length,
        confidence:
          analysisResults.reduce((sum, r) => sum + r.metadata.confidence, 0) /
          analysisResults.length,
        dominantFeel: analysisResults.reduce(
          (acc, r) => {
            acc[r.metadata.keywordFeel] =
              (acc[r.metadata.keywordFeel] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      } as z.infer<typeof TranscriptionMetadataSchema>;

      // If assemblyId was provided, update the database with the metadata
      if (assemblyId) {
        const db = await getDatabase();
        const collection = db.collection<Transcription>('transcriptions');

        const transcription = await collection.findOne({ assemblyId });
        if (transcription) {
          // Update captions with metadata at caption level
          const updatedCaptions = transcription.captions.map(
            (caption, index) => {
              const resultSentence =
                index < result.sentences.length
                  ? result.sentences[index]
                  : null;
              return {
                ...caption,
                metadata: resultSentence?.metadata,
              };
            },
          );

          const updatedTranscription = {
            ...transcription,
            captions: updatedCaptions,
            // Update transcription info if available
            ...(transcriptionInfoObject && {
              title: transcriptionInfoObject.title,
              description: transcriptionInfoObject.description,
              keywords: transcriptionInfoObject.keywords,
            }),
            processingData: {
              ...transcription.processingData,
              step4: {
                ...transcription.processingData?.step4,
                metadata: result,
                generatedAt: new Date().toISOString(),
              },
            },
            updatedAt: new Date(),
          };

          await collection.updateOne(
            { _id: transcription._id },
            { $set: updatedTranscription },
          );
        }
      }

      return result;
    } catch (error) {
      console.error('Error analyzing transcription metadata:', error);
      throw error;
    }
  })
  .actAsTool('/', {
    id: 'analyzeTranscriptionMetadata',
    name: 'Analyze Transcription Metadata',
    description:
      'Analyzes sentence-split transcripts to generate metadata for lyricography, including keyword identification, emotional strength, feel, and split recommendations. Can work with assemblyId or direct sentences. Updates database directly when assemblyId is provided.',
    inputSchema: z.object({
      assemblyId: z
        .string()
        .optional()
        .describe(
          'AssemblyAI transcription ID to analyze (alternative to sentences)',
        ),
      sentences: z
        .array(z.string())
        .optional()
        .describe(
          'Array of sentence-split transcript strings to analyze (alternative to assemblyId)',
        ),
      overallAnalysis: z
        .boolean()
        .optional()
        .describe('Whether to generate overall analysis'),
    }),
    outputSchema: TranscriptionMetadataSchema,
    metadata: {
      category: 'transcription',
      tags: [
        'lyricography',
        'metadata',
        'analysis',
        'emotion',
        'keywords',
        'database',
      ],
      hidden: true,
    },
  });

export default transcriptionMetaAgent;
