// No longer need database import as API route handles storage

export interface Highlight {
  type: 'text' | 'selector';
  value: string;
  color?: string;
  scrollIntoView?: boolean;
}

export interface Action {
  type: 'goto' | 'click' | 'type' | 'scroll' | 'wait';
  url?: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  selector?: string;
  text?: string;
  duration?: number;
  y?: number;
  x?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  amount?: number;
}

export interface RecordingRequest {
  url?: string;
  viewport?: {
    width: number;
    height: number;
  };
  highlights?: Highlight[];
  actions: Action[];
  output?: {
    format?: 'mp4' | 'webm';
    storage?: 's3' | 'direct';
  };
  webhookUrl?: string;
  requestId?: string;
}

export interface RecordingJobResponse {
  success: boolean;
  message?: string;
  jobId?: string;
  error?: string;
}

/**
 * Creates a recording job with the WebAction Recorder API
 * This now calls our own API route which handles the server-side communication
 */
export async function createRecordingJob(
  request: RecordingRequest,
  tags: string[],
  clientId?: string,
): Promise<RecordingJobResponse> {
  try {
    // Call our own API route which has access to server-side env variables
    const response = await fetch('/api/video/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recordingRequest: request,
        tags,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.details || 'Failed to create recording job');
    }

    const result = await response.json();
    
    return {
      success: result.success || false,
      message: result.message,
      jobId: result.jobId,
    };
  } catch (error) {
    console.error('Error creating recording job:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Creates a simple recording request from URL and text highlights
 */
export function buildSimpleRecordingRequest(
  url: string,
  highlights: Array<{ text: string; color?: string }>,
): RecordingRequest {
  return {
    url,
    highlights: highlights.map(h => ({
      type: 'text',
      value: h.text,
      color: h.color || '#FFFF00',
      scrollIntoView: true,
    })),
    actions: [
      {
        type: 'goto',
        url,
        waitUntil: 'load',
      },
    ],
    viewport: {
      width: 1280,
      height: 720,
    },
    output: {
      format: 'mp4',
      storage: 's3',
    },
  };
}

/**
 * Validates and parses advanced JSON input
 */
export function parseAdvancedRecordingRequest(json: string): RecordingRequest {
  try {
    const parsed = JSON.parse(json);
    
    // Validate required fields
    if (!parsed.actions || !Array.isArray(parsed.actions)) {
      throw new Error('Invalid request: "actions" field is required and must be an array');
    }

    if (parsed.actions.length === 0) {
      throw new Error('Invalid request: "actions" array cannot be empty');
    }

    // Check if URL is required
    const firstAction = parsed.actions[0];
    if (firstAction.type !== 'goto' && !parsed.url) {
      throw new Error('Invalid request: "url" is required if first action is not "goto"');
    }

    return parsed as RecordingRequest;
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets the status of a recording job
 * This now calls our own API route which handles the server-side communication
 */
export async function getRecordingJobStatus(jobId: string): Promise<any> {
  try {
    const response = await fetch(`/api/video/record?jobId=${jobId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get job status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting job status:', error);
    throw error;
  }
}

// Note: Request data storage is now handled by the API route
// No need for these helper functions in the client-side library

