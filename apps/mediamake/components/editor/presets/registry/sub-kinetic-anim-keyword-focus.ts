// import { RenderableComponentData } from '@microfox/datamotion';
// import { GenericEffectData } from '@microfox/remotion';
// import z from 'zod';
// import { PresetMetadata, PresetOutput } from '../types';

// const presetParams = z.object({
//   inputCaptions: z.array(z.any()).describe('input captions (data-referrable)'),
//   animationConfig: z.object({
//     normalAnimation: z
//       .enum([
//         'fade-in',
//         'fade-in-slide',
//         'fade-in-scale',
//         'fade-in-blur',
//       ])
//       .default('fade-in')
//       .describe('animation style for normal words'),
//     keywordAnimation: z
//       .enum([
//         'explosive-scale',
//         'glow-pulse',
//         'shake-glow',
//         'bounce-glow',
//         'rotate-glow',
//       ])
//       .default('explosive-scale')
//       .describe('special animation style for keywords'),
//     normalDuration: z
//       .number()
//       .default(0.4)
//       .describe('duration for normal word animation'),
//     keywordDuration: z
//       .number()
//       .default(0.8)
//       .describe('duration for keyword animation'),
//     intensity: z
//       .number()
//       .default(1.0)
//       .describe('global animation intensity multiplier'),
//   }),
//   colorChoices: z
//     .array(
//       z.object({
//         accent: z.string().describe('accent color for effects'),
//       }),
//     )
//     .optional()
//     .describe('color choices for effects'),
// });

// const presetExecution = (
//   params: z.infer<typeof presetParams>,
// ): PresetOutput => {
//   const { inputCaptions, animationConfig, colorChoices } = params;

//   // Color choices configuration
//   const COLOR_CHOICES =
//     colorChoices && colorChoices.length > 0
//       ? colorChoices
//       : [
//           {
//             accent: '#ff6b6b',
//           },
//         ];

//   // Select random color choice
//   const selectedColorChoice =
//     COLOR_CHOICES[Math.floor(Math.random() * COLOR_CHOICES.length)];

//   // Utility function to convert hex color to RGB
//   const hexToRgb = (hex: string) => {
//     return {
//       r: parseInt(hex.slice(1, 3), 16),
//       g: parseInt(hex.slice(3, 5), 16),
//       b: parseInt(hex.slice(5, 7), 16),
//     };
//   };

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

//   // Create normal word animation
//   const createNormalAnimation = (
//     wordId: string,
//     word: any,
//     animationStyle: string,
//     duration: number,
//     intensity: number,
//   ): GenericEffectData => {
//     const ranges: any[] = [];

//     switch (animationStyle) {
//       case 'fade-in':
//         ranges.push({ key: 'opacity', val: 0, prog: 0 });
//         ranges.push({ key: 'opacity', val: 1, prog: 1 });
//         break;

//       case 'fade-in-slide':
//         ranges.push({ key: 'opacity', val: 0, prog: 0 });
//         ranges.push({ key: 'opacity', val: 1, prog: 1 });
//         ranges.push({ key: 'translateY', val: 10 * intensity, prog: 0 });
//         ranges.push({ key: 'translateY', val: 0, prog: 1 });
//         break;

//       case 'fade-in-scale':
//         ranges.push({ key: 'opacity', val: 0, prog: 0 });
//         ranges.push({ key: 'opacity', val: 1, prog: 1 });
//         ranges.push({ key: 'scale', val: 0.9, prog: 0 });
//         ranges.push({ key: 'scale', val: 1, prog: 1 });
//         break;

//       case 'fade-in-blur':
//         ranges.push({ key: 'opacity', val: 0, prog: 0 });
//         ranges.push({ key: 'opacity', val: 1, prog: 1 });
//         ranges.push({ key: 'filter', val: 'blur(4px)', prog: 0 });
//         ranges.push({ key: 'filter', val: 'blur(0px)', prog: 1 });
//         break;
//     }

//     return {
//       id: `${wordId}-normal-anim`,
//       componentId: 'generic',
//       data: {
//         type: 'ease-out',
//         start: word.absoluteStart, // Use absolute time directly
//         duration: duration,
//         ranges: ranges,
//         extrapolate: {
//           left: 'clamp',   // Stay at start value before animation
//           right: 'clamp',  // Stay at end value after animation
//         },
//       } as GenericEffectData,
//     };
//   };

