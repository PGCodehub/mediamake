// import { Transcription } from '@/app/types/transcription';
// import { RenderableComponentData } from '@microfox/datamotion';
// import { TextAtomData } from '@microfox/remotion';
// import z from 'zod';
// import { PresetMetadata, PresetOutput } from '../types';
// import { CSSProperties } from 'react';

// const presetParams = z.object({
//   inputCaptions: z.array(z.any()).describe('input captions (data-referrable)'),
//   position: z.object({
//     align: z.enum(['left', 'center', 'right']).default('center'),
//     verticalAlign: z.enum(['top', 'center', 'bottom']).default('center'),
//   }),
//   fontChoices: z
//     .array(
//       z.object({
//         primaryFont: z
//           .string()
//           .describe('primary font family like Roboto:600'),
//         headerFont: z.string().describe('header font family like BebasNeue'),
//       }),
//     )
//     .optional()
//     .describe('font choices - primary and header font families'),
//   colorChoices: z
//     .array(
//       z.object({
//         primary: z.string().describe('primary color'),
//         accent: z.string().describe('accent color'),
//       }),
//     )
//     .optional()
//     .describe('color choices - primary and accent colors'),
//   style: z
//     .object({
//       textTransformSub: z
//         .enum(['none', 'uppercase', 'lowercase', 'capitalize'])
//         .optional()
//         .describe('text transform for normal words'),
//       textTransformMain: z
//         .enum(['none', 'uppercase', 'lowercase', 'capitalize'])
//         .optional()
//         .describe('text transform for keywords'),
//     })
//     .optional()
//     .describe('style'),
//   avgFontSize: z.number().optional().describe('average font size'),
//   fontScaling: z
//     .object({
//       highlighted: z
//         .number()
//         .default(1.8)
//         .optional()
//         .describe('font size multiplier for keywords'),
//       normal: z
//         .number()
//         .default(1.0)
//         .optional()
//         .describe('font size multiplier for normal words'),
//     })
//     .optional()
//     .describe('font size scaling'),
// });

// const presetExecution = (
//   params: z.infer<typeof presetParams>,
// ): PresetOutput => {
//   const {
//     inputCaptions,
//     position,
//     avgFontSize,
//     colorChoices,
//     fontChoices,
//     style,
//     fontScaling,
//   } = params;

//   // Font choices configuration
//   const FONT_CHOICES =
//     fontChoices && fontChoices.length > 0
//       ? fontChoices
//       : [
//           {
//             primaryFont: 'Roboto:600',
//             headerFont: 'BebasNeue',
//           },
//         ];

//   // Color choices configuration
//   const COLOR_CHOICES =
//     colorChoices && colorChoices.length > 0
//       ? colorChoices
//       : [
//           {
//             primary: '#ffffff',
//             accent: '#ff6b6b',
//           },
//         ];

//   // Select random font and color choices
//   const selectedFontChoice =
//     FONT_CHOICES[Math.floor(Math.random() * FONT_CHOICES.length)];
//   const selectedColorChoice =
//     COLOR_CHOICES[Math.floor(Math.random() * COLOR_CHOICES.length)];

//   // Splits sentence into parts using metadata.splitParts if available
//   const splitSentenceIntoParts = (caption: any) => {
//     if (caption.metadata?.splitParts && caption.metadata.splitParts.length > 0) {
//       const parts: any[][] = [];
//       let currentWordIndex = 0;

//       for (const splitPart of caption.metadata.splitParts) {
//         const partWords: any[] = [];
//         const targetText = splitPart.trim().toLowerCase();
//         const targetWordCount = splitPart.split(' ').length;

//         while (currentWordIndex < caption.words.length && partWords.length < targetWordCount) {
//           const word = caption.words[currentWordIndex];
//           partWords.push(word);
//           currentWordIndex++;
//         }

//         if (partWords.length > 0) {
//           parts.push(partWords);
//         }
//       }

//       // Add any remaining words to the last part
//       if (currentWordIndex < caption.words.length) {
//         const lastPart = parts[parts.length - 1];
//         if (lastPart) {
//           lastPart.push(...caption.words.slice(currentWordIndex));
//         } else {
//           parts.push(caption.words.slice(currentWordIndex));
//         }
//       }

//       return parts.length > 0 ? parts : [caption.words];
//     }

//     // Fallback: return all words as single part
//     return [caption.words];
//   };

//   // Identify keyword words based on metadata
//   const identifyKeywords = (caption: any) => {
//     const keywordIndices: number[] = [];
//     if (caption.metadata?.keyword) {
//       const cleanKeyword = caption.metadata.keyword
//         .toLowerCase()
//         .replace(/[^a-zA-Z0-9]/g, '');
      
