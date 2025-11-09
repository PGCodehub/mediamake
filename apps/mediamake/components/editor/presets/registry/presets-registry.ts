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
import { lottieShowcasePreset } from './lottie-showcase';
import { subKineticGradientFlowPreset } from './sub-kinetic-gradient-flow';
// import { subKineticLayoutVerticalPreset } from './sub-kinetic-layout-vertical';
// import { subKineticAnimKeywordFocusPreset } from './sub-kinetic-anim-keyword-focus';
import { beatstitchWithCaptionsPreset } from './beatstitchwithcaptions';
import { brollPreset } from './broll';
import { quotePresentPreset } from './quote-present';
import { htmlBlockAtomPreset } from './htmlBlockAtom';
// New dependency injection examples
import { wipeRevealPreset } from './wipe-reveal';
import { contentAwarePreset } from './content-aware-reveal';
import { particleEffectPreset } from './particle-effect';
import { glitchEffectPreset } from './glitch-effect';

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
  lottieShowcasePreset,
  subKineticGradientFlowPreset,
  // subKineticLayoutVerticalPreset,
  // subKineticAnimKeywordFocusPreset,
  brollPreset,
  quotePresentPreset,
  htmlBlockAtomPreset,
  // New dependency injection examples
  wipeRevealPreset,
  contentAwarePreset,
  particleEffectPreset,
  glitchEffectPreset,
  // beatstitchWithCaptionsPreset, - not working for now
  // Add more predefined presets here
];

export const getPredefinedPresetById = (id: string): Preset | undefined => {
  return predefinedPresets.find(preset => preset.metadata.id === id);
};
