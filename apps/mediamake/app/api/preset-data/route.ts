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
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/preset-data - Fetch saved preset data
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const clientId = request.headers.get('x-client-id') || undefined;
    const collection = db.collection<PresetDataDocument>('presetData');

    const { searchParams } = new URL(request.url);

    const query = clientId ? { clientId } : {};

    const presetData = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(presetData);
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
          return NextResponse.json(
            { error: 'Preset not found' },
            { status: 404 },
          );
        }

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
