import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getClientId } from '@/lib/auth-utils';

interface BulkUpdateRequest {
  fileIds: string[];
  operation: 'add' | 'remove' | 'replace';
  tags: string[];
}

// PATCH /api/media-files/bulk - Bulk update media files
export async function PATCH(request: NextRequest) {
  try {
    const clientId = getClientId(request);
    const body: BulkUpdateRequest = await request.json();
    const { fileIds, operation, tags } = body;

    if (!fileIds || fileIds.length === 0) {
      return NextResponse.json(
        { error: 'No file IDs provided' },
        { status: 400 },
      );
    }

    if (!operation || !tags || tags.length === 0) {
      return NextResponse.json(
        { error: 'Operation and tags are required' },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const collection = db.collection('mediaFiles');

    // Validate all file IDs
    const objectIds = fileIds.map(id => {
      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid file ID: ${id}`);
      }
      return new ObjectId(id);
    });

    // Build query with client ID for security
    const query: any = { _id: { $in: objectIds } };
    if (clientId) query.clientId = clientId;

    // Get current files to validate they exist and belong to client
    const existingFiles = await collection.find(query).toArray();

    if (existingFiles.length !== fileIds.length) {
      return NextResponse.json(
        { error: 'Some files not found or access denied' },
        { status: 404 },
      );
    }

    // Build update operations based on the operation type
    let updateOperations: any[] = [];
    const updateTime = new Date();

    switch (operation) {
      case 'add':
        // Add tags to existing tags (avoid duplicates)
        updateOperations = objectIds.map(id => ({
          updateOne: {
            filter: { _id: id },
            update: {
              $set: { updatedAt: updateTime },
              $addToSet: { tags: { $each: tags } },
            },
          },
        }));
        break;

      case 'remove':
        // Remove tags from existing tags
        updateOperations = objectIds.map(id => ({
          updateOne: {
            filter: { _id: id },
            update: {
              $set: { updatedAt: updateTime },
              $pull: { tags: { $in: tags } },
            },
          },
        }));
        break;

      case 'replace':
        // Replace all tags with new tags
        updateOperations = objectIds.map(id => ({
          updateOne: {
            filter: { _id: id },
            update: {
              $set: {
                tags: tags,
                updatedAt: updateTime,
              },
            },
          },
        }));
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Must be add, remove, or replace' },
          { status: 400 },
        );
    }

    // Execute bulk update
    const result = await collection.bulkWrite(updateOperations);

    if (result.modifiedCount !== fileIds.length) {
      return NextResponse.json(
        { error: 'Some files could not be updated' },
        { status: 500 },
      );
    }

    // Return updated files
    const updatedFiles = await collection.find(query).toArray();

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      files: updatedFiles,
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { error: 'Failed to update media files' },
      { status: 500 },
    );
  }
}

// PUT /api/media-files/bulk - Bulk replace tags (alias for PATCH with replace operation)
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const requestWithReplace = {
    ...body,
    operation: 'replace',
  };

  return PATCH(
    new NextRequest(request.url, {
      method: 'PATCH',
      headers: request.headers,
      body: JSON.stringify(requestWithReplace),
    }),
  );
}
