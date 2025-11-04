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
<<<<<<< Updated upstream
=======
// New dependency injection examples
import { simpleOpacityEffectPreset } from './simple-opacity-effect';
import { advancedWordEffectsPreset } from './advanced-word-effects';
import { compositeSubtitleShowcasePreset } from './composite-subtitle-showcase';
import { enhancedSubtitleDemoPreset } from './enhanced-subtitle-demo';
import { basicTextLayerPreset } from './basic-text-layer';
import { glowPulseEffectsPreset } from './glow-pulse-effects';
import { layeredEffectsDemoPreset } from './layered-effects-demo';
// Kinetic Typography presets
import { kineticSlideInPreset } from './kinetic-slide-in';
import { kineticBouncePreset } from './kinetic-bounce';
import { kineticRotateFadePreset } from './kinetic-rotate-fade';
import { kineticScalePulsePreset } from './kinetic-scale-pulse';
import { kineticTypographyPreset } from './kinetic-typography';
import { burnRevealPreset } from './burn-reveal';
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
=======
  // New dependency injection examples
  simpleOpacityEffectPreset,
  advancedWordEffectsPreset,
  compositeSubtitleShowcasePreset,
  enhancedSubtitleDemoPreset,
  basicTextLayerPreset,
  glowPulseEffectsPreset,
  layeredEffectsDemoPreset,
  // Kinetic Typography presets
  kineticSlideInPreset,
  kineticBouncePreset,
  kineticRotateFadePreset,
  kineticScalePulsePreset,
  kineticTypographyPreset,
  burnRevealPreset,
>>>>>>> Stashed changes
  // beatstitchWithCaptionsPreset, - not working for now
  // Add more predefined presets here
];

export const getPredefinedPresetById = (id: string): Preset | undefined => {
  return predefinedPresets.find(preset => preset.metadata.id === id);
};
