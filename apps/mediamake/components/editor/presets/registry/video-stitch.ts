import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
import { BaseEffect, RenderableComponentData } from '@microfox/datamotion';
import { InputCompositionProps, GenericEffectData } from '@microfox/remotion';

interface ShakeEffectData extends GenericEffectData {
  amplitude?: number;
  frequency?: number;
  decay?: boolean;
  axis?: 'x' | 'y' | 'both';
}

const videoItemSchema = z.object({
  src: z.string().url(),
  fit: z.enum(['cover', 'contain', 'fill', 'none', 'scale-down']).optional(),
  start: z.number().optional(),
  duration: z.number().optional(),
  style: z.any().optional(),
  transitions: z.object({
    fadeInTransition: z
      .enum([
        'none',
        'opacity',
        'slide-in-right',
        'slide-in-left',
        'slide-in-top',
        'slide-in-bottom',
        'scale-in',
        'blur-in',
        'shake-in',
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
        'blur-out',
        'shake-out',
      ])
      .optional(),
    fadeOutDuration: z.number().optional(),
  }),
});

const presetParams = z.object({
  width: z.number().describe('Width of the video').default(1920),
  aspectRatio: z
    .string()
    .describe("Aspect ratio for the video (e.g., '16:9', '9:16', '1:1')"),
  videoUrls: z
    .array(z.string().url())
    .optional()
    .describe('Array of video URLs to stitch together in sequence (no transitions)'),
  videoItems: z.array(videoItemSchema).optional(),
  position: z
    .string()
    .describe('top/bottom/left/right/25% 75%/top 0 right 10px'),
});