//       caption.words.forEach((word: any, index: number) => {
//         const cleanWord = word.text.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
//         if (cleanWord.includes(cleanKeyword) || cleanKeyword.includes(cleanWord)) {
//           keywordIndices.push(index);
//         }
//       });
//     }
//     return keywordIndices;
//   };

//   // Generates word data with styling (no animations in layout preset)
//   const generateWordsData = (
//     words: any[],
//     caption: any,
//     partId: string,
//     captionId: string,
//     keywordIndices: number[],
//     wordIndexOffset: number,
//   ) => {
//     return words.map((word: any, wordIndex: number) => {
//       const globalWordIndex = wordIndexOffset + wordIndex;
//       const wordId = `word-${globalWordIndex}-${partId}`;
//       const isKeyword = keywordIndices.includes(globalWordIndex);

//       // Calculate font size and style
//       const fontSize = avgFontSize ?? 50;
//       const highlightedMultiplier = fontScaling?.highlighted ?? 1.8;
//       const normalMultiplier = fontScaling?.normal ?? 1.0;
//       const fontCalculatedSize = isKeyword
//         ? fontSize * highlightedMultiplier
//         : fontSize * normalMultiplier;
      
//       const font = isKeyword
//         ? selectedFontChoice.headerFont
//         : selectedFontChoice.primaryFont;

//       const fontString = font || 'Roboto';
//       const fontFamily = fontString.includes(':')
//         ? fontString.split(':')[0]
//         : fontString;

//       // Parse font style from font string
//       let fontStyle: CSSProperties = {};
//       if (fontString.includes(':')) {
//         const _fontStyle = fontString.split(':');
//         if (_fontStyle.length > 1) {
//           fontStyle.fontWeight = parseInt(_fontStyle[1]);
//         }
//       }

//       // Set text colors based on keyword status
//       const textColor = isKeyword
//         ? selectedColorChoice.accent
//         : selectedColorChoice.primary;

//       // Apply text transform based on keyword status
//       const textTransform = isKeyword
//         ? style?.textTransformMain || 'none'
//         : style?.textTransformSub || 'none';

//       // Apply text transform to the word text
//       let transformedText = word.text;
//       switch (textTransform) {
//         case 'uppercase':
//           transformedText = word.text.toUpperCase();
//           break;
//         case 'lowercase':
//           transformedText = word.text.toLowerCase();
//           break;
//         case 'capitalize':
//           transformedText =
//             word.text.charAt(0).toUpperCase() +
//             word.text.slice(1).toLowerCase();
//           break;
//         case 'none':
//         default:
//           transformedText = word.text;
//           break;
//       }

//       return {
//         type: 'atom',
//         id: wordId,
//         componentId: 'TextAtom',
//         effects: [], // NO effects in layout preset
//         data: {
//           text: transformedText,
//           className: isKeyword
//             ? 'font-bold tracking-wide'
//             : 'font-normal',
//                   style: {
//                     fontSize: fontCalculatedSize,
//                     color: textColor,
//                     opacity: 0, // Start invisible - animation preset will fade in
//                     ...fontStyle,
//                   },
//           font: {
//             family: fontFamily,
//           },
//         } as TextAtomData,
//         context: {
//           timing: {
//             start: 0,
//             duration: caption.duration,
//           },
//         },
//       } as RenderableComponentData;
//     });
//   };

//   // Creates part-specific layout
//   const createPartLayout = (
//     partWords: any[],
//     partIndex: number,
//     caption: any,
//     partId: string,
//     captionId: string,
//     keywordIndices: number[],
//     wordIndexOffset: number,
//   ) => {
//     const wordsData = generateWordsData(
//       partWords,
//       caption,
//       partId,
//       captionId,
//       keywordIndices,
//       wordIndexOffset,
//     );

//     const baseFontSize = avgFontSize || 50;
//     const gapSize = Math.max(8, Math.floor(baseFontSize * 0.3));
//     const containerClassName =
//       'relative flex flex-row items-center justify-center';

//     return {
//       type: 'layout',
//       id: partId,
//       componentId: 'BaseLayout',
//       effects: [], // NO effects in layout preset
//       data: {
//         containerProps: {
//           className: containerClassName,
//           style: {
//             gap: `${gapSize}px`,
//           },
//         },
//       },
//       context: {
//         boundaries: {
//           reset: true,
//         },
//         timing: {
//           start: 0,
//           duration: caption.duration,
//         },
//       },
//       childrenData: wordsData,
//     } as RenderableComponentData;
//   };

