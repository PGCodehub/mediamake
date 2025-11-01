import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
import { RenderableComponentData } from '@microfox/datamotion';

/**
 * LAYERED EFFECTS DEMO PRESET
 * 
 * A children preset that demonstrates composing multiple children presets together.
 * This preset calls:
 * 1. basic-text-layer (creates simple text components)
 * 2. glow-pulse-effects (adds glow and pulse effects on top)
 * 
 * This showcases how children presets can layer on top of each other,
 * with each adding its own components/effects to the composition.
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
  
  // Layer 1 params (basic-text-layer)
  layer1_fontSize: z
    .number()
    .min(20)
    .max(120)
    .default(56)
    .describe('Layer 1: Font size for text'),
  
  layer1_textColor: z
    .string()
    .default('#ffffff')
    .describe('Layer 1: Text color in hex'),
  
  layer1_position: z
    .enum(['top', 'center', 'bottom'])
    .default('center')
    .describe('Layer 1: Vertical position'),
  
  // Layer 2 params (glow-pulse-effects)
  layer2_glowColor: z
    .string()
    .default('#00ffff')
    .describe('Layer 2: Glow color in hex'),
  
  layer2_pulseIntensity: z
    .number()
    .min(0)
    .max(2)
    .default(1.2)
    .describe('Layer 2: Pulse intensity'),
  
  layer2_applyGlow: z
    .boolean()
    .default(true)
    .describe('Layer 2: Enable glow effect'),
  
  layer2_applyPulse: z
    .boolean()
    .default(true)
    .describe('Layer 2: Enable pulse effect'),
});

const presetExecution = async (
  params: z.infer<typeof presetParams>,
  props: any,
): Promise<PresetOutput> => {
  const { presets } = props;

  console.log('🎨 LAYERED EFFECTS DEMO starting...');
  console.log('   - Input captions:', params.inputCaptions.length);
  console.log('   - Layer 1 (basic-text-layer): fontSize', params.layer1_fontSize, 'position', params.layer1_position);
  console.log('   - Layer 2 (glow-pulse-effects): glow', params.layer2_applyGlow, 'pulse', params.layer2_applyPulse);

  // === LAYER 1: Call basic-text-layer ===
  // This creates the foundational text components
  console.log('   📝 Calling Layer 1: basic-text-layer...');
  
  if (!presets || !presets['basic-text-layer']) {
    throw new Error('Preset dependency "basic-text-layer" not found');
  }

  const layer1Output = await presets['basic-text-layer'](
    {
      inputCaptions: params.inputCaptions,
      fontSize: params.layer1_fontSize,
      fontWeight: 'bold',
      textColor: params.layer1_textColor,
      position: params.layer1_position,
    },
    props,
  );

  console.log('   ✅ Layer 1 complete:', layer1Output.output.childrenData.length, 'components');

  // === LAYER 2: Call glow-pulse-effects ===
  // This adds glow and pulse effects on top of the text
  console.log('   ✨ Calling Layer 2: glow-pulse-effects...');
  
  if (!presets || !presets['glow-pulse-effects']) {
    throw new Error('Preset dependency "glow-pulse-effects" not found');
  }

  const layer2Output = await presets['glow-pulse-effects'](
    {
      inputCaptions: params.inputCaptions,
      glowColor: params.layer2_glowColor,
      pulseIntensity: params.layer2_pulseIntensity,
      applyGlow: params.layer2_applyGlow,
      applyPulse: params.layer2_applyPulse,
    },
    props,
  );

  console.log('   ✅ Layer 2 complete:', layer2Output.output.childrenData.length, 'components');

  // === MERGE THE LAYERS ===
  // Combine outputs from both presets
  // Layer 1 creates the subtitle components
  // Layer 2 creates effect containers that we add alongside
  
  const mergedChildren = [
    ...layer1Output.output.childrenData,
    ...layer2Output.output.childrenData,
  ];

  console.log('🎉 LAYERED EFFECTS DEMO complete!');
  console.log('   - Total components:', mergedChildren.length);
  console.log('   - Layer 1 components:', layer1Output.output.childrenData.length);
  console.log('   - Layer 2 components:', layer2Output.output.childrenData.length);

  return {
    output: {
      childrenData: mergedChildren,
    },
    options: {
      attachedToId: 'BaseScene',
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'layered-effects-demo',
  title: 'Layered Effects Demo',
  description:
    'Demonstrates composing multiple children presets. Calls basic-text-layer to create text, then glow-pulse-effects to layer effects on top. Showcases preset composition and dependency injection.',
  type: 'predefined',
  presetType: 'children',
  tags: ['demo', 'composition', 'effects', 'text', 'multi-layer', 'dependency-injection'],
  dependencies: {
    presets: ['basic-text-layer', 'glow-pulse-effects'],
  },
  defaultInputParams: {
    inputCaptions: [
      {
        id: 'caption-1',
        text: 'Layered effects showcase',
        start: 0,
        end: 2.5,
        words: [
          { id: 'w1', text: 'Layered', start: 0, end: 0.8 },
          { id: 'w2', text: 'effects', start: 0.9, end: 1.6 },
          { id: 'w3', text: 'showcase', start: 1.7, end: 2.5 },
        ],
      },
      {
        id: 'caption-2',
        text: 'Multiple presets combined',
        start: 3,
        end: 5.5,
        words: [
          { id: 'w4', text: 'Multiple', start: 3, end: 3.7 },
          { id: 'w5', text: 'presets', start: 3.8, end: 4.5 },
          { id: 'w6', text: 'combined', start: 4.6, end: 5.5 },
        ],
      },
    ],
    layer1_fontSize: 56,
    layer1_textColor: '#ffffff',
    layer1_position: 'center',
    layer2_glowColor: '#00ffff',
    layer2_pulseIntensity: 1.2,
    layer2_applyGlow: true,
    layer2_applyPulse: true,
  },
};

export const layeredEffectsDemoPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};

