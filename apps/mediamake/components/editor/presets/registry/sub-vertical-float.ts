import { Transcription } from '@/app/types/transcription';
import { RenderableComponentData } from '@microfox/datamotion';
import {
  GenericEffectData,
  InputCompositionProps,
  TextAtomData,
} from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata } from '../types';
import { CSSProperties } from 'react';

const presetParams = z.object({
  inputCaptions: z.array(z.any()),
  position: z.enum(['left', 'center', 'right']),
  negativeOffset: z.number().optional(),
  fontChoices: z
    .array(
      z.object({
        primary: z.string().describe('primary font family'),
        header: z.string().describe('impact font family'),
      }),
    )
    .optional()
    .describe('font choices - primary and secondary font families'),
  colorChoices: z
    .array(
      z.object({
        primary: z.string().describe('primary color'),
        secondary: z.string().describe('secondary color'),
        accent: z.string().describe('accent color'),
      }),
    )
    .optional()
    .describe('color choices - primary and secondary colors'),
  avgFontSize: z.number().optional().describe('average font size'),
  randomizePosition: z.boolean().optional().describe('randomize position'),
  noGaps: z.object({
    enabled: z.boolean().optional().describe('enable no gaps'),
    maxLength: z
      .number()
      .default(3)
      .optional()
      .describe('max duration it can extend'),
  }),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): Partial<InputCompositionProps> => {
  const {
    inputCaptions,
    position,
    negativeOffset,
    avgFontSize,
    colorChoices,
    randomizePosition,
    fontChoices,
  } = params;

  // Font choices configuration
  const FONT_CHOICES =
    fontChoices && fontChoices.length > 0
      ? fontChoices
      : [
          {
            primary: 'Roboto:600:italic',
            header: 'BebasNeue',
          },
        ];

  // Utility function to convert hex color to RGB
  const hexToRgb = (hex: string) => {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  };

  // Splits sentence into parts based on character count for better layout
  const splitSentenceIntoParts = (words: any[]) => {
    const totalCharacters = words.reduce(
      (sum, word) => sum + word.text.trim().length,
      0,
    );

    // Very short sentences: don't split
    if (totalCharacters < 8 || words.length <= 1) {
      return [words];
    }

    // Distribute by character count constraint: max 8 characters per part
    const parts: any[][] = [];
    let currentPart: any[] = [];
    let currentCharCount = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordLength = word.text.length;

      // If adding this word would exceed 8 characters and we have words in current part, start a new part
      if (currentCharCount + wordLength > 8 && currentPart.length > 0) {
        parts.push([...currentPart]);
        currentPart = [word];
        currentCharCount = wordLength;
      } else {
        currentPart.push(word);
        currentCharCount += wordLength;
      }
    }

    // Add any remaining words to the last part
    if (currentPart.length > 0) {
      parts.push(currentPart);
    }

    return parts;
  };

  // Creates opacity fade-in effect for words
  const createOpacityEffect = (
    wordId: string,
    word: any,
    caption: any,
  ): GenericEffectData => ({
    type: 'ease-out',
    start: word.start,
    duration: 1,
    mode: 'provider',
    targetIds: [wordId],
    ranges: [
      { key: 'opacity', val: 0, prog: 0 },
      {
        key: 'opacity',
        val: 1,
        prog: caption.duration >= 1 ? 0.5 : 0.05,
      },
      { key: 'opacity', val: 1, prog: 1 },
    ],
  });

  // Creates letter spacing effect for highlighted words
  const createLetterSpacingEffect = (
    wordId: string,
    word: any,
    syncDuration: number | null,
    shouldAnimate: boolean,
  ): GenericEffectData => ({
    type: 'ease-out',
    start: word.start - 0.1,
    duration: shouldAnimate ? syncDuration || 8 : 3,
    mode: 'provider',
    targetIds: [wordId],
    ranges: [
      { key: 'letterSpacing', val: '0.1em' as any, prog: 0 },
      { key: 'letterSpacing', val: '0.175em' as any, prog: 1 },
    ],
  });

  // Creates glow effect for highlighted words
  const createGlowEffect = (
    wordId: string,
    word: any,
    selectedColorChoice: any,
    syncDuration: number | null,
    shouldAnimate: boolean,
  ): GenericEffectData => {
    const accentRgb = hexToRgb(selectedColorChoice.accent) || {
      r: 255,
      g: 107,
      b: 107,
    };

    return {
      type: 'ease-in',
      start: word.start - 0.1,
      duration: shouldAnimate ? syncDuration || word.duration : 0.1,
      mode: 'provider',
      targetIds: [wordId],
      ranges: shouldAnimate
        ? [
            {
              key: 'filter',
              val: `drop-shadow(0 0 0px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0))` as any,
              prog: 0,
            },
            {
              key: 'filter',
              val: `drop-shadow(0 0 8px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.4))` as any,
              prog: 1,
            },
          ]
        : [
            {
              key: 'filter',
              val: `drop-shadow(0 0 0px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0))` as any,
              prog: 0,
            },
            {
              key: 'filter',
              val: `drop-shadow(0 0 2px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.4))` as any,
              prog: 1,
            },
          ],
    };
  };

  // Generates word data with effects and styling
  const generateWordsData = (
    words: any[],
    caption: any,
    selectedFontChoice: any,
    avgFontSize: number | undefined,
    selectedColorChoice: any,
    partId: string,
    scentenceId: string,
  ) => {
    const isAllWordsHighlighted = words.every(
      word => word.metadata?.isHighlight,
    );
    const syncDuration =
      isAllWordsHighlighted && words.length > 0 && caption.duration > 1
        ? words.reduce((sum, word) => sum + word.duration, 0)
        : null;

    return words.map((word, _j: number) => {
      const wordId = `word-${_j}-${partId}-${scentenceId}`;
      const isHighlight = word.metadata?.isHighlight;
      const shouldAnimate =
        word.duration >= 1 || (isAllWordsHighlighted && syncDuration > 1.5);

      // Create effects array
      const effects = [
        {
          id: `opacity-${wordId}`,
          componentId: 'generic',
          data: createOpacityEffect(wordId, word, caption),
        },
      ];

      // Add letter spacing effect for highlighted words
      if (isHighlight) {
        effects.push({
          id: `letter-spacing-${wordId}`,
          componentId: 'generic',
          data: createLetterSpacingEffect(
            wordId,
            word,
            syncDuration,
            shouldAnimate,
          ),
        });
      }

      // Add glow effect for highlighted words
      if (isHighlight) {
        effects.push({
          id: `glow-${wordId}`,
          componentId: 'generic',
          data: createGlowEffect(
            wordId,
            word,
            selectedColorChoice,
            syncDuration,
            shouldAnimate,
          ),
        });
      }

      // Calculate font size and style
      let fontSize = avgFontSize ?? 50;
      const fontCalculatedSize = isHighlight
        ? fontSize * 1.35
        : fontSize * 0.85;
      const font = isHighlight
        ? selectedFontChoice.header
        : selectedFontChoice.primary;
      const fontFamily = font.includes(':') ? font.split(':')[0] : font;

      // Parse font style from font string
      let fontStyle: CSSProperties = {};
      if (font.includes(':')) {
        const _fontStyle = font.split(':');
        if (_fontStyle.length > 2) {
          fontStyle.fontStyle = _fontStyle[2];
          fontStyle.fontWeight = parseInt(_fontStyle[1]);
        } else if (_fontStyle.length > 1) {
          fontStyle.fontWeight = parseInt(_fontStyle[1]);
        }
      }

      // Set text colors based on highlight status
      const textColor = isHighlight
        ? selectedColorChoice.accent
        : selectedColorChoice.primary;
      const textShadowColor = isHighlight
        ? selectedColorChoice.accent
        : selectedColorChoice.secondary;

      return {
        type: 'atom',
        id: wordId,
        componentId: 'TextAtom',
        effects: effects,
        data: {
          text: word.text.toUpperCase(),
          className: isHighlight
            ? 'rounded-xl text-xl font-bold tracking-wide'
            : 'rounded-xl text-xl',
          style: {
            fontSize: fontCalculatedSize,
            color: textColor,
            ...fontStyle,
            ...(isHighlight && {
              textShadow: `0 0 10px ${textShadowColor}50`,
            }),
          },
          font: {
            family: fontFamily,
          },
        } as TextAtomData,
        context: {
          timing: {
            start: 0,
            duration: caption.duration,
          },
        },
      } as RenderableComponentData;
    });
  };

  // Smart word selection algorithm for highlighting
  const selectHighlightWord = (words: any[], metadata?: any) => {
    // If AI metadata is available, use it for selection
    if (metadata?.highlightWordIndex !== undefined) {
      return metadata.highlightWordIndex;
    }

    const wordDurations = words.map(word => word.duration);
    const avgDuration =
      wordDurations.reduce((sum, dur) => sum + dur, 0) / words.length;
    const maxDuration = Math.max(...wordDurations);

    // Check if all words are fast (less than 0.5 seconds)
    const allFast = wordDurations.every(dur => dur < 0.5);

    if (allFast) {
      // Sort by word length and pick from top 3 longest
      const wordsWithLength = words.map((word, index) => ({
        word,
        index,
        length: word.text.length,
      }));

      const sortedByLength = wordsWithLength.sort(
        (a, b) => b.length - a.length,
      );
      const topThree = sortedByLength.slice(0, 3);
      return topThree[Math.floor(Math.random() * topThree.length)].index;
    }

    // Find words with significant duration
    const significantWords = words.map((word, index) => ({
      word,
      index,
      duration: word.duration,
      isSignificant:
        word.duration >= avgDuration * 0.8 ||
        word.duration >= maxDuration * 0.7,
    }));

    // Find context words (short words that precede/succeed long duration words)
    const contextWords = [];
    for (let i = 0; i < words.length; i++) {
      const currentWord = words[i];
      const prevWord = i > 0 ? words[i - 1] : null;
      const nextWord = i < words.length - 1 ? words[i + 1] : null;

      const isShort = currentWord.duration < avgDuration * 0.6;
      const hasLongNeighbor =
        (prevWord && prevWord.duration >= maxDuration * 0.8) ||
        (nextWord && nextWord.duration >= maxDuration * 0.8);

      if (isShort && hasLongNeighbor) {
        contextWords.push(i);
      }
    }

    // Combine significant words and context words
    const candidateIndices = [
      ...significantWords.filter(w => w.isSignificant).map(w => w.index),
      ...contextWords,
    ];

    const uniqueCandidates = [...new Set(candidateIndices)];

    // If we have candidates, pick one randomly
    if (uniqueCandidates.length > 0) {
      return uniqueCandidates[
        Math.floor(Math.random() * uniqueCandidates.length)
      ];
    }

    // Fallback: pick the word with longest duration
    return wordDurations.indexOf(maxDuration);
  };

  // Applies noGaps extension to reduce gaps between captions
  const applyNoGapsExtension = (
    captions: Transcription['captions'],
    noGapsConfig: any,
  ) => {
    if (!noGapsConfig?.enabled) {
      return captions;
    }

    const maxExtension = noGapsConfig.maxLength || 3;
    const extendedCaptions = [...captions];

    for (let i = 0; i < extendedCaptions.length - 1; i++) {
      const currentCaption = extendedCaptions[i];
      const nextCaption = extendedCaptions[i + 1];

      const currentEnd = currentCaption.absoluteEnd;
      const nextStart = nextCaption.absoluteStart;
      const gap = nextStart - currentEnd;

      // If there's a gap, extend the current caption
      if (gap > 0) {
        const extensionAmount = Math.min(gap, maxExtension);
        const newDuration = currentCaption.duration + extensionAmount;
        const newAbsoluteEnd = currentCaption.absoluteStart + newDuration;

        // Update the current caption's duration and all word timings
        extendedCaptions[i] = {
          ...currentCaption,
          duration: newDuration,
          absoluteEnd: newAbsoluteEnd,
          words: currentCaption.words.map((word, _j: number) => {
            // Extend the last word to fill the gap
            if (_j === currentCaption.words.length - 1) {
              return {
                ...word,
                duration: word.duration + extensionAmount,
                absoluteEnd: word.absoluteEnd + extensionAmount,
              };
            }
            return word;
          }),
        };
      }
    }

    return extendedCaptions;
  };

  // Generates random position for captions when randomizePosition is enabled
  const getRandomPosition = (height: number, randomizePosition: boolean) => {
    if (!randomizePosition) {
      return {};
    }

    // Generate random position within 1920x1080 constraints
    const maxTop = 1080 - (height || 600);
    const maxLeft = 1920 - 1000;

    const randomTop = 100 + Math.random() * maxTop;
    const randomLeft = 100 + Math.random() * maxLeft;

    return {
      position: 'absolute' as const,
      top: `${randomTop}px`,
      left: `${randomLeft}px`,
    };
  };

  // Creates part-specific layout with animations
  const createPartLayout = (
    partWords: any[],
    partIndex: number,
    totalParts: number,
    caption: any,
    avgFontSize: number | undefined,
    selectedFontChoice: any,
    selectedColorChoice: any,
    partId: string,
    scentenceId: string,
  ) => {
    const wordsData = generateWordsData(
      partWords,
      caption,
      selectedFontChoice,
      avgFontSize,
      selectedColorChoice,
      partId,
      scentenceId,
    );

    // Create part-specific effects using provider mode
    const partRanges = [
      { key: 'translateX', val: partIndex % 2 === 0 ? 20 : -20, prog: 0 },
      { key: 'translateX', val: partIndex % 2 === 0 ? -20 : 20, prog: 1 },
    ];

    const partEffect: GenericEffectData = {
      type: 'ease-out',
      start: 0,
      duration: 8,
      mode: 'provider',
      targetIds: [partId],
      ranges: partRanges,
    };

    return {
      type: 'layout',
      id: partId,
      componentId: 'BaseLayout',
      effects: [
        {
          id: `part-effects-${partId}`,
          componentId: 'generic',
          data: partEffect,
        },
      ],
      data: {
        containerProps: {
          className: 'relative flex flex-row gap-8 items-center justify-center',
        },
      },
      context: {
        boundaries: {
          reset: true,
        },
        timing: {
          start: 0,
          duration: caption.duration,
        },
      },
      childrenData: wordsData,
    } as RenderableComponentData;
  };

  // Processes captions and applies highlighting logic
  const processCaptions = (
    inputCaptions: any[],
    negativeOffset: number | undefined,
    noGapsConfig: any,
    avgFontSize: number | undefined,
    selectedFontChoice: any,
    selectedColorChoice: any,
  ) => {
    // Apply negative offset to all captions
    const offsetCaptions = inputCaptions.map(caption => ({
      ...caption,
      absoluteStart: caption.absoluteStart - (negativeOffset ?? 0.15),
      absoluteEnd: caption.absoluteEnd - (negativeOffset ?? 0.15),
    }));

    // Apply noGaps extension if enabled
    const processedCaptions = applyNoGapsExtension(
      offsetCaptions,
      noGapsConfig,
    );

    return processedCaptions.map(
      (caption: Transcription['captions'][number], _i: number) => {
        const scentenceId = `caption-${_i}`;

        // Split sentence into parts first
        const sentenceParts = splitSentenceIntoParts(caption.words);

        // Determine which part to highlight
        let highlightedPartIndex = -1;
        let highlightedWordIndex = -1;

        if (caption.metadata?.keyword?.length > 0) {
          // Find the word index that contains the keyword
          const keywordWordIndex = caption.words.findIndex(word =>
            word.text
              .toLowerCase()
              .includes(caption.metadata?.keyword.toLowerCase()),
          );
          if (keywordWordIndex !== -1) {
            // Find which part contains this word
            let wordCount = 0;
            for (let i = 0; i < sentenceParts.length; i++) {
              const part = sentenceParts[i];
              if (keywordWordIndex < wordCount + part.length) {
                highlightedPartIndex = i;
                highlightedWordIndex = keywordWordIndex;
                break;
              }
              wordCount += part.length;
            }
          }
        }

        if (sentenceParts.length > 1 && highlightedPartIndex === -1) {
          // Calculate impact for first and last parts
          const firstPart = sentenceParts[0];
          const lastPart = sentenceParts[sentenceParts.length - 1];

          const firstPartDuration = firstPart.reduce(
            (sum, word) => sum + word.duration,
            0,
          );
          const firstPartCharLength = firstPart.reduce(
            (sum, word) => sum + word.text.length,
            0,
          );
          const lastPartDuration = lastPart.reduce(
            (sum, word) => sum + word.duration,
            0,
          );
          const lastPartCharLength = lastPart.reduce(
            (sum, word) => sum + word.text.length,
            0,
          );

          // Determine which part is more impactful
          const durationDifference = Math.abs(
            firstPartDuration - lastPartDuration,
          );
          const durationThreshold =
            Math.max(firstPartDuration, lastPartDuration) * 0.2;

          if (durationDifference <= durationThreshold) {
            highlightedPartIndex =
              firstPartCharLength >= lastPartCharLength
                ? 0
                : sentenceParts.length - 1;
          } else {
            highlightedPartIndex =
              firstPartDuration >= lastPartDuration
                ? 0
                : sentenceParts.length - 1;
          }
        } else {
          highlightedPartIndex = 0;
        }

        // Apply highlighting logic to words
        const captionWords = caption.words.map((word, _j: number) => {
          let isHighlight = false;

          if (highlightedPartIndex >= 0) {
            const highlightedPart = sentenceParts[highlightedPartIndex];
            const isLastPart =
              highlightedPartIndex === sentenceParts.length - 1;

            if (isLastPart) {
              // Find which part this word belongs to
              let wordPartIndex = -1;
              let currentIndex = 0;

              for (
                let partIndex = 0;
                partIndex < sentenceParts.length;
                partIndex++
              ) {
                const part = sentenceParts[partIndex];
                if (_j >= currentIndex && _j < currentIndex + part.length) {
                  wordPartIndex = partIndex;
                  break;
                }
                currentIndex += part.length;
              }

              isHighlight = wordPartIndex === highlightedPartIndex;
            } else {
              // For first part, find a representative word to highlight
              if (highlightedWordIndex === -1) {
                const partStartIndex = sentenceParts
                  .slice(0, highlightedPartIndex)
                  .reduce((sum, part) => sum + part.length, 0);
                const partEndIndex = partStartIndex + highlightedPart.length;
                const partWords = caption.words.slice(
                  partStartIndex,
                  partEndIndex,
                );

                const maxDuration = Math.max(...partWords.map(w => w.duration));
                highlightedWordIndex =
                  partWords.findIndex(w => w.duration === maxDuration) +
                  partStartIndex;
              }

              isHighlight = _j === highlightedWordIndex;
            }
          }

          return {
            ...word,
            metadata: {
              isHighlight,
            },
          };
        });

        const totalParts = sentenceParts.length;

        // Create layout for each part
        const partsData = sentenceParts.map((partWords, partIndex) => {
          const startIndex = sentenceParts
            .slice(0, partIndex)
            .reduce((sum, part) => sum + part.length, 0);
          const endIndex = startIndex + partWords.length;
          const modifiedPartWords = captionWords.slice(startIndex, endIndex);
          const partId = `part-${partIndex}`;

          return createPartLayout(
            modifiedPartWords,
            partIndex,
            totalParts,
            caption,
            avgFontSize,
            selectedFontChoice,
            selectedColorChoice,
            partId,
            scentenceId,
          );
        });

        // Main sentence block layout
        return {
          type: 'layout',
          id: scentenceId,
          componentId: 'BaseLayout',
          data: {
            containerProps: {
              className:
                'h-full flex flex-col items-start justify-center text-white gap-2 pl-10',
            },
          },
          context: {
            boundaries: {
              reset: true,
            },
            timing: {
              start: caption.absoluteStart,
              duration: caption.duration,
            },
          },
          childrenData: partsData,
        } as RenderableComponentData;
      },
    );
  };

  // Select random font and color choices
  const selectedFontChoice =
    FONT_CHOICES[Math.floor(Math.random() * FONT_CHOICES.length)];
  const selectedColorChoice =
    colorChoices && colorChoices.length > 0
      ? colorChoices[Math.floor(Math.random() * colorChoices.length)]
      : {
          primary: '#ffffff',
          secondary: '#ffffff',
          accent: '#ffffff',
        };

  // Process all captions with highlighting and effects
  const captionsChildrenData = processCaptions(
    inputCaptions,
    negativeOffset,
    params.noGaps,
    avgFontSize,
    selectedFontChoice,
    selectedColorChoice,
  );

  // Generate final composition structure
  return {
    config: {
      duration:
        captionsChildrenData[captionsChildrenData.length - 1].context?.timing
          ?.start! +
        captionsChildrenData[captionsChildrenData.length - 1].context?.timing
          ?.duration!,
    },
    childrenData: [
      {
        id: 'BaseScene',
        componentId: 'BaseLayout',
        type: 'layout',
        data: {
          childrenProps: [
            {
              className: 'absolute inset-0',
            },
          ],
        },
        childrenData: [
          {
            id: 'SubtitlesOverlay',
            componentId: 'BaseLayout',
            type: 'layout',
            data: {
              containerProps: {
                className: 'absolute inset-0',
              },
              childrenProps: Array(captionsChildrenData.length)
                .fill({
                  className: 'absolute',
                })
                .map((child, _j) => {
                  // Get random position if enabled
                  const randomPos = getRandomPosition(
                    inputCaptions[_j].text.length > 20 ? 800 : 600,
                    randomizePosition ?? false,
                  );

                  // Determine horizontal positioning based on position parameter
                  let horizontalStyle: any = {};
                  // Use position parameter for consistent alignment
                  switch (position) {
                    case 'left':
                      horizontalStyle = { left: 80 };
                      break;
                    case 'center':
                      horizontalStyle = {
                        left: '50%',
                        transform: 'translateX(-50%)',
                      };
                      break;
                    case 'right':
                      horizontalStyle = { right: 80 };
                      break;
                    default:
                      horizontalStyle = { left: 80 };
                  }

                  return {
                    ...child,
                    style: {
                      top: randomPos.top || 50, // Use random top if available, otherwise default
                      ...horizontalStyle,
                    },
                  };
                }),
            },
            context: {
              timing: {
                start: 0,
                duration:
                  captionsChildrenData[captionsChildrenData.length - 1].context
                    ?.timing?.start! +
                  captionsChildrenData[captionsChildrenData.length - 1].context
                    ?.timing?.duration!,
              },
            },
            childrenData: captionsChildrenData,
          } as RenderableComponentData,
        ],
      },
    ],
  };
};

const presetMetadata: PresetMetadata = {
  id: 'sub-vertical-float',
  title: 'Subtitles Vertical Float',
  description:
    'Kinetic Subtitle in Vertical Layout & zig zag floating animations',
  type: 'predefined',
  presetType: 'children',
  tags: ['subtitles', 'vertical', 'float', 'zigzag'],
  defaultInputParams: {
    negativeOffset: 0.5,
    position: 'left',
    randomizePosition: false,
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

const _presetExecution = presetExecution.toString();

export const subVerticalFloatPreset = {
  metadata: presetMetadata,
  presetFunction: _presetExecution,
  presetParams: z.toJSONSchema(presetParams),
};

// I want ti to select 1 random font pair if not given.
// the placement of the scentence should be random.
// fontsizing should not be same, ( highlight should be highlighted )
// animation effects should be smooth ( not simple fade in )
// add boxed/glassy blur effects
// inversion of colors ( if dark image bg or plain colored bg)
