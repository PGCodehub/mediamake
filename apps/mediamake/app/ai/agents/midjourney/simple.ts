import { AiRouter } from '@microfox/ai-router';
import { z } from 'zod/v4';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import dedent from 'dedent';

const aiRouter = new AiRouter();

// Image analysis schema for first generateObject call
const ImageAnalysisSchema = z.object({
  imageDescriptions: z
    .array(
      z.object({
        description: z
          .string()
          .describe(
            'Detailed description of the image content, style, mood, and visual elements',
          ),
      }),
    )
    .describe('Analysis of each provided image'),
  userRequestAlignment: z
    .string()
    .describe('What the user wants to learn from the given images'),
});

// Midjourney prompt schema for second generateObject call
const MidjourneyPromptSchema = z.object({
  prompts: z
    .array(
      z.object({
        prompt: z
          .string()
          .describe('Generated Midjourney prompt for this shot'),
      }),
    )
    .describe('Generated Midjourney prompts for each shot'),
});

const MidjourneyPromptsWithVariationsSchema = z.object({
  prompts: z
    .array(
      z.object({
        prompt: z
          .string()
          .describe('Generated Midjourney prompt for this shot'),
        variations: z
          .array(z.string())
          .optional()
          .describe('Additional variations of the prompt'),
      }),
    )
    .describe('Generated Midjourney prompts for each shot'),
});

// Input schema for the agent
const MidjourneyPromptingInputSchema = z.object({
  shots: z
    .array(z.string().describe('Description of the shot'))
    .describe('Array of shots to generate'),
  mediaUrls: z
    .array(z.string())
    .optional()
    .describe('Array of image URLs to analyze'),
  variationCount: z
    .number()
    .optional()
    .describe('Number of variations to generate'),
  model: z.string().optional().describe('AI model to use for generation'),
  predefinedPreferences: z
    .array(z.string())
    .optional()
    .describe(
      'Array of predefined preferences that will be attached at the end of the generated prompt',
    ),
  userRequest: z
    .string()
    .optional()
    .describe('User request or context for shot generation'),
});

// Output schema for the agent
const MidjourneyPromptingOutputSchema = z.object({
  prompts: z.array(
    z.object({
      shotIndex: z.number(),
      shotDescription: z.string(),
      prompt: z.string(),
      variations: z.array(z.string()).optional(),
    }),
  ),
  processedShots: z.number().describe('Number of shots processed'),
  imageAnalysisUsed: z.boolean().describe('Whether image analysis was used'),
});

// Helper function to download image and convert to base64
async function downloadImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

