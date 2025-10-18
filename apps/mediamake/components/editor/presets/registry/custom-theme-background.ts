import {
  GenericEffectData,
  InputCompositionProps,
  VideoAtomDataProps,
} from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

// Input schema
const presetParams = z.object({
  paletteMode: z
    .enum(['predefined', 'custom'])
    .describe('Choose between predefined palettes or custom colors'),

  predefinedPalette: z
    .enum([
      'sunset',
      'ocean',
      'neon',
      'forest',
      'monochrome',
      'pastel',
      'fire',
      'purple',
      'tropical',
      'autumn',
    ])
    .optional()
    .describe('Select a predefined color palette'),

  customColors: z
    .array(z.string())
    .min(1)
    .max(5)
    .optional()
    .describe('Custom colors (2-5 hex colors)'),

  backgroundType: z
    .enum([
      'solid',
      'radial-gradient',
      'image-overlay',
      'video-overlay',
    ])
    .describe('Type of background'),

  enablePattern: z
    .boolean()
    .optional()
    .describe('Enable pattern overlay on solid/radial backgrounds'),

  patternType: z
    .enum(['dots', 'stripes', 'grid', 'checkerboard'])
    .optional()
    .describe('Pattern type (for pattern backgrounds)'),

  patternDensity: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe('Pattern density (1=sparse, 10=dense)'),

  patternThickness: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe('Pattern line/element thickness (1=thin, 10=thick)'),

  patternGlow: z
    .boolean()
    .optional()
    .describe('Enable glow effect on pattern'),

  patternGlowIntensity: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe('Pattern glow intensity (1=subtle, 10=strong)'),

  mediaUrl: z.string().optional().describe('Image or video URL for media overlays'),

  mediaOpacity: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Opacity of color overlay on media (0-1)'),

  enableAnimation: z
    .boolean()
    .optional()
    .describe('Enable simple pulse animation'),

  animationSpeed: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .describe('Animation speed in seconds (lower = faster)'),

  durationMode: z
    .enum(['fixed', 'match-component', 'fit-parent'])
    .describe('Duration mode'),

  matchComponentId: z
    .string()
    .optional()
    .describe('Component ID to match duration to'),

  fixedDuration: z
    .number()
    .optional()
    .describe('Fixed duration in seconds'),

  aspectRatio: z.string().optional().describe('Aspect ratio (e.g., 16:9, 9:16, 1:1)'),
});

