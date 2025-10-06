import { Transcription } from '@/app/types/transcription';
import { RenderableComponentData } from '@microfox/datamotion';
import {
  GenericEffectData,
  InputCompositionProps,
  TextAtomData,
} from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
import { headers } from 'next/headers';
import { CSSProperties } from 'react';

const presetParams = z.object({
  inputCaptions: z.array(z.any()),
  position: z.enum(['bottom', 'top']),
  padding: z.string().optional(),
  negativeOffset: z.number().optional(),
  wordAnimationDuration: z.number().optional(),
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
): PresetOutput => {
  const {
    inputCaptions,
    position,
    padding,
    negativeOffset,
    wordAnimationDuration,
    avgFontSize,
    colorChoices,
    randomizePosition,
  } = params;

  const FONT_CHOICES = [
    {
      primary: 'Roboto:600:italic',
      header: 'BebasNeue',
    },
    // {
    //   primary: `BebasNeue`,
    //   header: `Calligraffitti`,
    // },
    // {
    //   primary: `Roboto:400:Italic`,
    //   header: `PlayfairDisplay`,
    // },
  ];

  const hexToRgb = (hex: string) => {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  };

  // Helper function to split sentence into 1-3 parts based on character count
  const splitSentenceIntoParts = (words: any[]) => {
    const totalCharacters = words.reduce(
      (sum, word) => sum + word.text.trim().length,
      0,
    );

    const totalDuration = words.reduce((sum, word) => sum + word.duration, 0);

    // Very short sentences: don't split
    if (totalCharacters < 10 || totalDuration < 1.5 || words.length <= 1) {
      return [words];
    }

    // Distribute by character count constraint: max 10 characters per part
    const parts: any[][] = [];
    let currentPart: any[] = [];
    let currentCharCount = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordLength = word.text.length;

      // If adding this word would exceed 10 characters and we have words in current part, start a new part
      if (currentCharCount + wordLength > 10 && currentPart.length > 0) {
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

  // Helper function to generate word data for a given set of words
  const generateWordsData = (
    words: any[],
    caption: any,
    selectedFontChoice: any,
    negativeOffset: number | undefined,
    wordAnimationDuration: number | undefined,
    avgFontSize: number | undefined,
    selectedColorChoice: any,
  ) => {
    const isAllWordsHighlighted = words.every(
      word => word.metadata?.isHighlight,
    );

    // For synchronized highlighting, use the first word's start time
    const syncStartTime =
      isAllWordsHighlighted && words.length > 0 && caption.duration > 1
        ? words[0].start
        : null;
    const syncDuration =
      isAllWordsHighlighted && words.length > 0 && caption.duration > 1
        ? words.reduce((sum, word) => sum + word.duration, 0)
        : null;

    return words.map((word, _j: number) => {
      const wordId = `word-${_j}`;
      const isHighlight = word.metadata?.isHighlight;
      const wordContext = {
        timing: {
          start: 0,
          duration: caption.duration,
        },
      };

      // Skip animations if word duration is too short (less than 0.3 seconds)
      const shouldAnimate =
        word.duration >= 1 || (isAllWordsHighlighted && syncDuration > 1.5);

      // Create separate effects with different timings
      const effects = [];

      // 1. Opacity fade-in effect
      const opacityEffect: GenericEffectData = {
        type: 'ease-in',
        start: word.start,
        // start: isHighlight && syncStartTime !== null ? syncStartTime : word.start,
        duration: 0.15,
        // duration: Math.min(
        //   isHighlight && syncDuration !== null ? syncDuration : 0.15,
        //   0.3,
        // ), // Quick fade-in
        mode: 'provider',
        targetIds: [wordId],
        ranges: [
          { key: 'opacity', val: 0, prog: 0 },
          { key: 'opacity', val: 1, prog: 1 },
        ],
      };

      if (caption.duration > 1) {
        // Add opacity effect
        effects.push({
          id: `opacity-${wordId}`,
          componentId: 'generic',
          data: opacityEffect,
        });
      }

      // 2. Letter spacing effect (only for highlighted words)
      if (isHighlight && shouldAnimate) {
        const letterSpacingEffect: GenericEffectData = {
          type: 'ease-out',
          start:
            isHighlight && syncStartTime !== null ? syncStartTime : word.start,
          duration: isHighlight && syncDuration !== null ? syncDuration : 8,
          mode: 'provider',
          targetIds: [wordId],
          ranges: [
            { key: 'letterSpacing', val: '0.1em' as any, prog: 0 },
            { key: 'letterSpacing', val: '0.175em' as any, prog: 1 },
          ],
        };

        effects.push({
          id: `letter-spacing-${wordId}`,
          componentId: 'generic',
          data: letterSpacingEffect,
        });
      } else if (isHighlight) {
        const letterSpacingEffect: GenericEffectData = {
          type: 'ease-out',
          start:
            isHighlight && syncStartTime !== null ? syncStartTime : word.start,
          duration: 3,
          mode: 'provider',
          targetIds: [wordId],
          ranges: [
            { key: 'letterSpacing', val: '0.1em' as any, prog: 0 },
            { key: 'letterSpacing', val: '0.175em' as any, prog: 1 },
          ],
        };
        effects.push({
          id: `letter-spacing-${wordId}`,
          componentId: 'generic',
          data: letterSpacingEffect,
        });
      }

      // 3. Glow effect with different timings for highlighted vs regular words
      if (isHighlight) {
        const accentRgb = hexToRgb(selectedColorChoice.accent) || {
          r: 255,
          g: 107,
          b: 107,
        };

        const glowEffect: GenericEffectData = {
          type: 'ease-in',
          start:
            isHighlight && syncStartTime !== null ? syncStartTime : word.start,
          duration:
            isHighlight && syncDuration !== null
              ? syncDuration
              : shouldAnimate
                ? word.duration
                : 0.1,
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

        effects.push({
          id: `glow-${wordId}`,
          componentId: 'generic',
          data: glowEffect,
        });
      }

      let fontSize = avgFontSize ?? 50;
      const fontCalculatedSize = isHighlight
        ? fontSize * 1.35
        : fontSize * 0.85;

      const font = isHighlight
        ? selectedFontChoice.header
        : selectedFontChoice.primary;

      const fontFamily = font.includes(':') ? font.split(':')[0] : font;

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

      // Set text color based on highlight status
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
            // Add kinetic typography styles with selected colors
            ...(isHighlight && {
              textShadow: `0 0 10px ${textShadowColor}50`,
            }),
          },
          font: {
            family: fontFamily,
          },
        } as TextAtomData,
        context: wordContext,
      } as RenderableComponentData;
    });
  };

  const selectedFontChoice =
    FONT_CHOICES[Math.floor(Math.random() * FONT_CHOICES.length)];

  // Select color choice
  const selectedColorChoice =
    colorChoices && colorChoices.length > 0
      ? colorChoices[Math.floor(Math.random() * colorChoices.length)]
      : {
          primary: '#ffffff',
          secondary: '#ffffff',
          accent: '#ffffff',
        };

  // Smart word selection algorithm
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
      // Sort by word length (text length) and pick from top 3 longest
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

    // Find words with significant duration (above average or close to max)
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

      // Check if current word is short but precedes/succeeds a long word
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

    // Remove duplicates
    const uniqueCandidates = [...new Set(candidateIndices)];

    // If we have candidates, pick one randomly
    if (uniqueCandidates.length > 0) {
      return uniqueCandidates[
        Math.floor(Math.random() * uniqueCandidates.length)
      ];
    }

    // Fallback: pick the word with longest duration
    const longestIndex = wordDurations.indexOf(maxDuration);
    return longestIndex;
  };

  // Helper function to apply noGaps extension
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

        console.log(
          `NoGaps: Caption ${i} - Gap: ${gap}s, Extension: ${extensionAmount}s, New Duration: ${newDuration}s`,
        );

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
                // start:
                // word.duration + extensionAmount > 1
                //   ? word.start - 0.5
                //   : word.start,
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

  // First apply negativeOffset to all captions
  const offsetCaptions = inputCaptions.map(caption => ({
    ...caption,
    absoluteStart: caption.absoluteStart - (negativeOffset ?? 0.15),
    absoluteEnd: caption.absoluteEnd - (negativeOffset ?? 0.15),
  }));

  // Then apply noGaps extension if enabled
  const processedCaptions = applyNoGapsExtension(offsetCaptions, params.noGaps);

  const captionsCHildrenData = processedCaptions.map(
    (caption: Transcription['captions'][number], _i: number) => {
      const scentenceId = `caption-${_i}`;

      // Split sentence into parts first
      const sentenceParts = splitSentenceIntoParts(caption.words);

      // Only consider first or last part for highlighting
      let highlightedPartIndex = -1;

      console.log('caption.metadata?.keyword', caption.metadata);
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

        // Calculate first part metrics
        const firstPartDuration = firstPart.reduce(
          (sum, word) => sum + word.duration,
          0,
        );
        const firstPartCharLength = firstPart.reduce(
          (sum, word) => sum + word.text.length,
          0,
        );

        // Calculate last part metrics
        const lastPartDuration = lastPart.reduce(
          (sum, word) => sum + word.duration,
          0,
        );
        const lastPartCharLength = lastPart.reduce(
          (sum, word) => sum + word.text.length,
          0,
        );

        // Determine which part is more impactful
        // Priority: duration > character length > default to first
        const durationDifference = Math.abs(
          firstPartDuration - lastPartDuration,
        );
        const charLengthDifference = Math.abs(
          firstPartCharLength - lastPartCharLength,
        );

        // If durations are roughly the same (within 20% difference), use character length
        const durationThreshold =
          Math.max(firstPartDuration, lastPartDuration) * 0.2;

        if (durationDifference <= durationThreshold) {
          // Durations are roughly the same, use character length
          highlightedPartIndex =
            firstPartCharLength >= lastPartCharLength
              ? 0
              : sentenceParts.length - 1;
        } else {
          // Use duration as the deciding factor
          highlightedPartIndex =
            firstPartDuration >= lastPartDuration
              ? 0
              : sentenceParts.length - 1;
        }
      } else {
        // Only one part, highlight it
        highlightedPartIndex = 0;
      }

      // Apply highlighting logic: only last part can be fully highlighted
      const captionWords = caption.words.map((word, _j: number) => {
        let isHighlight = false;

        if (highlightedPartIndex >= 0) {
          const highlightedPart = sentenceParts[highlightedPartIndex];
          const isLastPart = highlightedPartIndex === sentenceParts.length - 1;

          // Only fully highlight if it's the last part
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

            // Highlight if this word is in the same part as the highlighted part
            isHighlight = wordPartIndex === highlightedPartIndex;
          } else {
            // For first part, find a representative word to highlight
            // Use the word with the longest duration in that part
            const partStartIndex = sentenceParts
              .slice(0, highlightedPartIndex)
              .reduce((sum, part) => sum + part.length, 0);
            const partEndIndex = partStartIndex + highlightedPart.length;
            const partWords = caption.words.slice(partStartIndex, partEndIndex);

            const maxDuration = Math.max(...partWords.map(w => w.duration));
            const highlightWordIndex =
              partWords.findIndex(w => w.duration === maxDuration) +
              partStartIndex;

            isHighlight = _j === highlightWordIndex;
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

      // Create layout for each part using the modified words with highlighting
      const partsData = sentenceParts.map((partWords, partIndex) => {
        // Get the corresponding words from captionWords with proper highlighting
        const startIndex = sentenceParts
          .slice(0, partIndex)
          .reduce((sum, part) => sum + part.length, 0);
        const endIndex = startIndex + partWords.length;
        const modifiedPartWords = captionWords.slice(startIndex, endIndex);
        const partId = `part-${partIndex}`;

        // Generate word data for this part
        const wordsData = generateWordsData(
          modifiedPartWords,
          caption,
          selectedFontChoice,
          negativeOffset,
          wordAnimationDuration,
          avgFontSize,
          selectedColorChoice,
        );

        // split scentence container styling
        const wordsProps = wordsData.map(word => {
          return {
            className: 'text-white',
          };
        });

        // Skip part animations if caption duration is too short
        const shouldAnimatePart = caption.duration >= 0.5;

        // Create part-specific effects using provider mode
        const partRanges = [
          { key: 'translateX', val: partIndex % 2 === 0 ? 20 : -20, prog: 0 },
          { key: 'translateX', val: partIndex % 2 === 0 ? -20 : 20, prog: 1 },
        ];

        const partEffect: GenericEffectData = {
          type: 'ease-out',
          start: 0,
          duration: 8, //caption.duration + 1,
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
              className:
                totalParts > 1
                  ? _i == 0
                    ? 'relative flex flex-row gap-8 items-center justify-center'
                    : 'relative flex flex-row gap-8 items-center justify-center'
                  : 'relative flex flex-row gap-8 items-center justify-center',
              // style: {
              //   background: 'rgba(0, 0, 0, 0.25)',
              //   paddingHorizontal: 100,
              //   backdropFilter: 'blur(10px)',
              //   borderRadius: 50,
              // },
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
      });

      // Sentence-level animation: subtle left shift with exit effect
      const sentenceRanges = [
        { key: 'translateX', val: 100, prog: 0 },
        { key: 'translateX', val: -50, prog: 1 },
      ];

      const sentenceEffect: GenericEffectData = {
        type: 'ease-out',
        start: 0, // Start immediately when caption begins
        duration: caption.duration + 1,
        mode: 'provider',
        targetIds: [scentenceId],
        ranges: sentenceRanges,
      };

      const sentenceEffects = [
        {
          id: `sentence-effects-${scentenceId}`,
          componentId: 'generic',
          data: sentenceEffect,
        },
      ];
      // MAIN SCENTENCE BLOCK LAYOUT
      return {
        type: 'layout',
        id: scentenceId,
        componentId: 'BaseLayout',
        //effects: sentenceEffects,
        data: {
          containerProps: {
            className:
              'h-full flex flex-col items-start justify-center text-white gap-2 pl-10',
          },
          // childrenProps:
          //   totalParts > 1
          //     ? Array(totalParts).map((_, index) => ({
          //         style: {
          //           marginLeft: index % 2 === 0 ? '-200px' : '0',
          //           marginRight: index % 2 != 0 ? '0' : '-200px',
          //         },
          //       }))
          //     : [],
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

  // Random positioning logic
  const getRandomPosition = () => {
    if (!randomizePosition) {
      return {};
    }

    // Generate random position within 1920x1080 constraints
    // Leave some margin to ensure text is visible
    const maxTop = 1080 - 600; // Leave space for text height
    const maxLeft = 1920 - 1000; // Leave space for text width

    const randomTop = 100 + Math.random() * maxTop;
    const randomLeft = 100 + Math.random() * maxLeft;

    return {
      position: 'absolute' as const,
      top: `${randomTop}px`,
      left: `${randomLeft}px`,
    };
  };

  //generate childrenData for scenes.
  return {
    output: {
      config: {
        duration: processedCaptions[processedCaptions.length - 1].absoluteEnd!,
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
            childrenProps: Array(captionsCHildrenData.length)
              .fill({
                className: 'absolute',
              })
              .map(child => ({
                ...child,
                style: {
                  ...getRandomPosition(),
                  left: 100,
                },
              })),
          },
          context: {
            timing: {
              start: 0,
              duration:
                processedCaptions[processedCaptions.length - 1].absoluteEnd! -
                processedCaptions[0].absoluteStart!,
            },
          },
          childrenData: captionsCHildrenData,
        } as RenderableComponentData,
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

const plainSubtitlesPresetFunction = presetExecution.toString();

export const plainSubtitlesPreset = {
  metadata: presetMetadata,
  presetFunction: plainSubtitlesPresetFunction,
  presetParams: z.toJSONSchema(presetParams),
};

// I want ti to select 1 random font pair if not given.
// the placement of the scentence should be random.
// fontsizing should not be same, ( highlight should be highlighted )
// animation effects should be smooth ( not simple fade in )
// add boxed/glassy blur effects
// inversion of colors ( if dark image bg or plain colored bg)
