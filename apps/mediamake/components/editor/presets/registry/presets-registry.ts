import { Preset } from '../types';
import { waveformPreset } from './waveform';
import { videoStitchPreset } from './video-stitch';
import { plainSubtitlesPreset } from './subtitles-plain';

export const predefinedPresets: Preset[] = [
  waveformPreset,
  videoStitchPreset,
  plainSubtitlesPreset,
  // Add more predefined presets here
];

export const getPresetById = (id: string): Preset | undefined => {
  return predefinedPresets.find(preset => preset.metadata.id === id);
};

export const getPresetsByType = (type: 'predefined' | 'database'): Preset[] => {
  return predefinedPresets.filter(preset => preset.metadata.type === type);
};
