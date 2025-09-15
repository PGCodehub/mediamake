import { useState, useCallback } from 'react';
import {
  getRenderRequest,
  updateRenderRequest,
  type RenderRequest,
} from '@/lib/render-history';

// Progress fetcher for checking render status
const fetchProgress = async (bucketName: string, renderId: string) => {
  const response = await fetch(
    `/api/remotion/progress?bucketName=${bucketName}&id=${renderId}`,
  );
  if (!response.ok) {
    throw new Error('Failed to fetch progress');
  }
  return response.json();
};

interface ProgressUpdateResult {
  success: boolean;
  updatedRequest?: RenderRequest;
  error?: string;
}

export const useProgress = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const updateRequestWithProgressData = useCallback(
    (requestId: string, progressData: any): ProgressUpdateResult => {
      try {
        console.log('Updating request with progress data:', {
          requestId,
          progressData,
        });

        let updateData: Partial<RenderRequest>;

        if (progressData.type === 'done') {
          updateData = {
            status: 'completed' as const,
            downloadUrl: progressData.url,
            fileSize: progressData.size,
            progress: 1,
            progressData: progressData,
          };
        } else if (progressData.type === 'error') {
          updateData = {
            status: 'failed' as const,
            error: progressData.message,
            progress: 0,
            progressData: progressData,
          };
        } else if (progressData.type === 'progress') {
          updateData = {
            progress: progressData.progress,
            progressData: progressData,
          };
        } else {
          return { success: false, error: 'Unknown progress data type' };
        }

        updateRenderRequest(requestId, updateData);
        const updatedRequest = getRenderRequest(requestId);

        if (updatedRequest) {
          return {
            success: true,
            updatedRequest: {
              ...updatedRequest,
              progressData: progressData, // Ensure progressData is always included
            },
          };
        } else {
          return {
            success: false,
            error: 'Failed to retrieve updated request',
          };
        }
      } catch (error) {
        console.error('Error updating request with progress data:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [],
  );

  const fetchAndUpdateProgress = useCallback(
    async (request: RenderRequest): Promise<ProgressUpdateResult> => {
      if (!request.bucketName || !request.renderId) {
        return { success: false, error: 'Missing bucket name or render ID' };
      }

      try {
        console.log('Fetching progress for request:', request.id);
        const progressData = await fetchProgress(
          request.bucketName,
          request.renderId,
        );
        console.log('Progress data received:', progressData);

        return updateRequestWithProgressData(request.id, progressData);
      } catch (error) {
        console.error('Failed to fetch progress:', error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to fetch progress',
        };
      }
    },
    [updateRequestWithProgressData],
  );

  const refreshRequest = useCallback(
    async (requestId: string): Promise<ProgressUpdateResult> => {
      setIsRefreshing(true);

      try {
        console.log('Refreshing request:', requestId);
        const request = getRenderRequest(requestId);

        if (!request) {
          return { success: false, error: 'Request not found' };
        }

        // Always fetch fresh data from API for refresh
        return await fetchAndUpdateProgress(request);
      } finally {
        setIsRefreshing(false);
      }
    },
    [fetchAndUpdateProgress],
  );

  return {
    isRefreshing,
    fetchAndUpdateProgress,
    refreshRequest,
    updateRequestWithProgressData,
  };
};
