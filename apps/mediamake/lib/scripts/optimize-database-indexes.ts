#!/usr/bin/env tsx

/**
 * Database Index Optimization Script
 *
 * This script creates optimized indexes for all MongoDB collections based on
 * the query patterns identified in the API endpoints. It will significantly
 * improve database performance by creating compound indexes for common query patterns.
 *
 * Run with: npx tsx scripts/optimize-database-indexes.ts
 */

import { MongoClient, Db } from 'mongodb';
import { config } from 'dotenv';

// Load environment variables
config();

interface IndexDefinition {
  collection: string;
  index: any;
  options?: any;
  description: string;
}

class DatabaseIndexOptimizer {
  private client: MongoClient;
  private db!: Db;

  constructor() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    this.client = new MongoClient(mongoUri);
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db();
    console.log('✅ Connected to MongoDB');
  }

  async disconnect() {
    await this.client.close();
    console.log('✅ Disconnected from MongoDB');
  }

  /**
   * Define all optimized indexes based on API query patterns
   */
  getIndexDefinitions(): IndexDefinition[] {
    return [
      // TRANSCRIPTIONS COLLECTION
      {
        collection: 'transcriptions',
        index: { clientId: 1, createdAt: -1 },
        options: { name: 'clientId_createdAt_desc' },
        description:
          'Client transcriptions sorted by creation date (most common query)',
      },
      {
        collection: 'transcriptions',
        index: { clientId: 1, status: 1, createdAt: -1 },
        options: { name: 'clientId_status_createdAt_desc' },
        description:
          'Client transcriptions filtered by status and sorted by date',
      },
      {
        collection: 'transcriptions',
        index: { clientId: 1, language: 1, createdAt: -1 },
        options: { name: 'clientId_language_createdAt_desc' },
        description:
          'Client transcriptions filtered by language and sorted by date',
      },
      {
        collection: 'transcriptions',
        index: { clientId: 1, tags: 1, createdAt: -1 },
        options: { name: 'clientId_tags_createdAt_desc' },
        description:
          'Client transcriptions filtered by tags and sorted by date',
      },
      {
        collection: 'transcriptions',
        index: { clientId: 1, updatedAt: -1 },
        options: { name: 'clientId_updatedAt_desc' },
        description: 'Client transcriptions sorted by update date',
      },
      {
        collection: 'transcriptions',
        index: { assemblyId: 1 },
        options: { name: 'assemblyId_unique', unique: true },
        description: 'Unique index for AssemblyAI ID lookups',
      },
      {
        collection: 'transcriptions',
        index: { _id: 1, clientId: 1 },
        options: { name: 'id_clientId_compound' },
        description:
          'Compound index for individual transcription lookups with client filtering',
      },

      // PRESETS COLLECTION
      {
        collection: 'presets',
        index: { clientId: 1, createdAt: -1 },
        options: { name: 'clientId_createdAt_desc' },
        description: 'Client presets sorted by creation date',
      },
      {
        collection: 'presets',
        index: { clientId: 1, 'metadata.type': 1, createdAt: -1 },
        options: { name: 'clientId_metadata_type_createdAt_desc' },
        description: 'Client presets filtered by type and sorted by date',
      },
      {
        collection: 'presets',
        index: { clientId: 1, 'metadata.presetType': 1, createdAt: -1 },
        options: { name: 'clientId_metadata_presetType_createdAt_desc' },
        description:
          'Client presets filtered by preset type and sorted by date',
      },
      {
        collection: 'presets',
        index: { clientId: 1, 'metadata.tags': 1, createdAt: -1 },
        options: { name: 'clientId_metadata_tags_createdAt_desc' },
        description: 'Client presets filtered by tags and sorted by date',
      },
      {
        collection: 'presets',
        index: { clientId: 1, 'metadata.title': 1 },
        options: { name: 'clientId_metadata_title_asc' },
        description: 'Client presets sorted by title',
      },
      {
        collection: 'presets',
        index: { clientId: 1, updatedAt: -1 },
        options: { name: 'clientId_updatedAt_desc' },
        description: 'Client presets sorted by update date',
      },
      {
        collection: 'presets',
        index: { _id: 1, clientId: 1 },
        options: { name: 'id_clientId_compound' },
        description:
          'Compound index for individual preset lookups with client filtering',
      },

      // PRESET DATA COLLECTION
      {
        collection: 'presetData',
        index: { clientId: 1, createdAt: -1 },
        options: { name: 'clientId_createdAt_desc' },
        description: 'Client preset data sorted by creation date',
      },
      {
        collection: 'presetData',
        index: { _id: 1, clientId: 1 },
        options: { name: 'id_clientId_compound' },
        description:
          'Compound index for preset data lookups with client filtering',
      },

      // MEDIA FILES COLLECTION
      {
        collection: 'mediaFiles',
        index: { clientId: 1, createdAt: -1 },
        options: { name: 'clientId_createdAt_desc' },
        description: 'Client media files sorted by creation date',
      },
      {
        collection: 'mediaFiles',
        index: { clientId: 1, contentType: 1, createdAt: -1 },
        options: { name: 'clientId_contentType_createdAt_desc' },
        description:
          'Client media files filtered by content type and sorted by date',
      },
      {
        collection: 'mediaFiles',
        index: { clientId: 1, contentSource: 1, createdAt: -1 },
        options: { name: 'clientId_contentSource_createdAt_desc' },
        description:
          'Client media files filtered by content source and sorted by date',
      },
      {
        collection: 'mediaFiles',
        index: { clientId: 1, contentSourceUrl: 1 },
        options: { name: 'clientId_contentSourceUrl_asc' },
        description: 'Client media files filtered by content source URL',
      },
      {
        collection: 'mediaFiles',
        index: { clientId: 1, tags: 1, createdAt: -1 },
        options: { name: 'clientId_tags_createdAt_desc' },
        description: 'Client media files filtered by tags and sorted by date',
      },
      {
        collection: 'mediaFiles',
        index: { _id: 1, clientId: 1 },
        options: { name: 'id_clientId_compound' },
        description:
          'Compound index for individual media file lookups with client filtering',
      },

      // API KEYS COLLECTION (if exists)
      {
        collection: 'apiKeys',
        index: { clientId: 1, createdAt: -1 },
        options: { name: 'clientId_createdAt_desc' },
        description: 'Client API keys sorted by creation date',
      },
      {
        collection: 'apiKeys',
        index: { _id: 1, clientId: 1 },
        options: { name: 'id_clientId_compound' },
        description: 'Compound index for API key lookups with client filtering',
      },

      // RENDER HISTORY COLLECTION (if exists)
      {
        collection: 'renderHistory',
        index: { clientId: 1, createdAt: -1 },
        options: { name: 'clientId_createdAt_desc' },
        description: 'Client render history sorted by creation date',
      },
      {
        collection: 'renderHistory',
        index: { _id: 1, clientId: 1 },
        options: { name: 'id_clientId_compound' },
        description:
          'Compound index for render history lookups with client filtering',
      },
    ];
  }

  /**
   * Create indexes for a specific collection
   */
  async createIndexesForCollection(
    collectionName: string,
    indexes: IndexDefinition[],
  ) {
    const collection = this.db.collection(collectionName);
    const collectionIndexes = indexes.filter(
      idx => idx.collection === collectionName,
    );

    if (collectionIndexes.length === 0) {
      console.log(`⚠️  No indexes defined for collection: ${collectionName}`);
      return;
    }

    console.log(`\n📁 Creating indexes for collection: ${collectionName}`);

    for (const indexDef of collectionIndexes) {
      try {
        console.log(`   Creating index: ${indexDef.options.name}`);
        console.log(`   Description: ${indexDef.description}`);

        await collection.createIndex(indexDef.index, indexDef.options);
        console.log(`   ✅ Created successfully`);
      } catch (error: any) {
        if (error.code === 85) {
          console.log(`   ⚠️  Index already exists: ${indexDef.options.name}`);
        } else {
          console.log(`   ❌ Failed to create index: ${error.message}`);
        }
      }
    }
  }

  /**
   * List existing indexes for a collection
   */
  async listExistingIndexes(collectionName: string) {
    try {
      const collection = this.db.collection(collectionName);
      const indexes = await collection.indexes();

      console.log(`\n📋 Existing indexes for ${collectionName}:`);
      indexes.forEach((index: any) => {
        console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
      });
    } catch (error) {
      console.log(
        `   ⚠️  Collection ${collectionName} does not exist or is empty`,
      );
    }
  }

  /**
   * Analyze query performance for a collection
   */
  async analyzeQueryPerformance(collectionName: string) {
    try {
      const collection = this.db.collection(collectionName);
      const stats = await this.db.stats();

      console.log(`\n📊 Collection stats for ${collectionName}:`);

      // Get collection-specific stats
      const collectionStats = await this.db
        .collection(collectionName)
        .countDocuments();
      console.log(`   - Document count: ${collectionStats}`);

      // Get index information
      const indexes = await collection.indexes();
      console.log(`   - Index count: ${indexes.length}`);

      if (indexes.length > 0) {
        console.log(`   - Indexes:`);
        indexes.forEach((index: any) => {
          console.log(`     * ${index.name}: ${JSON.stringify(index.key)}`);
        });
      }
    } catch (error) {
      console.log(
        `   ⚠️  Could not analyze collection ${collectionName}: ${error}`,
      );
    }
  }

  /**
   * Run the complete optimization process
   */
  async optimize() {
    console.log('🚀 Starting Database Index Optimization');
    console.log('=====================================\n');

    try {
      await this.connect();

      const indexDefinitions = this.getIndexDefinitions();
      const collections = [
        ...new Set(indexDefinitions.map(idx => idx.collection)),
      ];

      // Analyze existing state
      console.log('📊 Analyzing existing database state...');
      for (const collection of collections) {
        await this.analyzeQueryPerformance(collection);
        await this.listExistingIndexes(collection);
      }

      // Create optimized indexes
      console.log('\n🔧 Creating optimized indexes...');
      for (const collection of collections) {
        await this.createIndexesForCollection(collection, indexDefinitions);
      }

      // Final analysis
      console.log('\n📊 Final database state after optimization...');
      for (const collection of collections) {
        await this.analyzeQueryPerformance(collection);
      }

      console.log('\n✅ Database optimization completed successfully!');
      console.log('\n💡 Performance improvements you should see:');
      console.log('   - Faster query execution for filtered lists');
      console.log('   - Improved sorting performance');
      console.log('   - Reduced database load for pagination');
      console.log('   - Better performance for client-specific queries');
    } catch (error) {
      console.error('❌ Optimization failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Drop all indexes (use with caution!)
   */
  async dropAllIndexes() {
    console.log('⚠️  WARNING: This will drop ALL indexes except _id!');
    console.log('This should only be used for testing or complete reindexing.');

    const indexDefinitions = this.getIndexDefinitions();
    const collections = [
      ...new Set(indexDefinitions.map(idx => idx.collection)),
    ];

    for (const collectionName of collections) {
      try {
        const collection = this.db.collection(collectionName);
        const indexes = await collection.indexes();

        for (const index of indexes) {
          if (index.name !== '_id_') {
            console.log(`Dropping index: ${index.name} from ${collectionName}`);
            await collection.dropIndex(index.name!);
          }
        }
      } catch (error) {
        console.log(`Could not drop indexes for ${collectionName}:`, error);
      }
    }
  }
}

// Main execution
async function main() {
  const optimizer = new DatabaseIndexOptimizer();

  const args = process.argv.slice(2);

  if (args.includes('--drop-all')) {
    console.log('⚠️  Dropping all indexes...');
    await optimizer.connect();
    await optimizer.dropAllIndexes();
    await optimizer.disconnect();
  } else {
    await optimizer.optimize();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseIndexOptimizer };
