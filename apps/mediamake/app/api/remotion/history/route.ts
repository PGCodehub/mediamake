import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Mock data - replace with actual database queries
const mockRenderRequests = [
  {
    id: '1',
    fileName: 'video-1.mp4',
    codec: 'h264',
    composition: 'CompositionLayout',
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    downloadUrl: 'https://example.com/video-1.mp4',
    fileSize: 15728640,
    inputProps: {
      childrenData: [],
      duration: 400,
      style: { backgroundColor: 'black' },
    },
  },
  {
    id: '2',
    fileName: 'video-2.mp4',
    codec: 'h265',
    composition: 'CompositionLayout',
    status: 'rendering',
    createdAt: '2024-01-15T11:00:00Z',
    progress: 0.65,
    inputProps: {
      childrenData: [],
      duration: 300,
      style: { backgroundColor: 'blue' },
    },
  },
  {
    id: '3',
    fileName: 'video-3.mp4',
    codec: 'h264',
    composition: 'CompositionLayout',
    status: 'failed',
    createdAt: '2024-01-15T11:30:00Z',
    error: 'Invalid input props provided',
    inputProps: {
      childrenData: [],
      duration: 200,
      style: { backgroundColor: 'red' },
    },
  },
  {
    id: '4',
    fileName: 'video-4.mp4',
    codec: 'h264',
    composition: 'CompositionLayout',
    status: 'pending',
    createdAt: '2024-01-15T12:00:00Z',
    inputProps: {
      childrenData: [],
      duration: 500,
      style: { backgroundColor: 'green' },
    },
  },
];

export const GET = async (req: NextRequest) => {
  try {
    // Since we're now using localStorage for render history,
    // this endpoint is no longer needed for the main functionality.
    // Return empty array as fallback.
    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch render history' },
      { status: 500 },
    );
  }
};
