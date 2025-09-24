import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import {
  Transcription,
  UpdateTranscriptionRequest,
} from '@/app/types/transcription';

// GET /api/transcriptions/[id] - Get a specific transcription
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const clientId = req.headers.get('x-client-id') || undefined;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid transcription ID' },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const collection = db.collection<Transcription>('transcriptions');

    const query: any = { _id: new ObjectId(id) };
    if (clientId) query.clientId = clientId;

    const transcription = await collection.findOne(query);

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, transcription });
  } catch (error) {
    console.error('Error fetching transcription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcription' },
      { status: 500 },
    );
  }
}

// PUT /api/transcriptions/[id] - Update a specific transcription
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const clientId = req.headers.get('x-client-id') || undefined;
    const body: UpdateTranscriptionRequest = await req.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid transcription ID' },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const collection = db.collection<Transcription>('transcriptions');

    const query: any = { _id: new ObjectId(id) };
    if (clientId) query.clientId = clientId;

    // Check if transcription exists
    const existing = await collection.findOne(query);
    if (!existing) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 },
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.status !== undefined) updateData.status = body.status;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.captions !== undefined) updateData.captions = body.captions;
    if (body.processingData !== undefined)
      updateData.processingData = body.processingData;
    if (body.error !== undefined) updateData.error = body.error;

    const result = await collection.updateOne(query, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 },
      );
    }

    // Fetch the updated document
    const updatedTranscription = await collection.findOne(query);

    return NextResponse.json({
      success: true,
      transcription: updatedTranscription,
    });
  } catch (error) {
    console.error('Error updating transcription:', error);
    return NextResponse.json(
      { error: 'Failed to update transcription' },
      { status: 500 },
    );
  }
}

// DELETE /api/transcriptions/[id] - Delete a specific transcription
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const clientId = req.headers.get('x-client-id') || undefined;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid transcription ID' },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const collection = db.collection<Transcription>('transcriptions');

    const query: any = { _id: new ObjectId(id) };
    if (clientId) query.clientId = clientId;

    const result = await collection.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transcription:', error);
    return NextResponse.json(
      { error: 'Failed to delete transcription' },
      { status: 500 },
    );
  }
}
