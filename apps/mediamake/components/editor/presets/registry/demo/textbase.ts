import z from 'zod';
import { PresetMetadata, PresetOutput } from '../../types';
import { RenderableComponentData } from '@microfox/datamotion';

/**
 * TEXT BASE PRESET
 *
 * Renders a line of text with words displayed horizontally one after another.
 * Uses primary font for one word and secondary font for the rest.
 * Applies opacity effects via genericOpacityEffect preset dependency.
 */

const presetParams = z.object({
  text: z.string().describe('The text line to display'),

  totalDuration: z
    .number()
    .min(0.1)
    .default(5)
    .describe('Total duration of the animation in seconds'),

  primaryFont: z
    .string()
    .default('Inter')
    .describe('Font family for the primary word (one word)'),

  secondaryFont: z
    .string()
    .default('Inter')
    .describe('Font family for secondary words (rest of the words)'),

  fontSize: z
    .number()
    .min(20)
    .max(120)
    .default(48)
    .describe('Font size in pixels'),

  textColor: z.string().default('#ffffff').describe('Text color in hex format'),

  effectType: z
    .enum(['opacity', 'glow-pulse'])
    .default('opacity')
    .describe('Type of effect to apply to words'),

  impact: z
    .number()
    .min(0.1)
    .max(3.0)
    .default(1.0)
    .describe('Impact modifier for effect intensity (applies to all words)'),

  glowColor: z
    .string()
    .default('#ffffff')
    .describe('Glow color in hex format (only used for glow-pulse effect)'),
});

const presetExecution = async (
  params: z.infer<typeof presetParams>,
  props: any,
): Promise<PresetOutput> => {
  const { presets } = props;

  // Determine which effect preset to use based on effectType
  const effectPresetId =
    params.effectType === 'glow-pulse'
      ? 'glowPulseTextEffect'
      : 'genericOpacityEffect';

  if (!presets || !presets[effectPresetId]) {
    throw new Error(
      `Preset dependency "${effectPresetId}" not found. Check metadata.dependencies.`,
    );
  }

  // Split text into words
  const words = params.text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);

  if (words.length === 0) {
    return {
      output: {
        childrenData: [],
      },
      options: {
        attachedToId: 'BaseScene',
      },
    };
  }

  // Pick a random word index for primary font
  const primaryWordIndex = Math.floor(Math.random() * words.length);

  // Calculate timing for effects (relative to container start)
  const wordDuration = params.totalDuration / words.length;
  const wordComponents: RenderableComponentData[] = [];

  // Process each word and apply effects individually
  for (let index = 0; index < words.length; index++) {
    const word = words[index];
    const wordStart = index > 0 ? index * wordDuration : 0; // Relative start for effects
    const isPrimary = index === primaryWordIndex;
    const fontFamily = isPrimary ? params.primaryFont : params.secondaryFont;
    const wordId = `textbase-word-${index}`;

    // Call the selected effect preset for this word
    const effectParams: any = {
      targetId: wordId,
      effectStart: wordStart,
      effectDuration: wordDuration,
      impact: params.impact,
    };

    // Add glowColor for glow-pulse effect
    if (params.effectType === 'glow-pulse') {
      effectParams.glowColor = params.glowColor;
    }

    const effectResult = await presets[effectPresetId](effectParams, props);

    // Extract single effect from internal preset output
    const wordEffect =
      effectResult?.output?._extractedEffects?.[0] ||
      effectResult?.output?.childrenData?.[0]?.effects?.[0];

    const wordComponent: RenderableComponentData = {
      id: wordId,
      type: 'atom',
      componentId: 'TextAtom',
      data: {
        text: word,
        style: {
          fontSize: `${params.fontSize}px`,
          fontWeight: isPrimary ? 'bold' : 'normal',
          color: params.textColor,
          //textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          marginRight: '0.3em',
        },
        font: {
          family: fontFamily,
          weights: isPrimary ? ['700'] : ['400'],
        },
      },
      // All words use sentence-level timing to maintain layout stability
      context: {
        timing: {
          start: 0, // All words start together
          duration: params.totalDuration, // All words last for full sentence
        },
      },
      // Apply effect directly to this word
      effects: wordEffect ? [wordEffect] : [],
      childrenData: [],
    } as unknown as RenderableComponentData;

    wordComponents.push(wordComponent);
  }

  // Create container with word components
  const container: RenderableComponentData = {
    id: 'textbase-container',
    type: 'layout',
    componentId: 'BaseLayout',
    data: {
      containerProps: {
        className: 'absolute inset-0 flex items-center justify-center',
      },
    },
    context: {
      timing: {
        start: 0,
        duration: params.totalDuration,
      },
    },
    childrenData: wordComponents,
  } as unknown as RenderableComponentData;

  return {
    output: {
      childrenData: [container],
    },
    options: {
      attachedToId: 'BaseScene',
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'textbase',
  title: 'Text Base',
  description:
    'Renders a line of text horizontally with words displayed one after another. Uses primary font for one word and secondary font for the rest. Applies opacity effects via genericOpacityEffect preset.',
  type: 'predefined',
  presetType: 'children',
  tags: ['text', 'horizontal', 'layout', 'typography', 'effects'],
  dependencies: {
    presets: ['genericOpacityEffect', 'glowPulseTextEffect'],
  },
  defaultInputParams: {
    text: 'Exciled Prince',
    totalDuration: 5,
    primaryFont: 'Inter',
    secondaryFont: 'Inter',
    fontSize: 48,
    textColor: '#ffffff',
    effectType: 'opacity',
    impact: 1.0,
    glowColor: '#ffffff',
  },
};

export const textbasePreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
