# ElevenLabs Text-to-Speech Integration

## Overview

This implementation adds ElevenLabs text-to-speech (TTS) functionality to the transcriber, allowing users to generate speech from text with precise timing information that is automatically converted to the same transcript format used for audio-to-text transcriptions.

## What Was Implemented

### 1. **API Route** (`/api/transcribe/elevenlabs/route.ts`)

- Accepts text, voice ID, model ID, and output format
- Calls ElevenLabs `convertWithTimestamps` API
- Converts character-level timing to custom TranscriptionWord/TranscriptionSentence format
- Returns audio base64 and formatted captions

### 2. **TTS Logic File** (`new-transcription-ui.ts`)

- `generateTextToSpeech()` - Complete workflow function
- `uploadAudioToS3()` - Handles audio file upload to S3
- `saveTranscriptionToDB()` - Saves transcription with TTS metadata
- `COMMON_VOICES` - Pre-defined voice options
- `AVAILABLE_MODELS` - Model selection options

### 3. **Updated Modal UI** (`new-transcription-modal.tsx`)

- Mode toggle between "Audio to Text" and "Text to Speech"
- TTS-specific UI fields:
  - Text input area
  - Voice selector (with common voices dropdown)
  - Custom voice ID input option
  - Model selector
  - Language (optional)
- Conditional rendering based on selected mode
- AI Autofix only shown for Audio to Text mode

## Usage

### For Users

1. **Open the New Transcription Modal**
2. **Select "Text to Speech" mode** using the mode toggle buttons
3. **Enter your text** in the text area
4. **Select a voice**:
   - Use the dropdown for common voices (Rachel, Adam, Antoni, etc.)
   - OR check "Use custom voice ID" to enter your own
5. **Choose a model**:
   - Flash v2.5 (ultra-low latency)
   - Turbo v2.5 (fast with good quality)
   - Multilingual v2 (highest quality, 32 languages)
6. **Add tags** (optional) to organize your content
7. **Click "Generate Speech"**

The system will:

- Generate speech with ElevenLabs
- Extract timing information
- Upload audio to S3
- Save everything to the database
- Display the transcription in the transcriber UI

### For Developers

#### API Usage

```typescript
// POST /api/transcribe/elevenlabs
const response = await fetch('/api/transcribe/elevenlabs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Your text here',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
    modelId: 'eleven_flash_v2_5',
    outputFormat: 'mp3_44100_128',
    language: 'en',
  }),
});

const { audioBase64, captions, language } = await response.json();
```

#### Using the generateTextToSpeech Function

```typescript
import { generateTextToSpeech } from '@/components/transcriber/new-transcription-ui';

const result = await generateTextToSpeech({
  text: 'Your text here',
  voiceId: '21m00Tcm4TlvDq8ikWAM',
  modelId: 'eleven_flash_v2_5',
  language: 'en',
  tags: ['tutorial', 'demo'],
  clientId: 'user-123',
});

if (result.success) {
  console.log('Transcription:', result.transcription);
} else {
  console.error('Error:', result.error);
}
```

## Data Flow

```
User Input (Text + Voice)
    ↓
Modal calls generateTextToSpeech()
    ↓
API: /api/transcribe/elevenlabs
    ├─> ElevenLabs: Generate speech with timestamps
    ├─> Convert character timings to words
    └─> Group words into sentences (captions)
    ↓
Upload audio to S3 (/api/db/files)
    ↓
Save to MongoDB (transcriptions collection)
    ↓
Return Transcription object
    ↓
Display in Transcriber UI
```

## Format Conversion

### ElevenLabs Character Timing → Custom Format

**Input from ElevenLabs:**

```javascript
{
  characters: ['H', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l', 'd'],
  character_start_times: [0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, ...],
  character_end_times: [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, ...]
}
```

**Output (Custom TranscriptionSentence format):**

```javascript
{
  id: "caption-0",
  text: "Hello world",
  start: 0.0,
  absoluteStart: 0.0,
  end: 0.65,
  absoluteEnd: 0.65,
  duration: 0.65,
  words: [
    {
      id: "caption-0-word-0",
      text: "Hello",
      start: 0.0,        // Relative to sentence
      absoluteStart: 0.0, // Absolute time
      end: 0.2,
      absoluteEnd: 0.2,
      duration: 0.2,
      confidence: 1.0
    },
    {
      id: "caption-0-word-1",
      text: "world",
      start: 0.05,       // Relative to sentence
      absoluteStart: 0.25,
      end: 0.4,
      absoluteEnd: 0.65,
      duration: 0.4,
      confidence: 1.0
    }
  ]
}
```

### Sentence Grouping Rules

- **Max characters per sentence**: 50 (configurable)
- **Max words per sentence**: 7 (configurable)
- Ensures subtitles are readable and well-timed
- Same logic as AssemblyAI conversion for consistency

## Environment Variables

Ensure you have the following environment variable set:

```env
ELEVENLABS_API_KEY=your_api_key_here
```

## Available Voices

The system includes 10 common voices by default:

