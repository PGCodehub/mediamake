import { getDatabase } from './mongodb';

export async function initializeDatabase() {
  try {
    const db = await getDatabase();

    // Initialize transcriptions collection
    const transcriptionsCollection = db.collection('transcriptions');
    await transcriptionsCollection.createIndex({ createdAt: -1 });
    await transcriptionsCollection.createIndex({ status: 1 });
    await transcriptionsCollection.createIndex({ tags: 1 });
    await transcriptionsCollection.createIndex({ clientId: 1 });
    await transcriptionsCollection.createIndex(
      { assemblyId: 1 },
      { unique: true },
    );

    // Initialize tags collection
    const tagsCollection = db.collection('tags');
    await tagsCollection.createIndex({ id: 1 }, { unique: true });
    await tagsCollection.createIndex({ clientId: 1 });
    await tagsCollection.createIndex({ createdAt: -1 });

    // Initialize media files collection
    const mediaFilesCollection = db.collection('mediaFiles');
    await mediaFilesCollection.createIndex({ tags: 1 }); // Index for tag queries
    await mediaFilesCollection.createIndex({ clientId: 1 });
    await mediaFilesCollection.createIndex({ contentType: 1 });
    await mediaFilesCollection.createIndex({ contentSource: 1 });
    await mediaFilesCollection.createIndex({ contentSourceUrl: 1 });
    await mediaFilesCollection.createIndex({ createdAt: -1 });
    await mediaFilesCollection.createIndex({ updatedAt: -1 });
    await mediaFilesCollection.createIndex({ contentSubType: 1 });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
