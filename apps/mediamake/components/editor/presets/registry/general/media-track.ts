/**
 * Media Track Preset
 *
 * This preset creates a flexible media track system that can sequence, align, or randomly place
 * multiple media items (videos, images, or audio) in a composition. It supports:
 *
 * - **Sequence Mode**: Plays media items one after another in order
 * - **Aligned Mode**: Aligns all media items to a specific duration or reference
 * - **Random Mode**: Randomly places media items within a specified duration
 *
 * Features:
 * - Time range selection: Specify exact time ranges (e.g., "0:10-2:30") for each media item
 * - Rich transitions: Fade in/out, slide, scale, shake, and blur effects
 * - Media controls: Volume, playback rate, looping, muting, opacity, blend modes
 * - Flexible fitting: Cover, contain, fill, none, or scale-down options
 * - Multiple media types: Supports video, image, and audio atoms
 *
 * Use cases:
 * - Creating video montages with multiple clips
 * - Building dynamic media sequences with transitions
 * - Creating B-roll tracks that sync with other content
 * - Layering multiple media sources with different timings
 */

import {
  AudioAtomDataProps,
  InputCompositionProps,
  VideoAtomDataProps,
} from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../../types';
import { GenericEffectData } from '@microfox/remotion';

// Extended effect data type for shake effects
interface ShakeEffectData extends GenericEffectData {
  amplitude?: number;
  frequency?: number;
  decay?: boolean;
  axis?: 'x' | 'y' | 'both';
}

