import { InputCompositionProps, GenericEffectData } from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

/**
 * BURN IMAGE REVEAL PRESET (Children)
 *
 * Attaches a single image to a scene with a "burn-in" reveal effect. It uses a
 * two-layer technique: a clean top image is revealed by an animated radial-gradient
 * mask, while a blurred, glowing version of the image underneath creates the illusion
 * of a hot, burning edge.
 */

const presetParams = z.object({
  trackId: z.string().default('burn-reveal').describe('A unique ID for this component track.'),
  imageUrl: z.string().url().describe('The URL of the image to reveal.'),
  start: z.number().min(0).default(0).describe('Start time of the reveal in seconds.'),
  duration: z.number().min(0).default(5).describe('Total duration the image is visible.'),
  revealDuration: z.number().min(0).default(1.5).describe('Duration of the reveal animation.'),
  burnColor: z.string().default('#ff6b00').describe('The color of the "hot" glowing edge.'),
  edgeSharpness: z.number().min(0).max(50).default(20).describe('The sharpness of the burn edge (0-50).'),
  fit: z.enum(['cover', 'contain', 'fill', 'none', 'scale-down']).default('cover').describe('How the image should fit.'),
});

const presetExecution = async (
  params: z.infer<typeof presetParams>,
  props: { config: InputCompositionProps['config'] }
): Promise<Partial<PresetOutput>> => {
  const { trackId, imageUrl, start, duration, revealDuration, burnColor, edgeSharpness, fit } = params;

  // 1. The Glowing Under-Layer (Blurred and Brightened)
  const glowImageAtom = {
    id: `${trackId}-glow-image`,
    componentId: 'ImageAtom',
    type: 'atom' as const,
    data: {
      src: imageUrl,
      fit,
      className: 'w-full h-full',
      style: {
        filter: `blur(10px) brightness(1.5)`,
      },
    },
    context: {
      timing: { start, duration },
    },
  };

  // 2. The Color Overlay (Tints the Glow)
  const colorOverlayAtom = {
    id: `${trackId}-color-overlay`,
    componentId: 'ShapeAtom',
    type: 'atom' as const,
    data: {
      shape: 'rect' as const,
      width: '100%',
      height: '100%',
      color: burnColor,
      style: {
        mixBlendMode: 'overlay',
      },
    },
    context: {
      timing: { start, duration },
    },
  };

  // 3. The Clean Top-Layer (Revealed by a Mask)
  const maskGradient = `radial-gradient(circle, black ${100 - edgeSharpness}%, transparent 100%)`;
  const cleanImageAtom = {
    id: `${trackId}-clean-image`,
    componentId: 'ImageAtom',
    type: 'atom' as const,
    data: {
      src: imageUrl,
      fit,
      className: 'w-full h-full',
      style: {
        maskImage: maskGradient,
        maskRepeat: 'no-repeat',
        maskSize: '0% 0%',
        maskPosition: 'center',
      },
    },
    context: {
      timing: { start, duration },
    },
    effects: [
      {
        id: `${trackId}-mask-reveal-effect`,
        componentId: 'generic',
        data: {
          mode: 'provider',
          targetIds: [`${trackId}-clean-image`],
          type: 'ease-in-out',
          ranges: [
            { key: 'maskSize', val: '0% 0%', prog: 0 },
            { key: 'maskSize', val: '250% 250%', prog: 1 },
          ],
          duration: revealDuration,
          start: 0,
        } as GenericEffectData,
      },
    ],
  };

  // 4. Construct Final Output
  return {
    output: {
      childrenData: [
        {
          id: trackId,
          componentId: 'BaseLayout',
          type: 'layout' as const,
          data: {
            containerProps: { className: 'absolute inset-0' },
            repeatChildrenProps: { className: 'absolute inset-0' },
          },
          childrenData: [
            glowImageAtom,
            colorOverlayAtom,
            cleanImageAtom,
          ],
        },
      ],
    },
    options: {
      attachedToId: `BaseScene`,
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'burn-image-reveal',
  title: 'Burn Image Reveal',
  description: 'Reveals an image with a procedural "burn-in" effect, using a glowing under-layer and an animated mask.',
  type: 'predefined',
  presetType: 'children',
  tags: ['image', 'reveal', 'mask', 'burn', 'procedural', 'glow'],
  defaultInputParams: {
    trackId: 'burn-reveal-1',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
    start: 0,
    duration: 5,
    revealDuration: 2.0,
    burnColor: '#ff6b00',
    edgeSharpness: 20,
    fit: 'cover',
  },
};

const presetFunction = presetExecution.toString();
const presetParamsSchema = z.toJSONSchema(presetParams);

export const burnRevealPreset = {
  metadata: presetMetadata,
  presetFunction: presetFunction,
  presetParams: presetParamsSchema,
};

