# Render Modal Usage Guide

The render modal now supports both AWS Lambda and Local rendering through a tabbed interface.

## Features

### AWS Lambda Tab (Default)

- **Downloadable**: Toggle for file download behavior
- **File Name**: Custom filename (when downloadable is enabled)
- **Codec**: Video codec selection (H.264, H.265, VP8, VP9)
- **Composition**: Manual composition ID input
- **Input Props**: JSON configuration for the composition

### Local Render Tab

- **Composition**: Dropdown selection of available compositions
  - DataMotion
  - ExampleDataMotion
  - Ripple
  - Waveform
- **Render Type**: Choose between Video, Audio Only, or Still Image
- **Video Codec**: H.264, H.265, VP8, VP9, ProRes
- **Audio Codec**: AAC, MP3, PCM-16, Opus
- **File Name**: Output filename (without extension)
- **Output Location**: Directory path for output files
- **Input Props**: JSON configuration for the composition

## Usage Examples

### Local Video Render

1. Select "Local Render" tab
2. Choose composition: "DataMotion"
3. Set render type: "Video"
4. Select codecs: H.264 + AAC
5. Set filename: "my-video"
6. Set output location: "./out"
7. Configure input props if needed
8. Click "Start Render"

### Local Audio Render

1. Select "Local Render" tab
2. Choose composition: "Waveform"
3. Set render type: "Audio Only"
4. Select audio codec: "MP3"
5. Set filename: "my-audio"
6. Click "Start Render"

### Local Still Image

1. Select "Local Render" tab
2. Choose composition: "Ripple"
3. Set render type: "Still Image"
4. Set filename: "my-still"
5. Click "Start Render"

## Output Files

- **Video**: `{filename}.mp4`
- **Audio**: `{filename}.{audioCodec}` (e.g., `my-audio.mp3`)
- **Still**: `{filename}.png`

## Error Handling

The modal provides:

- JSON validation for input props
- Clear error messages for failed renders
- Success notifications with output paths
- Loading states during render operations

## Integration

The modal integrates with:

- Existing render history system (AWS renders)
- Local file system (Local renders)
- Toast notifications for user feedback
- Router navigation to history page (AWS renders)
