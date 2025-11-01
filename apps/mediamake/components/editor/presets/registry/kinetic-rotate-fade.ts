import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
import { RenderableComponentData } from '@microfox/datamotion';

/**
 * KINETIC ROTATE-FADE ANIMATION
 * 
 * A children preset that creates rotating fade-in animation for text using effects.
 * Text rotates while fading in with a smooth effect.
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
  
  rotationDegrees: z
    .number()
    .min(-360)
    .max(360)
    .default(90)
    .describe('Degrees to rotate'),
  
  duration: z
    .number()
    .min(0.3)
    .max(3)
    .default(1)
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
  
  console.log('🌀 ROTATE-FADE ANIMATION starting...');
  console.log('   - Rotation:', params.rotationDegrees, 'degrees');
  console.log('   - Duration:', params.duration);

  if (!helpers) {
    throw new Error('Helpers not injected. Check metadata.dependencies.');
  }

  const processedCaptions = helpers.preprocessCaptions(params.inputCaptions);
  const childrenData: RenderableComponentData[] = [];

  // Create rotate-fade animated text for each caption
  processedCaptions.forEach((caption: any, captionIndex: number) => {
    const wordComponents = caption.words.map((word: any, wordIndex: number) => {
      const wordId = `rotate-word-${captionIndex}-${wordIndex}`;
      
      // Calculate animation duration: use word's remaining time but cap it
      const remainingTime = caption.duration - word.start;
      const animDuration = Math.min(params.duration, Math.max(0.2, remainingTime * 0.3));
      
      // Create rotate-fade effect
      const rotateEffect = {
        id: `rotate-${wordId}`,
        componentId: 'generic',
        data: {
          type: 'ease-out',
          start: word.start,
          duration: animDuration,
          mode: 'provider',
          targetIds: [wordId],
          ranges: [
            { key: 'rotate', val: params.rotationDegrees, prog: 0 },
            { key: 'rotate', val: 0, prog: 1 },
            { key: 'scale', val: 0.5, prog: 0 },
            { key: 'scale', val: 1, prog: 1 },
            { key: 'opacity', val: 0, prog: 0 },
            { key: 'opacity', val: 1, prog: 0.7 },
          ],
        },
      };

      return {
        id: wordId,
        type: 'atom',
        componentId: 'TextAtom',
        effects: [rotateEffect],
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
      id: `rotate-caption-${captionIndex}`,
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

  console.log('✅ ROTATE-FADE ANIMATION complete:', childrenData.length, 'components');

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
  id: 'kinetic-rotate-fade',
  title: 'Kinetic Rotate-Fade',
  description: 'Animates text with rotating fade-in effect with smooth appearance.',
  type: 'predefined',
  presetType: 'children',
  tags: ['kinetic', 'animation', 'rotate', 'fade', 'text', 'spin'],
  dependencies: {
    helpers: ['preprocessCaptions'],
  },
  defaultInputParams: {
    inputCaptions: [
      {
        id: 'caption-1',
        text: 'Rotate & Fade',
        start: 0,
        end: 3,
        words: [
          { id: 'w1', text: 'Rotate', start: 0, end: 1.5 },
          { id: 'w2', text: '&', start: 1.5, end: 1.8 },
          { id: 'w3', text: 'Fade', start: 1.8, end: 3 },
        ],
      },
    ],
    rotationDegrees: 90,
    duration: 1,
    fontSize: 48,
    textColor: '#ffffff',
  },
};

export const kineticRotateFadePreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