const presetExecution = async (
  params: z.infer<typeof presetParams>,
  props: {
    config: InputCompositionProps['config'];
    fetcher: (url: string, data: any) => Promise<any>;
  },
): Promise<PresetOutput> => {
  // Parse aspect ratio
  const [widthRatio, heightRatio] = params.aspectRatio.split(':').map(Number);
  const aspectRatio = widthRatio / heightRatio;

  // Calculate dimensions based on aspect ratio (using 1920 as base width)
  const baseWidth = aspectRatio > 1 ? 1920 : 1080;
  const baseHeight = Math.round(baseWidth / aspectRatio);


  const createTransitionEffects = (
    videoItem: z.infer<typeof videoItemSchema>,
    videoId: string,
    isFadeIn: boolean = true,
  ): BaseEffect[] => {
    const effects: (GenericEffectData | ShakeEffectData)[] = [];
    const { transitions, style } = videoItem;
    const transition = isFadeIn
      ? transitions.fadeInTransition
      : transitions.fadeOutTransition;
    const effectDuration = isFadeIn
      ? transitions.fadeInDuration
      : transitions.fadeOutDuration;

    // The duration of the video item itself. If not present, we can't do a fade-out.
    const videoDuration = videoItem.duration;

    if (
      !transition ||
      transition === 'none' ||
      (!isFadeIn && !videoDuration) // Cannot do fade-out without a duration
    ) {
      return [];
    }

    const transitionDuration = effectDuration || 1.0;
    const totalDuration = videoDuration || 5; // Use default if duration is not set for timing calcs

    const startTime = isFadeIn
      ? 0
      : Math.max(0, totalDuration - transitionDuration);


    if (
      transition === 'opacity' ||
      transition.includes('slide') ||
      transition.includes('scale') ||
      transition.includes('blur')
    ) {
      effects.push({
        start: startTime,
        duration: transitionDuration,
        mode: 'provider',
        targetIds: [videoId],
        type: 'ease-in-out',
        ranges: [
          { key: 'opacity', val: isFadeIn ? 0 : 1, prog: 0 },
          { key: 'opacity', val: isFadeIn ? 1 : 0, prog: 1 },
        ],
      });
    }

    if (transition.includes('slide-in') || transition.includes('slide-out')) {
      const direction = transition.split('-')[2];
      const isSlideIn = transition.includes('slide-in');

      if (direction === 'right' || direction === 'left') {
        effects.push({
          start: startTime,
          duration: transitionDuration * 0.8,
          mode: 'provider',
          targetIds: [videoId],
          type: isSlideIn ? 'ease-out' : 'ease-in',
          ranges: [
            {
              key: 'translateX',
              val: isSlideIn
                ? direction === 'right'
                  ? '100px'
                  : '-100px'
                : '0px',
              prog: 0,
            },
            {
              key: 'translateX',
              val: isSlideIn
                ? '0px'
                : direction === 'right'
                  ? '-100px'
                  : '100px',
              prog: 1,
            },
          ],
        });
      }
    }

    if (transition === 'scale-in') {
      effects.push({
        start: startTime,
        duration: transitionDuration,
        mode: 'provider',
        targetIds: [videoId],
        type: 'ease-out',
        ranges: [
          { key: 'scale', val: 0.8, prog: 0 },
          { key: 'scale', val: 1, prog: 1 },
        ],
      });
    }

    if (transition === 'scale-out') {
      effects.push({
        start: startTime,
        duration: transitionDuration,
        mode: 'provider',
        targetIds: [videoId],
        type: 'ease-in',
        ranges: [
          { key: 'scale', val: 1, prog: 0 },
          { key: 'scale', val: 1.1, prog: 1 },
        ],
      });
    }

    if (transition === 'blur-in') {
      effects.push({
        start: startTime,
        duration: transitionDuration,
        mode: 'provider',
        targetIds: [videoId],
        type: 'ease-out',
        ranges: [
          { key: 'blur', val: '10px', prog: 0 },
          { key: 'blur', val: '0px', prog: 1 },
        ],
      });
    }

    if (transition === 'blur-out') {
      effects.push({
        start: startTime,
        duration: transitionDuration,
        mode: 'provider',
        targetIds: [videoId],
        type: 'ease-in',
        ranges: [
          { key: 'blur', val: '0px', prog: 0 },
          { key: 'blur', val: '10px', prog: 1 },
        ],
      });
    }

    if (transition === 'shake-in') {
      effects.push({
        start: startTime,
        duration: transitionDuration,
        mode: 'provider',
        targetIds: [videoId],
        type: 'linear',
        amplitude: 3,
        frequency: 1,
        decay: true,
        axis: 'both',
      } as ShakeEffectData);
      effects.push({
        start: startTime,
        duration: 0.5,
        mode: 'provider',
        targetIds: [videoId],
        type: 'ease-in-out',
        ranges: [
          {
            key: 'opacity',
            val: isFadeIn ? 0 : 1,
            prog: 0,
          },
          {
            key: 'opacity',
            val: isFadeIn ? 1 : 0,
            prog: 1,
          },
        ],
      });
    }

    if (transition === 'shake-out') {
      effects.push({
        start: startTime,
        duration: transitionDuration,
        mode: 'provider',
        targetIds: [videoId],
        type: 'linear',
        amplitude: 10,
        frequency: 1,
        decay: false,
        axis: 'both',
      } as ShakeEffectData);
    }

    return effects.map((effect) => {
      const isShakeEffect = 'amplitude' in effect;
      return {
        id: `${videoId}-transition-${isFadeIn ? 'in' : 'out'
          }-${transition}`,
        componentId: isShakeEffect ? 'shake' : 'generic',
        data: effect,
      };
    });
  };

  let scenes: RenderableComponentData[] = [];
  let cumulativeDuration = 0;

  if (params.videoItems && params.videoItems.length > 0) {
    scenes = [];
    for (const [index, videoItem] of params.videoItems.entries()) {
      let duration: number;
      if (videoItem.duration !== undefined) {
        duration = videoItem.duration;
      } else {
        try {
          const mediaInfo = await props.fetcher('/api/media-info', {
            src: videoItem.src,
          });
          duration = mediaInfo.duration ?? 5;
        } catch (error) {
          console.error(`Failed to fetch duration for ${videoItem.src}`, error);
          duration = 5;
        }
      }

      const videoId = `video-item-${index}`; // Use index for a clean, unique ID
      const videoStart = videoItem.start ?? cumulativeDuration;

      console.log(
        `Processing video: ${videoId}`,
        `start: ${videoStart}`,
        `duration: ${duration}`,
      );

      const itemWithDuration = { ...videoItem, duration };

      const effects: BaseEffect[] = [
        ...createTransitionEffects(itemWithDuration, videoId, true),
        ...createTransitionEffects(itemWithDuration, videoId, false),
      ];

      const videoAtom: RenderableComponentData = {
        id: videoId,
        componentId: 'VideoAtom',
        type: 'atom' as const,
        data: {
          src: videoItem.src,
          className: 'w-full h-full object-cover',
          style: {
            objectPosition: params.position,
            ...videoItem.style,
          },
          fit: videoItem.fit ?? ('cover' as const),
          start: videoStart,
          duration: duration,
        },
        effects,
      };
      scenes.push(videoAtom);
      cumulativeDuration += duration;
    }
  } else if (params.videoUrls && params.videoUrls.length > 0) {
    scenes = [];
    for (const [index, url] of params.videoUrls.entries()) {
      const videoAtom: RenderableComponentData = {
        id: `video-${index}`,
        componentId: 'VideoAtom',
        type: 'atom' as const,
        data: {
          src: url,
          className: 'w-full h-auto object-cover bg-black',
          style: {
            objectPosition: params.position,
          },
          fit: 'cover' as const,
        },
      };

      scenes.push(videoAtom);
    }
  }

  return {
    output: {
      config: {
        width: baseWidth,
        height: baseHeight,
        fps: 30,
        duration: cumulativeDuration || 20,
        fitDurationTo: params?.videoItems ? undefined : 'video-scene', // Let the calculated duration take precedence
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
    'Stitches multiple videos together in sequence with customizable aspect ratio and transitions',
  type: 'predefined',
  presetType: 'full',
  tags: ['video', 'stitch', 'sequence', 'aspect-ratio', 'transition'],
  defaultInputParams: {
    aspectRatio: '16:9',
    videoItems: [
      {
        src: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        // duration: 5, // Example of omitting duration
        // start: 0,
        transitions: {
          fadeInTransition: 'slide-in-left',
          fadeInDuration: 1,
          fadeOutTransition: 'opacity',
          fadeOutDuration: 1,
        },
      },
      {
        src: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        duration: 8, // Example of providing duration
        // start: 5,
        transitions: {
          fadeInTransition: 'opacity',
          fadeInDuration: 1,
          fadeOutTransition: 'slide-out-right',
          fadeOutDuration: 1,
        },
      },
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
