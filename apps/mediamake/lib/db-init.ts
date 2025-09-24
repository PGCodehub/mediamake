import { getDatabase } from './mongodb';

export async function initializeDatabase() {
  try {
    const db = await getDatabase();
    const collection = db.collection('transcriptions');

    // Create indexes
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ status: 1 });
    await collection.createIndex({ tags: 1 });
    await collection.createIndex({ clientId: 1 });
    await collection.createIndex({ assemblyId: 1 }, { unique: true });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