//   // Create keyword animation with special effects
//   const createKeywordAnimation = (
//     wordId: string,
//     word: any,
//     animationStyle: string,
//     duration: number,
//     intensity: number,
//     selectedColorChoice: any,
//   ): GenericEffectData[] => {
//     const effects: GenericEffectData[] = [];
//     const accentRgb = hexToRgb(selectedColorChoice.accent);

//     // Base fade-in effect
//     effects.push({
//       id: `${wordId}-keyword-fade`,
//       componentId: 'generic',
//       data: {
//         type: 'ease-out',
//         start: word.absoluteStart, // Use absolute time directly
//         duration: duration * 0.6,
//         ranges: [
//           { key: 'opacity', val: 0, prog: 0 },
//           { key: 'opacity', val: 1, prog: 1 },
//         ],
//         extrapolate: {
//           left: 'clamp',
//           right: 'clamp',
//         },
//       } as GenericEffectData,
//     });

//     switch (animationStyle) {
//       case 'explosive-scale':
//         // Explosive scale effect
//         effects.push({
//           id: `${wordId}-explosive-scale`,
//           componentId: 'generic',
//           data: {
//             type: 'spring',
//             start: word.absoluteStart, // Use absolute time directly
//             duration: duration,
//             ranges: [
//               { key: 'scale', val: 0.5, prog: 0 },
//               { key: 'scale', val: 1.3 * intensity, prog: 0.6 },
//               { key: 'scale', val: 1, prog: 1 },
//             ],
//           } as GenericEffectData,
//         });

//         // Glow effect
//         effects.push({
//           id: `${wordId}-explosive-glow`,
//           componentId: 'generic',
//           data: {
//             type: 'ease-out',
//             start: word.absoluteStart, // Use absolute time directly
//             duration: duration,
//             ranges: [
//               {
//                 key: 'filter',
//                 val: `drop-shadow(0 0 0px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0))`,
//                 prog: 0,
//               },
//               {
//                 key: 'filter',
//                 val: `drop-shadow(0 0 ${20 * intensity}px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.9)) drop-shadow(0 0 ${40 * intensity}px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.6))`,
//                 prog: 0.5,
//               },
//               {
//                 key: 'filter',
//                 val: `drop-shadow(0 0 ${10 * intensity}px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.8))`,
//                 prog: 1,
//               },
//             ],
//           } as GenericEffectData,
//         });
//         break;

//       case 'glow-pulse':
//         // Pulse scale effect
//         effects.push({
//           id: `${wordId}-pulse-scale`,
//           componentId: 'generic',
//           data: {
//             type: 'ease-in-out',
//             start: word.absoluteStart, // Use absolute time directly
//             duration: word.duration,
//             ranges: [
//               { key: 'scale', val: 1, prog: 0 },
//               { key: 'scale', val: 1.1 * intensity, prog: 0.5 },
//               { key: 'scale', val: 1, prog: 1 },
//             ],
//           } as GenericEffectData,
//         });

//         // Continuous glow effect
//         effects.push({
//           id: `${wordId}-pulse-glow`,
//           componentId: 'generic',
//           data: {
//             type: 'ease-in-out',
//             start: word.absoluteStart, // Use absolute time directly
//             duration: word.duration,
//             ranges: [
//               {
//                 key: 'filter',
//                 val: `drop-shadow(0 0 ${8 * intensity}px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.6))`,
//                 prog: 0,
//               },
//               {
//                 key: 'filter',
//                 val: `drop-shadow(0 0 ${16 * intensity}px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.9))`,
//                 prog: 0.5,
//               },
//               {
//                 key: 'filter',
//                 val: `drop-shadow(0 0 ${8 * intensity}px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.6))`,
//                 prog: 1,
//               },
//             ],
//           } as GenericEffectData,
//         });
//         break;

//       case 'shake-glow':
//         // Shake effect
//         const shakeRanges: any[] = [];
//         for (let i = 0; i <= 8; i++) {
//           const prog = i / 8;
//           const shakeValue = (i % 2 === 0 ? 1 : -1) * 3 * intensity;
//           shakeRanges.push({ key: 'translateX', val: shakeValue, prog });
//         }
//         shakeRanges.push({ key: 'translateX', val: 0, prog: 1 });