const presetParams = z.object({
  mediaItems: z
    .array(
      z.object({
        src: z.string().url(),
        type: z.enum(['video', 'image', 'audio']),
        fit: z
          .enum(['cover', 'contain', 'fill', 'none', 'scale-down'])
          .optional(),
        startCropVideo: z.number().optional(),
        ranges: z
          .array(
            z
              .string()
              .describe(
                'Time ranges to make the video appear until 0:10-2:30 will make it appear from context start: 10, duration: 140',
              ),
          )
          .optional(),
        duration: z.number().optional(),
        loop: z.boolean().optional(),
        blendMode: z
          .enum([
            'screen',
            'multiply',
            'overlay',
            'darken',
            'lighten',
            'color-dodge',
            'color-burn',
            'hard-light',
            'soft-light',
            'difference',
            'exclusion',
            'hue',
            'saturation',
            'color',
            'luminosity',
          ])
          .optional(),
        mute: z.boolean().optional(),
        playbackRate: z.number().optional(),
        volume: z.number().optional(),
        fitDurationTo: z.string().optional(),
        opacity: z.number().min(0).max(1).optional(),
        fadeInTransition: z
          .enum([
            'none',
            'opacity',
            'slide-in-right',
            'slide-in-left',
            'slide-in-top',
            'slide-in-bottom',
            'scale-in',
            'scale-out',
            'shake-in',
            'blur-in',
          ])
          .optional(),
        fadeInDuration: z.number().optional(),
        fadeOutTransition: z
          .enum([
            'none',
            'opacity',
            'slide-out-right',
            'slide-out-left',
            'slide-out-top',
            'slide-out-bottom',
            'scale-out',
            'shake-out',
            'blur-out',
          ])
          .optional(),
        fadeOutDuration: z.number().optional(),
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
  trackStartOffset: z
    .number()
    .describe('Start offset of the track in seconds')
    .optional(),
  trackFitDurationTo: z
    .string()
    .describe('Fit duration to the track ( only for aligned/random tracks )')
    .optional(),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
  props: {
    config: InputCompositionProps['config'];
    clip?: { start?: number; duration?: number };
  },
): PresetOutput => {
  // Get the base scene start offset from the clip information
  const baseSceneStartOffset = props.clip?.start ?? 0;

  // Helper function to create transition effects
  const createTransitionEffects = (
    mediaItem: z.infer<typeof presetParams>['mediaItems'][0],
    sceneId: string,
    isFadeIn: boolean = true,
    timeRangeOffset: number = 0,
    timeRangeDuration?: number,
  ): (GenericEffectData | ShakeEffectData)[] => {
    const effects: (GenericEffectData | ShakeEffectData)[] = [];
    const transition = isFadeIn
      ? mediaItem.fadeInTransition
      : mediaItem.fadeOutTransition;
    const duration = isFadeIn
      ? mediaItem.fadeInDuration
      : mediaItem.fadeOutDuration;

    if (!transition || transition === 'none') return effects;

    const effectDuration = duration || (isFadeIn ? 1.5 : 1); // Default durations
    const mediaDuration = timeRangeDuration || mediaItem.duration || 0;
    const startTime = isFadeIn ? 0 : mediaDuration - effectDuration;

    // Base opacity effect for all transitions (including pure opacity)
    effects.push({
      start: startTime,
      duration: effectDuration,
      mode: 'provider',
      targetIds: [sceneId],
      type: 'ease-in-out',
      ranges: [
        {
          key: 'opacity',
          val: isFadeIn ? 0 : (mediaItem.opacity ?? 1),
          prog: 0,
        },
        {
          key: 'opacity',
          val: isFadeIn ? (mediaItem.opacity ?? 1) : 0,
          prog: 1,
        },
      ],
    });

    // Slide effects
    if (transition.includes('slide-in') || transition.includes('slide-out')) {
      const direction = transition.split('-')[2]; // right, left, top, bottom
      const isSlideIn = transition.includes('slide-in');

      switch (direction) {
        case 'right':
          effects.push({
            start: startTime,
            duration: effectDuration * 0.8, // Faster than opacity
            mode: 'provider',
            targetIds: [sceneId],
            type: 'ease-out',
            ranges: [
              {
                key: 'translateX',
                val: isSlideIn ? '100px' : '-100px',
                prog: 0,
              },
              {
                key: 'translateX',
                val: '0px',
                prog: 1,
              },
            ],
          });
          break;
        case 'left':
          effects.push({
            start: startTime,
            duration: effectDuration * 0.8,
            mode: 'provider',
            targetIds: [sceneId],
            type: 'ease-out',
            ranges: [
              {
                key: 'translateX',
                val: isSlideIn ? '-100px' : '100px',
                prog: 0,
              },
              {
                key: 'translateX',
                val: '0px',
                prog: 1,
              },
            ],
          });
          break;
        case 'top':
          effects.push({
            start: startTime,
            duration: effectDuration * 0.8,
            mode: 'provider',
            targetIds: [sceneId],
            type: 'ease-out',
            ranges: [
              {
                key: 'translateY',
                val: isSlideIn ? '-100px' : '100px',
                prog: 0,
              },
              {
                key: 'translateY',
                val: '0px',
                prog: 1,
              },
            ],
          });
          break;
        case 'bottom':
          effects.push({
            start: startTime,
            duration: effectDuration * 0.8,
            mode: 'provider',
            targetIds: [sceneId],
            type: 'ease-out',
            ranges: [
              {
                key: 'translateY',
                val: isSlideIn ? '100px' : '-100px',
                prog: 0,
              },
              {
                key: 'translateY',
                val: '0px',
                prog: 1,
              },
            ],
          });
          break;
      }
    }

    // Scale effects
    if (transition === 'scale-in') {
      effects.push({
        start: startTime,
        duration: effectDuration,
        mode: 'provider',
        targetIds: [sceneId],
        type: 'ease-out',
        ranges: [
          {
            key: 'scale',
            val: 0.8,
            prog: 0,
          },
          {
            key: 'scale',
            val: 1,
            prog: 1,
          },
        ],
      });
    }

    if (transition === 'scale-out') {
      effects.push({
        start: startTime,
        duration: effectDuration,
        mode: 'provider',
        targetIds: [sceneId],
        type: 'ease-in',
        ranges: [
          {
            key: 'scale',
            val: 1,
            prog: 0,
          },
          {
            key: 'scale',
            val: 1.1,
            prog: 1,
          },
        ],
      });
    }

    // Blur effects
    if (transition === 'blur-in') {
      effects.push({
        start: startTime,
        duration: effectDuration,
        mode: 'provider',
        targetIds: [sceneId],
        type: 'ease-out',
        ranges: [
          {
            key: 'blur',
            val: '10px',
            prog: 0,
          },
          {
            key: 'blur',
            val: '0px',
            prog: 1,
          },
        ],
      });
    }

    if (transition === 'blur-out') {
      effects.push({
        start: startTime,
        duration: effectDuration,
        mode: 'provider',
        targetIds: [sceneId],
        type: 'ease-in',
        ranges: [
          {
            key: 'blur',
            val: '0px',
            prog: 0,
          },
          {
            key: 'blur',
            val: '10px',
            prog: 1,
          },
        ],
      });
    }

    // Shake effects - use shake component instead of generic
    if (transition === 'shake-in') {
      effects.push({
        start: startTime,
        duration: effectDuration,
        mode: 'provider',
        targetIds: [sceneId],
        type: 'linear',
        amplitude: 15,
        frequency: 0.2,
        decay: true,
        axis: 'both',
      } as ShakeEffectData);
    }

    if (transition === 'shake-out') {
      effects.push({
        start: startTime,
        duration: effectDuration,
        mode: 'provider',
        targetIds: [sceneId],
        type: 'linear',
        amplitude: 10,
        frequency: 0.3,
        decay: false,
        axis: 'both',
      } as ShakeEffectData);
    }

    return effects;
  };
  // Helper function to parse time range (MM:SS-MM:SS format)
  const parseTimeRange = (
    range: string,
  ): { start: number; duration: number } | null => {
    if (!range) return null;

    const match = range.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const startMinutes = parseInt(match[1], 10);
    const startSeconds = parseInt(match[2], 10);
    const endMinutes = parseInt(match[3], 10);
    const endSeconds = parseInt(match[4], 10);

    const startTime = startMinutes * 60 + startSeconds;
    const endTime = endMinutes * 60 + endSeconds;
    const duration = endTime - startTime;

    return {
      start: startTime,
      duration: duration,
    };
  };

  // Create scenes for each video
  const scenes = params.mediaItems
    .flatMap((mediaItem, index) => {
      // If ranges array is provided, create a scene for each range
      const ranges = mediaItem.ranges || [];

      // If no ranges provided, create a single scene with no time range
      if (ranges.length === 0) {
        return [createMediaScene(mediaItem, index, 0, null)];
      }

      // Create a scene for each range
      return ranges.map((range, rangeIndex) => {
        const timeRange = parseTimeRange(range);
        return createMediaScene(mediaItem, index, rangeIndex, timeRange);
      });
    })
    .filter(scene => scene !== undefined);

  // Helper function to create a media scene
  function createMediaScene(
    mediaItem: z.infer<typeof presetParams>['mediaItems'][0],
    index: number,
    rangeIndex: number,
    timeRange: { start: number; duration: number } | null,
  ) {
    const sceneId = `${params.trackName ?? 'media-track'}-${mediaItem.type}-${index}${rangeIndex > 0 ? `-range-${rangeIndex}` : ''}`;

    // Create transition effects
    const timeRangeOffset = timeRange ? timeRange.start : 0;
    const timeRangeDuration = timeRange ? timeRange.duration : undefined;
    const fadeInEffects = createTransitionEffects(
      mediaItem,
      sceneId,
      true,
      timeRangeOffset,
      timeRangeDuration,
    );
    const fadeOutEffects = createTransitionEffects(
      mediaItem,
      sceneId,
      false,
      timeRangeOffset,
      timeRangeDuration,
    );
    const allEffects = [...fadeInEffects, ...fadeOutEffects];

    let mediaType = mediaItem.type;

    if (!mediaType) {
      if (
        mediaItem.src.endsWith('.png') ||
        mediaItem.src.endsWith('.jpg') ||
        mediaItem.src.endsWith('.jpeg') ||
        mediaItem.src.endsWith('.gif') ||
        mediaItem.src.endsWith('.webp') ||
        mediaItem.src.endsWith('.svg') ||
        mediaItem.src.endsWith('.avif')
      ) {
        mediaType = 'image';
      } else if (
        mediaItem.src.endsWith('.mp4') ||
        mediaItem.src.endsWith('.webm') ||
        mediaItem.src.endsWith('.mov') ||
        mediaItem.src.endsWith('.avi') ||
        mediaItem.src.endsWith('.mkv') ||
        mediaItem.src.endsWith('.flv') ||
        mediaItem.src.endsWith('.wmv')
      ) {
        mediaType = 'video';
      } else {
        mediaType = 'audio';
      }
    }

    if (mediaType === 'video') {
      return {
        id: sceneId,
        componentId: 'VideoAtom',
        type: 'atom' as const,
        data: {
          src: mediaItem.src,
          className:
            mediaItem.fit === 'cover'
              ? 'w-full h-full object-cover'
              : 'w-full h-auto',
          fit: mediaItem.fit ?? ('cover' as const),
          loop: mediaItem.loop ?? false,
          muted: mediaItem.mute ?? false,
          volume: mediaItem.volume ?? 1,
          playbackRate: mediaItem.playbackRate ?? 1,
          style: {
            ...(mediaItem.blendMode
              ? { mixBlendMode: mediaItem.blendMode }
              : {}),
            ...(mediaItem.opacity !== undefined
              ? { opacity: mediaItem.opacity }
              : {}),
          },
          startFrom: mediaItem.startCropVideo ?? 0,
          ...(timeRange &&
            !mediaItem.duration && {
              srcDuration: timeRange.duration,
            }),
        } as VideoAtomDataProps,
        context: {
          timing: {
            ...(mediaItem.duration && !timeRange
              ? { duration: mediaItem.duration }
              : {}),
            ...(mediaItem.fitDurationTo
              ? { fitDurationTo: mediaItem.fitDurationTo }
              : {}),
            ...(timeRange
              ? {
                  start: timeRange.start,
                  duration: timeRange.duration,
                }
              : {}),
          },
        },
        effects: allEffects.map((effect, effectIndex) => {
          // Use shake component for shake effects
          const isShakeEffect =
            'amplitude' in effect && effect.amplitude !== undefined;
          return {
            id: `${sceneId}-effect-${effectIndex}`,
            componentId: isShakeEffect ? 'shake' : 'generic',
            data: effect,
          };
        }),
      };
    } else if (mediaType === 'image') {
      return {
        id: sceneId,
        componentId: 'ImageAtom',
        type: 'atom' as const,
        data: {
          src: mediaItem.src,
          className: 'w-full h-auto object-cover',
          fit: mediaItem.fit ?? ('cover' as const),
          style: {
            ...(mediaItem.opacity !== undefined
              ? { opacity: mediaItem.opacity }
              : {}),
          },
        },
        context: {
          timing: {
            ...(timeRange
              ? {
                  start: timeRange.start,
                  duration: timeRange.duration,
                }
              : {}),
            ...(mediaItem.startCropVideo && !timeRange
              ? { start: mediaItem.startCropVideo }
              : {}),
            ...(mediaItem.duration && !timeRange
              ? { duration: mediaItem.duration }
              : {}),
            ...(mediaItem.fitDurationTo
              ? { fitDurationTo: mediaItem.fitDurationTo }
              : {}),
          },
        },
        effects: allEffects.map((effect, effectIndex) => {
          // Use shake component for shake effects
          const isShakeEffect =
            'amplitude' in effect && effect.amplitude !== undefined;
          return {
            id: `${sceneId}-effect-${effectIndex}`,
            componentId: isShakeEffect ? 'shake' : 'generic',
            data: effect,
          };
        }),
      };
    } else if (mediaType === 'audio') {
      return {
        id: sceneId,
        componentId: 'AudioAtom',
        type: 'atom' as const,
        data: {
          src: mediaItem.src,
          className: 'w-full h-auto object-cover',
          fit: mediaItem.fit ?? ('cover' as const),
          volume: mediaItem.volume ?? 1,
          startFrom: mediaItem.startCropVideo ?? 0,
        } as AudioAtomDataProps,
        context: {
          timing: {
            ...(timeRange
              ? {
                  start: timeRange.start,
                  duration: timeRange.duration,
                }
              : {}),
            ...(mediaItem.duration && !timeRange
              ? { duration: mediaItem.duration }
              : {}),
          },
        },
        effects: allEffects.map((effect, effectIndex) => {
          // Use shake component for shake effects
          const isShakeEffect =
            'amplitude' in effect && effect.amplitude !== undefined;
          return {
            id: `${sceneId}-effect-${effectIndex}`,
            componentId: isShakeEffect ? 'shake' : 'generic',
            data: effect,
          };
        }),
      };
    }
  }

  return {
    output: {
      config: {
        duration: 20,
      },
      childrenData: [
        {
          id: `${params.trackName}`,
          componentId: 'BaseLayout',
          type:
            params.trackType === 'aligned' || params.trackType === 'random'
              ? 'layout'
              : ('scene' as const),
          data: {
            containerProps: {
              className: 'absolute inset-0',
            },
          },
          context: {
            timing:
              params.trackType === 'aligned' || params.trackType === 'random'
                ? {
                    start: params.trackStartOffset ?? 0,
                    duration: params.trackDuration,
                    fitDurationTo: params.trackFitDurationTo ?? 'this',
                  }
                : {
                    start: params.trackStartOffset ?? 0,
                  },
          },
          childrenData: scenes ?? [],
        },
      ],
    },
    options: {
      attachedToId: `BaseScene`,
      attachedContainers: [
        {
          className: 'absolute inset-0',
        },
      ],
    },
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
        opacity: 0.8,
        ranges: ['0:10-2:30'],
      },
      {
        src: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        type: 'video',
        fit: 'cover',
        opacity: 1.0,
        ranges: ['2:30-5:00', '6:00-8:30'],
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
