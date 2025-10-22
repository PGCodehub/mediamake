import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { Transcription, Caption } from '@/app/types/transcription';

interface UpdateTranscriptionMetadataRequest {
  id: string;
  captions: Caption[];
}

// POST /api/transcriptions/[id]/metadata - Update transcription captions and step4 metadata
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body: UpdateTranscriptionMetadataRequest = await req.json();

    // Validate request body
    if (!body.captions || !Array.isArray(body.captions)) {
      return NextResponse.json(
        { error: 'Captions array is required' },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid transcription ID' },
        { status: 400 },
      );
    }

    // Get database connection
    const db = await getDatabase();
    const collection = db.collection<Transcription>('transcriptions');

    // Find the transcription
    const transcription = await collection.findOne({
      _id: new ObjectId(id),
    });

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 },
      );
    }

    // Update the transcription with new captions and step4 metadata
    const updateData: Partial<Transcription> = {
      captions: body.captions,
      updatedAt: new Date(),
      processingData: {
        ...transcription.processingData,
        step4: {
          ...transcription.processingData.step4,
          metadata: body.captions.map(caption => caption.metadata),
          updatedAt: new Date().toISOString(),
        },
      },
    };

    // Update the transcription in the database
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 },
      );
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No changes made to transcription' },
        { status: 400 },
      );
    }

    // Fetch the updated transcription
    const updatedTranscription = await collection.findOne({
      _id: new ObjectId(id),
    });

    console.log(`✅ API: Successfully updated transcription metadata:`, {
      id: id,
      captionsCount: body.captions.length,
      step4MetadataCount: body.captions.map(c => c.metadata).length,
    });

    return NextResponse.json({
      success: true,
      message: 'Transcription metadata updated successfully',
      transcription: updatedTranscription,
    });
  } catch (error) {
    console.error('Error updating transcription metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update transcription metadata' },
      { status: 500 },
    );
  }
}
