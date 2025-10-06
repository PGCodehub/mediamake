import {
  AudioAtomDataProps,
  InputCompositionProps,
  VideoAtomDataProps,
} from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
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
        startOffset: z.number().optional(),
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
    const startTime = isFadeIn
      ? 0
      : mediaItem.duration
        ? mediaItem.duration - effectDuration
        : 0;

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
  // Parse aspect ratio

  // Create scenes for each video
  const scenes = params.mediaItems
    .map((mediaItem, index) => {
      const sceneId = `${params.trackName ?? 'media-track'}-${mediaItem.type}-${index}`;

      // Create transition effects
      const fadeInEffects = createTransitionEffects(mediaItem, sceneId, true);
      const fadeOutEffects = createTransitionEffects(mediaItem, sceneId, false);
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
            className: 'w-full h-auto object-cover',
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
            startFrom: mediaItem.startOffset ?? 0,
          } as VideoAtomDataProps,
          context: {
            timing: {
              ...(mediaItem.duration ? { duration: mediaItem.duration } : {}),
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
              ...(mediaItem.startOffset
                ? { start: mediaItem.startOffset }
                : {}),
              ...(mediaItem.duration ? { duration: mediaItem.duration } : {}),
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
            startFrom: mediaItem.startOffset ?? 0,
          } as AudioAtomDataProps,
          context: {
            timing: {
              ...(mediaItem.duration ? { duration: mediaItem.duration } : {}),
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
    })
    .filter(scene => scene !== undefined);

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
          data: {},
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
      },
      {
        src: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        type: 'video',
        fit: 'cover',
        opacity: 1.0,
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
