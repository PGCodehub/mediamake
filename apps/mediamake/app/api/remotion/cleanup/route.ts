import { NextRequest, NextResponse } from 'next/server';
import { renderRequestDB } from '@/lib/render-mongodb';

// POST /api/remotion/cleanup - Clean up old completed/failed renders
export const POST = async (req: NextRequest) => {
  try {
    const { daysOld = 30 } = await req.json();

    if (typeof daysOld !== 'number' || daysOld < 1) {
      return NextResponse.json(
        { error: 'daysOld must be a positive number' },
        { status: 400 },
      );
    }

    const deletedCount = await renderRequestDB.cleanupOldRenders(daysOld);

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} old render requests older than ${daysOld} days`,
    });
  } catch (error) {
    console.error('Failed to cleanup old renders:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup old renders' },
      { status: 500 },
    );
  }
};
