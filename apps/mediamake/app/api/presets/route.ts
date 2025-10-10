import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  DatabasePreset,
  CreatePresetRequest,
  PresetListResponse,
  PresetFilters,
} from '@/components/editor/presets/types';

// GET /api/presets - List presets with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = req.headers.get('x-client-id') || undefined;

    // Parse query parameters
    const filters: PresetFilters = {
      clientId,
      type:
        (searchParams.get('type') as 'predefined' | 'database') || 'database',
      presetType:
        (searchParams.get('presetType') as
          | 'children'
          | 'data'
          | 'context'
          | 'effects'
          | 'full') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy:
        (searchParams.get('sortBy') as 'createdAt' | 'updatedAt' | 'title') ||
        'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    const db = await getDatabase();
    const collection = db.collection<DatabasePreset>('presets');

    // Build query
    const query: any = {};
    if (filters.clientId) query.clientId = filters.clientId;
    if (filters.type) query['metadata.type'] = filters.type;
    if (filters.presetType) query['metadata.presetType'] = filters.presetType;
    if (filters.tags && filters.tags.length > 0) {
      query['metadata.tags'] = { $in: filters.tags };
    }

    // Calculate pagination
    const skip = (filters.page! - 1) * filters.limit!;
    const sort: any = {};
    sort[filters.sortBy!] = filters.sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [presets, total] = await Promise.all([
      collection
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(filters.limit!)
        .toArray(),
      collection.countDocuments(query),
    ]);

    const response: PresetListResponse = {
      presets,
      total,
      page: filters.page!,
      limit: filters.limit!,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching presets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch presets' },
      { status: 500 },
    );
  }
}

// POST /api/presets - Create a new preset
export async function POST(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-client-id') || undefined;
    const body: CreatePresetRequest = await req.json();

    // Validate required fields
    if (!body.metadata || !body.presetFunction || !body.presetParams) {
      return NextResponse.json(
        { error: 'metadata, presetFunction, and presetParams are required' },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const collection = db.collection<DatabasePreset>('presets');

    // Check if preset with this title already exists for this client
    const query: any = { 'metadata.title': body.metadata.title };
    if (clientId) {
      query.clientId = clientId;
    } else {
      query.clientId = { $exists: false };
    }
    const existing = await collection.findOne(query);
    if (existing) {
      return NextResponse.json(
        { error: 'Preset with this title already exists' },
        { status: 409 },
      );
    }

    const now = new Date();
    const preset: Omit<DatabasePreset, '_id'> = {
      clientId,
      metadata: {
        ...body.metadata,
        id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'database',
        createdAt: now,
        updatedAt: now,
      },
      presetFunction: body.presetFunction,
      presetParams: body.presetParams,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(preset);

    // Fetch the created document
    const createdPreset = await collection.findOne({
      _id: result.insertedId,
    });

    console.log(`✅ API: Successfully created database preset:`, {
      id: result.insertedId.toString(),
      title: createdPreset?.metadata?.title,
      type: createdPreset?.metadata?.presetType,
      clientId: createdPreset?.clientId,
    });

    return NextResponse.json(
      { success: true, preset: createdPreset },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating preset:', error);
    return NextResponse.json(
      { error: 'Failed to create preset' },
      { status: 500 },
    );
  }
}
