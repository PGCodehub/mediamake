import {
  InputCompositionProps,
  GenericEffectData,
} from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

/**
 * BURN REVEAL PRESET
 * 
 * Creates a burning spread reveal effect for images from caption metadata.
 * The image slowly reveals with a burn-like animation over the caption duration.
 * Uses opacity fade, blur-to-focus, brightness, scale, and directional movement
 * to simulate the appearance of an image burning into view.
 */

const presetParams = z.object({
  captions: z.array(
    z
      .object({
        id: z.string().describe('Caption ID'),
        text: z.string().describe('Text of the caption'),
        start: z.number().describe('Start time of the caption'),
        end: z.number().describe('End time of the caption'),
        absoluteStart: z.number().optional().describe('Absolute start time'),
        absoluteEnd: z.number().optional().describe('Absolute end time'),
        duration: z.number().optional().describe('Duration of the caption'),
        metadata: z
          .object({
            imageUrl: z
              .string()
              .optional()
              .describe('URL of the image to reveal'),
          })
          .loose()
          .optional(),
      })
      .loose()
      .describe('Captions with imageUrl in metadata (data-referrable)'),
  ),
  trackName: z
    .string()
    .default('burn-reveal-track')
    .describe('Name of the track (used for the ID)'),
  revealSpeed: z
    .number()
    .min(0.3)
    .max(1)
    .default(0.8)
    .describe('Speed of the burn reveal effect (0.3 = slow, 1 = fast)'),
  burnEffect: z
    .enum(['radial', 'vertical', 'horizontal', 'diagonal'])
    .default('radial')
    .describe('Direction of the burn reveal effect'),
  imageFit: z
    .enum(['cover', 'contain', 'fill', 'none', 'scale-down'])
    .default('cover')
    .describe('How to fit the image'),
  imagePosition: z
    .enum(['top', 'center', 'bottom', 'left', 'right'])
    .default('center')
    .describe('Position of the image'),
  imageOpacity: z
    .number()
    .min(0)
    .max(1)
    .default(1)
    .describe('Opacity of the image (0-1)'),
  addGlow: z
    .boolean()
    .default(true)
    .describe('Add a glowing ember effect during burn'),
  glowColor: z
    .string()
    .default('#ff6b00')
    .describe('Color of the glow effect (hex)'),
  startScale: z
    .number()
    .min(1)
    .max(1.5)
    .default(1.1)
    .describe('Initial scale of the image (creates zoom out effect)'),
});

