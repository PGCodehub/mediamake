import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
import { RenderableComponentData } from '@microfox/datamotion';

/**
 * KINETIC SLIDE-IN ANIMATION
 * 
 * A children preset that creates slide-in animation for text using effects.
 * Text slides in from the side with smooth easing.
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
  
  direction: z
    .enum(['left', 'right'])
    .default('left')
    .describe('Direction from which text slides in'),
  
  distance: z
    .number()
    .min(50)
    .max(500)
    .default(100)
    .describe('Distance to slide in pixels'),
  
  duration: z
    .number()
    .min(0.1)
    .max(2)
    .default(0.5)
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
});

const presetExecution = async (
  params: z.infer<typeof presetParams>,
  props: any,
): Promise<PresetOutput> => {
  const { helpers } = props;
  
  console.log('🎬 SLIDE-IN ANIMATION starting...');
  console.log('   - Direction:', params.direction);
  console.log('   - Distance:', params.distance);
  console.log('   - Duration:', params.duration);

  if (!helpers) {
    throw new Error('Helpers not injected. Check metadata.dependencies.');
  }

  const processedCaptions = helpers.preprocessCaptions(params.inputCaptions);
  const childrenData: RenderableComponentData[] = [];

  // Create slide-in animated text for each caption
  processedCaptions.forEach((caption: any, captionIndex: number) => {
    const wordComponents = caption.words.map((word: any, wordIndex: number) => {
      const wordId = `slide-word-${captionIndex}-${wordIndex}`;
      const startX = params.direction === 'left' ? -params.distance : params.distance;
      
      // Calculate animation duration: use word's remaining time but cap it
      // This ensures fast words animate quickly and slow words have time
      const remainingTime = caption.duration - word.start;
      const animDuration = Math.min(params.duration, Math.max(0.2, remainingTime * 0.3));
      
      // Create slide effect
      const slideEffect = {
        id: `slide-${wordId}`,
        componentId: 'generic',
        data: {
          type: 'ease-out',
          start: word.start,
          duration: animDuration,
          mode: 'provider',
          targetIds: [wordId],
          ranges: [
            { key: 'translateX', val: startX, prog: 0 },
            { key: 'translateX', val: 0, prog: 1 },
            { key: 'opacity', val: 0, prog: 0 },
            { key: 'opacity', val: 1, prog: 0.6 },
          ],
        },
      };

      return {
        id: wordId,
        type: 'atom',
        componentId: 'TextAtom',
        effects: [slideEffect],
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
      id: `slide-caption-${captionIndex}`,
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

  console.log('✅ SLIDE-IN ANIMATION complete:', childrenData.length, 'components');

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
  id: 'kinetic-slide-in',
  title: 'Kinetic Slide-In',
  description: 'Animates text sliding in from a specified direction with smooth easing using effects.',
  type: 'predefined',
  presetType: 'children',
  tags: ['kinetic', 'animation', 'slide', 'text', 'motion'],
  dependencies: {
    helpers: ['preprocessCaptions'],
  },
  defaultInputParams: {
    inputCaptions: [
      {
        id: 'caption-1',
        text: 'Slide In Effect',
        start: 0,
        end: 3,
        words: [
          { id: 'w1', text: 'Slide', start: 0, end: 0.8 },
          { id: 'w2', text: 'In', start: 0.9, end: 1.5 },
          { id: 'w3', text: 'Effect', start: 1.6, end: 3 },
        ],
      },
    ],
    direction: 'left',
    distance: 100,
    duration: 0.5,
    fontSize: 48,
    textColor: '#ffffff',
  },
};

export const kineticSlideInPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
