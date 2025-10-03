import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { CreateTagRequest, Tag } from '@/app/types/media';

// GET /api/tags - Fetch all tags with file counts
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const tagsCollection = db.collection('tags');
    const mediaFilesCollection = db.collection('mediaFiles');

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const query = clientId ? { clientId } : {};
    const tags = await tagsCollection
      .find(query)
      .sort({ displayName: 1 })
      .toArray();

    // // Get file counts for each tag
    // const tagsWithCounts = await Promise.all(
    //   tags.map(async tag => {
    //     const fileCount = await mediaFilesCollection.countDocuments({
    //       tags: { $in: [tag.id] },
    //       ...(clientId && { clientId }),
    //     });
    //     return {
    //       ...tag,
    //       fileCount,
    //     };
    //   }),
    // );

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 },
    );
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const body: CreateTagRequest = await request.json();
    const { id, displayName, clientId } = body;

    if (!id || !displayName) {
      return NextResponse.json(
        { error: 'Tag id and displayName are required' },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const collection = db.collection('tags');

    // Check if tag with this id already exists
    const existingTag = await collection.findOne({ id });
    if (existingTag) {
      return NextResponse.json(
        { error: 'Tag with this id already exists' },
        { status: 409 },
      );
    }

    const tag: Tag = {
      id,
      displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(tag);

    return NextResponse.json(
      {
        ...tag,
        _id: result.insertedId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 },
    );
  }
}
