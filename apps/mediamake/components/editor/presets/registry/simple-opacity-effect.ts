import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

/**
 * Simple Opacity Effect Preset
 * 
 * This is a simple example preset that demonstrates the new dependency injection system.
 * It uses helper functions from preset-stdlib instead of defining them inline.
 */

const presetParams = z.object({
  targetWords: z
    .array(
      z.object({
        id: z.string(),
        start: z.number(),
        duration: z.number(),
      }),
    )
    .describe('Array of word objects to apply opacity effect to'),
  fadeInDuration: z
    .number()
    .default(0.6)
    .describe('Duration of the fade-in effect'),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
  props: any,
): PresetOutput => {
  // Access injected helpers from stdlib
  const { helpers } = props;

  if (!helpers) {
    throw new Error('Helpers not injected. Check metadata.dependencies.');
  }

  // Use the createOpacityEffect helper from stdlib
  const effects = params.targetWords.map((word) => ({
    id: `opacity-${word.id}`,
    componentId: 'generic',
    data: helpers.createOpacityEffect(word.id, word, null),
  }));

  return {
    output: {
      childrenData: [
        {
          id: 'opacity-effects-container',
          type: 'layout',
          componentId: 'BaseLayout',
          effects: effects,
          childrenData: [],
          context: {
            timing: {
              start: 0,
              duration: 10,
            },
          },
        },
      ],
    },
    options: {
      attachedToId: 'BaseScene',
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'simple-opacity-effect',
  title: 'Simple Opacity Effect',
  description:
    'A simple preset that applies opacity fade-in effects using stdlib helpers',
  type: 'predefined',
  presetType: 'effects',
  tags: ['effects', 'opacity', 'fade', 'simple', 'example'],
  // NEW: Declare dependencies
  dependencies: {
    helpers: ['createOpacityEffect'], // We use this helper from stdlib
  },
  defaultInputParams: {
    targetWords: [
      {
        id: 'word-1',
        start: 0,
        duration: 2,
      },
      {
        id: 'word-2',
        start: 2,
        duration: 2,
      },
    ],
    fadeInDuration: 0.6,
  },
};

const _presetExecution = presetExecution.toString();

export const simpleOpacityEffectPreset = {
  metadata: presetMetadata,
  presetFunction: _presetExecution,
  presetParams: z.toJSONSchema(presetParams),
};

