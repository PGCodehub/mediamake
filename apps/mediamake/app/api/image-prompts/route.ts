import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  CustomImagePromptSchema,
  customPromptDocumentToResponse,
  type CustomImagePromptDocument,
} from '@/lib/models/CustomImagePrompt';
import { getAllPromptPresets, getPromptPreset } from '@/app/ai/agents/scriptMeta/imagePromptRegistry';

/**
 * GET /api/image-prompts
 * List all prompts (built-in + custom)
 * Query params: category, tag, search, includeBuiltIn (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const includeBuiltIn = searchParams.get('includeBuiltIn') !== 'false';
    const userId = searchParams.get('userId');
    const clientId = searchParams.get('clientId');

    // Get built-in presets
    let builtInPresets = includeBuiltIn ? getAllPromptPresets() : [];

    // Filter built-in presets
    if (category) {
      builtInPresets = builtInPresets.filter(p => p.category === category);
    }
    if (tag) {
      builtInPresets = builtInPresets.filter(p => p.tags?.includes(tag));
    }
    if (search) {
      const lowerSearch = search.toLowerCase();
      builtInPresets = builtInPresets.filter(
        p =>
          p.name.toLowerCase().includes(lowerSearch) ||
          p.description.toLowerCase().includes(lowerSearch) ||
          p.tags?.some(t => t.toLowerCase().includes(lowerSearch))
      );
    }

    // Get custom prompts from database
    const db = await getDatabase();
    const collection = db.collection<CustomImagePromptDocument>('customImagePrompts');

    const filter: any = {};
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (userId) filter.userId = userId;
    if (clientId) filter.clientId = clientId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const customPrompts = await collection.find(filter).sort({ createdAt: -1 }).toArray();
    const customPromptsFormatted = customPrompts.map(customPromptDocumentToResponse);

    // Merge and return
    const allPrompts = [...builtInPresets, ...customPromptsFormatted];

    return NextResponse.json({
      prompts: allPrompts,
      count: allPrompts.length,
      builtInCount: builtInPresets.length,
      customCount: customPromptsFormatted.length,
    });
  } catch (error) {
    console.error('Error listing image prompts:', error);
    return NextResponse.json(
      { error: 'Failed to list image prompts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/image-prompts
 * Create a new custom prompt
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = CustomImagePromptSchema.parse(body);

    // Check if ID already exists (built-in or custom)
    const builtInPreset = getPromptPreset(validatedData.id);
    if (builtInPreset && !validatedData.isBuiltInOverride) {
      return NextResponse.json(
        { error: `A built-in preset with ID '${validatedData.id}' already exists. Set isBuiltInOverride to true to override it.` },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<CustomImagePromptDocument>('customImagePrompts');

    // Check if custom prompt with this ID already exists
    const existing = await collection.findOne({ id: validatedData.id });
    if (existing) {
      return NextResponse.json(
        { error: `A custom prompt with ID '${validatedData.id}' already exists` },
        { status: 400 }
      );
    }

    // Create document
    const now = new Date();
    const document: CustomImagePromptDocument = {
      ...validatedData,
      isCustom: true,
      isBuiltInOverride: validatedData.isBuiltInOverride ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(document);

    return NextResponse.json({
      success: true,
      prompt: customPromptDocumentToResponse({ ...document, _id: result.insertedId }),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating custom prompt:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create custom prompt' },
      { status: 500 }
    );
  }
}

