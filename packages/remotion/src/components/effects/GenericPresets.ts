// Common animation presets for GenericEffect

import { AnimationRange } from './Generic';

// Fade in animation
const fadeInPreset: AnimationRange[] = [
  { key: 'opacity', val: 0, prog: 0 },
  { key: 'opacity', val: 1, prog: 1 },
];

// Fade out animation
const fadeOutPreset: AnimationRange[] = [
  { key: 'opacity', val: 1, prog: 0 },
  { key: 'opacity', val: 0, prog: 1 },
];

// Scale in animation
const scaleInPreset: AnimationRange[] = [
  { key: 'scale', val: 0, prog: 0 },
  { key: 'scale', val: 1, prog: 1 },
];

// Scale out animation
const scaleOutPreset: AnimationRange[] = [
  { key: 'scale', val: 1, prog: 0 },
  { key: 'scale', val: 0, prog: 1 },
];

// Slide in from left
const slideInLeftPreset: AnimationRange[] = [
  { key: 'translateX', val: -100, prog: 0 },
  { key: 'translateX', val: 0, prog: 1 },
];

// Slide in from right
const slideInRightPreset: AnimationRange[] = [
  { key: 'translateX', val: 100, prog: 0 },
  { key: 'translateX', val: 0, prog: 1 },
];

// Slide in from top
const slideInTopPreset: AnimationRange[] = [
  { key: 'translateY', val: -100, prog: 0 },
  { key: 'translateY', val: 0, prog: 1 },
];

// Slide in from bottom
const slideInBottomPreset: AnimationRange[] = [
  { key: 'translateY', val: 100, prog: 0 },
  { key: 'translateY', val: 0, prog: 1 },
];

// Bounce animation
const bouncePreset: AnimationRange[] = [
  { key: 'scale', val: 0, prog: 0 },
  { key: 'scale', val: 1.2, prog: 0.6 },
  { key: 'scale', val: 1, prog: 1 },
];

// Pulse animation
const pulsePreset: AnimationRange[] = [
  { key: 'scale', val: 1, prog: 0 },
  { key: 'scale', val: 1.1, prog: 0.5 },
  { key: 'scale', val: 1, prog: 1 },
];

// Rotate in animation
const rotateInPreset: AnimationRange[] = [
  { key: 'rotate', val: -180, prog: 0 },
  { key: 'rotate', val: 0, prog: 1 },
];

// Blur in animation
const blurInPreset: AnimationRange[] = [
  { key: 'blur', val: 10, prog: 0 },
  { key: 'blur', val: 0, prog: 1 },
];

// Combined animations
const fadeInScalePreset: AnimationRange[] = [
  { key: 'opacity', val: 0, prog: 0 },
  { key: 'opacity', val: 1, prog: 1 },
  { key: 'scale', val: 0.8, prog: 0 },
  { key: 'scale', val: 1, prog: 1 },
];

const slideInFadePreset: AnimationRange[] = [
  { key: 'translateX', val: -50, prog: 0 },
  { key: 'translateX', val: 0, prog: 1 },
  { key: 'opacity', val: 0, prog: 0 },
  { key: 'opacity', val: 1, prog: 1 },
];

export const GenericEffectPresets = {
  fadeInPreset,
  fadeOutPreset,
  scaleInPreset,
  scaleOutPreset,
  slideInLeftPreset,
  slideInRightPreset,
  slideInTopPreset,
  slideInBottomPreset,
  bouncePreset,
  pulsePreset,
  rotateInPreset,
  blurInPreset,
  fadeInScalePreset,
  slideInFadePreset,
};
