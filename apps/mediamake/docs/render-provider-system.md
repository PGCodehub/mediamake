# Render Provider System

The Render Provider System provides a unified interface for managing render settings and methods across the application. It abstracts the complexity of different rendering approaches (AWS Lambda vs Local) and provides a consistent API for external components to control render behavior.

## Architecture

### Core Components

1. **RenderProvider** - Context provider that manages render state
2. **RenderButton** - Button component that opens the render modal
3. **RenderModal** - Modal component with tabbed interface for render settings
4. **useRender** - Hook for accessing render context
5. **useRenderSettings** - Hook for external components to control settings

### Unified Settings Interface

All render methods now use the same settings interface:

```typescript
interface RenderSettings {
  fileName: string; // Output filename
  codec: string; // Video codec (h264, h265, vp8, vp9, prores)
  audioCodec: string; // Audio codec (aac, mp3, pcm-16, opus)
  composition: string; // Composition ID
  renderType: 'video' | 'audio' | 'still'; // Type of render
  inputProps: string; // JSON string of input properties
  outputLocation?: string; // Output directory (local only)
  isDownloadable?: boolean; // Download behavior (AWS only)
}
```

## Usage

### Basic Usage

```tsx
import { RenderProvider, RenderButton } from '@/components/editor/player';

function MyComponent() {
  return (
    <RenderProvider>
      <RenderButton />
    </RenderProvider>
  );
}
```

### Custom Initial Settings

```tsx
<RenderProvider
  initialSettings={{
    composition: 'Waveform',
    renderType: 'audio',
    codec: 'h265',
    audioCodec: 'mp3',
    fileName: 'my-audio',
  }}
  initialRenderMethod="local"
>
  <RenderButton />
</RenderProvider>
```

### External Control

```tsx
import { useRenderSettings } from '@/components/editor/player';

function ExternalController() {
  const { settings, updateSetting, renderMethod, setRenderMethod } =
    useRenderSettings();

  const handlePreset = () => {
    setSettings({
      composition: 'DataMotion',
      renderType: 'video',
      codec: 'h264',
      fileName: 'preset-video',
    });
    setRenderMethod('local');
  };

  return <button onClick={handlePreset}>Apply Preset</button>;
}
```

## API Reference

### RenderProvider Props

```typescript
interface RenderProviderProps {
  children: ReactNode;
  initialSettings?: Partial<RenderSettings>;
  initialRenderMethod?: 'aws' | 'local';
}
```

### useRender Hook

```typescript
interface RenderContextType {
  // Settings
  settings: RenderSettings;
  setSettings: (settings: Partial<RenderSettings>) => void;
  updateSetting: <K extends keyof RenderSettings>(
    key: K,
    value: RenderSettings[K],
  ) => void;

  // Render method
  renderMethod: 'aws' | 'local';
  setRenderMethod: (method: 'aws' | 'local') => void;

  // Modal state
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Actions
  openModal: () => void;
  closeModal: () => void;
  resetSettings: () => void;
}
```

### useRenderSettings Hook

```typescript
function useRenderSettings() {
    return {
        settings: RenderSettings;
        setSettings: (settings: Partial<RenderSettings>) => void;
        updateSetting: <K extends keyof RenderSettings>(key: K, value: RenderSettings[K]) => void;
        renderMethod: 'aws' | 'local';
        setRenderMethod: (method: 'aws' | 'local') => void;
    };
}
```

## Render Methods

### AWS Lambda Rendering

- **Use Case**: Production rendering, scalable processing
- **Features**:
  - Cloud-based processing
  - Download behavior control
  - Render history tracking
  - Progress monitoring
- **Limitations**: Requires AWS credentials, network dependency

### Local Rendering

- **Use Case**: Development, testing, offline rendering
- **Features**:
  - No external dependencies
  - Immediate results
  - Custom output locations
  - Multiple render types (video, audio, still)
- **Limitations**: Limited by local hardware, no progress tracking

## Available Compositions

- **DataMotion** - Data visualization composition
- **ExampleDataMotion** - Example with test data
- **Ripple** - Ripple animation composition
- **Waveform** - Audio waveform visualization

## Codec Support

### Video Codecs

- **H.264** - Widely compatible, good compression
- **H.265** - Better compression, newer devices
- **VP8** - Open source, web optimized
- **VP9** - Google's codec, web optimized
- **ProRes** - Professional quality, large files

### Audio Codecs

- **AAC** - High quality, widely supported
- **MP3** - Universal compatibility
- **PCM-16** - Uncompressed, large files
- **Opus** - Modern, efficient compression

## Render Types

### Video

- Full video with audio track
- Output: `.mp4` file
- Uses both video and audio codecs

### Audio Only

- Audio track extraction
- Output: `.m4a`, `.mp3`, etc. (based on audio codec)
- Optimized for audio-only content

### Still Image

- Single frame capture
- Output: `.png` file
- Useful for thumbnails and previews

## Integration Examples

### Preset System

```tsx
const presets = {
  quickVideo: {
    composition: 'DataMotion',
    renderType: 'video' as const,
    codec: 'h264',
    audioCodec: 'aac',
    fileName: 'quick-video',
  },
  audioOnly: {
    composition: 'Waveform',
    renderType: 'audio' as const,
    codec: 'h264',
    audioCodec: 'mp3',
    fileName: 'audio-track',
  },
};

function PresetButton({
  preset,
  label,
}: {
  preset: typeof presets.quickVideo;
  label: string;
}) {
  const { setSettings, setRenderMethod, openModal } = useRenderSettings();

  return (
    <button
      onClick={() => {
        setSettings(preset);
        setRenderMethod('local');
        openModal();
      }}
    >
      {label}
    </button>
  );
}
```

### Dynamic Settings Update

```tsx
function DynamicController() {
  const { updateSetting } = useRenderSettings();

  const handleCompositionChange = (composition: string) => {
    // Auto-adjust settings based on composition
    if (composition === 'Waveform') {
      updateSetting('renderType', 'audio');
      updateSetting('audioCodec', 'mp3');
    } else {
      updateSetting('renderType', 'video');
      updateSetting('audioCodec', 'aac');
    }
  };

  return (
    <select onChange={e => handleCompositionChange(e.target.value)}>
      <option value="DataMotion">DataMotion</option>
      <option value="Waveform">Waveform</option>
    </select>
  );
}
```

## Error Handling

The system provides comprehensive error handling:

- **JSON Validation**: Input props are validated before rendering
- **Network Errors**: Proper error messages for API failures
- **Type Safety**: TypeScript ensures correct parameter types
- **User Feedback**: Toast notifications for success/error states

## Performance Considerations

- **Local Rendering**: Uses server CPU/memory resources
- **Bundle Creation**: Cached for multiple renders
- **State Management**: Efficient context updates
- **Modal Performance**: Lazy loading of render options

## Migration Guide

### From Old System

1. Wrap your app with `RenderProvider`
2. Replace direct render button usage with `RenderButton`
3. Use `useRenderSettings` for external control
4. Update any hardcoded settings to use the unified interface

### Breaking Changes

- Settings interface is now unified
- AWS route accepts additional parameters
- Modal state is managed by provider
- External components must use hooks for control
