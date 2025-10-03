import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { UpdateMediaFileRequest } from '@/app/types/media';

// GET /api/media-files/[id] - Fetch a specific media file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const collection = db.collection('mediaFiles');

    const file = await collection.findOne({ _id: new ObjectId(id) });

    if (!file) {
      return NextResponse.json(
        { error: 'Media file not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(file);
  } catch (error) {
    console.error('Error fetching media file:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media file' },
      { status: 500 },
    );
  }
}

// PUT /api/media-files/[id] - Update a media file
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body: UpdateMediaFileRequest = await request.json();
    const db = await getDatabase();
    const collection = db.collection('mediaFiles');

    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Media file not found' },
        { status: 404 },
      );
    }

    const updatedFile = await collection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error('Error updating media file:', error);
    return NextResponse.json(
      { error: 'Failed to update media file' },
      { status: 500 },
    );
  }
}

// DELETE /api/media-files/[id] - Delete a media file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const collection = db.collection('mediaFiles');

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Media file not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: 'Media file deleted successfully' });
  } catch (error) {
    console.error('Error deleting media file:', error);
    return NextResponse.json(
      { error: 'Failed to delete media file' },
      { status: 500 },
    );
  }
}
