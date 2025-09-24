# Local Rendering API

The local rendering API allows you to render Remotion compositions locally on your server without using AWS Lambda. This is useful for development, testing, or when you want to keep rendering in-house.

## Endpoint

```
POST /api/remotion/render/local
```

## Request Body

```typescript
interface LocalRenderRequest {
  compositionId: string; // Required: ID of the composition to render
  inputProps?: Record<string, any>; // Optional: Props to pass to the composition
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores'; // Optional: Video codec (default: 'h264')
  audioCodec?: 'aac' | 'mp3' | 'pcm-16' | 'opus'; // Optional: Audio codec (default: 'aac')
  renderType?: 'video' | 'audio' | 'still'; // Optional: Type of render (default: 'video')
  outputLocation?: string; // Optional: Output directory (default: './out')
  fileName?: string; // Optional: Output filename (default: '{compositionId}-{timestamp}')
}
```

## Available Compositions

- `DataMotion` - Data visualization composition
- `ExampleDataMotion` - Example data motion with test data
- `Ripple` - Ripple animation composition
- `Waveform` - Audio waveform visualization

## Render Types

### Video Rendering

Renders a complete video with both video and audio tracks.

```json
{
  "compositionId": "DataMotion",
  "codec": "h264",
  "audioCodec": "aac",
  "renderType": "video",
  "fileName": "my-video"
}
```

### Audio Rendering

Renders only the audio track from the composition.

```json
{
  "compositionId": "Waveform",
  "codec": "h264",
  "audioCodec": "mp3",
  "renderType": "audio",
  "fileName": "my-audio"
}
```

### Still Rendering

Renders a single frame as a PNG image.

```json
{
  "compositionId": "Ripple",
  "renderType": "still",
  "fileName": "my-still"
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "video render completed successfully",
  "result": {
    "type": "video",
    "outputPath": "./out/DataMotion-1234567890.mp4",
    "fileName": "DataMotion-1234567890.mp4",
    "composition": {
      "id": "DataMotion",
      "width": 1920,
      "height": 1080,
      "fps": 30,
      "durationInFrames": 600,
      "durationInSeconds": 20
    }
  }
}
```

### Error Response

```json
{
  "error": "Local render failed",
  "message": "Composition with ID 'NonExistent' not found",
  "stack": "Error stack trace (development only)"
}
```

## Usage Examples

### Basic Video Render

```javascript
const response = await fetch('/api/remotion/render/local', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    compositionId: 'DataMotion',
    renderType: 'video',
  }),
});

const result = await response.json();
console.log('Output file:', result.result.outputPath);
```

### Custom Props and Settings

```javascript
const response = await fetch('/api/remotion/render/local', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    compositionId: 'DataMotion',
    inputProps: {
      title: 'Custom Title',
      backgroundColor: 'blue',
      duration: 10,
    },
    codec: 'h265',
    audioCodec: 'opus',
    renderType: 'video',
    outputLocation: './custom-output',
    fileName: 'custom-video',
  }),
});
```

### Audio-Only Render

```javascript
const response = await fetch('/api/remotion/render/local', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    compositionId: 'Waveform',
    audioCodec: 'mp3',
    renderType: 'audio',
    fileName: 'my-audio',
  }),
});
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `500` - Internal Server Error (rendering failed)

Always check the response status and handle errors appropriately:

```javascript
const response = await fetch('/api/remotion/render/local', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestBody),
});

if (!response.ok) {
  const error = await response.json();
  console.error('Render failed:', error.message);
  return;
}

const result = await response.json();
console.log('Render successful:', result);
```

## Performance Considerations

- Local rendering uses your server's CPU and memory resources
- Large compositions or long durations may take significant time to render
- Consider implementing progress tracking for long renders
- Monitor server resources during rendering operations

## File Output

- Videos are saved as `.mp4` files
- Audio files use the appropriate extension based on codec (`.m4a` for AAC, `.mp3` for MP3, etc.)
- Still images are saved as `.png` files
- Files are saved to the specified `outputLocation` or `./out` by default
