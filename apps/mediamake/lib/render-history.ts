import { InputCompositionProps } from '@microfox/remotion';

export interface RenderRequest {
  id: string;
  fileName: string;
  codec: string;
  composition: string;
  status: 'pending' | 'rendering' | 'completed' | 'failed';
  createdAt: string;
  progress?: number;
  error?: string;
  downloadUrl?: string;
  fileSize?: number;
  inputProps?: InputCompositionProps;
  bucketName?: string;
  renderId?: string;
  renderType?: 'video' | 'audio' | 'still';
  audioCodec?: string;
  isDownloadable?: boolean;
  progressData?: {
    type: string;
    url?: string;
    size?: number;
    renderInfo?: {
      framesRendered?: number;
      bucket?: string;
      renderSize?: number;
      chunks?: number;
      costs?: {
        accruedSoFar?: number;
        displayCost?: string;
        currency?: string;
        disclaimer?: string;
      };
      currentTime?: number;
      done?: boolean;
      encodingStatus?: {
        framesEncoded?: number;
        combinedFrames?: number;
        timeToCombine?: number;
      };
      errors?: any[];
      fatalErrorEncountered?: boolean;
      lambdasInvoked?: number;
      outputFile?: string;
      renderId?: string;
      timeToFinish?: number;
      timeToFinishChunks?: number;
      timeToRenderFrames?: number;
      overallProgress?: number;
      retriesInfo?: any[];
      outKey?: string;
      outBucket?: string;
      mostExpensiveFrameRanges?: Array<{
        timeInMilliseconds: number;
        chunk: number;
        frameRange: [number, number];
      }>;
      timeToEncode?: number;
      outputSizeInBytes?: number;
      type?: string;
      estimatedBillingDurationInMilliseconds?: number;
      timeToCombine?: number;
      combinedFrames?: number;
      renderMetadata?: {
        startedDate?: number;
        totalChunks?: number;
        estimatedTotalLambdaInvokations?: number;
        estimatedRenderLambdaInvokations?: number;
        compositionId?: string;
        siteId?: string;
        codec?: string;
        type?: string;
        imageFormat?: string;
        inputProps?: any;
        lambdaVersion?: string;
        framesPerLambda?: number;
        memorySizeInMb?: number;
        region?: string;
        renderId?: string;
        privacy?: string;
        everyNthFrame?: number;
        frameRange?: [number, number];
        audioCodec?: string | null;
        deleteAfter?: string | null;
        numberOfGifLoops?: number | null;
        downloadBehavior?: any;
        audioBitrate?: number | null;
        muted?: boolean;
        metadata?: any;
        functionName?: string;
        dimensions?: {
          width: number;
          height: number;
        };
        rendererFunctionName?: string;
        scale?: number;
      };
      timeoutTimestamp?: number;
      compositionValidated?: number;
      functionLaunched?: number;
      serveUrlOpened?: number;
      artifacts?: any[];
    };
  };
}

const STORAGE_KEY = 'remotion-render-history';

export const getRenderHistory = (): RenderRequest[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to parse render history from localStorage:', error);
    return [];
  }
};

export const saveRenderHistory = (history: RenderRequest[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save render history to localStorage:', error);
  }
};

export const addRenderRequest = (request: RenderRequest): void => {
  const history = getRenderHistory();
  const existingIndex = history.findIndex(req => req.id === request.id);

  if (existingIndex >= 0) {
    // Update existing request
    history[existingIndex] = request;
  } else {
    // Add new request at the beginning
    history.unshift(request);
  }

  saveRenderHistory(history);
};

export const updateRenderRequest = (
  id: string,
  updates: Partial<RenderRequest>,
): void => {
  console.log('updateRenderRequest called with:', { id, updates });
  const history = getRenderHistory();
  const index = history.findIndex(req => req.id === id);

  if (index >= 0) {
    const oldRequest = history[index];
    history[index] = { ...history[index], ...updates };
    console.log('Updated request in localStorage:', {
      old: oldRequest,
      new: history[index],
      updates,
    });
    saveRenderHistory(history);
  } else {
    console.warn('Request not found for update:', id);
  }
};

export const getRenderRequest = (id: string): RenderRequest | null => {
  const history = getRenderHistory();
  const request = history.find(req => req.id === id) || null;
  console.log('getRenderRequest called for ID:', id, 'Found:', request);
  if (request) {
    console.log('Request progressData:', request.progressData);
  }
  return request;
};

export const clearRenderHistory = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};
