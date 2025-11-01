import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
import { RenderableComponentData } from '@microfox/datamotion';

/**
 * KINETIC SCALE-PULSE ANIMATION
 * 
 * A children preset that creates pulsing scale animation for text using effects.
 * Text scales up and down rhythmically with smooth pulsing effect.
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
    .describe('Array of captions with timing and words'),
  
  maxScale: z
    .number()
    .min(1)
    .max(2)
    .default(1.3)
    .describe('Maximum scale multiplier'),
  
  duration: z
    .number()
    .min(0.3)
    .max(2)
    .default(0.8)
    .describe('Animation duration in seconds'),
  
  fontSize: z
    .number()
    .min(20)
    .max(120)
    .default(48)
    .describe('Font size for text'),
  
  textColor: z
    .string()
    .default('#ffffff')
    .describe('Text color in hex'),
  
  addGlow: z
    .boolean()
    .default(true)
    .describe('Add glow effect that pulses with scale'),
  
  glowColor: z
    .string()
    .default('#00ffff')
    .describe('Glow color in hex'),
});

const presetExecution = async (
  params: z.infer<typeof presetParams>,
  props: any,
): Promise<PresetOutput> => {
  const { helpers } = props;
  
  console.log('💫 SCALE-PULSE ANIMATION starting...');
  console.log('   - Max Scale:', params.maxScale);
  console.log('   - Duration:', params.duration);
  console.log('   - Add Glow:', params.addGlow);

  if (!helpers) {
    throw new Error('Helpers not injected. Check metadata.dependencies.');
  }

  const processedCaptions = helpers.preprocessCaptions(params.inputCaptions);
  const childrenData: RenderableComponentData[] = [];

  // Create scale-pulse animated text for each caption
  processedCaptions.forEach((caption: any, captionIndex: number) => {
    const wordComponents = caption.words.map((word: any, wordIndex: number) => {
      const wordId = `pulse-word-${captionIndex}-${wordIndex}`;
      
      // Calculate animation duration: use word's remaining time but cap it
      const remainingTime = caption.duration - word.start;
      const animDuration = Math.min(params.duration, Math.max(0.2, remainingTime * 0.3));
      
      const effects = [];
      
      // Create pulse scale effect
      const pulseEffect = {
        id: `pulse-${wordId}`,
        componentId: 'generic',
        data: {
          type: 'ease-in-out',
          start: word.start,
          duration: animDuration,
          mode: 'provider',
          targetIds: [wordId],
          ranges: [
            { key: 'scale', val: 0.5, prog: 0 },
            { key: 'scale', val: params.maxScale, prog: 0.5 },
            { key: 'scale', val: 1, prog: 1 },
            { key: 'opacity', val: 0, prog: 0 },
            { key: 'opacity', val: 1, prog: 0.3 },
          ],
        },
      };
      effects.push(pulseEffect);

      // Add glow effect if enabled
      if (params.addGlow) {
        const glowEffect = helpers.createGradientGlowEffect(
          wordId,
          word,
          { color: params.glowColor, intensity: 1.5 }
        );
        effects.push({
          id: `glow-${wordId}`,
          componentId: 'generic',
          data: glowEffect,
        });
      }

      return {
        id: wordId,
        type: 'atom',
        componentId: 'TextAtom',
        effects,
        data: {
          text: word.text,
          className: 'font-bold',
          style: {
            fontSize: params.fontSize,
            color: params.textColor,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            marginRight: '0.3em',
          },
          font: {
            family: 'Inter',
            weights: ['700'],
          },
        },
        context: {
          timing: {
            start: word.start,
            duration: word.duration,
          },
        },
      } as unknown as RenderableComponentData;
    });

    // Create caption container
    childrenData.push({
      id: `pulse-caption-${captionIndex}`,
      type: 'layout',
      componentId: 'BaseLayout',
      data: {
        containerProps: {
          className: 'absolute inset-0 flex items-center justify-center px-8',
        },
      },
      context: {
        timing: {
          start: caption.absoluteStart,
          duration: caption.duration,
        },
      },
      childrenData: wordComponents,
    } as unknown as RenderableComponentData);
  });

  console.log('✅ SCALE-PULSE ANIMATION complete:', childrenData.length, 'components');

  return {
    output: {
      childrenData,
    },
    options: {
      attachedToId: 'BaseScene',
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'kinetic-scale-pulse',
  title: 'Kinetic Scale-Pulse',
  description: 'Animates text with rhythmic pulsing scale effect, optionally with synchronized glow.',
  type: 'predefined',
  presetType: 'children',
  tags: ['kinetic', 'animation', 'scale', 'pulse', 'text', 'glow'],
  dependencies: {
    helpers: ['preprocessCaptions', 'createGradientGlowEffect'],
  },
  defaultInputParams: {
    inputCaptions: [
      {
        id: 'caption-1',
        text: 'Pulse Effect',
        start: 0,
        end: 3,
        words: [
          { id: 'w1', text: 'Pulse', start: 0, end: 1.5 },
          { id: 'w2', text: 'Effect', start: 1.6, end: 3 },
        ],
      },
    ],
    maxScale: 1.3,
    duration: 0.8,
    fontSize: 48,
    textColor: '#ffffff',
    addGlow: true,
    glowColor: '#00ffff',
  },
};

export const kineticScalePulsePreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
