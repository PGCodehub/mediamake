import { AiRouter } from '@microfox/ai-router';
import { z } from 'zod/v4';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { saveTranscriptionMetadata } from './helpers';
import {
  ScriptMetaInputSchema,
  ScriptMetaOutputSchema,
  SentenceSchema,
} from './zod';
import dedent from 'dedent';
import {
  getPromptPreset,
  getAllPromptPresets,
  getAllPromptsWithCustom,
  getPromptPresetWithCustom,
  getPromptPresetsByCategory,
  getPromptPresetsByTag,
  searchPromptPresets,
  DEFAULT_PRESET_ID,
  type ImagePromptPreset,
} from './imagePromptRegistry';
import { getDatabase } from '@/lib/mongodb';
import {
  CustomImagePromptSchema,
  customPromptDocumentToResponse,
  type CustomImagePromptDocument,
} from '@/lib/models/CustomImagePrompt';

/**
 * Text-to-Image Agent - /text-to-image
 * 
 * MAIN ROUTE:
 * - / : Generate images for each caption using AI prompt transformation and text-to-image API
 * 
 * EASY WORKFLOW (View, Edit, Save):
 * - /prompts/preview : Preview full prompt text when you select a preset
 * - /prompts/save-and-use : Save edited prompt and get the new ID to use
 * 
 * OTHER PROMPT ROUTES:
 * - /prompts/list : List all available prompt presets (built-in + custom)
 * - /prompts/get/:id : Get full details of a specific prompt including systemPrompt text
 * - /prompts/save : Save or update a custom prompt preset (advanced)
 * - /prompts/delete/:id : Delete a custom prompt preset
 * 
 * RECOMMENDED WORKFLOW:
 * 1. Select preset from dropdown → Use /prompts/preview to see full text
 * 2. Copy systemPrompt → Edit it
 * 3. Use /prompts/save-and-use → Get your new custom ID
 * 4. Generate images with your custom promptPresetId
 */

const aiRouter = new AiRouter();

// Text-to-image metadata schema
const TextToImageMetadataSchema = z.object({
  imagePrompt: z
    .string()
    .describe('The AI-generated image prompt for this caption'),
  promptPresetId: z.string().optional().describe('The prompt preset ID used'),
  taskId: z.string().optional().describe('The text-to-image task ID'),
  imageUrl: z.string().optional().describe('The generated image URL'),
  imageSize: z.string().optional().describe('The image size used'),
  imageResolution: z.string().optional().describe('The image resolution used'),
  status: z
    .enum(['pending', 'processing', 'completed', 'failed'])
    .describe('The status of image generation - processing means task submitted, webhook will update when done'),
  error: z.string().optional().describe('Error message if generation failed'),
  completedAt: z.string().optional().describe('When the image was completed (ISO timestamp)'),
});

// Legacy: IMAGE_GENERATION_SYSTEM_PROMPT moved to imagePromptRegistry.ts
// Now using dynamic prompt presets from the registry