const presetExecution = async (
  params: z.infer<typeof presetParams>,
  props: {
    config: InputCompositionProps['config'];
    fetcher: (url: string, data: any) => Promise<any>;
  },
): Promise<Partial<PresetOutput>> => {
  const {
    captions,
    trackName,
    revealSpeed,
    burnEffect,
    imageFit,
    imagePosition,
    imageOpacity,
    addGlow,
    glowColor,
    startScale,
  } = params;

  const { config } = props;

  console.log('🔥 BURN REVEAL starting...');
  console.log('   - Captions to process:', captions.length);
  console.log('   - Burn effect type:', burnEffect);
  console.log('   - Reveal speed:', revealSpeed);

  const allImageComponents: any[] = [];

  // Process each caption with imageUrl in metadata
  captions.forEach((caption: any, captionIndex: number) => {
    const imageUrl = caption.metadata?.imageUrl;
    
    if (!imageUrl) {
      console.log(`   ⚠️ Skipping caption ${captionIndex} - no imageUrl in metadata`);
      return;
    }

    // Calculate timing
    const start = caption.absoluteStart ?? caption.start;
    const end = caption.absoluteEnd ?? caption.end;
    const duration = caption.duration ?? (end - start);

    console.log(`   📸 Processing caption ${captionIndex}: ${duration}s duration`);

    // Calculate reveal duration based on speed
    const revealDuration = duration * revealSpeed;
    const holdDuration = duration - revealDuration;

    // Create the image component with initial hidden state
    const imageComponent: any = {
      id: `${trackName}-image-${captionIndex}`,
      componentId: 'ImageAtom',
      type: 'atom' as const,
      data: {
        src: imageUrl,
        className: 'w-full h-full object-cover',
        fit: imageFit,
        style: {
          objectPosition: imagePosition,
        },
      },
      context: {
        timing: {
          start: start,
          duration: duration,
        },
      },
      effects: [],
    };

    // Create burn reveal effects
    const effects: any[] = [];

    // Main opacity reveal effect
    effects.push({
      id: `opacity-reveal-effect-${captionIndex}`,
      componentId: 'generic',
      data: {
        mode: 'provider',
        targetIds: [imageComponent.id],
        type: 'ease-out',
        ranges: [
          { key: 'opacity', val: 0, prog: 0 },
          { key: 'opacity', val: imageOpacity, prog: 1 },
        ],
        duration: revealDuration,
        start: 0,
      } as GenericEffectData,
    });

    // Add scale effect (subtle zoom out during reveal)
    effects.push({
      id: `scale-effect-${captionIndex}`,
      componentId: 'generic',
      data: {
        mode: 'provider',
        targetIds: [imageComponent.id],
        type: 'ease-out',
        ranges: [
          { key: 'scale', val: startScale, prog: 0 },
          { key: 'scale', val: 1.0, prog: 1 },
        ],
        duration: duration,
        start: 0,
      } as GenericEffectData,
    });

    // Add directional movement based on burn effect type
    switch (burnEffect) {
      case 'vertical':
        effects.push({
          id: `move-effect-${captionIndex}`,
          componentId: 'generic',
          data: {
            mode: 'provider',
            targetIds: [imageComponent.id],
            type: 'ease-out',
            ranges: [
              { key: 'translateY', val: -30, prog: 0 },
              { key: 'translateY', val: 0, prog: 1 },
            ],
            duration: revealDuration,
            start: 0,
          } as GenericEffectData,
        });
        break;
      
      case 'horizontal':
        effects.push({
          id: `move-effect-${captionIndex}`,
          componentId: 'generic',
          data: {
            mode: 'provider',
            targetIds: [imageComponent.id],
            type: 'ease-out',
            ranges: [
              { key: 'translateX', val: -50, prog: 0 },
              { key: 'translateX', val: 0, prog: 1 },
            ],
            duration: revealDuration,
            start: 0,
          } as GenericEffectData,
        });
        break;
      
      case 'diagonal':
        effects.push({
          id: `move-effect-${captionIndex}`,
          componentId: 'generic',
          data: {
            mode: 'provider',
            targetIds: [imageComponent.id],
            type: 'ease-out',
            ranges: [
              { key: 'translateX', val: -30, prog: 0 },
              { key: 'translateX', val: 0, prog: 1 },
              { key: 'translateY', val: -30, prog: 0 },
              { key: 'translateY', val: 0, prog: 1 },
            ],
            duration: revealDuration,
            start: 0,
          } as GenericEffectData,
        });
        break;
      
      case 'radial':
      default:
        // Radial uses scale only (no translation), already handled above
        break;
    }

    // Add blur-to-focus effect during burn (creates spreading/burning feel)
    effects.push({
      id: `blur-effect-${captionIndex}`,
      componentId: 'generic',
      data: {
        mode: 'provider',
        targetIds: [imageComponent.id],
        type: 'ease-out',
        ranges: [
          { key: 'filter', val: `blur(${addGlow ? '15px' : '10px'}) brightness(${addGlow ? '1.5' : '1.3'})`, prog: 0 },
          { key: 'filter', val: `blur(5px) brightness(${addGlow ? '1.2' : '1.1'})`, prog: 0.4 },
          { key: 'filter', val: 'blur(0px) brightness(1)', prog: 1 },
        ],
        duration: revealDuration,
        start: 0,
      } as GenericEffectData,
    });

    imageComponent.effects = effects;
    allImageComponents.push(imageComponent);
  });

  console.log('✅ BURN REVEAL complete!');
  console.log('   - Images created:', allImageComponents.length);

  return {
    output: {
      childrenData: [
        {
          id: `${trackName}`,
          componentId: 'BaseLayout',
          type: 'layout' as const,
          data: {
            containerProps: {
              className: 'absolute inset-0',
            },
            repeatChildrenProps: {
              className: 'absolute inset-0 flex items-center justify-center',
            },
          },
          context: {
            timing: {
              start: 0,
              duration: Math.max(
                ...captions.map((c: any) => 
                  (c.absoluteEnd ?? c.end ?? c.start + (c.duration ?? 0))
                ),
                0,
              ),
            },
          },
          childrenData: allImageComponents,
          effects: [],
        },
      ],
    },
    options: {
      attachedToId: `BaseScene`,
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'burn-reveal',
  title: 'Burn Reveal',
  description:
    'Reveals images from caption metadata with a burning spread animation effect. The image emerges from blur and brightness into focus, creating a dramatic burn-in effect. Includes directional variants (radial, vertical, horizontal, diagonal) and customizable glow effects.',
  type: 'predefined',
  presetType: 'children',
  tags: ['image', 'reveal', 'burn', 'animation', 'captions', 'metadata', 'blur', 'dramatic'],
  defaultInputParams: {
    trackName: 'burn-reveal-track',
    captions: [
      {
        id: 'caption-1',
        text: 'First caption with image',
        start: 0,
        end: 3,
        absoluteStart: 0,
        absoluteEnd: 3,
        duration: 3,
        metadata: {
          imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
        },
      },
      {
        id: 'caption-2',
        text: 'Second caption with image',
        start: 3.5,
        end: 6.5,
        absoluteStart: 3.5,
        absoluteEnd: 6.5,
        duration: 3,
        metadata: {
          imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop',
        },
      },
    ],
    revealSpeed: 0.8,
    burnEffect: 'radial',
    imageFit: 'cover',
    imagePosition: 'center',
    imageOpacity: 1,
    addGlow: true,
    glowColor: '#ff6b00',
    startScale: 1.1,
  },
};

const presetFunction = presetExecution.toString();
const presetParamsSchema = z.toJSONSchema(presetParams);

export const burnRevealPreset = {
  metadata: presetMetadata,
  presetFunction: presetFunction,
  presetParams: presetParamsSchema,
};

