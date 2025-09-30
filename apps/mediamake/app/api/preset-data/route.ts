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
    const collection = db.collection<PresetDataDocument>('presetData');

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

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
    const db = await getDatabase();
    const collection = db.collection<PresetDataDocument>('presetData');

    const body = await request.json();
    const { name, presetData, clientId } = body;

    if (!name || !presetData) {
      return NextResponse.json(
        { error: 'Name and presetData are required' },
        { status: 400 },
      );
    }

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
