/**
 * Example usage of the local rendering API route
 *
 * This file demonstrates how to use the /api/remotion/render/local endpoint
 * to render Remotion compositions locally with different codecs and render types.
 */

// Example 1: Render a video with default settings
export const renderVideoExample = async () => {
  const response = await fetch('/api/remotion/render/local', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      compositionId: 'DataMotion',
      codec: 'h264',
      audioCodec: 'aac',
      renderType: 'video',
      fileName: 'my-video',
    }),
  });

  const result = await response.json();
  console.log('Video render result:', result);
};

// Example 2: Render audio only
export const renderAudioExample = async () => {
  const response = await fetch('/api/remotion/render/local', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      compositionId: 'Waveform',
      codec: 'h264', // Still required for audio rendering
      audioCodec: 'mp3',
      renderType: 'audio',
      fileName: 'my-audio',
    }),
  });

  const result = await response.json();
  console.log('Audio render result:', result);
};

// Example 3: Render a still image
export const renderStillExample = async () => {
  const response = await fetch('/api/remotion/render/local', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      compositionId: 'Ripple',
      renderType: 'still',
      fileName: 'my-still',
    }),
  });

  const result = await response.json();
  console.log('Still render result:', result);
};

// Example 4: Render with custom input props
export const renderWithPropsExample = async () => {
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

  const result = await response.json();
  console.log('Custom render result:', result);
};

// Example 5: Available compositions
export const availableCompositions = [
  'DataMotion', // Data visualization composition
  'ExampleDataMotion', // Example data motion with test data
  'Ripple', // Ripple animation composition
  'Waveform', // Audio waveform visualization
];

// Example 6: Supported codecs and audio codecs
export const supportedCodecs = {
  video: ['h264', 'h265', 'vp8', 'vp9', 'prores'],
  audio: ['aac', 'mp3', 'pcm-16', 'opus'],
  renderTypes: ['video', 'audio', 'still'],
};

// Example 7: Error handling
export const renderWithErrorHandling = async () => {
  try {
    const response = await fetch('/api/remotion/render/local', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        compositionId: 'NonExistentComposition',
        renderType: 'video',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Render failed:', error);
      return;
    }

    const result = await response.json();
    console.log('Render successful:', result);
  } catch (error) {
    console.error('Network error:', error);
  }
};
