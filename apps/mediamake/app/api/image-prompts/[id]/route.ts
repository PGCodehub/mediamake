import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  CustomImagePromptSchema,
  customPromptDocumentToResponse,
  type CustomImagePromptDocument,
} from '@/lib/models/CustomImagePrompt';
import { getPromptPreset } from '@/app/ai/agents/scriptMeta/imagePromptRegistry';

/**
 * GET /api/image-prompts/[id]
 * Get a specific prompt (built-in or custom)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check built-in presets first
    const builtInPreset = getPromptPreset(id);
    if (builtInPreset) {
      return NextResponse.json({ prompt: builtInPreset });
    }

    // Check custom prompts
    const db = await getDatabase();
    const collection = db.collection<CustomImagePromptDocument>('customImagePrompts');
    const customPrompt = await collection.findOne({ id });

    if (!customPrompt) {
      return NextResponse.json(
        { error: `Prompt with ID '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      prompt: customPromptDocumentToResponse(customPrompt),
    });
  } catch (error) {
    console.error('Error getting image prompt:', error);
    return NextResponse.json(
      { error: 'Failed to get image prompt' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/image-prompts/[id]
 * Update a custom prompt
 * Note: Cannot update built-in presets directly, but can create an override
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = CustomImagePromptSchema.parse(body);

    // Ensure ID matches
    if (validatedData.id !== id) {
      return NextResponse.json(
        { error: 'ID in URL must match ID in body' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<CustomImagePromptDocument>('customImagePrompts');

    // Check if this is trying to update a built-in preset
    const builtInPreset = getPromptPreset(id);
    if (builtInPreset) {
      // Check if an override already exists
      const existingOverride = await collection.findOne({ id });
      
      if (!existingOverride) {
        // Create new override
        const now = new Date();
        const document: CustomImagePromptDocument = {
          ...validatedData,
          isCustom: true,
          isBuiltInOverride: true,
          originalPresetId: id,
          createdAt: now,
          updatedAt: now,
        };

        const result = await collection.insertOne(document);
        
        return NextResponse.json({
          success: true,
          message: `Created override for built-in preset '${id}'`,
          prompt: customPromptDocumentToResponse({ ...document, _id: result.insertedId }),
        });
      }
    }

    // Update existing custom prompt
    const result = await collection.findOneAndUpdate(
      { id },
      {
        $set: {
          ...validatedData,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: `Custom prompt with ID '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      prompt: customPromptDocumentToResponse(result),
    });
  } catch (error) {
    console.error('Error updating custom prompt:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update custom prompt' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/image-prompts/[id]
 * Delete a custom prompt
 * Note: Cannot delete built-in presets
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if this is a built-in preset
    const builtInPreset = getPromptPreset(id);
    if (builtInPreset) {
      return NextResponse.json(
        { error: 'Cannot delete built-in presets. You can only delete custom prompts or overrides.' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<CustomImagePromptDocument>('customImagePrompts');

    const result = await collection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: `Custom prompt with ID '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Custom prompt '${id}' deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting custom prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom prompt' },
      { status: 500 }
    );
  }
}