//         effects.push({
//           id: `${wordId}-shake`,
//           componentId: 'generic',
//           data: {
//             type: 'ease-out',
//             start: word.absoluteStart, // Use absolute time directly
//             duration: duration,
//             ranges: shakeRanges,
//           } as GenericEffectData,
//         });

//         // Glow effect
//         effects.push({
//           id: `${wordId}-shake-glow`,
//           componentId: 'generic',
//           data: {
//             type: 'ease-out',
//             start: word.absoluteStart, // Use absolute time directly
//             duration: duration,
//             ranges: [
//               {
//                 key: 'filter',
//                 val: `drop-shadow(0 0 0px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0))`,
//                 prog: 0,
//               },
//               {
//                 key: 'filter',
//                 val: `drop-shadow(0 0 ${12 * intensity}px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.9))`,
//                 prog: 0.5,
//               },
//               {
//                 key: 'filter',
//                 val: `drop-shadow(0 0 ${8 * intensity}px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.7))`,
//                 prog: 1,
//               },
//             ],
//           } as GenericEffectData,
//         });
//         break;

//       case 'bounce-glow':
//         // Bounce effect
//         effects.push({
//           id: `${wordId}-bounce`,
//           componentId: 'generic',
//           data: {
//             type: 'spring',
//             start: word.absoluteStart, // Use absolute time directly
//             duration: duration,
//             ranges: [
//               { key: 'translateY', val: -20 * intensity, prog: 0 },
//               { key: 'translateY', val: 5 * intensity, prog: 0.6 },
//               { key: 'translateY', val: 0, prog: 1 },
//             ],
//           } as GenericEffectData,
//         });

//         // Glow effect
//         effects.push({
//           id: `${wordId}-bounce-glow`,
//           componentId: 'generic',
//           data: {
//             type: 'ease-out',
//             start: word.absoluteStart, // Use absolute time directly
//             duration: duration,
//             ranges: [
//               {
//                 key: 'filter',
//                 val: `drop-shadow(0 0 0px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0))`,
//                 prog: 0,
//               },
//               {
//                 key: 'filter',
//                 val: `drop-shadow(0 0 ${15 * intensity}px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.9))`,
//                 prog: 0.5,
//               },
//               {
//                 key: 'filter',
//                 val: `drop-shadow(0 0 ${8 * intensity}px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.7))`,
//                 prog: 1,
//               },
//             ],
//           } as GenericEffectData,
//         });
//         break;

//       case 'rotate-glow':
//         // Rotation effect
//         effects.push({
//           id: `${wordId}-rotate`,
//           componentId: 'generic',
//           data: {
//             type: 'spring',
//             start: word.absoluteStart, // Use absolute time directly
//             duration: duration,
//             ranges: [
//               { key: 'rotate', val: -15 * intensity, prog: 0 },
//               { key: 'rotate', val: 5 * intensity, prog: 0.5 },
//               { key: 'rotate', val: 0, prog: 1 },
//             ],
//           } as GenericEffectData,
//         });

//         // Scale with rotation
//         effects.push({
//           id: `${wordId}-rotate-scale`,
//           componentId: 'generic',
//           data: {
//             type: 'spring',
//             start: word.absoluteStart, // Use absolute time directly
//             duration: duration,
//             ranges: [
//               { key: 'scale', val: 0.8, prog: 0 },
//               { key: 'scale', val: 1.2 * intensity, prog: 0.5 },
//               { key: 'scale', val: 1, prog: 1 },
//             ],
//           } as GenericEffectData,
//         });

//         // Glow effect
//         effects.push({
//           id: `${wordId}-rotate-glow`,
//           componentId: 'generic',
//           data: {
//             type: 'ease-out',
//             start: word.absoluteStart, // Use absolute time directly
//             duration: duration,
//             ranges: [
//               {
//                 key: 'filter',
//                 val: `drop-shadow(0 0 0px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0))`,
//                 prog: 0,
//               },
//               {
//                 key: 'filter',
//                 val: `drop-shadow(0 0 ${18 * intensity}px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.9))`,
//                 prog: 0.5,
//               },
//               {
//                 key: 'filter',
//                 val: `drop-shadow(0 0 ${10 * intensity}px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.7))`,
//                 prog: 1,
//               },
//             ],
//           } as GenericEffectData,
//         });
//         break;
//     }

