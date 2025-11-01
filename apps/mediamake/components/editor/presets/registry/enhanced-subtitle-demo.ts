import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
import { RenderableComponentData } from '@microfox/datamotion';

/**
 * Enhanced Subtitle Demo
 * 
 * A simple, focused preset that demonstrates:
 * 1. Using helpers from stdlib to process captions
 * 2. Calling another preset (simple-opacity-effect) and USING its result
 * 3. Combining helper functions and preset composition
 * 
 * This is a realistic example of how presets should work together.
 */

const presetParams = z.object({
  inputCaptions: z
    .array(z.any())
    .describe('Input captions with word data (data-referrable)'),
  applyExtraOpacityLayer: z
    .boolean()
    .default(true)
    .describe('Apply an additional opacity effect layer by calling simple-opacity-effect preset'),
});

const presetExecution = async (
  params: z.infer<typeof presetParams>,
  props: any,
): Promise<PresetOutput> => {
  const { helpers, presets } = props;

  if (!helpers) {
    throw new Error('Helpers not injected. Check metadata.dependencies.');
  }

  console.log('🎬 Enhanced Subtitle Demo starting...');
  console.log('📝 Input captions:', params.inputCaptions.length, 'captions');

  // Step 1: Use helper to preprocess captions
  console.log('🔧 Using helper: preprocessCaptions');
  const processedCaptions = helpers.preprocessCaptions(params.inputCaptions);

  // Step 2: Create caption containers with word components
  const captionContainers: any[] = [];

  processedCaptions.forEach((caption: any, captionIndex: number) => {
    const wordComponents = caption.words.map((word: any, wordIndex: number) => {
      const wordId = `word-${captionIndex}-${wordIndex}`;

      // Create basic opacity effect using helper
      const opacityEffect = {
        id: `opacity-${wordId}`,
        componentId: 'generic',
        data: helpers.createOpacityEffect(wordId, word, caption),
      };

      // Create text component
      return {
        type: 'atom',
        id: wordId,
        componentId: 'TextAtom',
        effects: [opacityEffect],
        data: {
          text: word.text,
          className: 'font-bold px-3 py-2 rounded-lg bg-black/50',
          style: {
            fontSize: 56,
            color: '#ffffff',
          },
          font: {
            family: 'Inter',
            weights: ['700'],
          },
        },
        context: {
          timing: {
            start: word.start,  // Each word starts at its own relative time
            duration: word.duration,  // Each word has its own duration
          },
        },
      } as unknown as RenderableComponentData;
    });

    // Create caption container
    captionContainers.push({
      type: 'layout',
      id: `caption-${captionIndex}`,
      componentId: 'BaseLayout',
      data: {
        containerProps: {
          className: 'flex flex-wrap gap-3 justify-center',
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

  const totalWords = processedCaptions.reduce((sum: number, cap: any) => sum + cap.words.length, 0);
  console.log('✅ Created', totalWords, 'word components in', captionContainers.length, 'captions using helpers');

  // Step 3: Optionally call another preset to add extra effects
  let extraEffects: any[] = [];
  
  if (params.applyExtraOpacityLayer && presets && presets['simple-opacity-effect']) {
    console.log('🎨 Calling simple-opacity-effect preset to add extra layer...');
    
    try {
      // Prepare data for the child preset
      const targetWords = processedCaptions.flatMap((caption: any, captionIndex: number) => 
        caption.words.map((word: any, wordIndex: number) => ({
          id: `word-${captionIndex}-${wordIndex}`,  // ← Must match the actual component IDs!
          start: word.absoluteStart,
          duration: word.duration,
        }))
      );

      // Call the preset
      const extraOpacityResult = await presets['simple-opacity-effect'](
        {
          targetWords: targetWords,
          fadeInDuration: 1.0,  // Slower fade for extra layer
        },
        props,
      );

      console.log('✅ simple-opacity-effect returned:', extraOpacityResult);

      // Extract effects from the result and use them
      if (extraOpacityResult?.output?.childrenData?.[0]?.effects) {
        extraEffects = extraOpacityResult.output.childrenData[0].effects;
        console.log('✅ Extracted', extraEffects.length, 'extra effects from preset');
      }
    } catch (error) {
      console.warn('⚠️ Could not call simple-opacity-effect preset:', error);
    }
  }

  // Step 4: Return final output with all components and effects
  console.log('🎉 Enhanced Subtitle Demo complete!');
  console.log('   - Used helpers:', 'preprocessCaptions, createOpacityEffect');
  console.log('   - Called presets:', params.applyExtraOpacityLayer ? 'simple-opacity-effect' : 'none');
  console.log('   - Total captions:', captionContainers.length);
  console.log('   - Extra effects applied:', extraEffects.length);

  return {
    output: {
      childrenData: [
        {
          id: 'enhanced-subtitle-container',
          type: 'layout',
          componentId: 'BaseLayout',
          data: {
            containerProps: {
              className: 'absolute inset-0 flex items-center justify-center',
            },
          },
          effects: extraEffects,  // ← Extra effects from called preset!
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
  id: 'enhanced-subtitle-demo',
  title: 'Enhanced Subtitle Demo',
  description:
    'Demonstrates using helpers and calling other presets. Creates subtitles with helpers, then optionally calls simple-opacity-effect to add an extra effect layer.',
  type: 'predefined',
  presetType: 'children',
  tags: ['demo', 'subtitles', 'captions', 'composition', 'dependency-injection'],
  dependencies: {
    helpers: ['preprocessCaptions', 'createOpacityEffect'],
    presets: ['simple-opacity-effect'],
  },
  defaultInputParams: {
    inputCaptions: [
      {
        id: 'caption-1',
        text: 'Testing Dependency Injection',
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
            text: 'Dependency',
            start: 1,
            duration: 1,
            absoluteStart: 1,
            absoluteEnd: 2,
          },
          {
            id: 'word-3',
            text: 'Injection',
            start: 2,
            duration: 1,
            absoluteStart: 2,
            absoluteEnd: 3,
          },
        ],
      },
    ],
    applyExtraOpacityLayer: true,
  },
};

const _presetExecution = presetExecution.toString();

export const enhancedSubtitleDemoPreset = {
  metadata: presetMetadata,
  presetFunction: _presetExecution,
  presetParams: z.toJSONSchema(presetParams),
};


