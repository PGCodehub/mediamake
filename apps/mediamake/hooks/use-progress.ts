import { useState, useCallback } from 'react';
import { type RenderRequest } from '@/lib/render-history';

// Progress fetcher for checking render status
const fetchProgress = async (
  bucketName: string,
  renderId: string,
  apiKey: string,
) => {
  const response = await fetch(
    `/api/remotion/progress?bucketName=${bucketName}&id=${renderId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
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
    (
      requestId: string,
      progressData: any,
      currentRequest: RenderRequest,
    ): ProgressUpdateResult => {
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

        // Create a full RenderRequest object by merging current request with updates
        const updatedRequest: RenderRequest = {
          ...currentRequest,
          ...updateData,
        };

        return {
          success: true,
          updatedRequest: updatedRequest,
        };
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
    async (
      request: RenderRequest,
      apiKey: string,
    ): Promise<ProgressUpdateResult> => {
      if (!request.bucketName || !request.renderId) {
        return { success: false, error: 'Missing bucket name or render ID' };
      }

      try {
        console.log('Fetching progress for request:', request.id);
        const progressData = await fetchProgress(
          request.bucketName,
          request.renderId,
          apiKey,
        );
        console.log('Progress data received:', progressData);

        return updateRequestWithProgressData(request.id, progressData, request);
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

  return {
    isRefreshing,
    fetchAndUpdateProgress,
    updateRequestWithProgressData,
  };
};
