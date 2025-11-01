import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
import { RenderableComponentData } from '@microfox/datamotion';

/**
 * BASIC TEXT LAYER PRESET
 * 
 * A simple children preset that creates text components from captions.
 * This is a foundational layer that other presets can build upon.
 * Uses helper functions from stdlib for caption preprocessing.
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
  
  fontSize: z
    .number()
    .min(20)
    .max(120)
    .default(48)
    .describe('Font size in pixels'),
  
  fontWeight: z
    .enum(['normal', 'bold', 'bolder'])
    .default('bold')
    .describe('Font weight'),
  
  textColor: z
    .string()
    .default('#ffffff')
    .describe('Text color in hex format'),
  
  position: z
    .enum(['top', 'center', 'bottom'])
    .default('center')
    .describe('Vertical position of text'),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
  props: any,
): PresetOutput => {
  const { helpers } = props;

  console.log('📝 BASIC TEXT LAYER starting...');
  console.log('   - Captions:', params.inputCaptions.length);

  // Use helper to preprocess captions
  const processedCaptions = helpers.preprocessCaptions(params.inputCaptions);

  // Determine vertical position class
  const positionClass = 
    params.position === 'top' ? 'items-start pt-20' :
    params.position === 'bottom' ? 'items-end pb-20' :
    'items-center';

  // Create caption containers with word components
  const captionContainers = processedCaptions.map((caption: any, captionIndex: number) => {
    const wordComponents = caption.words.map((word: any, wordIndex: number) => {
      return {
        id: `text-word-${captionIndex}-${wordIndex}`,
        type: 'atom',
        componentId: 'TextAtom',
        data: {
          text: word.text,
          style: {
            fontSize: `${params.fontSize}px`,
            fontWeight: params.fontWeight,
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
        childrenData: [],
      } as unknown as RenderableComponentData;
    });

    return {
      id: `text-caption-${captionIndex}`,
      type: 'layout',
      componentId: 'BaseLayout',
      data: {
        containerProps: {
          className: `absolute inset-0 flex ${positionClass} justify-center px-8`,
        },
      },
      context: {
        timing: {
          start: caption.absoluteStart,
          duration: caption.duration,
        },
      },
      childrenData: wordComponents,
    } as unknown as RenderableComponentData;
  });

  console.log('✅ BASIC TEXT LAYER complete!');
  console.log('   - Created', captionContainers.length, 'caption containers');

  return {
    output: {
      childrenData: [
        {
          id: 'basic-text-container',
          type: 'layout',
          componentId: 'BaseLayout',
          data: {
            containerProps: {
              className: 'absolute inset-0',
            },
          },
          context: {
            timing: {
              start: 0,
              duration: processedCaptions[processedCaptions.length - 1]?.absoluteEnd || 10,
            },
          },
          childrenData: captionContainers,
        } as unknown as RenderableComponentData,
      ],
    },
    options: {
      attachedToId: 'BaseScene',
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'basic-text-layer',
  title: 'Basic Text Layer',
  description:
    'Creates a simple text layer from captions. A foundational preset that other presets can layer effects on top of. Uses preprocessCaptions helper from stdlib.',
  type: 'predefined',
  presetType: 'children',
  tags: ['text', 'captions', 'basic', 'layer', 'foundation'],
  dependencies: {
    helpers: ['preprocessCaptions'],
  },
  defaultInputParams: {
    inputCaptions: [
      {
        id: 'caption-1',
        text: 'Simple text layer',
        start: 0,
        end: 2,
        words: [
          { id: 'w1', text: 'Simple', start: 0, end: 0.7 },
          { id: 'w2', text: 'text', start: 0.8, end: 1.4 },
          { id: 'w3', text: 'layer', start: 1.5, end: 2 },
        ],
      },
    ],
    fontSize: 48,
    fontWeight: 'bold',
    textColor: '#ffffff',
    position: 'center',
  },
};

export const basicTextLayerPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};

