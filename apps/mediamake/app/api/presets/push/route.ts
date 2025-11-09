import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  DatabasePreset,
  PresetMetadata,
} from '@/components/editor/presets/types';
import { getPredefinedPresetById } from '@/components/editor/presets/registry/registry/presets-registry';

// POST /api/presets/push - Push a preset from private registry to database
export async function POST(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-client-id') || undefined;
    const body = await req.json();
    const { presetData } = body;

    if (!presetData) {
      return NextResponse.json(
        { error: 'presetData is required' },
        { status: 400 },
      );
    }

    // Validate presetData structure
    if (
      !presetData.metadata ||
      !presetData.presetFunction ||
      !presetData.presetParams
    ) {
      return NextResponse.json(
        {
          error:
            'presetData must contain metadata, presetFunction, and presetParams',
        },
        { status: 400 },
      );
    }

    // Check if a predefined preset with the same id already exists
    const predefinedPreset = getPredefinedPresetById(presetData.metadata.id);
    if (predefinedPreset) {
      return NextResponse.json(
        {
          error: `A predefined preset with id '${presetData.metadata.id}' already exists. Cannot push to database.`,
        },
        { status: 409 },
      );
    }

    // Check if a database preset with the same metadata.id already exists for this client
    const db = await getDatabase();
    const collection = db.collection<DatabasePreset>('presets');

    const query: any = { 'metadata.id': presetData.metadata.id };
    if (clientId) {
      query.clientId = clientId;
    } else {
      query.clientId = { $exists: false };
    }
    const existingDbPreset = await collection.findOne(query);

    const now = new Date();

    if (existingDbPreset) {
      // Update existing preset
      const updateData: any = {
        metadata: {
          ...existingDbPreset.metadata,
          ...presetData.metadata,
          type: 'database', // Ensure type is database
          updatedAt: now,
          // Preserve original createdAt
          createdAt:
            existingDbPreset.metadata.createdAt || existingDbPreset.createdAt,
        },
        presetFunction: presetData.presetFunction,
        presetParams: presetData.presetParams,
        updatedAt: now,
      };

      const updateResult = await collection.updateOne(query, {
        $set: updateData,
      });

      if (updateResult.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Failed to update preset' },
          { status: 500 },
        );
      }

      // Fetch the updated document
      const updatedPreset = await collection.findOne(query);

      console.log(`✅ API: Successfully updated preset in database:`, {
        id: updatedPreset?._id.toString(),
        title: updatedPreset?.metadata?.title,
        type: updatedPreset?.metadata?.presetType,
        clientId: updatedPreset?.clientId,
      });

      return NextResponse.json(
        {
          success: true,
          preset: updatedPreset,
          message: `Successfully updated preset '${presetData.metadata.id}' in database`,
        },
        { status: 200 },
      );
    }

    // Prepare new database preset
    const preset: Omit<DatabasePreset, '_id'> = {
      clientId,
      metadata: {
        ...presetData.metadata,
        type: 'database', // Change type to database
        createdAt: now,
        updatedAt: now,
      },
      presetFunction: presetData.presetFunction,
      presetParams: presetData.presetParams,
      createdAt: now,
      updatedAt: now,
    };

    // Insert into database
    const result = await collection.insertOne(preset);

    // Fetch the created document
    const createdPreset = await collection.findOne({
      _id: result.insertedId,
    });

    console.log(`✅ API: Successfully pushed preset to database:`, {
      id: result.insertedId.toString(),
      title: createdPreset?.metadata?.title,
      type: createdPreset?.metadata?.presetType,
      clientId: createdPreset?.clientId,
    });

    return NextResponse.json(
      {
        success: true,
        preset: createdPreset,
        message: `Successfully pushed preset '${presetData.metadata.id}' to database`,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Error pushing preset:', error);
    return NextResponse.json(
      {
        error: 'Failed to push preset',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
