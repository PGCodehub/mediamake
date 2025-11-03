import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
import { RenderableComponentData } from '@microfox/datamotion';

/**
 * KINETIC TYPOGRAPHY - MAIN PRESET
 * 
 * This is the main kinetic typography preset that allows you to choose
 * which animation style to apply to your text.
 * 
 * It demonstrates a SELECTOR pattern where you can choose between multiple
 * child presets using a dropdown parameter.
 * 
 * Available animations:
 * - slide-in: Text slides in from a direction
 * - bounce: Text bounces like a ball
 * - rotate-fade: Text rotates and fades in
 * - scale-pulse: Text pulses with scale effect
 */

const presetParams = z.object({
  inputCaptions: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        start: z.number(),
        end: z.number(),
        words: z.array(
          z.object({
            id: z.string(),
            text: z.string(),
            start: z.number(),
            end: z.number(),
          }),
        ),
      }),
    )
    .describe('Array of captions with timing and words (data-referrable)'),
  
  // === ANIMATION SELECTOR ===
  // This field will dynamically load the selected preset's parameters in the UI
  animationStyle: z
    .enum(['slide-in', 'bounce', 'rotate-fade', 'scale-pulse'])
    .default('slide-in')
    .describe('Choose which animation style to apply'),
  
  // === COMMON PARAMETERS ===
  // These are shared across all animation styles
  fontSize: z
    .number()
    .min(20)
    .max(120)
    .default(56)
    .describe('Font size for text'),
  
  textColor: z
    .string()
    .default('#ffffff')
    .describe('Text color in hex'),
  
  animationDuration: z
    .number()
    .min(0.1)
    .max(3)
    .default(0.8)
    .describe('Animation duration in seconds'),
  
  // Child preset-specific parameters will be dynamically loaded based on animationStyle selection
  // No need to define them here - they come from the child presets automatically!
});

const presetExecution = async (
  params: z.infer<typeof presetParams> & Record<string, any>, // Allow dynamic child preset fields
  props: any,
): Promise<PresetOutput> => {
  const { presets } = props;

  console.log('🎬 KINETIC TYPOGRAPHY starting...');
  console.log('   - Animation Style:', params.animationStyle);
  console.log('   - Input captions:', params.inputCaptions.length);
  console.log('   - Font size:', params.fontSize);

  // === SELECT AND CALL THE CHOSEN ANIMATION PRESET ===
  // Child preset-specific fields are dynamically loaded and passed through params
  let selectedOutput: PresetOutput;

  switch (params.animationStyle) {
    case 'slide-in':
      console.log('   📥 Calling kinetic-slide-in preset...');
      if (!presets || !presets['kinetic-slide-in']) {
        throw new Error('Preset dependency "kinetic-slide-in" not found');
      }
      selectedOutput = await presets['kinetic-slide-in'](
        {
          inputCaptions: params.inputCaptions,
          direction: params.direction || params.slideDirection, // Support both field names
          distance: params.distance || params.slideDistance,
          duration: params.animationDuration,
          fontSize: params.fontSize,
          textColor: params.textColor,
        },
        props,
      );
      break;

    case 'bounce':
      console.log('   🎾 Calling kinetic-bounce preset...');
      if (!presets || !presets['kinetic-bounce']) {
        throw new Error('Preset dependency "kinetic-bounce" not found');
      }
      selectedOutput = await presets['kinetic-bounce'](
        {
          inputCaptions: params.inputCaptions,
          bounceHeight: params.bounceHeight,
          duration: params.animationDuration,
          fontSize: params.fontSize,
          textColor: params.textColor,
        },
        props,
      );
      break;

    case 'rotate-fade':
      console.log('   🌀 Calling kinetic-rotate-fade preset...');
      if (!presets || !presets['kinetic-rotate-fade']) {
        throw new Error('Preset dependency "kinetic-rotate-fade" not found');
      }
      selectedOutput = await presets['kinetic-rotate-fade'](
        {
          inputCaptions: params.inputCaptions,
          rotationDegrees: params.rotationDegrees,
          duration: params.animationDuration,
          fontSize: params.fontSize,
          textColor: params.textColor,
        },
        props,
      );
      break;

    case 'scale-pulse':
      console.log('   💫 Calling kinetic-scale-pulse preset...');
      if (!presets || !presets['kinetic-scale-pulse']) {
        throw new Error('Preset dependency "kinetic-scale-pulse" not found');
      }
      selectedOutput = await presets['kinetic-scale-pulse'](
        {
          inputCaptions: params.inputCaptions,
          maxScale: params.maxScale,
          duration: params.animationDuration,
          fontSize: params.fontSize,
          textColor: params.textColor,
          addGlow: params.addGlow,
          glowColor: params.glowColor,
        },
        props,
      );
      break;

    default:
      throw new Error(`Unknown animation style: ${params.animationStyle}`);
  }

  console.log('✅ KINETIC TYPOGRAPHY complete!');
  console.log('   - Style used:', params.animationStyle);
  console.log('   - Components created:', selectedOutput.output.childrenData?.length || 0);

  return selectedOutput;
};

const presetMetadata: PresetMetadata = {
  id: 'kinetic-typography',
  title: 'Kinetic Typography',
  description:
    'Main kinetic typography preset with selectable animation styles. Choose from slide-in, bounce, rotate-fade, or scale-pulse animations. Each style has its own customization parameters.',
  type: 'predefined',
  presetType: 'children',
  tags: ['kinetic', 'typography', 'animation', 'text', 'motion', 'selector'],
  dependencies: {
    presets: [
      'kinetic-slide-in',
      'kinetic-bounce',
      'kinetic-rotate-fade',
      'kinetic-scale-pulse',
    ],
  },
  // NEW: Preset selector configuration for dynamic schema loading
  presetSelector: {
    field: 'animationStyle',
    mapping: {
      'slide-in': 'kinetic-slide-in',
      'bounce': 'kinetic-bounce',
      'rotate-fade': 'kinetic-rotate-fade',
      'scale-pulse': 'kinetic-scale-pulse',
    },
  },
  defaultInputParams: {
    inputCaptions: [
      {
        id: 'caption-1',
        text: 'Kinetic Typography',
        start: 0,
        end: 2.5,
        words: [
          { id: 'w1', text: 'Kinetic', start: 0, end: 1.2 },
          { id: 'w2', text: 'Typography', start: 1.3, end: 2.5 },
        ],
      },
      {
        id: 'caption-2',
        text: 'Choose Your Animation',
        start: 3,
        end: 5,
        words: [
          { id: 'w3', text: 'Choose', start: 3, end: 3.6 },
          { id: 'w4', text: 'Your', start: 3.7, end: 4.1 },
          { id: 'w5', text: 'Animation', start: 4.2, end: 5 },
        ],
      },
    ],
    animationStyle: 'slide-in',
    fontSize: 56,
    textColor: '#ffffff',
    animationDuration: 0.8,
    // Child preset-specific defaults will be loaded from the selected child preset
  },
};

export const kineticTypographyPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};

