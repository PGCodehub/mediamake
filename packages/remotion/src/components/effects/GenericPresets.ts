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

// String-based animation presets
const slideInLeftStringPreset: AnimationRange[] = [
  { key: 'translateX', val: '-100px', prog: 0 },
  { key: 'translateX', val: '0px', prog: 1 },
];

const slideInRightStringPreset: AnimationRange[] = [
  { key: 'translateX', val: '100px', prog: 0 },
  { key: 'translateX', val: '0px', prog: 1 },
];

const slideInTopStringPreset: AnimationRange[] = [
  { key: 'translateY', val: '-100px', prog: 0 },
  { key: 'translateY', val: '0px', prog: 1 },
];

const slideInBottomStringPreset: AnimationRange[] = [
  { key: 'translateY', val: '100px', prog: 0 },
  { key: 'translateY', val: '0px', prog: 1 },
];

const rotateInStringPreset: AnimationRange[] = [
  { key: 'rotate', val: '-180deg', prog: 0 },
  { key: 'rotate', val: '0deg', prog: 1 },
];

const blurInStringPreset: AnimationRange[] = [
  { key: 'blur', val: '10px', prog: 0 },
  { key: 'blur', val: '0px', prog: 1 },
];

const scaleInStringPreset: AnimationRange[] = [
  { key: 'scale', val: 0, prog: 0 },
  { key: 'scale', val: 1, prog: 1 },
];

// Responsive animations using viewport units
const slideInLeftResponsivePreset: AnimationRange[] = [
  { key: 'translateX', val: '-50vw', prog: 0 },
  { key: 'translateX', val: '0vw', prog: 1 },
];

const slideInTopResponsivePreset: AnimationRange[] = [
  { key: 'translateY', val: '-50vh', prog: 0 },
  { key: 'translateY', val: '0vh', prog: 1 },
];

// Custom CSS property animations
const backgroundColorPreset: AnimationRange[] = [
  { key: 'backgroundColor', val: '#ff0000', prog: 0 },
  { key: 'backgroundColor', val: '#0000ff', prog: 1 },
];

const borderRadiusPreset: AnimationRange[] = [
  { key: 'borderRadius', val: '0px', prog: 0 },
  { key: 'borderRadius', val: '50px', prog: 1 },
];

const boxShadowPreset: AnimationRange[] = [
  { key: 'boxShadow', val: '0px 0px 0px rgba(0,0,0,0)', prog: 0 },
  { key: 'boxShadow', val: '10px 10px 20px rgba(0,0,0,0.5)', prog: 1 },
];

const fontSizePreset: AnimationRange[] = [
  { key: 'fontSize', val: '12px', prog: 0 },
  { key: 'fontSize', val: '24px', prog: 1 },
];

const letterSpacingPreset: AnimationRange[] = [
  { key: 'letterSpacing', val: '0px', prog: 0 },
  { key: 'letterSpacing', val: '5px', prog: 1 },
];

const lineHeightPreset: AnimationRange[] = [
  { key: 'lineHeight', val: '1', prog: 0 },
  { key: 'lineHeight', val: '2', prog: 1 },
];

const textShadowPreset: AnimationRange[] = [
  { key: 'textShadow', val: '0px 0px 0px rgba(0,0,0,0)', prog: 0 },
  { key: 'textShadow', val: '2px 2px 4px rgba(0,0,0,0.5)', prog: 1 },
];

const widthPreset: AnimationRange[] = [
  { key: 'width', val: '0px', prog: 0 },
  { key: 'width', val: '100%', prog: 1 },
];

const heightPreset: AnimationRange[] = [
  { key: 'height', val: '0px', prog: 0 },
  { key: 'height', val: '100%', prog: 1 },
];

const marginPreset: AnimationRange[] = [
  { key: 'margin', val: '0px', prog: 0 },
  { key: 'margin', val: '20px', prog: 1 },
];

const paddingPreset: AnimationRange[] = [
  { key: 'padding', val: '0px', prog: 0 },
  { key: 'padding', val: '20px', prog: 1 },
];

// Complex combined animations with custom properties
const morphingCardPreset: AnimationRange[] = [
  { key: 'borderRadius', val: '0px', prog: 0 },
  { key: 'borderRadius', val: '20px', prog: 0.5 },
  { key: 'borderRadius', val: '50px', prog: 1 },
  { key: 'boxShadow', val: '0px 0px 0px rgba(0,0,0,0)', prog: 0 },
  { key: 'boxShadow', val: '0px 10px 30px rgba(0,0,0,0.3)', prog: 1 },
  { key: 'backgroundColor', val: '#ffffff', prog: 0 },
  { key: 'backgroundColor', val: '#f0f0f0', prog: 1 },
];

const textRevealPreset: AnimationRange[] = [
  { key: 'opacity', val: 0, prog: 0 },
  { key: 'opacity', val: 1, prog: 1 },
  { key: 'letterSpacing', val: '10px', prog: 0 },
  { key: 'letterSpacing', val: '0px', prog: 1 },
  { key: 'textShadow', val: '0px 0px 0px rgba(0,0,0,0)', prog: 0 },
  { key: 'textShadow', val: '2px 2px 4px rgba(0,0,0,0.5)', prog: 1 },
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
  // String-based presets
  slideInLeftStringPreset,
  slideInRightStringPreset,
  slideInTopStringPreset,
  slideInBottomStringPreset,
  rotateInStringPreset,
  blurInStringPreset,
  scaleInStringPreset,
  slideInLeftResponsivePreset,
  slideInTopResponsivePreset,
  // Custom CSS property presets
  backgroundColorPreset,
  borderRadiusPreset,
  boxShadowPreset,
  fontSizePreset,
  letterSpacingPreset,
  lineHeightPreset,
  textShadowPreset,
  widthPreset,
  heightPreset,
  marginPreset,
  paddingPreset,
  morphingCardPreset,
  textRevealPreset,
};
