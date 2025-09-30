import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  Transcription,
  CreateTranscriptionRequest,
  TranscriptionListResponse,
  TranscriptionFilters,
} from '@/app/types/transcription';

// GET /api/transcriptions - List transcriptions with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = req.headers.get('x-client-id') || undefined;
    // Parse query parameters
    const filters: TranscriptionFilters = {
      clientId,
      status: searchParams.get('status') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      language: searchParams.get('language') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy:
        (searchParams.get('sortBy') as 'createdAt' | 'updatedAt') ||
        'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    const db = await getDatabase();
    const collection = db.collection<Transcription>('transcriptions');

    // Build query
    const query: any = {};
    if (filters.clientId) query.clientId = filters.clientId;
    if (filters.status) query.status = filters.status;
    if (filters.language) query.language = filters.language;
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
    // Calculate pagination
    const skip = (filters.page! - 1) * filters.limit!;
    const sort: any = {};
    sort[filters.sortBy!] = filters.sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [transcriptions, total] = await Promise.all([
      collection
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(filters.limit!)
        .toArray(),
      collection.countDocuments(query),
    ]);

    const response: TranscriptionListResponse = {
      transcriptions,
      total,
      page: filters.page!,
      limit: filters.limit!,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching transcriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcriptions' },
      { status: 500 },
    );
  }
}

// POST /api/transcriptions - Create a new transcription
export async function POST(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-client-id') || undefined;
    const body: CreateTranscriptionRequest = await req.json();

    // Validate required fields
    if (!body.assemblyId || !body.audioUrl) {
      return NextResponse.json(
        { error: 'assemblyId and audioUrl are required' },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const collection = db.collection<Transcription>('transcriptions');

    // Check if transcription with this assemblyId already exists
    const existing = await collection.findOne({ assemblyId: body.assemblyId });
    if (existing) {
      return NextResponse.json(
        { error: 'Transcription with this assemblyId already exists' },
        { status: 409 },
      );
    }

    const now = new Date();
    const transcription: Omit<Transcription, '_id'> = {
      clientId,
      assemblyId: body.assemblyId,
      audioUrl: body.audioUrl,
      language: body.language,
      status: body.status || 'processing',
      tags: body.tags || [],
      captions: body.captions || [],
      processingData: body.processingData || {},
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(transcription);

    // Fetch the created document
    const createdTranscription = await collection.findOne({
      _id: result.insertedId,
    });

    return NextResponse.json(
      { success: true, transcription: createdTranscription },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating transcription:', error);
    return NextResponse.json(
      { error: 'Failed to create transcription' },
      { status: 500 },
    );
  }
}