// Preset execution function
const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  const COLOR_PALETTES = {
    sunset: ['#FF6B6B', '#FFE66D', '#FF8787', '#FFA500'],
    ocean: ['#0077BE', '#00A8CC', '#66D9EF', '#1E90FF'],
    neon: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC'],
    forest: ['#2D6A4F', '#52B788', '#74C69D', '#95D5B2'],
    monochrome: ['#000000', '#404040', '#808080', '#C0C0C0'],
    pastel: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9'],
    fire: ['#FF0000', '#FF4500', '#FF8C00', '#FFD700'],
    purple: ['#4B0082', '#8B00FF', '#9370DB', '#DA70D6'],
    tropical: ['#00CED1', '#FF1493', '#FFD700', '#00FA9A'],
    autumn: ['#8B4513', '#D2691E', '#CD853F', '#DEB887'],
  };

  const {
    paletteMode,
    predefinedPalette,
    customColors,
    backgroundType,
    enablePattern = false,
    patternType = 'dots',
    patternDensity = 5,
    patternThickness = 2,
    patternGlow = false,
    patternGlowIntensity = 5,
    mediaUrl,
    mediaOpacity = 0.5,
    enableAnimation = false,
    animationSpeed = 3,
    durationMode,
    matchComponentId,
    fixedDuration = 20,
    aspectRatio,
  } = params;

  // Determine active color palette
  const activeColors =
    paletteMode === 'custom' && customColors && customColors.length > 0
      ? customColors
      : predefinedPalette
        ? COLOR_PALETTES[predefinedPalette]
        : COLOR_PALETTES.sunset;

  // Calculate dimensions based on aspect ratio
  const [widthRatio, heightRatio] = aspectRatio?.split(':').map(Number) ?? [
    16, 9,
  ];
  const aspectRatioValue = widthRatio / heightRatio;
  const baseWidth = aspectRatioValue > 1 ? 1920 : 1080;
  const baseHeight = Math.round(baseWidth / aspectRatioValue);

  // Generate unique IDs
  const backgroundContainerId = `theme-background-container`;
  const mediaElementId = `media-element`;
  const overlayLayerId = `overlay-layer`;

  // Helper: Generate CSS radial gradient
  const generateRadialGradient = (colors: string[]): string => {
    const colorStops = colors.map((color, index) => 
      `${color} ${(index * 100) / (colors.length - 1)}%`
    );
    return `radial-gradient(circle, ${colorStops.join(', ')})`;
  };

  // Helper: Generate pattern CSS and size
  const generatePattern = (colors: string[]): { pattern: string; size: string; opacity: number; filter?: string } => {
    const baseColor = colors[0];
    const patternColor = colors[1] || colors[0];
    const size = Math.max(15, 60 - patternDensity * 5); // Inverse density, min 15px
    const thickness = Math.max(1, patternThickness * 0.5); // Convert to px (0.5-5px)
    
    // Generate glow effect
    const glowFilter = patternGlow 
      ? `drop-shadow(0 0 ${patternGlowIntensity}px ${patternColor}) drop-shadow(0 0 ${patternGlowIntensity * 2}px ${patternColor})`
      : undefined;

    switch (patternType) {
      case 'dots':
        const dotRadius = Math.max(2, patternThickness);
        return {
          pattern: `radial-gradient(circle, ${patternColor} ${dotRadius}px, transparent ${dotRadius}px)`,
          size: `${size}px ${size}px`,
          opacity: 0.3,
          filter: glowFilter
        };
      case 'stripes':
        const stripeWidth = Math.max(2, patternThickness);
        return {
          pattern: `repeating-linear-gradient(45deg, transparent, transparent ${size}px, ${patternColor} ${size}px, ${patternColor} ${size + stripeWidth}px)`,
          size: '100% 100%',
          opacity: 0.3,
          filter: glowFilter
        };
      case 'grid':
        return {
          pattern: `
            linear-gradient(to right, ${patternColor} ${thickness}px, transparent ${thickness}px),
            linear-gradient(to bottom, ${patternColor} ${thickness}px, transparent ${thickness}px)
          `,
          size: `${size}px ${size}px`,
          opacity: 0.4,
          filter: glowFilter
        };
      case 'checkerboard':
        const checkSize = Math.max(10, size / 2);
        return {
          pattern: `
            repeating-linear-gradient(0deg, ${patternColor} 0px, ${patternColor} ${checkSize}px, transparent ${checkSize}px, transparent ${checkSize * 2}px),
            repeating-linear-gradient(90deg, ${patternColor} 0px, ${patternColor} ${checkSize}px, transparent ${checkSize}px, transparent ${checkSize * 2}px)
          `,
          size: `${checkSize * 2}px ${checkSize * 2}px`,
          opacity: 0.3,
          filter: glowFilter
        };
      default:
        return {
          pattern: `radial-gradient(circle, ${patternColor} ${thickness}px, transparent ${thickness}px)`,
          size: `${size}px ${size}px`,
          opacity: 0.3,
          filter: glowFilter
        };
    }
  };

  // Helper: Generate background style
  const generateBackgroundStyle = (): React.CSSProperties => {
    switch (backgroundType) {
      case 'solid':
        return { backgroundColor: activeColors[0], zIndex: 0 };
      case 'radial-gradient':
        return { backgroundImage: generateRadialGradient(activeColors), zIndex: 0 };
      default:
        return { backgroundColor: activeColors[0], zIndex: 0 };
    }
  };

  // Helper: Create animation effects - simple pulse animation
  const createAnimationEffects = (): any[] => {
    if (!enableAnimation) return [];

    // Convert seconds to frames (assuming 30 fps)
    const fps = 30;
    const durationInFrames = animationSpeed * fps;

    // Effects are applied in order: first effect wraps content, second wraps first
    // So we want: Generic effect first, then Loop wraps it
    return [
      {
        id: `background-pulse-effect`,
        componentId: 'generic',
        data: {
          start: 0,
          duration: animationSpeed,
          mode: 'wrapper',
          type: 'ease-in-out',
          ranges: [
            { key: 'opacity', val: 0.7, prog: 0 },
            { key: 'opacity', val: 1, prog: 0.5 },
            { key: 'opacity', val: 0.7, prog: 1 },
          ],
        } as GenericEffectData,
      },
      {
        id: `background-pulse-loop`,
        componentId: 'loop',
        data: {
          durationInFrames: durationInFrames,
          times: Infinity,
          layout: 'none',
        },
      },
    ];
  };

  // Build timing configuration
  const timingConfig =
    durationMode === 'match-component' && matchComponentId
      ? { start: 0, fitDurationTo: matchComponentId }
      : durationMode === 'fit-parent'
        ? { start: 0 }
        : { start: 0, duration: fixedDuration };

  const compositionDuration =
    durationMode === 'match-component' && matchComponentId
      ? {}
      : durationMode === 'fit-parent'
        ? {}
        : { duration: fixedDuration };

  // Build children data based on background type
  let childrenData: any[] = [];

  if (backgroundType === 'image-overlay' && mediaUrl) {
    // Image with color overlay
    childrenData = [
      // Base image
      {
        id: mediaElementId,
        componentId: 'ImageAtom',
        type: 'atom' as const,
        data: {
          src: mediaUrl,
          className: 'w-full h-full object-cover',
        },
        context: {
          timing: timingConfig,
        },
      },
      // Color overlay
      {
        id: overlayLayerId,
        componentId: 'BaseLayout',
        type: 'layout' as const,
        data: {
          containerProps: {
            className: 'absolute inset-0',
            style: {
              background: generateRadialGradient(activeColors),
              opacity: mediaOpacity,
            },
          },
        },
        context: {
          timing: timingConfig,
        },
      },
    ];
  } else if (backgroundType === 'video-overlay' && mediaUrl) {
    // Video with color overlay
    childrenData = [
      // Base video
      {
        id: mediaElementId,
        componentId: 'VideoAtom',
        type: 'atom' as const,
        data: {
          src: mediaUrl,
          className: 'w-full h-full object-cover',
          fit: 'cover',
          volume: 0,
          muted: true,
          loop: true,
        } as VideoAtomDataProps,
        context: {
          timing: timingConfig,
        },
      },
      // Color overlay
      {
        id: overlayLayerId,
        componentId: 'BaseLayout',
        type: 'layout' as const,
        data: {
          containerProps: {
            className: 'absolute inset-0',
            style: {
              background: generateRadialGradient(activeColors),
              opacity: mediaOpacity,
            },
          },
        },
        context: {
          timing: timingConfig,
        },
      },
    ];
  } else if (enablePattern && (backgroundType === 'solid' || backgroundType === 'radial-gradient')) {
    // Pattern overlay on solid or radial background
    const patternData = generatePattern(activeColors);
    
    childrenData = [
      {
        id: 'pattern-overlay',
        componentId: 'BaseLayout',
        type: 'layout' as const,
        data: {
          containerProps: {
            className: 'absolute inset-0 pointer-events-none',
            style: {
              backgroundImage: patternData.pattern,
              backgroundSize: patternData.size,
              backgroundRepeat: 'repeat',
              opacity: patternData.opacity,
              zIndex: 1,
              ...(patternData.filter && { filter: patternData.filter }),
            },
          },
        },
        context: {
          timing: timingConfig,
        },
      },
    ];
  }

  // Create main background container
  const backgroundStyle = generateBackgroundStyle();
  const animationEffects = createAnimationEffects();

  // Simple background layout
  const backgroundLayout = {
    id: backgroundContainerId,
    componentId: 'BaseLayout',
    type: 'layout' as const,
    data: {
      containerProps: {
        className: 'w-full h-full',
        style: {
          ...backgroundStyle,
        },
      },
      isAbsoluteFill: true,
    },
    context: {
      timing: timingConfig,
    },
    effects: animationEffects,
    childrenData: enablePattern && (backgroundType === 'solid' || backgroundType === 'radial-gradient')
      ? childrenData
      : [],
  };

  return {
    output: {
      childrenData:
        backgroundType === 'image-overlay' || backgroundType === 'video-overlay'
          ? childrenData
          : [backgroundLayout],
    },
  };
};

