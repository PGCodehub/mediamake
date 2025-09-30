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
              schema: SentenceMetadataSchema,
              prompt: `Analyze this sentence for lyricography metadata:

Sentence: "${sentence}"

Please analyze this sentence and provide:
1. The most impactful keyword that would resonate in a song lyric
2. The emotional strength/power of that keyword (1-10 scale)
3. The emotional feel/mood of the keyword
4. Your confidence in this analysis

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
      const result = {
        sentences: analysisResults,
        overallAnalysis: overallAnalysisObject,
        totalSentences: sentences.length,
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
