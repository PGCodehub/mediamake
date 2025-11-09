import z from 'zod';
import { PresetMetadata, PresetOutput } from '../../types';
import { GenericEffectData } from '@microfox/remotion';

/**
 * Glow Pulse Text Effect Preset
 *
 * A generic preset that applies pulsing glow effects to target text components.
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
  glowColor: z.string().default('#ffffff').describe('Glow color in hex format'),
  effectId: z.string().optional().describe('Optional custom effect ID'),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
  props: any,
): PresetOutput => {
  // Calculate effect duration with impact modifier
  // Higher impact = longer pulse duration
  const adjustedDuration = params.effectDuration;

  // Calculate glow intensity based on impact
  // Higher impact = stronger glow (more blur radius and opacity)
  const baseGlowRadius = 8;
  const baseGlowOpacity = 0.7;
  const glowRadius = baseGlowRadius * params.impact;
  const glowOpacity = Math.min(1.0, baseGlowOpacity * params.impact);

  // Get RGB values from hex color
  const rgb = props.helpers.hexToRgb(params.glowColor) || {
    r: 255,
    g: 255,
    b: 255,
  };

  // Construct pulsing glow effect
  // The effect pulses from no glow -> full glow -> no glow
  const effectData: GenericEffectData = {
    type: 'ease-in-out',
    start: params.effectStart,
    duration: adjustedDuration,
    mode: 'provider',
    targetIds: [params.targetId],
    ranges: [
      {
        key: 'filter',
        val: `drop-shadow(0 0 ${glowRadius}px rgba(${rgb.r},${rgb.g},${rgb.b},0))`,
        prog: 0,
      },
      {
        key: 'filter',
        val: `drop-shadow(0 0 ${glowRadius}px rgba(${rgb.r},${rgb.g},${rgb.b},${glowOpacity}))`,
        prog: 0.5,
      },
      {
        key: 'filter',
        val: `drop-shadow(0 0 ${glowRadius}px rgba(${rgb.r},${rgb.g},${rgb.b},0))`,
        prog: 1,
      },
    ],
  };

  // Create single effect
  const effect = {
    id: params.effectId || `glow-pulse-${params.targetId}`,
    componentId: 'generic',
    data: effectData,
  };

  return {
    output: {
      childrenData: [
        {
          id: 'glow-pulse-effect-container',
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
  id: 'glowPulseTextEffect',
  title: 'Glow Pulse Text Effect',
  description:
    'A generic preset that applies pulsing glow effects to target text components',
  type: 'predefined',
  presetType: 'effects',
  tags: ['effects', 'glow', 'pulse', 'text', 'generic', 'internal'],
  dependencies: {
    helpers: ['hexToRgb'],
  },
  // Internal preset metadata - only used by other presets, not via insertPresetToComposition
  _internalPreset: true,
  _internalPresetOutput: 'effects',
  defaultInputParams: {
    targetId: 'word-1',
    effectStart: 0,
    effectDuration: 2,
    impact: 1.0,
    glowColor: '#ffffff',
  },
};

export const glowPulseTextEffectPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
