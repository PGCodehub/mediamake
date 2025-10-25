import { AiRouter } from '@microfox/ai-router';
import { z } from 'zod';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { getDatabase } from '@/lib/mongodb';
import { MediaFile } from '@/app/types/media';
import {
  getVideoMetadata,
  extractFrame,
  readFrameAsBase64,
  cleanupFrame,
  type VideoMetadata,
  type FrameExtractionOptions,
} from './reflectiveThinkHelpers';

const aiRouter = new AiRouter();

// Input schema for the reflectiveThink agent
const ReflectiveThinkInputSchema = z.object({
  tags: z.array(z.string()).optional().describe('Array of string tags'),
  videoUrls: z
    .array(z.string().url())
    .describe('Array of video URLs to analyze'),
  userRequest: z
    .string()
    .optional()
    .describe('User request or context for quote generation'),
  pickFrame: z
    .enum(['start', 'end', 'middle'])
    .default('middle')
    .describe('Which frame to extract from videos'),
  model: z.string().optional().describe('Model to use for analysis'),
});

const quoteResultSchema = z.object({
  quote: z
    .string()
    .describe(
      'A 1-2 line inspirational or reflective quote based on the image analysis',
    ),
  style: z.string().describe('The style or tone of the quote'),
});

// Output schema for the agent
const ReflectiveThinkOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
  quotes: z
    .array(
      z.object({
        videoUrl: z.string().describe('Original video URL'),
        frameUrl: z.string().describe('Extracted frame URL'),
        analysis: z.string().describe('AI analysis of the frame'),
        quote: quoteResultSchema.describe('Generated quote based on analysis'),
      }),
    )
    .describe('Array of generated quotes with analysis'),
  error: z.string().optional().describe('Error message if operation failed'),
});

export const reflectiveThinkAgent = aiRouter
  .agent('/', async ctx => {
    try {
      ctx.response.writeMessageMetadata({
        loader: 'Processing reflective thinking...',
      });

      const clientId = ctx.request.clientId;
      const { videoUrls, userRequest, pickFrame, model, tags } =
        ctx.request.params;

      const selectedModel = google(model ?? 'gemini-2.5-pro');
      const db = await getDatabase();
      const collection = db.collection('mediaFiles');

      const results = [];

      for (const videoUrl of videoUrls) {
        try {
          ctx.response.writeMessageMetadata({
            loader: `Processing video: ${videoUrl}`,
          });

          // Step 1: Get video metadata using helper
          const videoMetadata = await getVideoMetadata(videoUrl);

          // Create media file entry
          const mediaFile: MediaFile = {
            tags: ['reflective-think', 'video-analysis', ...(tags || [])],
            clientId: clientId || 'default',
            contentType: 'video',
            contentMimeType: 'video/mp4',
            contentSubType: 'mp4',
            contentSource: 'reflective-think-agent',
            contentSourceUrl: videoUrl,
            metadata: {
              duration: videoMetadata.duration,
              width: videoMetadata.width,
              height: videoMetadata.height,
              bitRate: videoMetadata.bitRate,
              frameRate: videoMetadata.frameRate,
              originalUrl: videoUrl,
            },
            fileName: `video-reflective-think-${Date.now()}.mp4`,
            fileSize: 0,
            filePath: videoUrl, // Using original URL for now
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const mediaResult = await collection.insertOne(mediaFile);

          // Step 2: Extract frame from video using helper
          const tempFramePath = await extractFrame(videoUrl, {
            pickFrame,
            duration: videoMetadata.duration,
          });

          // Step 3: Analyze the extracted frame with Gemini
          const frameBase64 = await readFrameAsBase64(tempFramePath);

          const analysisResult = await generateObject({
            model: selectedModel,
            schema: z.object({
              analysis: z
                .string()
                .describe(
                  'Detailed analysis of the image content, emotions, and visual elements',
                ),
              mood: z
                .string()
                .describe('The overall mood or atmosphere of the image'),
              keyElements: z
                .array(z.string())
                .describe('Key visual elements in the image'),
              emotions: z
                .array(z.string())
                .describe('Emotions conveyed by the image'),
            }),
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analyze this image and provide insights about its content, mood, and visual elements.`,
                  },
                  {
                    type: 'image',
                    image: frameBase64,
                  },
                ],
              },
            ],
          });

          console.log('USAGE FOR FRAME ANALYSIS RESULT', analysisResult.usage);

          // Step 4: Generate quote based on analysis
          const quoteResult = await generateObject({
            model: selectedModel,
            schema: quoteResultSchema,
            system: `You are masterful writer who has a way with words.
            You can understand the users request deeply, and generate a meaningul 1-2 line quote.
            `,
            prompt: `Based on this image analysis: "${analysisResult.object.analysis}" ${userRequest ? `and the user's request: "${userRequest}"` : ''} The mood of the video is ${analysisResult.object.mood} and key elements include: ${analysisResult.object.keyElements.join(', ')}.`,
          });

          console.log('USAGE FOR QUOTE RESULT', quoteResult.usage);

          // Clean up temporary file
          await cleanupFrame(tempFramePath);

          results.push({
            videoUrl,
            frameUrl: videoUrl, // Using original URL for now
            analysis: analysisResult.object.analysis,
            quote: quoteResult.object,
            mediaFileId: mediaResult.insertedId.toString(),
            mediaFile: mediaFile,
          });
        } catch (error) {
          console.error(`Error processing video ${videoUrl}:`, error);

          // Add the error to results for better user feedback
          results.push({
            videoUrl,
            frameUrl: videoUrl,
            analysis: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
            quote: 'Unable to generate quote due to processing error.',
            mediaFileId: null,
            mediaFile: null,
          });
        }
      }

      return {
        success: results.length > 0,
        quotes: results,
      };
    } catch (error) {
      console.error('Error in reflective think agent:', error);
      return {
        success: false,
        quotes: [],
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  })
  .actAsTool('/', {
    id: 'reflectiveThink',
    name: 'Reflective Think Agent',
    description:
      'Analyzes videos to extract frames and generate reflective quotes',
    inputSchema: ReflectiveThinkInputSchema,
    outputSchema: ReflectiveThinkOutputSchema,
    metadata: {
      name: 'Reflective Think Agent',
      description:
        'Analyzes videos to extract frames and generate reflective quotes',
      hideUI: false,
      customUI: true,
      customUIType: 'presets',
    },
  });
