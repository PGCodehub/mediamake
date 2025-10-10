import { Transcription } from '@/app/types/transcription';

/**
 * Fetches a complete transcription by ID with all fields
 * Use this when you need the full transcription data (captions, processingData, etc.)
 */
export async function fetchFullTranscription(
  transcriptionId: string,
): Promise<Transcription | null> {
  try {
    const response = await fetch(`/api/transcriptions/${transcriptionId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch transcription');
    }
    const data = await response.json();
    return data.transcription;
  } catch (error) {
    console.error('Error fetching full transcription:', error);
    return null;
  }
}

/**
 * Fetches lightweight transcription list data
 * Use this for displaying lists where you only need basic info
 */
export async function fetchTranscriptionList(limit: number = 50): Promise<{
  transcriptions: any[];
  total: number;
  page: number;
  limit: number;
}> {
  try {
    const response = await fetch(`/api/transcriptions?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch transcription list');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching transcription list:', error);
    return { transcriptions: [], total: 0, page: 1, limit };
  }
}

/**
 * Fetches media files with optimized fields for list display
 */
export async function fetchMediaFileList(params: {
  tag?: string;
  tags?: string[];
  contentType?: string;
  contentSource?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  files: any[];
  total: number;
  hasMore: boolean;
}> {
  try {
    const searchParams = new URLSearchParams();
    if (params.tag) searchParams.append('tag', params.tag);
    if (params.tags?.length) searchParams.append('tags', params.tags.join(','));
    if (params.contentType)
      searchParams.append('contentType', params.contentType);
    if (params.contentSource)
      searchParams.append('contentSource', params.contentSource);
    searchParams.append('limit', (params.limit || 50).toString());
    searchParams.append('offset', (params.offset || 0).toString());

    const response = await fetch(`/api/media-files?${searchParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch media files');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching media files:', error);
    return { files: [], total: 0, hasMore: false };
  }
}
