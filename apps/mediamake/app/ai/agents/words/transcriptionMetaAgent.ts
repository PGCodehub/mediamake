import { AiRouter } from '@microfox/ai-router';
import { z } from 'zod/v4';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { TranscriptionSentence } from '@microfox/datamotion';

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
  feel: z
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
    .describe('The emotional feel/mood of the sentence'),
  shouldSplit: z
    .boolean()
    .describe(
      'Whether this sentence should be split for lyricography (true if it has enough impact and makes sense as a standalone lyric)',
    ),
  splitReason: z
    .enum([
      'high_impact_keyword',
      'complete_thought',
      'emotional_peak',
      'rhythmic_break',
      'continuation_needed',
      'low_impact',
      'incomplete_thought',
    ])
    .describe('The reason for the split recommendation'),
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
  totalSentences: z.number(),
  splitRecommendations: z.number(),
  averageStrength: z.number(),
  dominantFeel: z.record(z.string(), z.number()),
});

export const transcriptionMetaAgent = aiRouter
  .agent('/', async ctx => {
    try {
      console.log('ctx', ctx);
      ctx.response.writeMessageMetadata({
        loader: 'Analyzing transcription metadata...',
      });

      const { sentences, overallAnalysis } = ctx.request.params as {
        sentences: string[];
        overallAnalysis: boolean;
      };

      if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
        throw new Error('Invalid input: sentences array is required');
      }

      // Analyze each sentence for metadata
      const analysisResults = await Promise.all(
        sentences.map(async (sentence, index) => {
          try {
            const result = await generateObject({
              model: google('gemini-2.5-flash'),
              schema: SentenceMetadataSchema.omit({
                shouldSplit: true,
                splitReason: true,
              }),
              prompt: `Analyze this sentence for lyricography metadata:

Sentence: "${sentence}"

Please analyze this sentence and provide:
1. The most impactful keyword that would resonate in a song lyric
2. The emotional strength/power of that keyword (1-10 scale)
3. The overall emotional feel/mood of the sentence
4. Whether this sentence should be split for lyricography (consider if it's a complete thought, has emotional impact, or if it's just a continuation)
5. The reason for your split recommendation
6. Your confidence in this analysis

Consider:
- Is this a complete thought that can stand alone as a lyric?
- Does it have emotional impact or significance?
- Is it a natural break point in the flow?
- Would it work well as a standalone line in a song?
- Is it just a connecting word or phrase that needs context?`,
              maxRetries: 2,
            });

            return {
              sentenceIndex: index,
              originalText: sentence,
              metadata: {
                ...result.object,
                shouldSplit: false,
                splitReason: 'disabled_ai_splitting' as const,
              },
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
                feel: 'calm' as const,
                shouldSplit: false,
                splitReason: 'low_impact' as const,
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
      // Generate overall analysis
      if (overallAnalysis) {
        const overallAnalysisResult = await generateObject({
          model: google('gemini-2.5-flash'),
          schema: OverallAnalysisSchema,
          prompt: `Based on the following sentence analysis, provide an overall assessment:

${analysisResults
  .map(
    result =>
      `Sentence ${result.sentenceIndex}: "${result.originalText}"
   - Keyword: ${result.metadata.keyword}
   - Strength: ${result.metadata.strength}/10
   - Feel: ${result.metadata.feel}
   - Should Split: ${result.metadata.shouldSplit}
   - Reason: ${result.metadata.splitReason}`,
  )
  .join('\n\n')}

Provide an overall analysis of the transcription's mood, structure recommendations, key themes, and emotional arc.`,
          maxRetries: 2,
        });
        overallAnalysisObject = overallAnalysisResult.object;
        console.log('overallUsgae', overallAnalysisResult.usage);
      }
      const result = {
        sentences: analysisResults,
        overallAnalysis: overallAnalysisObject,
        totalSentences: sentences.length,
        splitRecommendations: analysisResults.filter(
          r =>
            r.metadata.shouldSplit &&
            r.metadata.splitReason !== 'disabled_ai_splitting',
        ).length,
        averageStrength:
          analysisResults.reduce((sum, r) => sum + r.metadata.strength, 0) /
          analysisResults.length,
        dominantFeel: analysisResults.reduce(
          (acc, r) => {
            acc[r.metadata.feel] = (acc[r.metadata.feel] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      } as z.infer<typeof TranscriptionMetadataSchema>;

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
      'Analyzes sentence-split transcripts to generate metadata for lyricography, including keyword identification, emotional strength, feel, and split recommendations.',
    inputSchema: z.object({
      sentences: z
        .array(z.string())
        .describe('Array of sentence-split transcript strings to analyze'),
      overallAnalysis: z
        .boolean()
        .describe('Whether to generated overall analysis'),
    }) as any,
    outputSchema: TranscriptionMetadataSchema,
    metadata: {
      category: 'transcription',
      tags: ['lyricography', 'metadata', 'analysis', 'emotion', 'keywords'],
    },
  });

export default transcriptionMetaAgent;