//   // Processes captions and creates layout structure
//   const processCaptions = (inputCaptions: any[]) => {
//     return inputCaptions.map((caption: any, captionIndex: number) => {
//       const captionId = `caption-${captionIndex}`;

//       // Split sentence into parts
//       const sentenceParts = splitSentenceIntoParts(caption);

//       // Identify keywords
//       const keywordIndices = identifyKeywords(caption);

//       // Create layout for each part
//       let wordIndexOffset = 0;
//       const partsData = sentenceParts.map((partWords: any[], partIndex: number) => {
//         const partId = `part-${partIndex}-${captionId}`;
//         const partLayout = createPartLayout(
//           partWords,
//           partIndex,
//           caption,
//           partId,
//           captionId,
//           keywordIndices,
//           wordIndexOffset,
//         );
//         wordIndexOffset += partWords.length;
//         return partLayout;
//       });

//       // Determine vertical alignment class
//       const verticalAlignClass =
//         position.verticalAlign === 'top'
//           ? 'justify-start'
//           : position.verticalAlign === 'bottom'
//             ? 'justify-end'
//             : 'justify-center';

//       // Determine horizontal alignment class
//       const horizontalAlignClass =
//         position.align === 'left'
//           ? 'items-start'
//           : position.align === 'right'
//             ? 'items-end'
//             : 'items-center';

//       // Main caption container with vertical layout
//       const mainLayoutClassName = `h-full flex flex-col ${horizontalAlignClass} ${verticalAlignClass} text-white gap-4`;

//       return {
//         type: 'layout',
//         id: captionId,
//         componentId: 'BaseLayout',
//         effects: [], // NO effects in layout preset
//         data: {
//           containerProps: {
//             className: mainLayoutClassName,
//           },
//         },
//         context: {
//           boundaries: {
//             reset: true,
//           },
//           timing: {
//             start: caption.absoluteStart,
//             duration: caption.duration,
//           },
//         },
//         childrenData: partsData,
//       } as RenderableComponentData;
//     });
//   };

//   // Process all captions
//   const captionsChildrenData = processCaptions(inputCaptions);

//   // Calculate total duration
//   const totalDuration =
//     captionsChildrenData.length > 0
//       ? captionsChildrenData[captionsChildrenData.length - 1].context?.timing
//           ?.start! +
//         captionsChildrenData[captionsChildrenData.length - 1].context?.timing
//           ?.duration!
//       : 10;

//   // Generate final composition structure
//   return {
//     output: {
//       config: {
//         duration: totalDuration,
//       },
//       childrenData: [
//         {
//           id: 'KineticLayoutContainer',
//           componentId: 'BaseLayout',
//           type: 'layout',
//           data: {
//             containerProps: {
//               className: 'absolute inset-0',
//             },
//           },
//           context: {
//             timing: {
//               start: 0,
//               duration: totalDuration,
//             },
//           },
//           childrenData: captionsChildrenData,
//         } as RenderableComponentData,
//       ],
//     },
//     options: {
//       attachedToId: `BaseScene`,
//       attachedContainers: [
//         {
//           className: 'absolute inset-0',
//         },
//       ],
//     },
//   };
// };

// const presetMetadata: PresetMetadata = {
//   id: 'sub-kinetic-layout-vertical',
//   title: 'Kinetic Layout - Vertical',
//   description:
//     'Layout preset for kinetic typography that arranges words in vertical parts based on splitParts metadata. Creates structure with proper IDs for animation targeting.',
//   type: 'predefined',
//   presetType: 'children',
//   tags: [
//     'kinetic',
//     'layout',
//     'vertical',
//     'typography',
//     'structure',
//   ],
//   defaultInputParams: {
//     position: {
//       align: 'center',
//       verticalAlign: 'center',
//     },
//     avgFontSize: 50,
//     fontScaling: {
//       highlighted: 1.8,
//       normal: 1.0,
//     },
//     // Example structure (actual captions come from your video)
//     inputCaptions: [
//       {
//         text: 'Example caption text',
//         absoluteStart: 0,
//         absoluteEnd: 2,
//         duration: 2,
//         metadata: {
//           splitParts: ['Example caption', 'text'],
//           keyword: 'caption',
//         },
//         words: [], // Words will come from your actual transcription
//       },
//     ],
//   },
// };

// const _presetExecution = presetExecution.toString();

// export const subKineticLayoutVerticalPreset = {
//   metadata: presetMetadata,
//   presetFunction: _presetExecution,
//   presetParams: z.toJSONSchema(presetParams),
// };