export const midjourneySimpleAgent = aiRouter
  .agent('/', async ctx => {
    try {
      ctx.response.writeMessageMetadata({
        loader: 'Analyzing images and generating Midjourney prompts...',
      });

      const {
        shots,
        mediaUrls,
        variationCount = 0,
        userRequest,
        model,
        predefinedPreferences = [],
      } = ctx.request.params as z.infer<typeof MidjourneyPromptingInputSchema>;

      if (!shots || shots.length === 0) {
        throw new Error('No shots provided for analysis');
      }

      let imageAnalysis = null;
      let imageBase64Data: string[] = [];

      // First generateObject call: Analyze images if provided
      if (mediaUrls && mediaUrls.length > 0) {
        ctx.response.writeMessageMetadata({
          loader: 'Downloading and analyzing reference images...',
        });

        // Download and convert images to base64
        imageBase64Data = await Promise.all(
          mediaUrls.map(url => downloadImageAsBase64(url)),
        );

        const imageAnalysisResult = await generateObject({
          model: google(model || 'gemini-2.5-flash'),
          schema: ImageAnalysisSchema,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: dedent`
                    Analyze these reference images in the context of the user's request: "${userRequest || 'Generate Midjourney prompts for the given shots'}"
                    
                    For each image, provide a detailed description of the content, style, mood, and visual elements.
                    
                    The user wants to generate Midjourney prompts for shots based on these reference images.
                  `,
                },
                ...imageBase64Data.map(base64 => ({
                  type: 'image' as const,
                  image: base64,
                })),
              ],
            },
          ],
          maxRetries: 2,
        });

        imageAnalysis = imageAnalysisResult.object;
        console.log('Image Analysis USAGE', imageAnalysisResult.usage);
      }

      // Second generateObject call: Generate Midjourney prompts
      ctx.response.writeMessageMetadata({
        loader: 'Generating Midjourney prompts for shots...',
      });

      let allPrompts: any[] = [];

      if (shots.length <= 10) {
        // Process all shots at once if 10 or fewer
        const promptGenerationResult = await generateObject({
          model: google(model || 'gemini-2.5-pro'),
          schema:
            variationCount === 0
              ? MidjourneyPromptSchema
              : MidjourneyPromptsWithVariationsSchema,
          prompt: dedent`
            Generate Midjourney prompts for these shots based on the user's request: "${userRequest || 'Generate creative Midjourney prompts'}"
            
            Shots to process (${shots.length} total):
            ${shots.map((shot: string, index: number) => `${index}: "${shot}"`).join('\n')}
            
            ${
              imageAnalysis
                ? `
            Reference Image Descriptions:
            ${imageAnalysis.imageDescriptions
              .map((desc, index) => `Image ${index + 1}: ${desc.description}`)
              .join('\n')}
            
            User Request Alignment: ${imageAnalysis.userRequestAlignment}
            `
                : ''
            }
            
            ${
              predefinedPreferences.length > 0
                ? `
            Predefined Preferences to include: ${predefinedPreferences.join(', ')}
            `
                : ''
            }
            
            Generate Midjourney prompts that align with the user's request and reference images (if provided).
            Each prompt should be optimized for Midjourney and be creative and engaging.
            ${variationCount > 1 ? `Generate ${variationCount} variations for each shot.` : ''}
            Do not include -ar tags, -v tags, or other Midjourney parameters in the prompts.
          `,
          maxOutputTokens: 4000,
          maxRetries: 2,
        });

        console.log('Prompt Generation USAGE', promptGenerationResult.usage);
        allPrompts =
          promptGenerationResult.object.prompts?.map((prompt: any) => ({
            ...prompt,
            shotInfo:
              prompt.shotIndex < shots.length
                ? shots[prompt.shotIndex]
                : undefined,
          })) || [];
      } else {
        // Process in batches of 10
        const batchSize = 10;
        const batches = [];

        for (let i = 0; i < shots.length; i += batchSize) {
          const batch = shots.slice(i, i + batchSize);
          batches.push({
            batch,
            batchStartIndex: i,
            batchNumber: Math.floor(i / batchSize) + 1,
          });
        }

        ctx.response.writeMessageMetadata({
          loader: `Processing ${batches.length} batches of shots...`,
        });

        // Process all batches in parallel
        const batchResults = await Promise.all(
          batches.map(async ({ batch, batchStartIndex, batchNumber }) => {
            const promptGenerationResult = await generateObject({
              model: google(model || 'gemini-2.5-flash'),
              schema: MidjourneyPromptSchema,
              prompt: dedent`
                Generate Midjourney prompts for these shots based on the user's request: "${userRequest || 'Generate creative Midjourney prompts'}"
                
                Shots to process (Batch ${batchNumber}/${batches.length}, ${batch.length} shots):
                ${batch.map((shot: string, index: number) => `${batchStartIndex + index}: "${shot}"`).join('\n')}
                
                ${
                  imageAnalysis
                    ? `
                Reference Image Descriptions:
                ${imageAnalysis.imageDescriptions
                  .map(
                    (desc, index) => `Image ${index + 1}: ${desc.description}`,
                  )
                  .join('\n')}
                
                User Request Alignment: ${imageAnalysis.userRequestAlignment}
                `
                    : ''
                }
                
                ${
                  predefinedPreferences.length > 0
                    ? `
                Predefined Preferences to include: ${predefinedPreferences.join(', ')}
                `
                    : ''
                }
                
                Generate Midjourney prompts that align with the user's request and reference images (if provided).
                Each prompt should be optimized for Midjourney and be creative and engaging.
                ${variationCount > 1 ? `Generate ${variationCount} variations for each shot.` : ''}
                Do not include -ar tags, -v tags, or other Midjourney parameters in the prompts.
              `,
              maxOutputTokens: 4000,
              maxRetries: 2,
            });

            console.log(
              `Batch ${batchNumber} USAGE`,
              promptGenerationResult.usage,
            );
            return promptGenerationResult.object.prompts;
          }),
        );

        // Flatten all batch results into a single array
        allPrompts = batchResults.flat();
      }

      const result = {
        prompts: allPrompts,
        processedShots: shots.length,
        imageAnalysisUsed: !!imageAnalysis,
      };

      return result;
    } catch (error) {
      console.error('Error generating Midjourney prompts:', error);
      throw error;
    }
  })
  .actAsTool('/', {
    id: 'generateMidjourneyPromptsSimple',
    name: 'Shot Based Midjourney Prompts (Simple)',
    description:
      'Analyzes reference images and generates Midjourney prompts for shots based on user request and image analysis.',
    inputSchema: MidjourneyPromptingInputSchema,
    outputSchema: MidjourneyPromptingOutputSchema,
    metadata: {
      icon: '🎨',
      title: 'Midjourney Prompt Generator (Simple)',
      hideUI: false,
      category: 'ai-generation',
      tags: [
        'midjourney',
        'image-generation',
        'prompts',
        'ai-art',
        'shots',
        'visual-content',
      ],
    },
  });
