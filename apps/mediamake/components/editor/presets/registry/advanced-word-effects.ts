import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

/**
 * Advanced Word Effects Preset
 * 
 * This demonstrates a more complex preset that:
 * 1. Uses multiple helpers from stdlib
 * 2. Calls another preset (simple-opacity-effect)
 * 3. Combines multiple effects
 */

const presetParams = z.object({
  inputCaptions: z
    .array(z.any())
    .describe('Input captions with word data (data-referrable)'),
  effects: z.object({
    useOpacity: z.boolean().default(true).describe('Apply opacity effect'),
    useScale: z.boolean().default(true).describe('Apply scale effect'),
    useWave: z.boolean().default(false).describe('Apply wave float effect'),
  }),
  impact: z.number().default(1.0).describe('Global impact multiplier'),
});

const presetExecution = async (
  params: z.infer<typeof presetParams>,
  props: any,
): Promise<PresetOutput> => {
  // Access injected helpers and presets
  const { helpers, presets } = props;

  if (!helpers) {
    throw new Error('Helpers not injected. Check metadata.dependencies.');
  }

  // Use helpers to preprocess captions
  const processedCaptions = helpers.preprocessCaptions(params.inputCaptions);

  // Create caption components with words and effects
  const captionComponents: any[] = [];

  processedCaptions.forEach((caption: any, captionIndex: number) => {
    // Create word components for this caption
    const wordComponents = caption.words.map((word: any, wordIndex: number) => {
      const wordId = `word-${captionIndex}-${wordIndex}`;
      
      // Collect effects for this word
      const wordEffects: any[] = [];

      // Use scale helper
      if (params.effects.useScale) {
        wordEffects.push({
          id: `scale-${wordId}`,
          componentId: 'generic',
          data: helpers.createScaleEffect(wordId, word, params.impact),
        });
      }

      // Use opacity helper
      if (params.effects.useOpacity) {
        wordEffects.push({
          id: `opacity-${wordId}`,
          componentId: 'generic',
          data: helpers.createOpacityEffect(wordId, word, caption),
        });
      }

      // Use wave float helper
      if (params.effects.useWave) {
        wordEffects.push({
          id: `wave-${wordId}`,
          componentId: 'generic',
          data: helpers.createWaveFloatEffect(wordId, word, params.impact),
        });
      }

      // Create text component with effects
      return {
        type: 'atom',
        id: wordId,
        componentId: 'TextAtom',
        effects: wordEffects,
        data: {
          text: word.text,
          className: 'font-bold px-2 rounded-lg',
          style: {
            fontSize: 48,
            color: '#ffffff',
          },
          font: {
            family: 'Inter',
            weights: ['700'],
          },
        },
        context: {
          timing: {
            start: 0,
            duration: caption.duration,
          },
        },
      };
    });

    // Create caption container with all words
    captionComponents.push({
      type: 'layout',
      id: `caption-${captionIndex}`,
      componentId: 'BaseLayout',
      data: {
        containerProps: {
          className: 'flex flex-row gap-3 items-center justify-center',
        },
      },
      context: {
        timing: {
          start: caption.absoluteStart,
          duration: caption.duration,
        },
      },
      childrenData: wordComponents,
    });
  });

  // Optionally call another preset if available (demo of preset composition)
  if (presets && presets['simple-opacity-effect']) {
    try {
      const opacityPresetResult = await presets['simple-opacity-effect'](
        {
          targetWords: processedCaptions[0]?.words.map((word: any, idx: number) => ({
            id: `word-0-${idx}`,
            start: word.start,
            duration: word.duration,
          })) || [],
          fadeInDuration: 0.8,
        },
        props,
      );
      console.log('Called simple-opacity-effect preset successfully', opacityPresetResult);
    } catch (error) {
      console.warn('Could not call simple-opacity-effect preset:', error);
    }
  }

  return {
    output: {
      childrenData: [
        {
          id: 'advanced-word-effects-container',
          type: 'layout',
          componentId: 'BaseLayout',
          data: {
            containerProps: {
              className: 'absolute inset-0 flex flex-col items-center justify-center gap-4',
            },
          },
          context: {
            timing: {
              start: 0,
              duration: processedCaptions[processedCaptions.length - 1]?.absoluteEnd || 10,
            },
          },
          childrenData: captionComponents,
        },
      ],
    },
    options: {
      attachedToId: 'BaseScene',
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'advanced-word-effects',
  title: 'Advanced Word Effects',
  description:
    'Displays captions with animated word effects (opacity, scale, wave) using stdlib helpers and demonstrates preset composition',
  type: 'predefined',
  presetType: 'children',
  tags: ['captions', 'subtitles', 'effects', 'advanced', 'opacity', 'scale', 'wave', 'animated'],
  // NEW: Declare multiple dependencies
  dependencies: {
    helpers: [
      'preprocessCaptions',
      'createOpacityEffect',
      'createScaleEffect',
      'createWaveFloatEffect',
    ],
    presets: ['simple-opacity-effect'], // Can call this preset
  },
  defaultInputParams: {
    // Can use "data:[captions]" to reference captions from base data
    inputCaptions: [
      {
        id: 'caption-1',
        text: 'Hello World',
        absoluteStart: 0,
        absoluteEnd: 2,
        start: 0,
        end: 2,
        duration: 2,
        words: [
          {
            id: 'word-1',
            text: 'Hello',
            start: 0,
            duration: 1,
            absoluteStart: 0,
            absoluteEnd: 1,
          },
          {
            id: 'word-2',
            text: 'World',
            start: 1,
            duration: 1,
            absoluteStart: 1,
            absoluteEnd: 2,
          },
        ],
      },
    ],
    effects: {
      useOpacity: true,
      useScale: true,
      useWave: false,
    },
    impact: 1.0,
  },
};

const _presetExecution = presetExecution.toString();

export const advancedWordEffectsPreset = {
  metadata: presetMetadata,
  presetFunction: _presetExecution,
  presetParams: z.toJSONSchema(presetParams),
};

