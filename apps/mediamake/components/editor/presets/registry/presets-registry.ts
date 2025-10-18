import { Preset } from '../types';
import { waveformPreset } from './waveform-full';
import { waveformPreset as waveformChildrenPreset } from './waveform';
import { videoStitchPreset } from './video-stitch';
import { subVerticalFloatPreset } from './sub-vertical-float';
import { subFastRapStaticPreset } from './sub-fast-rap-static';
import { plainSubtitlesPreset } from './subtitles';
import { baseScenePreset } from './base-scene';
import { mediaTrackPreset } from './media-track';
import { thinkerVisualsPreset } from './thinker-visuals';
import { imageLoopPreset } from './imageloop';
import { imageLoopSoundPreset } from './imageloop-sound';
import { musicCardPreset } from './music-card';
import { textOverlayPreset } from './text-overlay';
import { beatstitchPreset } from './beatstitch';
import { subMediaStitchPreset } from './sub-media-stitch';
import { subScrollingVerticalPreset } from './sub-scrolling-vertical';
import { subKineticMotionPreset } from './sub-kinetic-motion';
import { customThemeBackgroundPreset } from './custom-theme-background';
import { advancedSubtitlesAnimsPreset } from './advanced-subtitles-anims';

export const predefinedPresets: Preset[] = [
  baseScenePreset,
  customThemeBackgroundPreset,
  mediaTrackPreset,
  waveformPreset,
  waveformChildrenPreset,
  videoStitchPreset,
  subVerticalFloatPreset,
  plainSubtitlesPreset,
  thinkerVisualsPreset,
  imageLoopPreset,
  imageLoopSoundPreset,
  musicCardPreset,
  textOverlayPreset,
  beatstitchPreset,
  subFastRapStaticPreset,
  subMediaStitchPreset,
  subScrollingVerticalPreset,
  subKineticMotionPreset,
  advancedSubtitlesAnimsPreset,
  // Add more predefined presets here
];

export const getPresetById = (id: string): Preset | undefined => {
  return predefinedPresets.find(preset => preset.metadata.id === id);
};

export const getPresetsByType = (type: 'predefined' | 'database'): Preset[] => {
  return predefinedPresets.filter(preset => preset.metadata.type === type);
};
