import { Transcription } from '@/app/types/transcription';
import { RenderableComponentData } from '@microfox/datamotion';
import {
  GenericEffectData,
  InputCompositionProps,
  TextAtomData,
} from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata } from '../types';

const presetParams = z.object({
  inputCaptions: z.array(z.any()),
  position: z.enum(['bottom', 'top']),
  padding: z.string().optional(),
  negativeOffset: z
    .number()
    .optional()
    .describe(
      'negative offset to adjust the subtitle appearance - 0.15 is standard',
    ),
  wordAnimationDuration: z
    .number()
    .optional()
    .describe('time to animate in the word - 0.15 is standard'),
  font: z
    .string()
    .optional()
    .default('Inter')
    .describe('font family - Inter, BebasNeue'),
  fontSize: z
    .number()
    .optional()
    .default(50)
    .describe('font size - 50 is standard'),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): Partial<InputCompositionProps> => {
  const {
    inputCaptions,
    position,
    padding,
    negativeOffset,
    wordAnimationDuration,
    font,
    fontSize,
  } = params;
  const captionsCHildrenData = inputCaptions.map(
    (caption: Transcription['captions'][number], _i: number) => {
      const scentenceId = `caption-${_i}`;

      const wordsData = caption.words.map((word, _j: number) => {
        const wordId = `word-${_j}`;
        const wordContext = {
          timing: {
            start: 0,
            // word.start is already relative to scentence, so no need to readjust
            // start: word.start,
            // make it stay until the entire duration of the subtitle.
            duration: caption.duration + (negativeOffset ?? 0.15),
          },
        };

        const effectFadeIn: GenericEffectData = {
          type: 'ease-in',
          start: word.start,
          duration: wordAnimationDuration ?? 0.15,
          ranges: [
            {
              key: 'opacity',
              val: 0.75,
              prog: 0,
            },
            {
              key: 'opacity',
              val: 1,
              prog: 1,
            },
          ],
        };
        return {
          type: 'atom',
          id: wordId,
          componentId: 'TextAtom',
          effects: [
            {
              id: `fade-in-${wordId}`,
              componentId: 'generic',
              data: effectFadeIn,
            },
          ],
          data: {
            text: word.text,
            className: 'rounded-xl text-xl',
            style: {
              fontSize: fontSize ?? 50,
              fontWeight: 100,
            },
            font: {
              family: font ?? 'BebasNeue',
            },
          } as TextAtomData,
          context: wordContext,
        } as RenderableComponentData;
      });

      // word container styling
      const wordsProps = wordsData.map(word => {
        return {
          className: 'text-white',
        };
      });

      // scentence layout.
      return {
        type: 'layout',
        id: scentenceId,
        componentId: 'BaseLayout',
        data: {
          containerProps: {
            className:
              'flex flex-row items-center justify-center text-white gap-4',
          },
          childrenProps: [],
        },
        context: {
          timing: {
            start: caption.absoluteStart - (negativeOffset ?? 0.15),
            duration: caption.duration + (negativeOffset ?? 0.15),
          },
        },
        childrenData: wordsData,
      } as RenderableComponentData;
    },
  );

  //generate childrenData for scenes.
  return {
    // appends this children data to the target parent
    config: {
      duration: inputCaptions[inputCaptions.length - 1].absoluteEnd!,
    },
    childrenData: [
      {
        // If AudioScene is already in the composition, we need to append this as children data, as this is children data type of preset
        // if not present, then it will append to the first node in base childrenData.
        id: 'AudioScene',
        componentId: 'BaseLayout',
        type: 'layout',
        data: {
          childrenProps: [
            {
              className:
                position === 'bottom' ? 'absolute bottom-0' : 'absolute top-0',
              style: {
                padding: padding ?? '24px',
              },
            },
          ],
        },
        childrenData: [
          // THIS IS OUR ACTUAL PRESET WIDGET THAT WILL BE APPENDED.
          {
            id: 'SubtitlesOverlay',
            componentId: 'BaseLayout',
            type: 'layout',
            data: {
              containerProps: {
                //className: 'absolute bottom-0',
              },
              childrenProps: [],
            },
            context: {
              timing: {
                start: 0,
                duration:
                  inputCaptions[inputCaptions.length - 1].absoluteEnd! -
                  inputCaptions[0].absoluteStart!,
              },
            },
            childrenData: captionsCHildrenData,
          },
        ],
      },
    ],
  };
};

const presetMetadata: PresetMetadata = {
  id: 'subtitles-plain',
  title: 'Subtitles Plain',
  description:
    'Plain Subtitles postitioned at the bottom or the top of the screen',
  type: 'predefined',
  presetType: 'children',
  tags: ['subtitles', 'plain', 'bottom', 'top'],
  defaultInputParams: {
    wordAnimationDuration: 0.15,
    negativeOffset: 0.5,
    padding: '4em',
    position: 'bottom',
    inputCaptions: [
      {
        id: 'caption-1',
        text: 'Hello, world!',
        absoluteStart: 0,
        absoluteEnd: 10,
        start: 0,
        end: 10,
        duration: 10,
        metadata: {},
        words: [
          {
            id: 'word-1',
            text: 'Hello',
            start: 0,
            duration: 5,
            absoluteStart: 0,
            absoluteEnd: 5,
            confidence: 1,
          },
          {
            id: 'word-2',
            text: 'world',
            start: 5,
            duration: 5,
            absoluteStart: 5,
            absoluteEnd: 10,
            confidence: 1,
          },
        ],
      },
    ],
  },
};

const plainSubtitlesPresetFunction = presetExecution.toString();

export const plainSubtitlesPreset = {
  metadata: presetMetadata,
  presetFunction: plainSubtitlesPresetFunction,
  presetParams: z.toJSONSchema(presetParams),
};
