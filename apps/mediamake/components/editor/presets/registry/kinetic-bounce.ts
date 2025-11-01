import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
import { RenderableComponentData } from '@microfox/datamotion';

/**
 * KINETIC BOUNCE ANIMATION
 * 
 * A children preset that creates bouncy animation for text using effects.
 * Text appears with elastic bounce effect.
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
  
  bounceHeight: z
    .number()
    .min(10)
    .max(100)
    .default(30)
    .describe('Height of bounce in pixels'),
  
  duration: z
    .number()
    .min(0.3)
    .max(2)
    .default(0.8)
    .describe('Total animation duration in seconds'),
  
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
});

const presetExecution = async (
  params: z.infer<typeof presetParams>,
  props: any,
): Promise<PresetOutput> => {
  const { helpers } = props;
  
  console.log('🎾 BOUNCE ANIMATION starting...');
  console.log('   - Bounce Height:', params.bounceHeight);
  console.log('   - Duration:', params.duration);

  if (!helpers) {
    throw new Error('Helpers not injected. Check metadata.dependencies.');
  }

  const processedCaptions = helpers.preprocessCaptions(params.inputCaptions);
  const childrenData: RenderableComponentData[] = [];

  // Create bounce animated text for each caption
  processedCaptions.forEach((caption: any, captionIndex: number) => {
    const wordComponents = caption.words.map((word: any, wordIndex: number) => {
      const wordId = `bounce-word-${captionIndex}-${wordIndex}`;
      
      // Calculate animation duration: use word's remaining time but cap it
      const remainingTime = caption.duration - word.start;
      const animDuration = Math.min(params.duration, Math.max(0.2, remainingTime * 0.3));
      
      // Create bounce effect with multiple keyframes
      const bounceEffect = {
        id: `bounce-${wordId}`,
        componentId: 'generic',
        data: {
          type: 'spring',
          start: word.start,
          duration: animDuration,
          mode: 'provider',
          targetIds: [wordId],
          ranges: [
            { key: 'translateY', val: -params.bounceHeight, prog: 0 },
            { key: 'translateY', val: 0, prog: 0.3 },
            { key: 'translateY', val: -params.bounceHeight * 0.5, prog: 0.5 },
            { key: 'translateY', val: 0, prog: 0.7 },
            { key: 'translateY', val: -params.bounceHeight * 0.2, prog: 0.85 },
            { key: 'translateY', val: 0, prog: 1 },
            { key: 'scale', val: 0.8, prog: 0 },
            { key: 'scale', val: 1, prog: 0.3 },
            { key: 'opacity', val: 0, prog: 0 },
            { key: 'opacity', val: 1, prog: 0.2 },
          ],
        },
      };

      return {
        id: wordId,
        type: 'atom',
        componentId: 'TextAtom',
        effects: [bounceEffect],
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
            duration: caption.duration - word.start, // Stay visible until caption ends
          },
        },
      } as unknown as RenderableComponentData;
    });

    // Create caption container
    childrenData.push({
      id: `bounce-caption-${captionIndex}`,
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

  console.log('✅ BOUNCE ANIMATION complete:', childrenData.length, 'components');

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
  id: 'kinetic-bounce',
  title: 'Kinetic Bounce',
  description: 'Animates text with elastic bounce effect using spring easing.',
  type: 'predefined',
  presetType: 'children',
  tags: ['kinetic', 'animation', 'bounce', 'text', 'elastic'],
  dependencies: {
    helpers: ['preprocessCaptions'],
  },
  defaultInputParams: {
    inputCaptions: [
      {
        id: 'caption-1',
        text: 'Bounce Effect',
        start: 0,
        end: 3,
        words: [
          { id: 'w1', text: 'Bounce', start: 0, end: 1.5 },
          { id: 'w2', text: 'Effect', start: 1.6, end: 3 },
        ],
      },
    ],
    bounceHeight: 30,
    duration: 0.8,
    fontSize: 48,
    textColor: '#ffffff',
  },
};

export const kineticBouncePreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