//     return effects;
//   };

//   // Process captions and create animation effects - now returns word component data with effects
//   const processCaptions = (inputCaptions: any[]) => {
//     const allWordComponentData: any[] = [];

//     inputCaptions.forEach((caption: any, captionIndex: number) => {
//       const captionId = `caption-${captionIndex}`;
//       const captionStart = caption.absoluteStart || 0;

//       // Split sentence into parts (MUST match layout logic)
//       const sentenceParts = splitSentenceIntoParts(caption);

//       // Identify keywords
//       const keywordIndices = identifyKeywords(caption);

//       // Process each part to generate matching IDs
//       let wordIndexOffset = 0;
//       sentenceParts.forEach((partWords: any[], partIndex: number) => {
//         const partId = `part-${partIndex}-${captionId}`;

//         // Create effects for each word in this part
//         partWords.forEach((word: any, localWordIndex: number) => {
//           const globalWordIndex = wordIndexOffset + localWordIndex;
//           const wordId = `word-${globalWordIndex}-${partId}`;
//           const isKeyword = keywordIndices.includes(globalWordIndex);

//           const wordEffects: any[] = [];

//           if (isKeyword) {
//             // Create special keyword animation
//             const keywordEffects = createKeywordAnimation(
//               wordId,
//               word,
//               animationConfig.keywordAnimation,
//               animationConfig.keywordDuration,
//               animationConfig.intensity,
//               selectedColorChoice,
//             );

//             // Add all keyword effects (returns array)
//             wordEffects.push(...keywordEffects);
//           } else {
//             // Create normal animation
//             const normalEffect = createNormalAnimation(
//               wordId,
//               word,
//               animationConfig.normalAnimation,
//               animationConfig.normalDuration,
//               animationConfig.intensity,
//             );

//             // Add single normal effect
//             wordEffects.push(normalEffect);
//           }

//           // Create word component data with effects attached
//           allWordComponentData.push({
//             id: wordId,
//             effects: wordEffects,
//           });
//         });

//         wordIndexOffset += partWords.length;
//       });
//     });

//     return allWordComponentData;
//   };

//   // Process all captions
//   const wordComponentsWithEffects = processCaptions(inputCaptions);

//   // Calculate total duration
//   const totalDuration =
//     inputCaptions.length > 0
//       ? inputCaptions[inputCaptions.length - 1].absoluteEnd
//       : 10;

//   // Generate final composition structure - return word components with their effects
//   return {
//     output: {
//       config: {
//         duration: totalDuration,
//       },
//       childrenData: wordComponentsWithEffects, // ← Each word gets its own effects directly
//     },
//     options: {
//       presetType: 'effects',  // Use effects mode to merge effects into matching word components
//     },
//   };
// };

// const presetMetadata: PresetMetadata = {
//   id: 'sub-kinetic-anim-keyword-focus',
//   title: 'Kinetic Animation - Keyword Focus',
//   description:
//     'Animation preset for kinetic typography that applies simple fade-in to normal words and explosive special effects to keywords. Works with layout presets.',
//   type: 'predefined',
//   presetType: 'children',
//   tags: [
//     'kinetic',
//     'animation',
//     'keyword',
//     'focus',
//     'explosive',
//     'glow',
//     'effects',
//   ],
//   defaultInputParams: {
//     animationConfig: {
//       normalAnimation: 'fade-in',
//       keywordAnimation: 'explosive-scale',
//       normalDuration: 0.4,
//       keywordDuration: 0.8,
//       intensity: 1.0,
//     },
//     // Example structure (actual captions come from your video)
//     inputCaptions: [
//       {
//         text: 'Example caption text',
//         absoluteStart: 0,
//         absoluteEnd: 2,
//         duration: 2,
//         metadata: {
//           keyword: 'caption',
//         },
//         words: [], // Words will come from your actual transcription
//       },
//     ],
//   },
// };

// const _presetExecution = presetExecution.toString();

// export const subKineticAnimKeywordFocusPreset = {
//   metadata: presetMetadata,
//   presetFunction: _presetExecution,
//   presetParams: z.toJSONSchema(presetParams),
// };

