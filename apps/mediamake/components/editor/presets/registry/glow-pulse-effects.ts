import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
import { RenderableComponentData } from '@microfox/datamotion';

/**
 * GLOW PULSE EFFECTS PRESET
 * 
 * A children preset that adds glow and pulse effects to text components.
 * This preset creates effect containers that can be applied on top of text layers.
 * Uses helper functions from stdlib for effect creation.
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
  
  glowColor: z
    .string()
    .default('#00ffff')
    .describe('Glow color in hex format'),
  
  pulseIntensity: z
    .number()
    .min(0)
    .max(2)
    .default(1)
    .describe('Pulse effect intensity multiplier'),
  
  applyGlow: z
    .boolean()
    .default(true)
    .describe('Apply gradient glow effect'),
  
  applyPulse: z
    .boolean()
    .default(true)
    .describe('Apply pulse effect'),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
  props: any,
): PresetOutput => {
  const { helpers } = props;

  console.log('✨ GLOW PULSE EFFECTS starting...');
  console.log('   - Captions:', params.inputCaptions.length);
  console.log('   - Glow:', params.applyGlow);
  console.log('   - Pulse:', params.applyPulse);

  // Use helper to preprocess captions
  const processedCaptions = helpers.preprocessCaptions(params.inputCaptions);

  // Collect all effects for all words
  const allEffects: any[] = [];

  processedCaptions.forEach((caption: any, captionIndex: number) => {
    caption.words.forEach((word: any, wordIndex: number) => {
      const wordId = `text-word-${captionIndex}-${wordIndex}`;

      // Add glow effect if enabled
      if (params.applyGlow) {
        const glowEffect = helpers.createGradientGlowEffect(
          wordId,
          word,
          { color: params.glowColor, intensity: 1.2 },
        );
        allEffects.push({
          id: `glow-${wordId}`,
          componentId: 'generic',
          data: glowEffect,
        });
      }

      // Add pulse effect if enabled
      if (params.applyPulse) {
        const pulseEffect = helpers.createPulseEffect(
          wordId,
          word,
          { intensity: params.pulseIntensity },
        );
        allEffects.push({
          id: `pulse-${wordId}`,
          componentId: 'generic',
          data: pulseEffect,
        });
      }
    });
  });

  console.log('✅ GLOW PULSE EFFECTS complete!');
  console.log('   - Total effects created:', allEffects.length);

  return {
    output: {
      childrenData: [
        {
          id: 'glow-pulse-effects-container',
          type: 'layout',
          componentId: 'BaseLayout',
          data: {
            containerProps: {
              className: 'absolute inset-0 pointer-events-none',
            },
          },
          effects: allEffects,
          context: {
            timing: {
              start: 0,
              duration: processedCaptions[processedCaptions.length - 1]?.absoluteEnd || 10,
            },
          },
          childrenData: [],
        } as unknown as RenderableComponentData,
      ],
    },
    options: {
      attachedToId: 'BaseScene',
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'glow-pulse-effects',
  title: 'Glow & Pulse Effects',
  description:
    'Adds glow and pulse effects to text components. Designed to layer on top of text presets. Uses createGradientGlowEffect and createPulseEffect helpers from stdlib.',
  type: 'predefined',
  presetType: 'children',
  tags: ['effects', 'glow', 'pulse', 'animation', 'layer'],
  dependencies: {
    helpers: ['preprocessCaptions', 'createGradientGlowEffect', 'createPulseEffect'],
  },
  defaultInputParams: {
    inputCaptions: [
      {
        id: 'caption-1',
        text: 'Glowing pulsing text',
        start: 0,
        end: 2,
        words: [
          { id: 'w1', text: 'Glowing', start: 0, end: 0.7 },
          { id: 'w2', text: 'pulsing', start: 0.8, end: 1.4 },
          { id: 'w3', text: 'text', start: 1.5, end: 2 },
        ],
      },
    ],
    glowColor: '#00ffff',
    pulseIntensity: 1,
    applyGlow: true,
    applyPulse: true,
  },
};

export const glowPulseEffectsPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};