// Helper function to call text-to-image API with webhook
async function generateImageForCaption(
  prompt: string,
  transcriptionId: string,
  captionIndex: number,
  imageSize: string = 'landscape_16_9',
  imageResolution: string = '1K',
): Promise<{ taskId: string; error?: string }> {
  const baseUrl = process.env.MEDIA_HELPER_URL;

  if (!baseUrl) {
    throw new Error('MEDIA_HELPER_URL environment variable not set');
  }

  // Construct webhook URL
  // If running locally, you might need ngrok or similar for testing
  const webhookBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                         process.env.VERCEL_URL || 
                         'http://localhost:3000';
  const webhookUrl = `${webhookBaseUrl}/api/webhooks/text-to-image`;

  try {
    const response = await fetch(`${baseUrl}/api/text-to-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: imageSize,
        image_resolution: imageResolution,
        max_images: 1,
        webhook_url: webhookUrl,
        webhook_metadata: {
          transcriptionId,
          captionIndex,
          imagePrompt: prompt,
          imageSize,
          imageResolution,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create image generation task');
    }

    const data = await response.json();
    return { taskId: data.taskId };
  } catch (error) {
    console.error('Error calling text-to-image API:', error);
    return {
      taskId: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Note: Polling removed - using webhook callback instead
// Images will be updated in the database via webhook when ready

// Create the complete schema by extending the base schemas
const TextToImageSentenceSchema = SentenceSchema.extend({
  metadata: TextToImageMetadataSchema,
});

const TextToImageTranscriptionSchema = ScriptMetaOutputSchema.extend({
  sentences: z.array(TextToImageSentenceSchema),
});

const textToImageAgent = aiRouter
  .agent('/', async ctx => {
    try {
      ctx.response.writeMessageMetadata({
        loader: 'Generating images for captions...',
      });

      const {
        userRequest,
        imageSize = 'landscape_16_9',
        imageResolution = '1K',
        promptPresetId = DEFAULT_PRESET_ID,
        customPrompt,
      } = ctx.request.params as {
        userRequest?: string;
        imageSize?: string;
        imageResolution?: string;
        promptPresetId?: string;
        customPrompt?: string;
      };

      // Determine which prompt to use
      let systemPrompt: string;
      let selectedPresetId: string | undefined;

      if (customPrompt) {
        // Use custom prompt if provided
        systemPrompt = customPrompt;
        console.log('Using custom prompt for image generation');
      } else {
        // Use preset from registry (checks custom prompts first, then built-in)
        const preset = await getPromptPresetWithCustom(promptPresetId);
        if (!preset) {
          throw new Error(
            `Prompt preset '${promptPresetId}' not found. Available presets: ${getAllPromptPresets()
              .map(p => p.id)
              .join(', ')}`
          );
        }
        systemPrompt = preset.systemPrompt;
        selectedPresetId = preset.id;
        const presetType = preset.isCustom ? 'custom' : 'built-in';
        console.log(`Using ${presetType} prompt preset: ${preset.name} (${preset.id})`);
      }

      // Get sentences from context state (loaded by middleware)
      const sentencesToAnalyze = ctx.state?.sentences || [];

      if (!sentencesToAnalyze || sentencesToAnalyze.length === 0) {
        throw new Error('No sentences available for analysis');
      }

      console.log(
        `Starting image generation for ${sentencesToAnalyze.length} captions...`,
      );

      const transcriptionId = ctx.state?.transcription?._id?.toString();
      if (!transcriptionId) {
        throw new Error('Transcription ID not found in context');
      }

      // Process each sentence: generate prompt -> create task (webhook handles completion)
      const analysisResults = await Promise.all(
        sentencesToAnalyze.map(async (sentence: string, index: number) => {
          try {
            // Step 1: Use AI to transform the caption into an image prompt
            ctx.response.writeMessageMetadata({
              loader: `Generating prompt for caption ${index + 1}/${sentencesToAnalyze.length}...`,
            });

            const promptResult = await generateText({
              model: google('gemini-2.5-pro'),
              system: systemPrompt,
              prompt: dedent`
                Transform the following sentence into an image generation prompt following the style guidelines:

                Sentence: "${sentence}"
                ${userRequest ? `\nUser Request: ${userRequest}` : ''}

                Generate only the image prompt, nothing else.
              `,
              maxRetries: 2,
            });

            const imagePrompt = promptResult.text.trim();
            console.log(
              `[Caption ${index + 1}] Generated prompt: ${imagePrompt.substring(0, 100)}...`,
            );

            // Step 2: Call text-to-image API with webhook (no waiting!)
            ctx.response.writeMessageMetadata({
              loader: `Submitting image task ${index + 1}/${sentencesToAnalyze.length}...`,
            });

            const { taskId, error: taskError } = await generateImageForCaption(
              imagePrompt,
              transcriptionId,
              index,
              imageSize,
              imageResolution,
            );

            if (taskError || !taskId) {
              console.error(
                `[Caption ${index + 1}] Failed to create task: ${taskError}`,
              );
              return {
                sentenceIndex: index,
                originalText: sentence,
                metadata: {
                  imagePrompt,
                  promptPresetId: selectedPresetId,
                  status: 'failed' as const,
                  error: taskError || 'Failed to create task',
                  imageSize,
                  imageResolution,
                },
                usage: promptResult.usage,
              };
            }

            console.log(`[Caption ${index + 1}] Task created: ${taskId} (webhook will update when ready)`);

            // Return immediately with "processing" status
            // Webhook will update to "completed" or "failed" when done
            return {
              sentenceIndex: index,
              originalText: sentence,
              metadata: {
                imagePrompt,
                promptPresetId: selectedPresetId,
                taskId,
                status: 'processing' as const,
                imageSize,
                imageResolution,
              },
              usage: promptResult.usage,
            };
          } catch (error) {
            console.error(`Error processing sentence ${index}:`, error);
            return {
              sentenceIndex: index,
              originalText: sentence,
              metadata: {
                imagePrompt: '',
                promptPresetId: selectedPresetId,
                status: 'failed' as const,
                error:
                  error instanceof Error
                    ? error.message
                    : 'Unknown error during processing',
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

      // Calculate statistics
      const processingCount = analysisResults.filter(
        r => r.metadata.status === 'processing',
      ).length;
      const failedCount = analysisResults.filter(
        r => r.metadata.status === 'failed',
      ).length;

      console.log(
        `Image tasks submitted: ${processingCount} processing, ${failedCount} failed immediately. Webhook will update when images are ready.`,
      );

      const result = {
        sentences: analysisResults,
        transcriptionInfo: ctx.state?.transcriptionInfo,
        totalSentences: sentencesToAnalyze.length,
        averageStrength: 0, // Not applicable for image generation
        confidence: processingCount / sentencesToAnalyze.length,
        dominantFeel: {
          processing: processingCount,
          failed: failedCount,
          note: 'Images are being generated. Check back in a few minutes or watch for webhook updates.',
        },
      };

      // Update the database with the metadata using the transcription from state
      const transcription = ctx.state?.transcription;
      if (transcription) {
        await saveTranscriptionMetadata(
          transcription,
          result.sentences,
          ctx.state?.transcriptionInfo,
        );
      }

      return result;
    } catch (error) {
      console.error('Error generating images for transcription:', error);
      throw error;
    }
  })
  .actAsTool('/', {
    id: 'generateImagesForTranscription',
    name: 'Generate Images for Transcription',
    description:
      'Generates images for each caption in a transcription using AI prompt transformation and text-to-image API. Supports multiple visual styles through prompt presets or custom prompts. Available presets: graphic-novel (default), cinematic-realism, minimalist-flat, watercolor-artistic, abstract-geometric.',
    inputSchema: ScriptMetaInputSchema.extend({
      imageSize: z
        .enum([
          'square',
          'square_hd',
          'portrait_4_3',
          'portrait_3_2',
          'portrait_16_9',
          'landscape_4_3',
          'landscape_3_2',
          'landscape_16_9',
          'landscape_21_9',
        ])
        .optional()
        .describe('Image size (default: landscape_16_9)'),
      imageResolution: z
        .enum(['1K', '2K', '4K'])
        .optional()
        .describe('Image resolution (default: 1K)'),
      promptPresetId: z
        .enum([
          'graphic-novel',
          'cinematic-realism',
          'minimalist-flat',
          'watercolor-artistic',
          'abstract-geometric',
        ])
        .optional()
        .describe(
          'Prompt preset to use for image generation. Options: graphic-novel (hand-drawn with limited palette), cinematic-realism (photo-realistic with dramatic lighting), minimalist-flat (clean geometric design), watercolor-artistic (soft painted style), abstract-geometric (bold shapes and colors). Default: graphic-novel'
        ),
      customPrompt: z
        .string()
        .optional()
        .describe(
          'Custom system prompt for image generation. If provided, overrides promptPresetId. Use this to define your own unique visual style and guidelines.'
        ),
    }),
    outputSchema: TextToImageTranscriptionSchema,
    metadata: {
      category: 'transcription',
      tags: [
        'sentence-metadata',
        'text-to-image',
        'image-generation',
        'captions',
        'ai',
        'metadata',
        'database',
        'style-presets',
      ],
      hidden: false,
    },
  });

// ============================================================================
// PROMPT MANAGEMENT ROUTES
// ============================================================================

// Preview prompt - Shows full prompt text when you select from dropdown
textToImageAgent
  .agent('/prompts/preview', async ctx => {
    const { promptPresetId = DEFAULT_PRESET_ID } = ctx.request.params as {
      promptPresetId?: string;
    };

    const preset = await getPromptPresetWithCustom(promptPresetId);

    if (!preset) {
      throw new Error(`Prompt preset '${promptPresetId}' not found`);
    }

    return {
      preset,
      message: `Preview of "${preset.name}" prompt. You can copy and edit the systemPrompt below, then use /prompts/save-and-use to save it as a custom preset.`,
    };
  })
  .actAsTool('/prompts/preview', {
    id: 'previewImagePrompt',
    name: 'Preview Selected Image Prompt',
    description:
      'Shows the full system prompt for a selected preset. Use this to see what prompt will be used before generating images. Returns the complete prompt text that you can then edit and save as custom.',
    inputSchema: z.object({
      promptPresetId: z
        .enum([
          'graphic-novel',
          'cinematic-realism',
          'minimalist-flat',
          'watercolor-artistic',
          'abstract-geometric',
        ])
        .default('graphic-novel')
        .describe('The preset to preview'),
    }),
    outputSchema: z.object({
      preset: z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        systemPrompt: z.string().describe('The full prompt text - copy this to edit'),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isCustom: z.boolean().optional(),
      }),
      message: z.string(),
    }),
    metadata: {
      category: 'utility',
      tags: ['prompt-preview', 'text-to-image'],
      hidden: false,
    },
  });

// Save and use - Saves edited prompt and returns the new ID to use
textToImageAgent
  .agent('/prompts/save-and-use', async ctx => {
    const {
      newPromptId,
      name,
      description,
      systemPrompt,
      category,
      tags,
      basePromptId,
    } = ctx.request.params as {
      newPromptId: string;
      name: string;
      description?: string;
      systemPrompt: string;
      category?: string;
      tags?: string[];
      basePromptId?: string;
    };

    // Validate input
    const validatedData = CustomImagePromptSchema.parse({
      id: newPromptId,
      name,
      description: description || `Custom version based on ${basePromptId || 'custom'}`,
      systemPrompt,
      category,
      tags,
      isBuiltInOverride: false,
      originalPresetId: basePromptId,
    });

    const db = await getDatabase();
    const collection = db.collection<CustomImagePromptDocument>('customImagePrompts');

    // Check if exists
    const existing = await collection.findOne({ id: validatedData.id });

    if (existing) {
      // Update existing
      const result = await collection.findOneAndUpdate(
        { id: validatedData.id },
        {
          $set: {
            ...validatedData,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      return {
        success: true,
        message: `Prompt "${name}" updated successfully! You can now use promptPresetId: "${newPromptId}" when generating images.`,
        prompt: customPromptDocumentToResponse(result!),
        useThisId: newPromptId,
      };
    } else {
      // Create new
      const now = new Date();
      const document: CustomImagePromptDocument = {
        ...validatedData,
        isCustom: true,
        isBuiltInOverride: validatedData.isBuiltInOverride ?? false,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(document);

      return {
        success: true,
        message: `Prompt "${name}" saved successfully! Use promptPresetId: "${newPromptId}" when generating images.`,
        prompt: customPromptDocumentToResponse({ ...document, _id: result.insertedId }),
        useThisId: newPromptId,
      };
    }
  })
  .actAsTool('/prompts/save-and-use', {
    id: 'saveAndUseImagePrompt',
    name: 'Save Custom Prompt & Get ID',
    description:
      'After previewing and editing a prompt, use this to save it as a custom preset. It will return the new prompt ID that you can then use with promptPresetId parameter when generating images.',
    inputSchema: z.object({
      newPromptId: z
        .string()
        .min(1)
        .describe('ID for your new custom prompt (e.g., "my-purple-style")'),
      name: z.string().min(1).describe('Display name for your custom prompt'),
      systemPrompt: z
        .string()
        .min(10)
        .describe('The edited system prompt text (copy from preview and modify)'),
      description: z.string().optional().describe('Brief description of your custom style'),
      category: z
        .enum(['illustration', 'realistic', 'abstract', 'minimalist', 'artistic', 'cinematic'])
        .optional()
        .describe('Category for your prompt'),
      tags: z.array(z.string()).optional().describe('Tags for categorization'),
      basePromptId: z
        .string()
        .optional()
        .describe('Original prompt ID this was based on (for reference)'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      prompt: z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        systemPrompt: z.string(),
      }),
      useThisId: z.string().describe('Use this ID in promptPresetId parameter'),
    }),
    metadata: {
      category: 'utility',
      tags: ['prompt-save', 'text-to-image'],
      hidden: false,
    },
  });

// List all prompts (built-in + custom)
textToImageAgent
  .agent('/prompts/list', async ctx => {
    const {
      category,
      tag,
      search,
      includeCustom = true,
      userId,
      clientId,
    } = ctx.request.params as {
      category?: string;
      tag?: string;
      search?: string;
      includeCustom?: boolean;
      userId?: string;
      clientId?: string;
    };

    let presets;

    if (includeCustom) {
      // Get all prompts including custom ones
      const allPrompts = await getAllPromptsWithCustom({ userId, clientId });
      
      // Apply filters
      presets = allPrompts;
      if (category) {
        presets = presets.filter(p => p.category === category);
      }
      if (tag) {
        presets = presets.filter(p => p.tags?.includes(tag));
      }
      if (search) {
        const lowerSearch = search.toLowerCase();
        presets = presets.filter(
          p =>
            p.name.toLowerCase().includes(lowerSearch) ||
            p.description.toLowerCase().includes(lowerSearch) ||
            p.tags?.some(t => t.toLowerCase().includes(lowerSearch))
        );
      }
    } else {
      // Only built-in presets
      if (search) {
        presets = searchPromptPresets(search);
      } else if (category) {
        presets = getPromptPresetsByCategory(category);
      } else if (tag) {
        presets = getPromptPresetsByTag(tag);
      } else {
        presets = getAllPromptPresets();
      }
    }

    const builtInCount = presets.filter(p => !p.isCustom).length;
    const customCount = presets.filter(p => p.isCustom).length;

    return {
      presets,
      count: presets.length,
      builtInCount,
      customCount,
      categories: ['illustration', 'realistic', 'abstract', 'minimalist', 'artistic', 'cinematic'],
    };
  })
  .actAsTool('/prompts/list', {
    id: 'listImagePromptPresets',
    name: 'List Image Prompt Presets',
    description:
      'Lists all available image prompt presets (built-in + custom) for text-to-image generation. Can filter by category, tag, or search query. Returns the full system prompt for each preset so you can view and edit them.',
    inputSchema: z.object({
      category: z
        .enum(['illustration', 'realistic', 'abstract', 'minimalist', 'artistic', 'cinematic'])
        .optional()
        .describe('Filter by category'),
      tag: z.string().optional().describe('Filter by tag'),
      search: z.string().optional().describe('Search in name, description, and tags'),
      includeCustom: z.boolean().optional().describe('Include custom user-created prompts (default: true)'),
      userId: z.string().optional().describe('Filter by user ID'),
      clientId: z.string().optional().describe('Filter by client ID'),
    }),
    outputSchema: z.object({
      presets: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        systemPrompt: z.string(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isCustom: z.boolean().optional(),
      })),
      count: z.number(),
      builtInCount: z.number(),
      customCount: z.number(),
      categories: z.array(z.string()),
    }),
    metadata: {
      category: 'utility',
      tags: ['prompt-presets', 'list', 'discovery', 'text-to-image'],
      hidden: false,
    },
  });

// Get specific prompt details
textToImageAgent
  .agent('/prompts/get/:id', async ctx => {
    const { id, userId, clientId } = ctx.request.params as {
      id: string;
      userId?: string;
      clientId?: string;
    };

    if (!id) {
      throw new Error('Preset ID is required');
    }

    const preset = await getPromptPresetWithCustom(id, { userId, clientId });

    if (!preset) {
      throw new Error(`Prompt preset '${id}' not found`);
    }

    return { preset };
  })
  .actAsTool('/prompts/get/:id', {
    id: 'getImagePromptPreset',
    name: 'Get Image Prompt Preset Details',
    description:
      'Gets detailed information about a specific image prompt preset by ID, including the FULL system prompt text. Use this to view the complete prompt before using or editing it. Shows custom prompts if they exist, otherwise falls back to built-in.',
    inputSchema: z.object({
      id: z.string().describe('The preset ID to retrieve (e.g., "graphic-novel", "cinematic-realism")'),
      userId: z.string().optional().describe('User ID for filtering custom prompts'),
      clientId: z.string().optional().describe('Client ID for filtering custom prompts'),
    }),
    outputSchema: z.object({
      preset: z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        systemPrompt: z.string().describe('The full system prompt text'),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isCustom: z.boolean().optional(),
      }),
    }),
    metadata: {
      category: 'utility',
      tags: ['prompt-presets', 'details', 'text-to-image'],
      hidden: false,
    },
  });

// Save/Create custom prompt
textToImageAgent
  .agent('/prompts/save', async ctx => {
    const data = ctx.request.params as any;

    // Validate input
    const validatedData = CustomImagePromptSchema.parse(data);

    const db = await getDatabase();
    const collection = db.collection<CustomImagePromptDocument>('customImagePrompts');

    // Check if exists
    const existing = await collection.findOne({ id: validatedData.id });

    if (existing) {
      // Update existing
      const result = await collection.findOneAndUpdate(
        { id: validatedData.id },
        {
          $set: {
            ...validatedData,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      return {
        success: true,
        message: 'Prompt updated successfully',
        prompt: customPromptDocumentToResponse(result!),
      };
    } else {
      // Create new
      const now = new Date();
      const document: CustomImagePromptDocument = {
        ...validatedData,
        isCustom: true,
        isBuiltInOverride: validatedData.isBuiltInOverride ?? false,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(document);

      return {
        success: true,
        message: 'Prompt saved successfully',
        prompt: customPromptDocumentToResponse({ ...document, _id: result.insertedId }),
      };
    }
  })
  .actAsTool('/prompts/save', {
    id: 'saveImagePromptPreset',
    name: 'Save Custom Image Prompt Preset',
    description:
      'Save a new custom image prompt preset or update an existing one. After viewing a preset with /prompts/get, you can edit the systemPrompt and save it with a new name. You can also override built-in presets by using the same ID with isBuiltInOverride: true.',
    inputSchema: CustomImagePromptSchema,
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      prompt: z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        systemPrompt: z.string(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isCustom: z.boolean().optional(),
      }),
    }),
    metadata: {
      category: 'utility',
      tags: ['prompt-presets', 'save', 'create', 'text-to-image'],
      hidden: false,
    },
  });

// Delete custom prompt
textToImageAgent
  .agent('/prompts/delete/:id', async ctx => {
    const { id } = ctx.request.params as { id: string };

    if (!id) {
      throw new Error('Preset ID is required');
    }

    // Check if this is a built-in preset
    const builtInPreset = getPromptPreset(id);
    const db = await getDatabase();
    const collection = db.collection<CustomImagePromptDocument>('customImagePrompts');
    const customOverride = await collection.findOne({ id });
    
    if (builtInPreset && !customOverride) {
      throw new Error('Cannot delete built-in presets. You can only delete custom prompts or overrides.');
    }

    const result = await collection.deleteOne({ id });

    if (result.deletedCount === 0) {
      throw new Error(`Custom prompt '${id}' not found`);
    }

    return {
      success: true,
      message: `Prompt '${id}' deleted successfully`,
    };
  })
  .actAsTool('/prompts/delete/:id', {
    id: 'deleteImagePromptPreset',
    name: 'Delete Custom Image Prompt Preset',
    description: 
      'Delete a custom image prompt preset. Cannot delete built-in presets (graphic-novel, cinematic-realism, etc.), but can delete custom overrides of them.',
    inputSchema: z.object({
      id: z.string().describe('The preset ID to delete'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
    metadata: {
      category: 'utility',
      tags: ['prompt-presets', 'delete', 'text-to-image'],
      hidden: false,
    },
  });

export default textToImageAgent;

