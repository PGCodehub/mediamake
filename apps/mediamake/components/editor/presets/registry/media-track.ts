import { InputCompositionProps } from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata } from '../types';

const presetParams = z.object({
  mediaItems: z
    .array(
      z.object({
        src: z.string().url(),
        type: z.enum(['video', 'image', 'audio']),
        fit: z
          .enum(['cover', 'contain', 'fill', 'none', 'scale-down'])
          .optional(),
        duration: z.number().optional(),
      }),
    )
    .min(1)
    .describe('Array of video URLs to stitch together in sequence'),
  trackName: z.string().describe('Name of the track ( used for the ID )'),
  trackType: z.enum(['sequence', 'aligned', 'random']).default('sequence'),
  trackDuration: z
    .number()
    .describe('Duration of the track in seconds ( only for random tracks )')
    .default(20)
    .optional(),
  trackFitDurationTo: z
    .string()
    .describe('Fit duration to the track ( only for aligned/random tracks )')
    .optional(),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): Partial<InputCompositionProps> => {
  // Parse aspect ratio

  // Create scenes for each video
  const scenes = params.mediaItems
    .map((mediaItem, index) => {
      if (mediaItem.type === 'video') {
        return {
          id: `video-${index}`,
          componentId: 'VideoAtom',
          type: 'atom' as const,
          data: {
            src: mediaItem.src,
            className: 'w-full h-auto object-cover bg-black',
            fit: mediaItem.fit ?? ('cover' as const),
          },
          context: {
            timing: {
              ...(mediaItem.duration ? { duration: mediaItem.duration } : {}),
            },
          },
        };
      } else if (mediaItem.type === 'image') {
        return {
          id: `image-${index}`,
          componentId: 'ImageAtom',
          type: 'atom' as const,
          data: {
            src: mediaItem.src,
            className: 'w-full h-auto object-cover bg-black',
            fit: mediaItem.fit ?? ('cover' as const),
          },
          context: {
            timing: {
              duration: mediaItem.duration ?? 5,
            },
          },
        };
      } else if (mediaItem.type === 'audio') {
        return {
          id: `audio-${mediaItem.src}`,
          componentId: 'AudioAtom',
          type: 'atom' as const,
          data: {
            src: mediaItem.src,
            className: 'w-full h-auto object-cover bg-black',
            fit: mediaItem.fit ?? ('cover' as const),
          },
          context: {
            timing: {
              ...(mediaItem.duration ? { duration: mediaItem.duration } : {}),
            },
          },
        };
      }
    })
    .filter(scene => scene !== undefined);

  return {
    config: {
      duration: 20,
    },
    childrenData: [
      {
        // If AudioScene is already in the composition, we need to append this as children data, as this is children data type of preset
        // if not present, then it will append to the first node in base childrenData.
        id: 'BaseScene',
        componentId: 'BaseLayout',
        type: 'layout',
        data: {
          childrenProps: [
            {
              className: `absolute inset-0`,
            },
          ],
        },
        childrenData: [
          {
            id: `${params.trackName}`,
            componentId: 'BaseLayout',
            type:
              params.trackType === 'aligned' || params.trackType === 'random'
                ? 'layout'
                : ('scene' as const),
            data: {},
            context: {
              timing:
                params.trackType === 'aligned' || params.trackType === 'random'
                  ? {
                      start: 0,
                      duration: params.trackDuration,
                      fitDurationTo: params.trackFitDurationTo ?? 'this',
                    }
                  : {},
            },
            childrenData: scenes ?? [],
          },
        ],
      },
    ],
  };
};

const _presetMetadata: PresetMetadata = {
  id: 'media-track',
  title: 'Media Track',
  description:
    'Tracks multiple media items together in sequence with customizable aspect ratio',
  type: 'predefined',
  presetType: 'children',
  tags: ['media', 'track', 'sequence', 'aspect-ratio'],
  defaultInputParams: {
    mediaItems: [
      {
        src: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        type: 'video',
        fit: 'cover',
      },
      {
        src: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        type: 'video',
        fit: 'cover',
      },
    ],
    trackName: 'media-track',
    trackType: 'sequence',
  },
};

const _presetExecution = presetExecution.toString();
const _presetParams = z.toJSONSchema(presetParams);

export const mediaTrackPreset = {
  metadata: _presetMetadata,
  presetFunction: _presetExecution,
  presetParams: _presetParams,
};
