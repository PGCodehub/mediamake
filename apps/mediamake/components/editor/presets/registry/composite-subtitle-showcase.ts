import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

/**
 * Composite Subtitle Showcase
 * 
 * This preset demonstrates REAL preset composition by:
 * 1. Calling base-scene preset to create a container
 * 2. Calling advanced-word-effects to add animated subtitles
 * 3. Merging the results into a complete composition
 * 
 * This shows the dependency injection system working end-to-end!
 */

const presetParams = z.object({
  inputCaptions: z
    .array(z.any())
    .describe('Input captions with word data (data-referrable)'),
  backgroundColor: z
    .string()
    .default('#1a1a2e')
    .describe('Background color for the scene'),
  effectsConfig: z.object({
    useOpacity: z.boolean().default(true),
    useScale: z.boolean().default(true),
    useWave: z.boolean().default(true),
    impact: z.number().default(1.2),
  }),
});

const presetExecution = async (
  params: z.infer<typeof presetParams>,
  props: any,
): Promise<PresetOutput> => {
  const { presets } = props;

  if (!presets) {
    throw new Error('Presets not injected. Check metadata.dependencies.');
  }

  console.log('🎬 Starting Composite Subtitle Showcase...');

  // Step 1: Call base-scene preset to create the scene container
  let baseSceneOutput;
  if (presets['base-scene']) {
    console.log('📦 Calling base-scene preset...');
    try {
      baseSceneOutput = await presets['base-scene'](
        {
          backgroundColor: params.backgroundColor,
        },
        props,
      );
      console.log('✅ base-scene preset completed:', baseSceneOutput);
    } catch (error) {
      console.error('❌ base-scene preset failed:', error);
      throw error;
    }
  } else {
    throw new Error('base-scene preset not available');
  }

  // Step 2: Call advanced-word-effects preset to create animated subtitles
  let subtitlesOutput;
  if (presets['advanced-word-effects']) {
    console.log('🎨 Calling advanced-word-effects preset...');
    try {
      subtitlesOutput = await presets['advanced-word-effects'](
        {
          inputCaptions: params.inputCaptions,
          effects: {
            useOpacity: params.effectsConfig.useOpacity,
            useScale: params.effectsConfig.useScale,
            useWave: params.effectsConfig.useWave,
          },
          impact: params.effectsConfig.impact,
        },
        props,
      );
      console.log('✅ advanced-word-effects preset completed:', subtitlesOutput);
    } catch (error) {
      console.error('❌ advanced-word-effects preset failed:', error);
      throw error;
    }
  } else {
    throw new Error('advanced-word-effects preset not available');
  }

  // Step 3: Merge the results - add subtitles to the base scene
  console.log('🔗 Merging preset outputs...');

  // Get the base scene container
  const baseSceneContainer = baseSceneOutput.output.childrenData?.[0];
  
  if (!baseSceneContainer) {
    throw new Error('Base scene container not found in output');
  }

  // Get the subtitles container
  const subtitlesContainer = subtitlesOutput.output.childrenData?.[0];
  
  if (!subtitlesContainer) {
    throw new Error('Subtitles container not found in output');
  }

  // Add subtitles as a child of the base scene
  const mergedChildren = [
    ...(baseSceneContainer.childrenData || []),
    subtitlesContainer,
  ];

  console.log('✅ Merged! Base scene now has', mergedChildren.length, 'children');

  // Step 4: Return the complete composition
  return {
    output: {
      childrenData: [
        {
          ...baseSceneContainer,
          childrenData: mergedChildren,
        },
      ],
      config: baseSceneOutput.output.config,
      style: baseSceneOutput.output.style,
    },
    options: {
      attachedToId: 'BaseScene',
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'composite-subtitle-showcase',
  title: 'Composite Subtitle Showcase',
  description:
    'Demonstrates REAL preset composition by calling base-scene and advanced-word-effects presets and merging their outputs',
  type: 'predefined',
  presetType: 'full',
  tags: ['composite', 'showcase', 'demo', 'captions', 'subtitles', 'scene'],
  // Declare dependencies on other presets
  dependencies: {
    presets: ['base-scene', 'advanced-word-effects'],
  },
  defaultInputParams: {
    inputCaptions: [
      {
        id: 'caption-1',
        text: 'Testing Preset Composition',
        absoluteStart: 0,
        absoluteEnd: 3,
        start: 0,
        end: 3,
        duration: 3,
        words: [
          {
            id: 'word-1',
            text: 'Testing',
            start: 0,
            duration: 1,
            absoluteStart: 0,
            absoluteEnd: 1,
          },
          {
            id: 'word-2',
            text: 'Preset',
            start: 1,
            duration: 1,
            absoluteStart: 1,
            absoluteEnd: 2,
          },
          {
            id: 'word-3',
            text: 'Composition',
            start: 2,
            duration: 1,
            absoluteStart: 2,
            absoluteEnd: 3,
          },
        ],
      },
    ],
    backgroundColor: '#1a1a2e',
    effectsConfig: {
      useOpacity: true,
      useScale: true,
      useWave: true,
      impact: 1.5,
    },
  },
};

const _presetExecution = presetExecution.toString();

export const compositeSubtitleShowcasePreset = {
  metadata: presetMetadata,
  presetFunction: _presetExecution,
  presetParams: z.toJSONSchema(presetParams),
};

