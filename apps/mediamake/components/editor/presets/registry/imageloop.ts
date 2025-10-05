import {
  InputCompositionProps,
  PanEffectData,
  ZoomEffectData,
  GenericEffectData,
} from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata } from '../types';

// Define the schema for image sources
const imageSourceSchema = z.object({
  src: z.string().describe('Image source URL'),
  duration: z.number().optional().describe('Duration in seconds (default: 5)'),
  fit: z
    .enum(['cover', 'contain', 'fill', 'none', 'scale-down'])
    .optional()
    .describe('How the image should fit (default: cover)'),
});

// Define the schema for effects
const effectSchema = z.object({
  type: z.enum(['pan', 'zoom', 'generic']).describe('Type of effect to apply'),
  id: z.string().optional().describe('Custom effect ID'),
  // Pan effect parameters
  panDirection: z
    .enum(['up', 'down', 'left', 'right'])
    .optional()
    .describe('Pan direction (for pan effect)'),
  panDistance: z
    .number()
    .optional()
    .describe('Pan distance in pixels (for pan effect)'),
  loopTimes: z
    .number()
    .optional()
    .describe('Number of times to loop the effect (for pan/zoom effects)'),
  // Zoom effect parameters
  zoomDirection: z
    .enum(['in', 'out'])
    .optional()
    .describe('Zoom direction (for zoom effect)'),
  zoomDepth: z
    .number()
    .optional()
    .describe('Zoom depth multiplier (for zoom effect)'),
  genericAnimationType: z
    .enum(['ease-in-out', 'ease-out', 'ease-in', 'linear', 'spring'])
    .optional()
    .describe('Animation type for generic effect'),
  // Generic effect parameters
  animationRanges: z
    .array(
      z.object({
        key: z.string().describe('CSS property name'),
        val: z.union([z.string(), z.number()]).describe('Property value'),
        prog: z.number().min(0).max(1).describe('Animation progress (0-1)'),
      }),
    )
    .optional()
    .describe('Animation ranges for generic effect'),
  start: z.number().optional().describe('Effect start offset time in seconds'),
  duration: z.number().optional().describe('Effect duration in seconds'),
});

// Main preset parameters schema
const presetParams = z.object({
  trackName: z.string().describe('Name of the track ( used for the ID )'),
  trackFitDurationTo: z
    .string()
    .optional()
    .describe('Fit duration to the track ( only for aligned/random tracks )'),
  images: z.array(imageSourceSchema).min(1).describe('Array of image sources'),
  effects: z.array(effectSchema).min(1).describe('Array of effects to apply'),
});

// Preset execution function
const presetExecution = (
  params: z.infer<typeof presetParams>,
  props: {
    config: {
      duration: number;
      width: number;
      height: number;
      fps: number;
      fitDurationTo?: string;
    };
  },
): Partial<InputCompositionProps> => {
  const { images, effects } = params;
  const { config } = props;

  // Create image components with effects
  const imageComponents = images.map((image, imageIndex) => {
    // Convert effects to the format expected by the system
    const imageEffects = effects.map((effect, effectIndex) => {
      const effectId =
        effect.id || `${effect.type}-${imageIndex}-${effectIndex}`;

      switch (effect.type) {
        case 'pan':
          return {
            id: effectId,
            componentId: 'pan',
            data: {
              panDirection: effect.panDirection || 'up',
              panDistance: effect.panDistance || 200,
              loopTimes: effect.loopTimes || 1,
            } as PanEffectData,
          };

        case 'zoom':
          return {
            id: effectId,
            componentId: 'zoom',
            data: {
              zoomDirection: effect.zoomDirection || 'in',
              zoomDepth: effect.zoomDepth || 1.2,
              loopTimes: effect.loopTimes || 1,
            } as ZoomEffectData,
          };

        case 'generic':
          return {
            id: effectId,
            componentId: 'generic',
            data: {
              mode: 'provider',
              targetIds: [`image-${imageIndex}`],
              type: effect.genericAnimationType || 'ease-in-out',
              ranges:
                effect.animationRanges?.map(range => ({
                  key: range.key,
                  val: isNaN(Number(range.val)) ? range.val : Number(range.val),
                  prog: range.prog,
                })) || [],
              duration: effect.duration || 2,
              start: effect.start || 0,
            } as GenericEffectData,
          };

        default:
          return {
            id: effectId,
            componentId: 'pan',
            data: {
              panDirection: 'up',
              panDistance: 200,
              loopTimes: 1,
            } as PanEffectData,
          };
      }
    });

    const isPanEffect = imageEffects.some(
      effect => effect.componentId === 'pan',
    );
    const isDuration = image.duration && image.duration > 0;

    return {
      id: `image-${imageIndex}`,
      componentId: 'ImageAtom',
      type: 'atom' as const,
      data: {
        src: image.src,
        className: isPanEffect
          ? props.config.width > props.config.height
            ? 'w-full h-auto object-cover'
            : 'w-full h-full object-cover'
          : 'w-full h-full object-cover',
        fit: image.fit || 'cover',
      },
      context: {
        timing: isDuration ? { duration: image.duration } : {},
      },
      effects: imageEffects,
    };
  });

  return {
    childrenData: [
      {
        id: 'BaseScene',
        componentId: 'BaseLayout',
        type: 'layout',
        data: {
          childrenProps: [
            {
              className: 'absolute inset-0',
            },
          ],
        },
        childrenData: [
          {
            id: `${params.trackName}`,
            componentId: 'BaseLayout',
            type: params.trackFitDurationTo ? 'layout' : ('scene' as const),
            data: {},
            context: {
              timing: params.trackFitDurationTo
                ? {
                    start: 0,
                    fitDurationTo: params.trackFitDurationTo ?? 'this',
                  }
                : {},
            },
            childrenData: imageComponents ?? [],
          },
        ],
      },
    ],
  };
};

// Preset metadata
const presetMetadata: PresetMetadata = {
  id: 'image-effects',
  title: 'Image Effects',
  description:
    'Apply pan, zoom, and generic effects to single or multiple images',
  type: 'predefined',
  presetType: 'children',
  tags: ['image', 'effects', 'visual', 'animation'],
  defaultInputParams: {
    trackName: 'image-track',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        duration: 5,
        fit: 'cover',
      },
    ],
    effects: [
      {
        type: 'pan',
        panDirection: 'up',
        panDistance: 200,
        loopTimes: 1,
      },
    ],
  },
};

const presetFunction = presetExecution.toString();
const presetParamsSchema = z.toJSONSchema(presetParams);

const imageLoopPreset = {
  metadata: presetMetadata,
  presetFunction: presetFunction,
  presetParams: presetParamsSchema,
};

export { imageLoopPreset };
