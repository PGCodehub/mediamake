import { InputCompositionProps } from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

const presetParams = z.object({
  trackId: z.string().default('image-wipe-reveal').describe('A unique ID for this component track.'),
  imageUrl: z.string().url().describe('The URL of the image to reveal.'),
  start: z.number().min(0).default(0).describe('Start time of the reveal in seconds.'),
  duration: z.number().min(0).default(5).describe('Total duration the image is visible.'),
  revealDuration: z.number().min(0).default(1.5).describe('Duration of the reveal animation in seconds.'),
  revealType: z.enum(['wipe', 'radial', 'organic-radial', 'organic-wipe', 'burn-wipe']).default('burn-wipe').describe('The style of the reveal animation.'),
  wipeAngle: z.number().default(0).describe('Angle for wipe reveals (0 is left-to-right).'),
  backgroundColor: z.string().default('rgba(0,0,0,0)').describe('Background color to reveal onto. Use rgba for transparency.'),
  fit: z.enum(['cover', 'contain']).default('cover').describe('How the image should fit.'),
  edgeWaviness: z.number().default(30).optional().describe('Amplitude of the organic wave or burn effect.'),
  edgeFrequency: z.number().default(4).optional().describe('Number of waves/bulges in the organic edge.'),
  burnGlow: z.boolean().default(true).optional().describe('Add glowing sparkle effects to burn edges.'),
  burnGlowColor: z.string().default('#ff6600').optional().describe('Color of the burn glow effect.'),
  burnGlowIntensity: z.number().default(1).optional().describe('Intensity of the burn glow (0-2).'),
  organicRandomAmplitude: z.boolean().default(true).optional().describe('Use random amplitudes for organic bulges.'),
  organicRandomWavelength: z.boolean().default(false).optional().describe('Use random wavelengths for organic bulges.'),
  contentAwareBurn: z.boolean().default(false).optional().describe('Burn similar colors together based on image content.'),
  burnColorOrder: z.enum(['vibgyor', 'luminance', 'random']).default('vibgyor').optional().describe('Order to burn colors: vibgyor (rainbow), luminance (bright to dark), or random.'),
  contentAwareOnly: z.boolean().default(false).optional().describe('Use only content-aware burn without edge wipe/reveal effects.'),
  zigzagReveal: z.boolean().default(false).optional().describe('Use zig-zag pattern for reveal.'),
  zigzagDirection: z.enum(['horizontal', 'vertical', 'diagonal-down', 'diagonal-up']).default('horizontal').optional().describe('Direction of zig-zag lines.'),
  zigzagLayers: z.number().default(10).optional().describe('Number of zig-zag layers (more = finer detail).'),
  drawingReveal: z.boolean().default(false).optional().describe('Simulate drawing/painting the image with color-aware strokes.'),
});

const presetExecution = async (
  params: z.infer<typeof presetParams>,
  props: { config: InputCompositionProps['config'] }
): Promise<Partial<PresetOutput>> => {
  const { 
    trackId, imageUrl, start, duration, revealDuration, revealType, 
    wipeAngle, backgroundColor, fit, edgeWaviness, edgeFrequency,
    burnGlow, burnGlowColor, burnGlowIntensity,
    organicRandomAmplitude, organicRandomWavelength,
    contentAwareBurn, burnColorOrder, contentAwareOnly,
    zigzagReveal, zigzagDirection, zigzagLayers, drawingReveal
  } = params;
  const { fps } = props.config ?? { fps: 30 };
  
  const [style, baseType] = revealType.includes('-')
    ? revealType.split('-') as [string, 'wipe' | 'radial']
    : ['straight', revealType as 'wipe' | 'radial'];
  
  const imageRevealComponent = {
    id: trackId,
    componentId: 'effect-CanvasReveal',
    type: 'layout' as const,
    data: {
      imageUrl,
      fit,
      backgroundColor,
      revealType: baseType,
      edgeStyle: style,
      angle: wipeAngle,
      revealDurationInFrames: Math.round(revealDuration * (fps ?? 30)),
      ...(edgeWaviness !== undefined && { edgeWaviness }),
      ...(edgeFrequency !== undefined && { edgeFrequency }),
      ...(burnGlow !== undefined && { burnGlow }),
      ...(burnGlowColor !== undefined && { burnGlowColor }),
      ...(burnGlowIntensity !== undefined && { burnGlowIntensity }),
      ...(organicRandomAmplitude !== undefined && { organicRandomAmplitude }),
      ...(organicRandomWavelength !== undefined && { organicRandomWavelength }),
      ...(contentAwareBurn !== undefined && { contentAwareBurn }),
      ...(burnColorOrder !== undefined && { burnColorOrder }),
      ...(contentAwareOnly !== undefined && { contentAwareOnly }),
      ...(zigzagReveal !== undefined && { zigzagReveal }),
      ...(zigzagDirection !== undefined && { zigzagDirection }),
      ...(zigzagLayers !== undefined && { zigzagLayers }),
      ...(drawingReveal !== undefined && { drawingReveal }),
    },
    context: {
      timing: { start, duration },
    },
  };
  
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
          childrenData: [imageRevealComponent],
        },
      ],
    },
    options: {
      attachedToId: `BaseScene`,
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'image-wipe-reveal',
  title: 'Image Wipe Reveal',
  description: "Reveals an image using a canvas-based wipe effect. Attaches to an existing scene.",
  type: 'predefined',
  presetType: 'children',
  tags: ['image', 'reveal', 'canvas', 'wipe', 'animation', 'organic', 'burn'],
  defaultInputParams: {
    trackId: 'image-wipe-1',
    imageUrl: 'https://aidev.blr1.cdn.digitaloceanspaces.com/mediamake/vswjt2025/1762303605130-Why%20Burglars%20Will%20Skip%20Your%20House%20If%20You%20Do%20This_%20The%2030-Minute%20Home%20Fortress%20Plan%203-59%20screenshot.png',
    start: 0,
    duration: 5,
    revealDuration: 2.0,
    revealType: 'burn-wipe',
    wipeAngle: 45,
    backgroundColor: 'white',
    fit: 'cover',
    edgeWaviness: 40,
    edgeFrequency: 4,
    burnGlow: true,
    burnGlowColor: '#ff6600',
    burnGlowIntensity: 1,
    organicRandomAmplitude: true,
    organicRandomWavelength: false,
    contentAwareBurn: false,
    burnColorOrder: 'vibgyor',
    contentAwareOnly: false,
    zigzagReveal: false,
    zigzagDirection: 'horizontal',
    zigzagLayers: 10,
    drawingReveal: false,
  },
};

const presetFunction = presetExecution.toString();
const presetParamsSchema = z.toJSONSchema(presetParams);

export const burnRevealPreset = {
  metadata: presetMetadata,
  presetFunction: presetFunction,
  presetParams: presetParamsSchema,
};
