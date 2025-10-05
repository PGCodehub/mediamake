import { Preset } from '../types';
import { waveformPreset } from './waveform-full';
import { waveformPreset as waveformChildrenPreset } from './waveform';
import { videoStitchPreset } from './video-stitch';
import { subVerticalFloatPreset } from './sub-vertical-float';
import { plainSubtitlesPreset } from './subtitles';
import { baseScenePreset } from './base-scene';
import { mediaTrackPreset } from './media-track';
import { thinkerVisualsPreset } from './thinker-visuals';
import { imageLoopPreset } from './imageloop';
import { musicCardPreset } from './music-card';
import { textOverlayPreset } from './text-overlay';

export const predefinedPresets: Preset[] = [
  baseScenePreset,
  mediaTrackPreset,
  waveformPreset,
  waveformChildrenPreset,
  videoStitchPreset,
  subVerticalFloatPreset,
  plainSubtitlesPreset,
  thinkerVisualsPreset,
  imageLoopPreset,
  musicCardPreset,
  textOverlayPreset,
  // Add more predefined presets here
];

export const getPresetById = (id: string): Preset | undefined => {
  return predefinedPresets.find(preset => preset.metadata.id === id);
};

export const getPresetsByType = (type: 'predefined' | 'database'): Preset[] => {
  return predefinedPresets.filter(preset => preset.metadata.type === type);
};
