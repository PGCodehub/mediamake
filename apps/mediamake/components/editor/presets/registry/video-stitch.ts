import { InputCompositionProps } from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
import { CSSProperties } from 'react';
import { RenderableComponentData } from '@microfox/datamotion';

const presetParams = z.object({
  width: z.number().describe('Width of the video').default(1920),
  aspectRatio: z
    .string()
    .describe("Aspect ratio for the video (e.g., '16:9', '9:16', '1:1')"),
  videoUrls: z
    .array(z.string().url())
    .optional()
    .describe('Array of video URLs to stitch together in sequence'),
  videoItems: z
    .array(
      z.object({
        src: z.string().url(),
        fit: z
          .enum(['cover', 'contain', 'fill', 'none', 'scale-down'])
          .optional(),
        start: z.number().optional(),
        duration: z.number().optional(),
        style: z.any().optional(),
      }),
    )
    .optional()
    .describe('Array of video items to stitch together in sequence'),
  position: z
    .string()
    .describe('top/bottom/left/right/25% 75%/top 0 right 10px'),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  // Parse aspect ratio
  const [widthRatio, heightRatio] = params.aspectRatio.split(':').map(Number);
  const aspectRatio = widthRatio / heightRatio;

  // Calculate dimensions based on aspect ratio (using 1920 as base width)
  const baseWidth = aspectRatio > 1 ? 1920 : 1080;
  const baseHeight = Math.round(baseWidth / aspectRatio);

  // Create scenes for each video
  let scenes: RenderableComponentData[] = [];

  if (params.videoUrls) {
    scenes = params.videoUrls?.map((videoUrl, index) => ({
      id: `video-${index}`,
      componentId: 'VideoAtom',
      type: 'atom' as const,
      data: {
        src: videoUrl,
        className: 'w-full h-auto object-cover bg-black',
        style: {
          objectPosition: params.position,
        },
        fit: 'cover' as const,
      },
    }));
  }

  if (params.videoItems) {
    scenes = params.videoItems.map((videoItem, index) => ({
      id: `video-${index}`,
      componentId: 'VideoAtom',
      type: 'atom' as const,
      data: {
        src: videoItem.src,
        className: 'w-full h-auto object-cover',
        style: {
          objectPosition: params.position,
          ...videoItem.style,
        },
        fit: videoItem.fit ?? ('cover' as const),
        startFrom: videoItem.start,
      },
      context: {
        timing: {
          duration: videoItem.duration,
        },
      },
    }));
  }

  return {
    output: {
      config: {
        width: baseWidth,
        height: baseHeight,
        fps: 30,
        duration: 20,
        fitDurationTo: 'video-scene', // Fit duration to the first video, scenes will handle sequencing
      },
      childrenData: [
        {
          id: `video-scene`,
          componentId: 'BaseLayout',
          type: 'scene' as const,
          data: {},
          context: {},
          childrenData: scenes ?? [],
        },
      ],
    },
  };
};

const videoStitchPresetMetadata: PresetMetadata = {
  id: 'video-stitch-sequence',
  title: 'Video Stitch Sequence',
  description:
    'Stitches multiple videos together in sequence with customizable aspect ratio',
  type: 'predefined',
  presetType: 'full',
  tags: ['video', 'stitch', 'sequence', 'aspect-ratio'],
  defaultInputParams: {
    aspectRatio: '16:9',
    videoUrls: [
      'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    ],
  },
};

const videoStitchPresetFunction = presetExecution.toString();
const videoStitchPresetParams = z.toJSONSchema(presetParams);

export const videoStitchPreset = {
  metadata: videoStitchPresetMetadata,
  presetFunction: videoStitchPresetFunction,
  presetParams: videoStitchPresetParams,
};