// Preset metadata
const presetMetadata: PresetMetadata = {
  id: 'custom-theme-background',
  title: 'Custom Theme Background',
  description:
    'Flexible background with color palettes, gradients, patterns, and animations',
  type: 'predefined',
  presetType: 'children',
  tags: ['background', 'theme', 'gradient', 'pattern', 'animation'],
  defaultInputParams: {
    paletteMode: 'predefined',
    predefinedPalette: 'sunset',
    customColors: ['#FF6B6B', '#FFE66D'],
    backgroundType: 'radial-gradient',
    enablePattern: false,
    patternType: 'dots',
    patternDensity: 5,
    patternThickness: 2,
    patternGlow: false,
    patternGlowIntensity: 5,
    mediaUrl: '',
    mediaOpacity: 0.5,
    enableAnimation: false,
    animationSpeed: 3,
    durationMode: 'fixed',
    matchComponentId: '',
    fixedDuration: 20,
    aspectRatio: '16:9',
  },
};

const presetFunction = presetExecution.toString();
const presetParamsSchema = z.toJSONSchema(presetParams);

const customThemeBackgroundPreset = {
  metadata: presetMetadata,
  presetFunction: presetFunction,
  presetParams: presetParamsSchema,
};

export { customThemeBackgroundPreset };



