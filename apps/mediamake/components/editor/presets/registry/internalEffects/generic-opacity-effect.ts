import z from 'zod';
import { PresetMetadata, PresetOutput } from '../../types';
import { GenericEffectData } from '@microfox/remotion';

/**
 * Generic Opacity Effect Preset
 *
 * A generic preset that applies opacity fade-in effects to target components.
 * Constructs effects directly without using helper functions.
 */

const presetParams = z.object({
  targetId: z.string().describe('ID of the component to target'),
  effectStart: z.number().describe('Start time of the effect (relative)'),
  effectDuration: z.number().describe('Duration of the effect'),
  impact: z
    .number()
    .default(1.0)
    .describe('Impact modifier for effect intensity (0.1 - 3.0)'),
  effectId: z.string().optional().describe('Optional custom effect ID'),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
  props: any,
): PresetOutput => {
  // Calculate effect duration with impact modifier
  // Higher impact = longer fade-in duration
  const adjustedDuration = params.effectDuration;

  // Calculate fade-in progress point based on impact
  // Higher impact = slower fade-in (reaches full opacity later in the animation)
  // Lower impact = faster fade-in (reaches full opacity earlier)
  // Clamp between 0.05 and 0.8 for reasonable fade-in speeds
  const fadeInProgress = Math.max(0.05, Math.min(0.8, 0.3 / params.impact));

  // Construct opacity fade-in effect directly
  const effectData: GenericEffectData = {
    type: 'ease-out',
    start: params.effectStart,
    duration: adjustedDuration,
    mode: 'provider',
    targetIds: [params.targetId],
    ranges: [
      { key: 'opacity', val: 0, prog: 0 },
      { key: 'opacity', val: 1, prog: fadeInProgress },
      { key: 'opacity', val: 1, prog: 1 },
    ],
  };

  // Create single effect
  const effect = {
    id: params.effectId || `opacity-${params.targetId}`,
    componentId: 'generic',
    data: effectData,
  };

  return {
    output: {
      childrenData: [
        {
          id: 'opacity-effect-container',
          type: 'layout',
          componentId: 'BaseLayout',
          effects: [effect],
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
  id: 'genericOpacityEffect',
  title: 'Generic Opacity Effect',
  description:
    'A generic preset that applies opacity fade-in effects to target components',
  type: 'predefined',
  presetType: 'effects',
  tags: ['effects', 'opacity', 'fade', 'generic', 'internal'],
  dependencies: {},
  // Internal preset metadata - only used by other presets, not via insertPresetToComposition
  _internalPreset: true,
  _internalPresetOutput: 'effects',
  defaultInputParams: {
    targetId: 'word-1',
    effectStart: 0,
    effectDuration: 2,
    impact: 1.0,
  },
};

export const genericOpacityEffectPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
