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
import { PresetMetadata, PresetOutput } from '../types';

const presetParams = z.object({
  backgroundColor: z.string(),
  duration: z.number().optional(),
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
): PresetOutput => {
  const { backgroundColor, duration, fitDurationTo } = params;

  const [widthRatio, heightRatio] = params.aspectRatio
    ?.split(':')
    .map(Number) ?? [16, 9];
  const aspectRatio = widthRatio / heightRatio;

  // Calculate dimensions based on aspect ratio (using 1920 as base width)
  const baseWidth = aspectRatio > 1 ? 1920 : 1080;
  const baseHeight = Math.round(baseWidth / aspectRatio);

  const sceneDuration =
    params.clip?.duration && params.clip?.duration > 0
      ? params.clip.duration
      : duration && duration > 0
        ? duration
        : 20;
  const sceneFitDuration =
    params.clip?.duration && params.clip?.duration > 0
      ? {}
      : { fitDurationTo: 'BaseScene' };
  const fitDuarationToData =
    params.clip?.duration && params.clip?.duration > 0
      ? {}
      : { fitDurationTo: fitDurationTo ?? 'this' };

  const start = params.clip?.start ? -params.clip.start : 0;
  const durationData = params.clip ? {} : { duration: sceneDuration ?? 20 };
  return {
    output: {
      childrenData: [
        {
          id: 'BaseScene',
          componentId: 'BaseLayout',
          type: fitDurationTo ? 'layout' : ('scene' as const),
          data: {
            containerProps: {
              className: 'flex items-center justify-center absolute inset-0',
              style: {
                backgroundColor: backgroundColor,
              },
            },
            childrenProps: [],
          },
          context: {
            timing: {
              start: start,
              ...durationData,
              ...fitDuarationToData,
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
    },
    options: {
      clip: {
        start: params.clip?.start,
        duration: params.clip?.duration,
      },
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
    duration: 20,
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
