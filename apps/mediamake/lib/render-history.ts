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
  inputProps?: any;
  bucketName?: string;
  renderId?: string;
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
  const history = getRenderHistory();
  const index = history.findIndex(req => req.id === id);

  if (index >= 0) {
    history[index] = { ...history[index], ...updates };
    saveRenderHistory(history);
  }
};

export const getRenderRequest = (id: string): RenderRequest | null => {
  const history = getRenderHistory();
  return history.find(req => req.id === id) || null;
};

export const clearRenderHistory = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};
