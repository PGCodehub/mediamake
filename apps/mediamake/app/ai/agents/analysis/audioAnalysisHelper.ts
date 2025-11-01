import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Helper function to find existing media file by source URL
 * @param src - Source URL to search for
 * @param clientId - Client ID to filter by
 * @returns Promise with existing media file or null if not found
 */
export async function findMediaFileBySrc(
  src: string,
  clientId: string,
): Promise<any | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection('mediaFiles');

    const existingFile = await collection.findOne({
      filePath: src,
      clientId: clientId,
    });

    return existingFile;
  } catch (error) {
    console.error('Error finding media file by src:', error);
    return null;
  }
}

/**
 * Helper function to update existing media file with analysis results
 * @param mediaFileId - ID of the media file to update
 * @param analysisResult - Analysis results to merge
 * @returns Promise with updated media file or null if update fails
 */
export async function updateMediaFileWithAnalysis(
  mediaFileId: string,
  analysisResult: any,
): Promise<any | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection('mediaFiles');

    const updateResult = await collection.updateOne(
      { _id: new ObjectId(mediaFileId) },
      {
        $set: {
          metadata: analysisResult.metadata,
          updatedAt: new Date(),
        },
      },
    );

    if (updateResult.modifiedCount > 0) {
      console.log('Media file updated with analysis results');
      return await collection.findOne({ _id: new ObjectId(mediaFileId) });
    }

    return null;
  } catch (error) {
    console.error('Error updating media file with analysis:', error);
    return null;
  }
}
