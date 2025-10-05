import {
  GenericEffectData,
  InputCompositionProps,
  VideoAtomDataProps,
  WaveformConfig,
  WaveformHistogramRangedDataProps,
} from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata } from '../types';

const presetParams = z.object({
  audioUrl: z.string().describe('Audio URL for waveform'),
  artworkImage: z.string().describe('Music artwork image URL'),
  trackTitle: z.string().describe('Track title text'),
  artistName: z.string().optional().describe('Artist name'),
  waveformColor: z.string().optional().describe('Waveform color (hex)'),
  waveformGradientEnd: z
    .string()
    .optional()
    .describe('Waveform gradient end color (hex)'),
  titleColor: z.string().optional().describe('Title text color (hex)'),
  artistColor: z.string().optional().describe('Artist text color (hex)'),
  titleFont: z
    .string()
    .optional()
    .describe('Title font family (e.g., "Roboto:600:italic" or "BebasNeue")'),
  artistFont: z
    .string()
    .optional()
    .describe('Artist font family (e.g., "Roboto:400" or "Inter")'),
  bottomOffset: z.string().optional().describe('Bottom offset (in pixels)'),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
  props: {
    config: {
      duration: number;
      width: number;
      height: number;
      fps: number;
      fitDurationTo?: string;
    };
  },
): Partial<InputCompositionProps> => {
  // Parse aspect ratio from config
  const { config } = props;
  const aspectRatio = config.width / config.height;
  const isVertical = aspectRatio < 1;

  // Responsive waveform histogram
  const waveform = {
    id: 'waveform-music-card',
    componentId: 'WaveformHistogramRanged',
    type: 'atom' as const,
    data: {
      config: {
        audioSrc: params.audioUrl,
        numberOfSamples: 64,
        windowInSeconds: 1 / 30,
        amplitude: 1,
        width: config.width,
        height: isVertical ? 200 : 300,
        dataOffsetInSeconds: 0,
        useFrequencyData: true,
      } as WaveformConfig,
      barSpacing: isVertical ? 6 : 10,
      barBorderRadius: isVertical ? 4 : 8,
      barWidth: isVertical ? 2 : 4,
      multiplier: 1,
      horizontalSymmetry: false,
      verticalMirror: true,
      histogramStyle: 'full-width',
      amplitude: 0.75,
      gradientStartColor: params.waveformColor ?? '#FFF',
      gradientEndColor: params.waveformGradientEnd ?? '#FDCE99',
      gradientDirection: 'vertical',
      gradientStyle: 'mirrored',
      className: 'rounded-lg flex flex-col justify-end',
      waveDirection: 'right-to-left',
      style: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: isVertical ? '200px' : '300px',
      },
    } as WaveformHistogramRangedDataProps,
  };

  // Responsive artwork image
  const artwork = {
    id: `artwork-music-card`,
    componentId: 'ImageAtom',
    type: 'atom' as const,
    effects: [
      {
        id: 'artwork-fade-in',
        componentId: 'generic',
        data: {
          start: 0,
          duration: 1,
          mode: 'provider',
          targetIds: ['artwork-music-card'],
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
        id: 'artwork-scale-in',
        componentId: 'generic',
        data: {
          start: 0,
          duration: 1.5,
          mode: 'provider',
          targetIds: ['artwork-music-card'],
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
        } as GenericEffectData,
      },
    ],
    data: {
      src: params.artworkImage,
      className: isVertical
        ? 'w-[300px] h-[300px] object-cover'
        : 'w-[400px] h-[400px] object-cover',
      style: {
        opacity: 1,
        borderRadius: isVertical ? 30 : 40,
        filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))',
      },
    },
  };

  // Track title text
  const trackTitle = {
    id: `track-title-music-card`,
    componentId: 'TextAtom',
    type: 'atom' as const,
    effects: [
      {
        id: 'track-title-fade-in',
        componentId: 'generic',
        data: {
          start: 0.5,
          duration: 1,
          mode: 'provider',
          targetIds: ['track-title-music-card'],
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
        id: 'track-title-slide-up',
        componentId: 'generic',
        data: {
          start: 0.5,
          duration: 1.5,
          mode: 'provider',
          targetIds: ['track-title-music-card'],
          type: 'ease-out',
          ranges: [
            {
              key: 'translateY',
              val: '30px',
              prog: 0,
            },
            {
              key: 'translateY',
              val: '0px',
              prog: 1,
            },
          ],
        } as GenericEffectData,
      },
    ],
    data: {
      text: params.trackTitle,
      className: 'mt-8',
      style: {
        fontSize: isVertical ? 35 : 45,
        color: params.titleColor || '#FFF',
        letterSpacing: isVertical ? 8 : 10,
        fontWeight: 900,
        textAlign: 'center',
        width: '100%',
        textShadow: '0 2px 10px rgba(0,0,0,0.8)',
        ...(params.titleFont?.includes(':') &&
        params.titleFont.split(':').length > 2
          ? { fontStyle: params.titleFont.split(':')[2] }
          : {}),
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
  };

  // Artist name text (optional)
  const artistName = params.artistName
    ? {
        id: `artist-name-music-card`,
        componentId: 'TextAtom',
        type: 'atom' as const,
        effects: [
          {
            id: 'artist-name-fade-in',
            componentId: 'generic',
            data: {
              start: 1,
              duration: 1,
              mode: 'provider',
              targetIds: ['artist-name-music-card'],
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
            id: 'artist-name-slide-up',
            componentId: 'generic',
            data: {
              start: 1,
              duration: 1.5,
              mode: 'provider',
              targetIds: ['artist-name-music-card'],
              type: 'ease-out',
              ranges: [
                {
                  key: 'translateY',
                  val: '20px',
                  prog: 0,
                },
                {
                  key: 'translateY',
                  val: '0px',
                  prog: 1,
                },
              ],
            } as GenericEffectData,
          },
        ],
        data: {
          text: params.artistName,
          className: '',
          style: {
            fontSize: isVertical ? 20 : 25,
            color: params.artistColor || '#CCC',
            textTransform: 'uppercase',
            letterSpacing: isVertical ? 4 : 6,
            fontWeight: 400,
            textAlign: 'center',
            width: '100%',
            textShadow: '0 1px 5px rgba(0,0,0,0.8)',
            ...(params.artistFont?.includes(':') &&
            params.artistFont.split(':').length > 2
              ? { fontStyle: params.artistFont.split(':')[2] }
              : {}),
          },
          font: {
            family: params.artistFont?.includes(':')
              ? params.artistFont.split(':')[0]
              : params.artistFont || 'Inter',
            ...(params.artistFont?.includes(':')
              ? { weights: [params.artistFont.split(':')[1]] }
              : {}),
          },
        },
      }
    : null;

  const musicCardContainer = {
    id: `music-card-box`,
    componentId: 'BaseLayout',
    type: 'layout' as const,
    data: {
      containerProps: {
        className: `flex ${isVertical ? 'p-8' : 'p-16 mb-24'} flex-col items-center justify-end absolute bottom-0 left-0 right-0`,
        style: {
          transform: `translateY(25%)`,
        },
      },
    },
    context: {
      timing: {
        fitDurationTo: 'audio-track',
      },
    },
    childrenData: [artwork, trackTitle, ...(artistName ? [artistName] : [])],
  };

  // Main layout container
  const layout = {
    id: `music-card-layout`,
    componentId: 'BaseLayout',
    type: 'layout' as const,
    data: {
      containerProps: {
        className: `absolute inset-0`,
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
      },
      repeatChildrenProps: {
        className: `absolute inset-0`,
        style: {
          marginBottom: params.bottomOffset || '0%',
        },
      },
    },
    context: {
      timing: {
        fitDurationTo: 'audio-track',
      },
    },
    childrenData: [waveform, musicCardContainer],
  };

  return {
    childrenData: [
      {
        id: `BaseScene`,
        componentId: 'BaseLayout',
        type: 'scene' as const,
        data: {
          containerProps: {
            className: `absolute inset-0`,
          },
          childrenProps: [
            {
              className: `absolute inset-0`,
            },
          ],
        },
        childrenData: [layout],
      },
    ],
  };
};

const musicCardPresetMetadata: PresetMetadata = {
  id: 'music-card',
  title: 'Music Card',
  description:
    'Music card with responsive artwork, waveform, and text overlays',
  type: 'predefined',
  presetType: 'children',
  tags: ['music', 'card', 'waveform', 'artwork', 'responsive'],
  defaultInputParams: {
    audioUrl:
      'https://aidev.blr1.cdn.digitaloceanspaces.com/mediamake/sample-audio.mp3',
    artworkImage:
      'https://aidev.blr1.cdn.digitaloceanspaces.com/mediamake/music-artwork.jpg',
    trackTitle: 'Amazing Track',
    artistName: 'Great Artist',
    waveformColor: '#FFF',
    waveformGradientEnd: '#FDCE99',
    titleColor: '#FFF',
    artistColor: '#CCC',
  },
};

const musicCardPresetFunction = presetExecution.toString();
const musicCardPresetParams = z.toJSONSchema(presetParams);

export const musicCardPreset = {
  metadata: musicCardPresetMetadata,
  presetFunction: musicCardPresetFunction,
  presetParams: musicCardPresetParams,
};