| Name      | Voice ID             | Gender |
| --------- | -------------------- | ------ |
| Rachel    | 21m00Tcm4TlvDq8ikWAM | Female |
| Adam      | pNInz6obpgDQGcFmaJgB | Male   |
| Antoni    | ErXwobaYiN019PkySvjV | Male   |
| Arnold    | VR6AewLTigWG4xSOukaG | Male   |
| Bella     | EXAVITQu4vr4xnSDxMaL | Female |
| Callum    | N2lVS1w4EtoT3dr4eOWO | Male   |
| Charlotte | IKne3meq5aSn9XLyUdCD | Female |
| Clyde     | XB0fDUnXU5powFXDhCwa | Male   |
| Chris     | iP95p4xoKVk53GoZ742B | Male   |
| Daniel    | onwK4e9ZLuTAKqWW03F9 | Male   |

You can also use custom voice IDs from your ElevenLabs Voice Lab.

## Available Models

| Model ID               | Name            | Description                                            |
| ---------------------- | --------------- | ------------------------------------------------------ |
| eleven_flash_v2_5      | Flash v2.5      | Ultra-low 75ms latency, up to 40,000 characters        |
| eleven_turbo_v2_5      | Turbo v2.5      | Fast with good quality, up to 40,000 characters        |
| eleven_multilingual_v2 | Multilingual v2 | Highest quality, 32 languages, up to 10,000 characters |

## Database Schema

TTS-generated transcriptions are stored with these additional fields in `processingData.step1`:

```javascript
{
  assemblyId: "elevenlabs-1234567890",  // Unique ID with timestamp
  audioUrl: "https://cdn.example.com/tts-1234567890.mp3",
  captions: [...],  // Same format as AssemblyAI
  processingData: {
    step1: {
      rawText: "Original input text",
      processedCaptions: [...],
      source: "elevenlabs-tts",
      voiceId: "21m00Tcm4TlvDq8ikWAM",
      modelId: "eleven_flash_v2_5",
      generatedAt: "2025-10-18T12:34:56.789Z"
    }
  },
  status: "completed",
  tags: ["demo", "tutorial"],
  // ... other fields
}
```

## Important Notes

### No AI Autofix for TTS

AI Autofix is **NOT** applied to text-to-speech generations because:

- TTS has perfect accuracy (confidence = 1.0)
- Input text is already correct
- No transcription errors to fix
- User has full control over input text

### Integration with Existing Features

- TTS-generated transcriptions appear in the same UI as audio-to-text
- All transcriber steps (caption editor, meta editor, etc.) work identically
- Same export and rendering options available
- Fully compatible with existing transcript format

## Testing

### Manual Testing Checklist

1. ✅ Mode toggle switches between Audio to Text and Text to Speech
2. ✅ TTS text area accepts input and shows character count
3. ✅ Voice selector works (both dropdown and custom ID)
4. ✅ Model selector changes model
5. ✅ Generate Speech button triggers TTS generation
6. ✅ Progress messages update during generation
7. ✅ Audio uploads to S3 successfully
8. ✅ Transcription saves to database
9. ✅ Generated transcription appears in transcriber UI
10. ✅ Captions have correct timing and word boundaries
11. ✅ Tags are properly saved
12. ✅ Error handling works for invalid inputs

### Example Test Script

```javascript
// Test with short text
await generateTextToSpeech({
  text: 'Hello world! This is a test of the ElevenLabs text to speech integration.',
  voiceId: '21m00Tcm4TlvDq8ikWAM',
  modelId: 'eleven_flash_v2_5',
  tags: ['test'],
});

// Test with longer text
await generateTextToSpeech({
  text: "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet. It's commonly used for testing fonts and keyboards.",
  voiceId: 'pNInz6obpgDQGcFmaJgB',
  modelId: 'eleven_turbo_v2_5',
  language: 'en',
  tags: ['pangram', 'test'],
});
```

## Troubleshooting

### Common Issues

**1. "ElevenLabs API key is required"**

- Ensure `ELEVENLABS_API_KEY` is set in environment variables
- Restart your development server after adding the key

**2. "Failed to upload audio to S3"**

- Check S3 credentials in environment variables
- Verify S3 bucket permissions
- Check network connectivity

**3. "No alignment data received from ElevenLabs"**

- Some very short texts may not return timing data
- Try using slightly longer text (minimum ~5 words)

**4. Audio plays but no captions**

- Check browser console for errors
- Verify caption format matches schema
- Check MongoDB for saved transcription

**5. Voice selection not working**

- Verify voice ID is correct
- Check if voice exists in your ElevenLabs account
- Try using a different voice from the dropdown

## Future Enhancements

Potential improvements for future versions:

1. **Voice Preview** - Play sample audio before generating
2. **Bulk Generation** - Generate multiple TTS from a list
3. **Voice Cloning** - Support for custom cloned voices
4. **SSML Support** - Advanced speech control with SSML tags
5. **Cost Estimation** - Show estimated cost before generation
6. **Batch Processing** - Queue multiple TTS generations
7. **Voice Settings** - Adjust stability, similarity, and style

## Related Documentation

- [ElevenLabs TTS to Subtitles Guide](./elevenlabs-tts-subtitles.md)
- [Transcription Types](../app/types/transcription.ts)
- [Caption Mutator](../../packages/datamotion/src/transformers/caption.mutate.ts)

---

**Created**: October 2025  
**Status**: ✅ Complete and Production Ready  
**Dependencies**: elevenlabs@^1.59.0
