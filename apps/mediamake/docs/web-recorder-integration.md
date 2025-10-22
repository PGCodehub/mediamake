# Web Recorder Integration

This document describes the WebAction Recorder API integration for recording website interactions as video.

## Overview

The Web Recorder integration allows users to:

- Record website interactions as videos
- Highlight specific text on pages
- Create custom action sequences
- Store recorded videos in the media library

## Setup

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Media Helper API Base URL
MEDIA_HELPER_URL=http://localhost:8080

# Media Helper API Key (required for authentication)
MEDIA_HELPER_API_KEY=your-api-key-here

# JWT Encryption Secret (for webhook authentication)
MEDIA_HELPER_SECRET=your-secret-key-for-jwt

# Your API key (for webhook callbacks)
DEV_API_KEY=your-mediamake-api-key
```

- **MEDIA_HELPER_URL**: Replace with your Media Helper API endpoint
- **MEDIA_HELPER_API_KEY**: Your Bearer token for API authentication
- **MEDIA_HELPER_SECRET**: Secret key for JWT encryption of webhook callbacks
- **DEV_API_KEY**: Your MediaMake API key for webhook authentication

### Next.js Configuration

If your webhook endpoint needs to be publicly accessible (for the WebAction Recorder API to call it), you may need to:

1. Use a service like ngrok for local development:

   ```bash
   ngrok http 3000
   ```

2. Set the `NEXT_PUBLIC_APP_URL` environment variable:
   ```env
   NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok.io
   ```

## Features

### Simple Mode

Simple mode provides an easy interface for basic recording:

1. **URL Input**: Enter the website URL to record
2. **Text Highlights**: Add multiple text highlights with custom colors
3. **Tags**: Select or create tags for organizing the recorded video

The system automatically:

- Creates a `goto` action to navigate to the URL
- Waits for the page to load
- Applies all text highlights with specified colors
- Captures the recording

### Advanced Mode

Advanced mode allows full control over the recording process using JSON configuration:

```json
{
  "url": "https://example.com",
  "actions": [
    { "type": "goto", "url": "https://example.com", "waitUntil": "load" },
    { "type": "click", "selector": "#button" },
    { "type": "type", "selector": "#input", "text": "Hello World" },
    { "type": "wait", "duration": 2000 },
    { "type": "scroll", "y": 500 }
  ],
  "highlights": [
    { "type": "text", "value": "Example", "color": "#FFFF00" },
    { "type": "selector", "value": ".important", "color": "#FF6B6B" }
  ],
  "viewport": {
    "width": 1280,
    "height": 720
  },
  "output": {
    "format": "mp4",
    "storage": "s3"
  }
}
```

### Supported Actions

- **goto**: Navigate to a URL
  - `url`: Target URL
  - `waitUntil`: "load" | "domcontentloaded" | "networkidle"

- **click**: Click an element
  - `selector`: CSS selector

- **type**: Type text into an input
  - `selector`: CSS selector
  - `text`: Text to type

- **scroll**: Scroll the page
  - `y`: Vertical scroll position
  - `x`: Horizontal scroll position
  - `direction`: "up" | "down" | "left" | "right"
  - `amount`: Pixels to scroll

- **wait**: Wait for a duration
  - `duration`: Time in milliseconds

### Highlights

Two types of highlights are supported:

1. **Text Highlight**: Highlights specific text on the page

   ```json
   { "type": "text", "value": "Search text", "color": "#FFFF00" }
   ```

2. **Selector Highlight**: Highlights elements matching a CSS selector
   ```json
   { "type": "selector", "value": ".class-name", "color": "#FF6B6B" }
   ```

## Architecture

### Components

1. **WebRecorderDialog** (`components/ui/web-recorder-dialog.tsx`)
   - Main dialog component with simple and advanced modes
   - Handles form validation and submission

2. **WebRecorderTrigger** (`components/ui/web-recorder-trigger.tsx`)
   - Trigger component that opens the dialog
   - Supports button and dropzone UI variants

3. **API Helper** (`lib/web-recorder.ts`)
   - Functions for interacting with the WebAction Recorder API
   - Request building and validation
   - Job status polling

4. **Webhook Endpoint** (`app/api/video/webhook/route.ts`)
   - Receives webhook callbacks from the API
   - Creates media file entries in the database
   - Handles idempotency using requestId

### Data Flow

1. User submits recording request through the dialog
2. Request is sent to WebAction Recorder API with webhook URL
3. API returns a jobId
4. User is notified that the job is submitted
5. When recording completes, API calls our webhook
6. Webhook creates a media file entry in the database
7. Video appears in the media library

### Database Schema

Recorded videos are stored as media files with:

```typescript
{
  tags: string[],                    // User-selected tags
  clientId: string,                  // Client identifier
  contentType: "video",              // Always "video"
  contentMimeType: string,           // "video/mp4" or "video/webm"
  contentSubType: "recorded",        // Always "recorded"
  contentSource: "webrecorder",      // Always "webrecorder"
  contentSourceUrl: string,          // Video URL from API
  fileName: string,                  // Generated filename
  fileSize: number,                  // Video file size
  filePath: string,                  // Video URL
  metadata: {
    duration: number,                // Video duration in seconds
    resolution: string,              // e.g., "1280x720"
    format: string,                  // "mp4" or "webm"
    recordedAt: string,              // ISO timestamp
    requestId: string                // For idempotency
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Temporary Storage

Recording requests are temporarily stored in the `webRecorderRequests` collection:

```typescript
{
  requestId: string,
  tags: string[],
  clientId: string,
  createdAt: Date,
  expiresAt: Date  // 24 hours from creation
}
```

This allows the webhook to retrieve the user-selected tags when the recording completes.

## UI Integration

The Web Recorder is integrated into the media page at `/media`:

- Appears as a dropzone alongside Upload and URL Indexing
- Uses a 3-column grid layout
- Refreshes media list when recording completes

## Error Handling

- Invalid JSON in advanced mode is validated in real-time
- Missing required fields are highlighted
- API errors are displayed with toast notifications
- Webhook handles failed recordings gracefully
- Duplicate recordings are prevented using requestId

## Future Enhancements

- Real-time progress updates via WebSocket or polling
- Preview of recording configuration
- Save and reuse recording templates
- Bulk recording from CSV/JSON files
- Recording history and analytics
