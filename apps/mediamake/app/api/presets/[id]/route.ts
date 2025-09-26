import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import {
  DatabasePreset,
  UpdatePresetRequest,
} from '@/components/editor/presets/types';

// GET /api/presets/[id] - Get a specific preset
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const clientId = req.headers.get('x-client-id') || undefined;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid preset ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<DatabasePreset>('presets');

    const query: any = { _id: new ObjectId(id) };
    if (clientId) query.clientId = clientId;

    const preset = await collection.findOne(query);

    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, preset });
  } catch (error) {
    console.error('Error fetching preset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preset' },
      { status: 500 },
    );
  }
}

// PUT /api/presets/[id] - Update a specific preset
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const clientId = req.headers.get('x-client-id') || undefined;
    const body: UpdatePresetRequest = await req.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid preset ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<DatabasePreset>('presets');

    const query: any = { _id: new ObjectId(id) };
    if (clientId) query.clientId = clientId;

    // Check if preset exists
    const existing = await collection.findOne(query);
    if (!existing) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.metadata) {
      updateData.metadata = {
        ...existing.metadata,
        ...body.metadata,
        updatedAt: new Date(),
      };
    }
    if (body.presetFunction !== undefined)
      updateData.presetFunction = body.presetFunction;
    if (body.presetParams !== undefined)
      updateData.presetParams = body.presetParams;

    const result = await collection.updateOne(query, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    // Fetch the updated document
    const updatedPreset = await collection.findOne(query);

    return NextResponse.json({
      success: true,
      preset: updatedPreset,
    });
  } catch (error) {
    console.error('Error updating preset:', error);
    return NextResponse.json(
      { error: 'Failed to update preset' },
      { status: 500 },
    );
  }
}

// DELETE /api/presets/[id] - Delete a specific preset
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const clientId = req.headers.get('x-client-id') || undefined;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid preset ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<DatabasePreset>('presets');

    const query: any = { _id: new ObjectId(id) };
    if (clientId) query.clientId = clientId;

    const result = await collection.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting preset:', error);
    return NextResponse.json(
      { error: 'Failed to delete preset' },
      { status: 500 },
    );
  }
}
