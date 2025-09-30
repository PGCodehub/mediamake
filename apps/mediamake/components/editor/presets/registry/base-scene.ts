import {
  AudioAtomDataProps,
  InputCompositionProps,
  PanEffectData,
  TextAtomData,
  WaveformConfig,
  WaveformHistogramRangedDataProps,
  ZoomEffectData,
} from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata } from '../types';

const presetParams = z.object({
  backgroundColor: z.string(),
  duaration: z.number().optional(),
  fitDurationTo: z.string().optional(),
  aspectRatio: z.string().optional(),
  clip: z
    .object({
      start: z.number().optional(),
      duration: z.number().optional(),
    })
    .optional(),
});
//src: https://cdn1.suno.ai/6aded313-9bd5-4c8b-bb6f-fd5f158642e3.m4a
const presetExecution = (
  params: z.infer<typeof presetParams>,
): Partial<InputCompositionProps> => {
  const { backgroundColor, duaration, fitDurationTo } = params;

  const [widthRatio, heightRatio] = params.aspectRatio
    ?.split(':')
    .map(Number) ?? [16, 9];
  const aspectRatio = widthRatio / heightRatio;

  // Calculate dimensions based on aspect ratio (using 1920 as base width)
  const baseWidth = aspectRatio > 1 ? 1920 : 1080;
  const baseHeight = Math.round(baseWidth / aspectRatio);

  const sceneDuration = params.clip?.duration ?? duaration ?? 20;
  const sceneFitDuration = !params.clip ? { fitDurationTo: 'BaseScene' } : {};

  const start = params.clip?.start ? -params.clip.start : 0;
  const duration = params.clip ? {} : { duration: 20 };
  return {
    childrenData: [
      {
        id: 'BaseScene',
        componentId: 'BaseLayout',
        type: fitDurationTo ? 'layout' : ('scene' as const),
        data: {
          containerProps: {
            className: 'flex items-center justify-center bg-black',
            style: {
              backgroundColor: backgroundColor,
            },
          },
          childrenProps: [],
        },
        context: {
          timing: {
            start: start,
            ...duration,
            fitDurationTo: fitDurationTo ?? 'this',
          },
        },
        childrenData: [],
      },
    ],
    config: {
      width: baseWidth,
      height: baseHeight,
      fps: 30,
      duration: sceneDuration ?? 20,
      ...sceneFitDuration,
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'base-scene',
  title: 'Base Scene',
  description: 'A base scene with a background color',
  type: 'predefined',
  presetType: 'full',
  tags: ['base', 'scene'],
  defaultInputParams: {
    backgroundColor: 'black',
    duaration: 20,
    fitDurationTo: 'BaseScene',
  },
};

const presetFunction = presetExecution.toString();
const presetParamsSchema = z.toJSONSchema(presetParams);

const baseScenePreset = {
  metadata: presetMetadata,
  presetFunction: presetFunction,
  presetParams: presetParamsSchema,
};

export { baseScenePreset };
