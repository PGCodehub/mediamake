import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { DatabasePreset } from '@/components/editor/presets/types';

// GET /api/presets/by-metadata-id/[id] - Get a preset by its metadata.id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const clientId = req.headers.get('x-client-id') || undefined;

    console.log(`🔍 API: Fetching database preset by metadata.id: ${id}`);

    const db = await getDatabase();
    const collection = db.collection<DatabasePreset>('presets');

    // Query by metadata.id
    const query: any = { 'metadata.id': id };
    if (clientId) query.clientId = clientId;

    const preset = await collection.findOne(query);

    if (!preset) {
      console.log(`❌ API: Database preset with metadata.id '${id}' not found`);
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    console.log(
      `✅ API: Successfully fetched database preset by metadata.id:`,
      {
        metadataId: id,
        title: preset.metadata?.title,
        type: preset.metadata?.presetType,
        clientId: preset.clientId,
      },
    );

    return NextResponse.json({ success: true, preset });
  } catch (error) {
    console.error('Error fetching preset by metadata.id:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preset' },
      { status: 500 },
    );
  }
}
