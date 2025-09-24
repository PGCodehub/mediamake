import { generateId } from '@microfox/datamotion';
import {
  RenderableComponentData,
  TranscriptionSentence,
} from '@microfox/datamotion';

export const captionTransformer = (
  captions: TranscriptionSentence[],
): RenderableComponentData => {
  const id = generateId();

  const childrenData = captions.map(caption => {
    const scentenceId = generateId();

    const wordsData = caption.words.map(word => {
      const wordId = generateId();

      const wordContext = {
        timing: {
          start: word.start,
          duration: caption.duration,
        },
      };
      return {
        type: 'atom',
        id: wordId,
        componentId: 'TextAtom',
        data: {
          text: word.text,
          className: 'rounded-xl text-xl',
          style: {
            fontSize: 50,
            fontWeight: 100,
          },
          font: {
            family: 'BebasNeue',
          },
        },
        context: wordContext,
      } as RenderableComponentData;
    });

    const wordsProps = wordsData.map(word => {
      return {
        className: 'text-white',
      };
    });

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
          start: caption.absoluteStart,
          duration: caption.duration,
        },
      },
      childrenData: wordsData,
    } as RenderableComponentData;
  });

  return {
    type: 'layout',
    id: id,
    componentId: 'BaseLayout',
    data: {
      containerProps: {},
      childrenProps: [],
    },
    context: {
      timing: {
        start: 0,
        duration:
          captions[captions.length - 1].absoluteEnd! -
          captions[0].absoluteStart!,
      },
    },
    childrenData: childrenData,
  };
};
