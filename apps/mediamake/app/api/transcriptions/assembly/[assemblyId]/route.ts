import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Transcription } from '@/app/types/transcription';
import { generateCaptions } from '@/app/api/transcribe/assembly/route';

// GET /api/transcriptions/assembly/[assemblyId] - Get transcription by AssemblyAI ID
export async function GET(
  req: NextRequest,
  { params }: { params: { assemblyId: string } },
) {
  try {
    const { assemblyId } = params;
    const clientId = req.headers.get('x-client-id') || undefined;

    if (!assemblyId) {
      return NextResponse.json(
        { error: 'Assembly ID is required' },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const collection = db.collection<Transcription>('transcriptions');

    const query: any = { assemblyId };
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
    console.error('Error fetching transcription by assembly ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcription' },
      { status: 500 },
    );
  }
}
