import { ObjectId } from 'mongodb';
import { z } from 'zod/v4';

/**
 * Custom Image Prompt Model
 * Stores user-created or modified image generation prompts
 */

// Database document schema
export interface CustomImagePromptDocument {
  _id?: ObjectId;
  id: string; // Unique string ID for easy reference
  name: string;
  description: string;
  systemPrompt: string;
  category?: 'illustration' | 'realistic' | 'abstract' | 'minimalist' | 'artistic' | 'cinematic';
  tags?: string[];
  thumbnailExample?: string;
  isCustom: boolean; // Always true for user-created prompts
  isBuiltInOverride: boolean; // True if this overrides a built-in preset
  originalPresetId?: string; // If this is a modified version of a built-in preset
  userId?: string; // Optional: track which user created it
  clientId?: string; // Optional: for multi-tenant scenarios
  createdAt: Date;
  updatedAt: Date;
}

// Validation schema
export const CustomImagePromptSchema = z.object({
  id: z.string().min(1).describe('Unique identifier (slug format, e.g., "my-custom-style")'),
  name: z.string().min(1).describe('Human-readable name'),
  description: z.string().min(1).describe('Brief description of the style'),
  systemPrompt: z.string().min(10).describe('The full system prompt for the AI'),
  category: z.enum(['illustration', 'realistic', 'abstract', 'minimalist', 'artistic', 'cinematic']).optional(),
  tags: z.array(z.string()).optional().describe('Tags for categorization'),
  thumbnailExample: z.string().optional().describe('Example image URL or description'),
  isBuiltInOverride: z.boolean().default(false).describe('Whether this overrides a built-in preset'),
  originalPresetId: z.string().optional().describe('If modified from a built-in preset'),
  userId: z.string().optional(),
  clientId: z.string().optional(),
});

export type CustomImagePromptInput = z.infer<typeof CustomImagePromptSchema>;

// Helper to convert DB document to API response
export function customPromptDocumentToResponse(doc: CustomImagePromptDocument) {
  return {
    id: doc.id,
    name: doc.name,
    description: doc.description,
    systemPrompt: doc.systemPrompt,
    category: doc.category,
    tags: doc.tags,
    thumbnailExample: doc.thumbnailExample,
    isCustom: true,
    isBuiltInOverride: doc.isBuiltInOverride,
    originalPresetId: doc.originalPresetId,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

