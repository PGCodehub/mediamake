import {
  GenericEffectData,
  InputCompositionProps,
  VideoAtomDataProps,
  PanEffectData,
} from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata } from '../types';
import { Layout } from 'lucide-react';

const presetParams = z.object({
  imageUrl: z.string().describe('Background image URL'),
  videoUrl: z.string().optional().describe('Background video URL'),
  titleText: z.string().describe("Main title text (e.g., 'Get into Zone')"),
  keystoneText: z.string().describe("Keystone text (e.g., 'keystone')"),
  titleColor: z.string().optional().describe('Title text color (hex)'),
  titleFont: z
    .string()
    .optional()
    .describe('Title font family (e.g., "Roboto:600:italic" or "BebasNeue")'),
  keystoneColor: z.string().optional().describe('Keystone text color (hex)'),
  keystoneFont: z
    .string()
    .optional()
    .describe(
      'Keystone font family (e.g., "Roboto:600:italic" or "BebasNeue")',
    ),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): Partial<InputCompositionProps> => {
  // Parse aspect ratio

  // 1st slowed out video track.
  const video = {
    id: `video-1-alkefn`,
    componentId: 'VideoAtom',
    type: 'atom' as const,
    effects: [
      {
        id: `video-1-effects-alkefn`,
        componentId: 'generic',
        data: {
          start: 0,
          duration: 1,
          mode: 'provider',
          targetIds: ['video-1-alkefn'],
          type: 'ease-in-out',
          ranges: [
            {
              key: 'opacity',
              val: 0,
              prog: 0,
            },
            {
              key: 'opacity',
              val: 0.35,
              prog: 1,
            },
          ],
        } as GenericEffectData,
      },
    ],
    data: {
      src:
        params.videoUrl ||
        'https://aidev.blr1.cdn.digitaloceanspaces.com/mediamake/social_u6251845547_httpss.mj.run9l2KyQUVPrM_camera_rotates_around._-_e8d79e2e-6ed9-4fc6-946d-b182e6f84b88_0.mp4',
      className: 'w-full h-full object-cover bg-black',
      fit: 'cover' as const,
      playbackRate: 1,
      loop: true,
    } as VideoAtomDataProps,
    context: {
      timing: {
        fitDurationTo: 'audio-track',
      },
    },
  };

  // 2nd moving animation
  const image = {
    id: `image-1-alkefn`,
    componentId: 'ImageAtom',
    type: 'atom' as const,
    effects: [
      {
        id: `video-1-effects-alkefn`,
        componentId: 'generic',
        data: {
          start: 0,
          duration: 2,
          mode: 'provider',
          targetIds: ['image-1-alkefn'],
          type: 'ease-in-out',
          ranges: [
            {
              key: 'opacity',
              val: 0,
              prog: 0,
            },
            {
              key: 'opacity',
              val: 1,
              prog: 1,
            },
          ],
        } as GenericEffectData,
      },
      {
        id: `right-moveout`,
        componentId: 'generic',
        data: {
          start: 0,
          ranges: [
            {
              key: 'translateX',
              val: '0%',
              prog: 0,
            },
            {
              key: 'translateX',
              val: '25%',
              prog: 1,
            },
          ],
          targetIds: ['image-1-alkefn'],
          type: 'ease-out',
          mode: 'provider',
          duration: 10,
        } as GenericEffectData,
      },
    ],
    data: {
      src: params.imageUrl,
      className: 'w-full h-auto object-cover bg-black',
      //   containerClassName: 'w-full h-full bg-black',
    },
    context: {
      timing: {
        duration: 12,
      },
    },
  };

  // Title intro with "Get into Zone" and "keystone" text
  const titleIntro = {
    id: `title-intro-alkefn`,
    componentId: 'BaseLayout',
    type: 'layout' as const,
    data: {
      containerProps: {
        className:
          'absolute left-30 top-0 bottom-0 flex flex-col items-start justify-center z-10',
      },
    },
    context: {
      timing: {
        start: 0,
        duration: 16,
      },
    },
    childrenData: [
      // "Get into Zone" text (similar to middleText from waveform)
      {
        id: 'get-into-zone-text',
        componentId: 'TextAtom',
        type: 'atom' as const,
        effects: [
          {
            id: 'get-into-zone-fade-in',
            componentId: 'generic',
            data: {
              start: 2,
              duration: 1,
              mode: 'provider',
              targetIds: ['get-into-zone-text'],
              type: 'ease-in',
              ranges: [
                {
                  key: 'opacity',
                  val: 0,
                  prog: 0,
                },
                {
                  key: 'opacity',
                  val: 1,
                  prog: 1,
                },
              ],
            } as GenericEffectData,
          },
          {
            id: 'get-into-zone-slide-in',
            componentId: 'generic',
            data: {
              start: 2,
              duration: 10,
              mode: 'provider',
              targetIds: ['get-into-zone-text'],
              type: 'ease-in',
              ranges: [
                {
                  key: 'translateX',
                  val: '-50px',
                  prog: 0,
                },
                {
                  key: 'translateX',
                  val: '0px',
                  prog: 1,
                },
              ],
            },
          },
          {
            id: 'get-into-zone-letter-spacing',
            componentId: 'generic',
            data: {
              start: 2,
              duration: 10,
              mode: 'provider',
              targetIds: ['get-into-zone-text'],
              type: 'ease-in-out',
              ranges: [
                {
                  key: 'letterSpacing',
                  val: 10,
                  prog: 0,
                },
                {
                  key: 'letterSpacing',
                  val: 40,
                  prog: 2,
                },
              ],
            } as GenericEffectData,
          },
        ],
        data: {
          text: params.titleText,
          className: 'px-0 py-4 text-center',
          style: {
            fontSize: 25,
            color: params.titleColor || '#FFF',
            textTransform: 'uppercase',
            letterSpacing: 30,
            fontWeight: 700,
          },
          font: {
            family: params.titleFont?.includes(':')
              ? params.titleFont.split(':')[0]
              : params.titleFont || 'Inter',
            ...(params.titleFont?.includes(':')
              ? { weights: [params.titleFont.split(':')[1]] }
              : {}),
          },
        },
        context: {
          timing: {
            start: 0,
            duration: 12,
          },
        },
      },
      // "keystone" text (similar to titleText from waveform)
      {
        id: 'keystone-text',
        componentId: 'TextAtom',
        type: 'atom' as const,
        effects: [
          {
            id: 'keystone-fade-in',
            componentId: 'generic',
            data: {
              start: 5,
              duration: 1,
              mode: 'provider',
              targetIds: ['keystone-text'],
              type: 'ease-in',
              ranges: [
                {
                  key: 'opacity',
                  val: 0,
                  prog: 0,
                },
                {
                  key: 'opacity',
                  val: 1,
                  prog: 1,
                },
              ],
            } as GenericEffectData,
          },
          {
            id: 'keystone-slide-in',
            componentId: 'generic',
            data: {
              start: 5,
              duration: 7,
              mode: 'provider',
              targetIds: ['keystone-text'],
              type: 'ease-out',
              ranges: [
                {
                  key: 'translateX',
                  val: '-50px',
                  prog: 0,
                },
                {
                  key: 'translateX',
                  val: '0px',
                  prog: 1,
                },
              ],
            } as GenericEffectData,
          },
          {
            id: 'keystone-letter-spacing',
            componentId: 'generic',
            data: {
              start: 5,
              duration: 7,
              mode: 'provider',
              targetIds: ['keystone-text'],
              type: 'ease-in-out',
              ranges: [
                {
                  key: 'letterSpacing',
                  val: 10,
                  prog: 0,
                },
                {
                  key: 'letterSpacing',
                  val: 30,
                  prog: 2,
                },
              ],
            } as GenericEffectData,
          },
          {
            id: 'keystone-glow',
            componentId: 'generic',
            data: {
              start: 5,
              duration: 7,
              mode: 'provider',
              targetIds: ['keystone-text'],
              type: 'ease-in-out',
              ranges: [
                {
                  key: 'textShadow',
                  val: '0 0 0px #FFF',
                  prog: 0,
                },
                {
                  key: 'textShadow',
                  val: '0 0 20px #FFF, 0 0 40px #FFF, 0 0 60px #FFF',
                  prog: 0.5,
                },
                {
                  key: 'textShadow',
                  val: '0 0 0px #FFF',
                  prog: 1,
                },
              ],
            } as GenericEffectData,
          },
        ],
        data: {
          text: params.keystoneText,
          className: 'rounded-xl',
          style: {
            fontSize: 150,
            color: params.keystoneColor || '#FFF',
            borderRadius: 40,
            letterSpacing: 10,
            fontWeight: 100,
          },
          font: {
            family: params.keystoneFont?.includes(':')
              ? params.keystoneFont.split(':')[0]
              : params.keystoneFont || 'BebasNeue',
            weights: params.keystoneFont?.includes(':')
              ? [params.keystoneFont.split(':')[1]]
              : ['400'],
          },
        },
        context: {
          timing: {
            duration: 12,
          },
        },
      },
    ],
  };

  const layout = {
    id: `layout-1-alkefn`,
    componentId: 'BaseLayout',
    type: 'layout' as const,
    data: {
      repeatChildrenProps: {
        className: `absolute inset-0`,
      },
    },
    effects: [
      {
        id: 'keystone-fade-out',
        componentId: 'generic',
        data: {
          start: 10,
          duration: 2,
          mode: 'provider',
          targetIds: ['title-intro-alkefn'],
          type: 'ease-out',
          ranges: [
            {
              key: 'opacity',
              val: 1,
              prog: 0,
            },
            {
              key: 'opacity',
              val: 0,
              prog: 1,
            },
          ],
        } as GenericEffectData,
      },
    ],
    context: {
      timing: {
        duration: 12,
      },
    },
    childrenData: [...(params.imageUrl ? [image] : []), titleIntro],
  };

  const image2 = {
    id: `image-2-alkefn`,
    componentId: 'ImageAtom',
    type: 'atom' as const,
    effects: [
      {
        id: 'image2-pan-effect',
        componentId: 'pan',
        data: {
          panDirection: 'up',
          panDistance: 400,
          loopTimes: 3,
        } as PanEffectData,
      },
    ],
    data: {
      src: params.imageUrl,
      className: 'w-full h-auto object-cover',
      style: {
        transform: 'translateX(25%)',
      },
    },
  };

  const layout2 = {
    id: `layout-2-alkefn`,
    componentId: 'BaseLayout',
    type: 'layout' as const,
    data: {
      containerProps: {
        className: `absolute inset-0`,
      },
      repeatChildrenProps: {
        className: `absolute inset-0`,
      },
    },
    context: {
      timing: {
        start: 12,
        fitDurationTo: 'audio-track',
      },
    },
    childrenData: [
      ...(params.videoUrl ? [video] : []),
      ...(params.imageUrl ? [image2] : []),
    ],
  };

  return {
    config: {
      fitDurationTo: 'title-intro-alkefn', // Fit duration to the title intro (10 seconds)
    },
    childrenData: [
      {
        id: `BaseScene`,
        componentId: 'BaseLayout',
        type: 'scene' as const,
        data: {
          containerProps: {
            className: `absolute inset-0`,
          },
          repeatChildrenProps: {
            className: `absolute inset-0`,
          },
        },
        childrenData: [
          // Title intro overlay
          layout,
          layout2,
        ],
      },
    ],
  };
};

const videoStitchPresetMetadata: PresetMetadata = {
  id: 'thinker-visuals',
  title: 'Thinker Visuals',
  description:
    'Stitches multiple videos together in sequence with customizable aspect ratio',
  type: 'predefined',
  presetType: 'children',
  tags: ['video', 'stitch', 'sequence', 'aspect-ratio'],
  defaultInputParams: {
    imageUrl:
      'https://aidev.blr1.cdn.digitaloceanspaces.com/mediamake/u6251845547_Rodins_The_Thinker_in_a_luxry_chromium_black_art__a3a22513-8951-4171-8f21-485c8ae346e5_2.png',
    titleText: 'Get into Zone',
    keystoneText: 'keystone',
  },
};

const videoStitchPresetFunction = presetExecution.toString();
const videoStitchPresetParams = z.toJSONSchema(presetParams);

export const thinkerVisualsPreset = {
  metadata: videoStitchPresetMetadata,
  presetFunction: videoStitchPresetFunction,
  presetParams: videoStitchPresetParams,
};
