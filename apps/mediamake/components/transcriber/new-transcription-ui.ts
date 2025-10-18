/**
 * Text-to-Speech Logic for Transcriber
 * Handles ElevenLabs TTS generation, audio upload to S3, and database synchronization
 */

import { Transcription } from '@/app/types/transcription';
import { Caption } from '@/app/types/transcription';

export interface TTSGenerationOptions {
  text: string;
  voiceId: string;
  modelId?: string;
  outputFormat?: string;
  language?: string;
  tags?: string[];
  clientId?: string;
}

export interface TTSGenerationResult {
  success: boolean;
  transcription?: Transcription;
  error?: string;
}

/**
 * Upload audio file to S3 and update transcription with S3 URL
 */
async function uploadAudioAndUpdateDB(
  audioBase64: string,
  transcriptionId: string,
  clientId?: string
): Promise<Transcription> {
  // Convert base64 to blob
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'audio/mpeg' });

  // Create File object
  const fileName = `tts-${Date.now()}.mp3`;
  const file = new File([blob], fileName, { type: 'audio/mpeg' });

  // Upload to S3 via the files API
  const formData = new FormData();
  formData.append('file', file);
  formData.append(
    'folderName',
    `mediamake/${clientId?.replaceAll(' ', '') || 'tts'}`
  );

  const response = await fetch('/api/db/files', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload audio to S3');
  }

  const result = await response.json();

  if (!result.success || !result.media || result.media.length === 0) {
    throw new Error('Failed to get audio URL from S3 upload');
  }

  const audioUrl = result.media[0].mediaUrl;

  // Update transcription with S3 URL
  const updateResponse = await fetch(`/api/transcriptions/${transcriptionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audioUrl,
    }),
  });

  if (!updateResponse.ok) {
    throw new Error('Failed to update transcription with audio URL');
  }

  // Fetch and return the updated transcription
  const getResponse = await fetch(`/api/transcriptions/${transcriptionId}`);
  if (!getResponse.ok) {
    throw new Error('Failed to fetch updated transcription');
  }

  const updatedData = await getResponse.json();
  return updatedData.transcription;
}

/**
 * Complete TTS workflow: Generate speech (saves to DB) -> Upload to S3 -> Update DB with S3 URL
 */
export async function generateTextToSpeech(
  options: TTSGenerationOptions
): Promise<TTSGenerationResult> {
  const {
    text,
    voiceId,
    modelId = 'eleven_flash_v2_5',
    outputFormat = 'mp3_44100_128',
    language,
    tags = [],
    clientId,
  } = options;

  try {
    // Step 1: Generate speech with ElevenLabs and save to DB
    console.log('🎤 Step 1: Generating speech with ElevenLabs...');
    const response = await fetch('/api/transcribe/elevenlabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clientId ? { 'x-client-id': clientId } : {}),
      },
      body: JSON.stringify({
        text,
        voiceId,
        modelId,
        outputFormat,
        language,
        tags,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate speech');
    }

    const result = await response.json();

    if (!result.success || !result.transcription) {
      throw new Error('Failed to generate speech');
    }

    console.log('✅ Speech generated, transcription saved to DB');

    // Step 2: Upload audio to S3 and update DB with S3 URL
    console.log('☁️ Step 2: Uploading audio to S3...');
    const updatedTranscription = await uploadAudioAndUpdateDB(
      result.audioBase64,
      result.transcription._id,
      clientId
    );

    console.log('✅ Audio uploaded to S3, transcription updated with URL');
    console.log('🎉 TTS workflow completed successfully!');
    console.log('Audio URL:', updatedTranscription.audioUrl);

    return {
      success: true,
      transcription: updatedTranscription,
    };
  } catch (error) {
    console.error('TTS generation workflow error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Common ElevenLabs voice IDs
 */
export const COMMON_VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'Female' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'Male' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'Male' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: 'Male' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'Female' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', gender: 'Male' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlotte', gender: 'Female' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Clyde', gender: 'Male' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', gender: 'Male' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', gender: 'Male' },
] as const;

/**
 * Available ElevenLabs models
 */
export const AVAILABLE_MODELS = [
  {
    id: 'eleven_flash_v2_5',
    name: 'Flash v2.5 (Recommended)',
    description: 'Ultra-low 75ms latency, up to 40,000 characters',
  },
  {
    id: 'eleven_turbo_v2_5',
    name: 'Turbo v2.5',
    description: 'Fast with good quality, up to 40,000 characters',
  },
  {
    id: 'eleven_multilingual_v2',
    name: 'Multilingual v2',
    description: 'Highest quality, 32 languages, up to 10,000 characters',
  },
  {
    id: 'eleven_turbo_v2',
    name: 'Turbo v2 (Legacy)',
    description: 'Previous generation model',
  },
  {
    id: 'eleven_monolingual_v1',
    name: 'Monolingual v1 (Legacy)',
    description: 'English only, original model',
  },
  {
    id: 'eleven_v3',
    name: 'v3 (Alpha - Experimental)',
    description: 'Most expressive with emotion control - ⚠️ May timeout with longer texts',
  },
] as const;

