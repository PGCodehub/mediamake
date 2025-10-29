import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

interface PresetDataDocument {
  _id?: ObjectId;
  clientId?: string;
  name: string;
  presetData: {
    presets: Array<{
      presetId: string;
      presetType: string;
      presetInputData: any;
      disabled?: boolean;
    }>;
    defaultData?: {
      references: Array<{
        key: string;
        type: string;
        value: any;
      }>;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/preset-data
// - Without query: return only metadata (no presetData)
// - With ?id=...: return full document including presetData
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const clientId = request.headers.get('x-client-id') || undefined;
    const collection = db.collection<PresetDataDocument>('presetData');

    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');

    // If id is provided, return the full document (including presetData)
    if (id) {
      try {
        const objectId = new ObjectId(id);
        const doc = await collection.findOne({
          _id: objectId,
          ...(clientId ? { clientId } : {}),
        });
        if (!doc) {
          return NextResponse.json(
            { error: 'Preset not found' },
            { status: 404 },
          );
        }
        return NextResponse.json(doc);
      } catch {
        return NextResponse.json(
          { error: 'Invalid preset ID' },
          { status: 400 },
        );
      }
    }

    // Otherwise, return only metadata without presetData
    const query = clientId ? { clientId } : {};
    const presetsMeta = await collection
      .find(query, { projection: { name: 1, createdAt: 1, updatedAt: 1 } })
      .sort({ createdAt: -1 })
      .toArray();

    // Normalize _id to id for client
    const response = presetsMeta.map((d: any) => ({
      id: d._id,
      name: d.name,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching preset data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preset data' },
      { status: 500 },
    );
  }
}

// POST /api/preset-data - Save preset data
export async function POST(request: NextRequest) {
  try {
    const clientId = request.headers.get('x-client-id') || undefined;
    const db = await getDatabase();
    const collection = db.collection<PresetDataDocument>('presetData');

    const body = await request.json();
    const { name, presetData, overwriteId } = body;

    console.log(`💾 API: Saving preset data:`, {
      name: name,
      overwriteId: overwriteId,
      numberOfPresets: presetData?.presets?.length || 0,
      hasDefaultData: !!presetData?.defaultData,
      referencesCount: presetData?.defaultData?.references?.length || 0,
      clientId: clientId,
    });

    if (!name || !presetData) {
      return NextResponse.json(
        { error: 'Name and presetData are required' },
        { status: 400 },
      );
    }

    // If overwriteId is provided, update existing document
    if (overwriteId) {
      try {
        const objectId = new ObjectId(overwriteId);
        const updateResult = await collection.updateOne(
          { _id: objectId },
          {
            $set: {
              name,
              presetData,
              updatedAt: new Date(),
            },
          },
        );

        if (updateResult.matchedCount === 0) {
          console.log(
            `❌ API: Preset data not found for overwrite: ${overwriteId}`,
          );
          return NextResponse.json(
            { error: 'Preset not found' },
            { status: 404 },
          );
        }

        console.log(`✅ API: Successfully updated preset data:`, {
          presetDataId: overwriteId,
          name: name,
          numberOfPresets: presetData?.presets?.length || 0,
          hasDefaultData: !!presetData?.defaultData,
          referencesCount: presetData?.defaultData?.references?.length || 0,
        });

        return NextResponse.json({
          id: overwriteId,
          message: 'Preset data updated successfully',
        });
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid preset ID' },
          { status: 400 },
        );
      }
    }

    // Otherwise, create new document
    const document: Omit<PresetDataDocument, '_id'> = {
      clientId,
      name,
      presetData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(document);

    console.log(`✅ API: Successfully created preset data:`, {
      presetDataId: result.insertedId.toString(),
      name: name,
      numberOfPresets: presetData?.presets?.length || 0,
      hasDefaultData: !!presetData?.defaultData,
      referencesCount: presetData?.defaultData?.references?.length || 0,
      clientId: clientId,
    });

    return NextResponse.json({
      id: result.insertedId,
      message: 'Preset data saved successfully',
    });
  } catch (error) {
    console.error('Error saving preset data:', error);
    return NextResponse.json(
      { error: 'Failed to save preset data' },
      { status: 500 },
    );
  }
}
