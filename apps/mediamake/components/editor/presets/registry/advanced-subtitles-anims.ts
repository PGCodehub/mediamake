import { RenderableComponentData } from '@microfox/datamotion';
import { GenericEffectData, TextAtomData } from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

// ============================================================
// STEP 1: Define comprehensive params (supports both approaches)
// ============================================================
const presetParams = z.object({
  inputCaptions: z.array(z.any()),

  // Sentence-level pattern rules
  sentenceStyles: z
    .array(
      z.object({
        pattern: z.string().describe('Regex pattern to match sentence text'),
        position: z
          .enum(['bottom', 'center', 'top'])
          .optional()
          .describe('Position for matched sentences'),
        fontSize: z.number().optional().describe('Font size for sentence'),
        color: z.string().optional().describe('Text color for sentence'),
        backgroundColor: z
          .string()
          .optional()
          .describe('Background color for sentence container'),
        maxWidth: z
          .string()
          .optional()
          .describe(
            'Max width for this sentence (overrides global maxWidth)',
          ),
        textAlign: z
          .enum(['left', 'center', 'right'])
          .optional()
          .describe('Text alignment within container (default: center)'),
      }),
    )
    .optional()
    .default([])
    .describe('Array of pattern-based sentence styling rules'),

  // Word-level pattern rules
  wordEffects: z
    .array(
      z.object({
        pattern: z.string().describe('Regex pattern to match words'),
        effectType: z.enum([
          'highlight',
          'circle',
          'glow',
          'counter',
          'underline',
          'box',
        ]),
        color: z.string().optional(),
        backgroundColor: z.string().optional(),
        counterStart: z.number().optional(),
      }),
    )
    .optional()
    .default([])
    .describe('Array of pattern-based word effects'),

  // Control options
  disableMetadata: z
    .boolean()
    .optional()
    .default(false)
    .describe('Disable metadata-based effects'),

  // Styling defaults
  fontSize: z.number().optional().default(50).describe('Base font size'),
  defaultColor: z
    .string()
    .optional()
    .default('#FFFFFF')
    .describe('Default text color'),
  position: z
    .enum(['bottom', 'center', 'top'])
    .optional()
    .default('bottom')
    .describe('Default subtitle position on screen'),
  padding: z
    .string()
    .optional()
    .default('50px')
    .describe('Padding around subtitles'),
  maxWidth: z
    .string()
    .optional()
    .default('90%')
    .describe('Maximum width of subtitle container (percentage or px)'),
  textAlign: z
    .enum(['left', 'center', 'right'])
    .optional()
    .default('center')
    .describe('Default text alignment within container'),
});

// ============================================================
// STEP 2: Implement preset execution with priority system
// ============================================================
const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  const {
    inputCaptions,
    disableMetadata,
    sentenceStyles,
    wordEffects,
    fontSize,
    defaultColor,
    position,
    padding,
    maxWidth,
    textAlign,
  } = params;

  // ============================================================
  // Shared utilities
  // ============================================================
  const hexToRgb = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });

  const extractNumber = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  // ============================================================
  // Effect creation functions
  // ============================================================
  const createHighlightWord = (
    word: any,
    index: number,
    config: any,
    caption: any,
  ): RenderableComponentData => {
    return {
      type: 'atom',
      id: `highlight-${index}`,
      componentId: 'TextAtom',
      effects: [
        {
          id: `draw-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: word.start,
            duration: 0.3,
            mode: 'provider',
            targetIds: [`highlight-${index}`],
            ranges: [
              { key: 'opacity', val: 0, prog: 0 },
              { key: 'opacity', val: 1, prog: 0.3 },
              { key: 'scaleX', val: 0, prog: 0 },
              { key: 'scaleX', val: 1, prog: 1 },
              { key: 'scale', val: 1, prog: 0 },
              { key: 'scale', val: 1.1, prog: 0.5 },
              { key: 'scale', val: 1, prog: 1 },
            ],
          } as GenericEffectData,
        },
        {
          id: `fade-out-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: caption.duration - 0.2,
            duration: 0.2,
            mode: 'provider',
            targetIds: [`highlight-${index}`],
            ranges: [
              { key: 'opacity', val: 1, prog: 0 },
              { key: 'opacity', val: 0, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        text: word.text,
        style: {
          fontSize: config.fontSize || 55,
          fontWeight: 900,
          color: config.color || '#000000',
          backgroundColor: config.backgroundColor || '#FFEB3B',
          padding: '8px 16px',
          borderRadius: '8px',
          display: 'inline-block',
          transformOrigin: 'left center',
        },
        font: { family: 'Inter', weights: ['900'] },
      } as TextAtomData,
      context: {
        timing: { start: 0, duration: caption.duration },
      },
    } as RenderableComponentData;
  };

  const createCircleWord = (
    word: any,
    index: number,
    config: any,
    caption: any,
  ): RenderableComponentData => {
    const color = config.color || '#FF0000';
    const rgb = hexToRgb(color);

    const circle = {
      type: 'atom',
      id: `circle-${index}`,
      componentId: 'ShapeAtom',
      effects: [
        {
          id: `circle-draw-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: word.start,
            duration: 0.5,
            mode: 'provider',
            targetIds: [`circle-${index}`],
            ranges: [
              { key: 'opacity', val: 0, prog: 0 },
              { key: 'opacity', val: 1, prog: 0.3 },
              { key: 'scale', val: 0, prog: 0 },
              { key: 'scale', val: 1.1, prog: 0.7 },
              { key: 'scale', val: 1, prog: 1 },
              { key: 'rotate', val: -10, prog: 0 },
              { key: 'rotate', val: 0, prog: 1 },
              {
                key: 'filter',
                val: `drop-shadow(0 0 15px rgba(${rgb.r},${rgb.g},${rgb.b},0.8))`,
                prog: 1,
              },
            ],
          } as GenericEffectData,
        },
        {
          id: `circle-fade-out-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: caption.duration - 0.2,
            duration: 0.2,
            mode: 'provider',
            targetIds: [`circle-${index}`],
            ranges: [
              { key: 'opacity', val: 1, prog: 0 },
              { key: 'opacity', val: 0, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        shape: 'circle' as const,
        color: 'transparent',
        style: { border: `5px solid ${color}` },
      },
      context: { timing: { start: 0, duration: caption.duration } },
    };

    const text = {
      type: 'atom',
      id: `text-${index}`,
      componentId: 'TextAtom',
      effects: [
        {
          id: `pop-${index}`,
          componentId: 'generic',
          data: {
            type: 'spring',
            start: word.start + 0.2,
            duration: 0.2,
            mode: 'provider',
            targetIds: [`text-${index}`],
            ranges: [
              { key: 'scale', val: 0.5, prog: 0 },
              { key: 'scale', val: 1, prog: 1 },
            ],
          } as GenericEffectData,
        },
        {
          id: `text-fade-out-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: caption.duration - 0.2,
            duration: 0.2,
            mode: 'provider',
            targetIds: [`text-${index}`],
            ranges: [
              { key: 'opacity', val: 1, prog: 0 },
              { key: 'opacity', val: 0, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        text: word.text,
        style: { fontSize: config.fontSize || 55, fontWeight: 900, color },
        font: { family: 'BebasNeue' },
      } as TextAtomData,
      context: { timing: { start: 0, duration: caption.duration } },
    };

    return {
      type: 'layout',
      id: `circled-${index}`,
      componentId: 'BaseLayout',
      data: {
        containerProps: {
          className: 'relative inline-block',
          style: { padding: '25px' },
        },
        childrenProps: [
          { className: 'absolute inset-0' },
          { className: 'relative z-10 flex items-center justify-center' },
        ],
      },
      context: { timing: { start: 0, duration: caption.duration } },
      childrenData: [circle, text],
    } as RenderableComponentData;
  };

  const createGlowWord = (
    word: any,
    index: number,
    config: any,
    caption: any,
  ): RenderableComponentData => {
    const color = config.color || '#FFD700';
    const rgb = hexToRgb(color);

    return {
      type: 'atom',
      id: `glow-${index}`,
      componentId: 'TextAtom',
      effects: [
        {
          id: `glow-entrance-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: word.start,
            duration: 0.4,
            mode: 'provider',
            targetIds: [`glow-${index}`],
            ranges: [
              { key: 'scale', val: 0.5, prog: 0 },
              { key: 'scale', val: 1.2, prog: 0.6 },
              { key: 'scale', val: 1, prog: 1 },
              { key: 'opacity', val: 0, prog: 0 },
              { key: 'opacity', val: 1, prog: 1 },
              {
                key: 'filter',
                val: `drop-shadow(0 0 0px rgba(${rgb.r},${rgb.g},${rgb.b},0))`,
                prog: 0,
              },
              {
                key: 'filter',
                val: `drop-shadow(0 0 20px rgba(${rgb.r},${rgb.g},${rgb.b},0.8))`,
                prog: 1,
              },
            ],
          } as GenericEffectData,
        },
        {
          id: `glow-fade-out-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: caption.duration - 0.2,
            duration: 0.2,
            mode: 'provider',
            targetIds: [`glow-${index}`],
            ranges: [
              { key: 'opacity', val: 1, prog: 0 },
              { key: 'opacity', val: 0, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        text: word.text,
        style: {
          fontSize: config.fontSize || 60,
          fontWeight: 900,
          color: color,
        },
        font: { family: 'BebasNeue' },
      } as TextAtomData,
      context: { timing: { start: 0, duration: caption.duration } },
    } as RenderableComponentData;
  };

  const createCounterWord = (
    word: any,
    index: number,
    config: any,
    caption: any,
  ): RenderableComponentData => {
    const endValue = config.counterEnd || extractNumber(word.text);
    const startValue = config.counterStart || 0;
    const steps = config.steps || 20;
    const stepDuration = word.duration / steps;
    const prefix = config.prefix || '$';

    const counterSteps = Array.from({ length: steps }, (_, i) => {
      const progress = i / (steps - 1);
      const currentValue = Math.round(
        startValue + (endValue - startValue) * progress,
      );

      const formattedValue = `${prefix}${currentValue.toLocaleString()}`;

      return {
        type: 'atom',
        id: `counter-step-${index}-${i}`,
        componentId: 'TextAtom',
        effects: [
          {
            id: `fade-${index}-${i}`,
            componentId: 'generic',
            data: {
              type: 'linear',
              start: 0,
              duration: stepDuration * 1.2,
              mode: 'provider',
              targetIds: [`counter-step-${index}-${i}`],
              ranges: [
                { key: 'opacity', val: 1, prog: 0 },
                { key: 'opacity', val: 0, prog: 1 },
              ],
            } as GenericEffectData,
          },
        ],
        data: {
          text: formattedValue,
          className: 'absolute inset-0 font-black',
          style: {
            fontSize: config.fontSize || 70,
            fontWeight: 900,
            color: config.color || '#FFD700',
            textShadow: '0 0 20px rgba(255,215,0,0.6)',
          },
          font: { family: 'BebasNeue' },
        } as TextAtomData,
        context: {
          timing: {
            start: stepDuration * i,
            duration: stepDuration * 1.2,
          },
        },
      } as RenderableComponentData;
    });

    return {
      type: 'layout',
      id: `counter-${index}`,
      componentId: 'BaseLayout',
      effects: [
        {
          id: `counter-fade-in-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-in',
            start: word.start,
            duration: 0.15,
            mode: 'wrapper',
            ranges: [
              { key: 'opacity', val: 0, prog: 0 },
              { key: 'opacity', val: 1, prog: 1 },
            ],
          } as GenericEffectData,
        },
        {
          id: `counter-fade-out-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: caption.duration - 0.2,
            duration: 0.2,
            mode: 'wrapper',
            ranges: [
              { key: 'opacity', val: 1, prog: 0 },
              { key: 'opacity', val: 0, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        containerProps: {
          className: 'relative inline-block',
          style: {
            minWidth: '250px',
            height: '80px',
          },
        },
      },
      context: {
        timing: { start: 0, duration: caption.duration },
      },
      childrenData: counterSteps,
    } as RenderableComponentData;
  };

  const createUnderlineWord = (
    word: any,
    index: number,
    config: any,
    caption: any,
  ): RenderableComponentData => {
    const color = config.color || '#FFD700';

    const underline = {
      type: 'atom',
      id: `underline-${index}`,
      componentId: 'ShapeAtom',
      effects: [
        {
          id: `underline-draw-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: word.start,
            duration: 0.4,
            mode: 'provider',
            targetIds: [`underline-${index}`],
            ranges: [
              { key: 'opacity', val: 0, prog: 0 },
              { key: 'opacity', val: 1, prog: 0.2 },
              { key: 'scaleX', val: 0, prog: 0 },
              { key: 'scaleX', val: 1, prog: 1 },
            ],
          } as GenericEffectData,
        },
        {
          id: `underline-shape-fade-out-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: caption.duration - 0.2,
            duration: 0.2,
            mode: 'provider',
            targetIds: [`underline-${index}`],
            ranges: [
              { key: 'opacity', val: 1, prog: 0 },
              { key: 'opacity', val: 0, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        shape: 'rectangle' as const,
        color: color,
        style: {
          height: '4px',
          width: '100%',
        },
      },
      context: { timing: { start: 0, duration: caption.duration } },
    };

    const text = {
      type: 'atom',
      id: `underlined-text-${index}`,
      componentId: 'TextAtom',
      effects: [
        {
          id: `underlined-text-fade-in-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-in',
            start: word.start,
            duration: 0.15,
            mode: 'provider',
            targetIds: [`underlined-text-${index}`],
            ranges: [
              { key: 'opacity', val: 0, prog: 0 },
              { key: 'opacity', val: 1, prog: 1 },
            ],
          } as GenericEffectData,
        },
        {
          id: `underlined-text-fade-out-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: caption.duration - 0.2,
            duration: 0.2,
            mode: 'provider',
            targetIds: [`underlined-text-${index}`],
            ranges: [
              { key: 'opacity', val: 1, prog: 0 },
              { key: 'opacity', val: 0, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        text: word.text,
        className: 'font-bold',
        style: {
          fontSize: config.fontSize || 50,
          fontWeight: 700,
          color: color,
        },
        font: { family: 'Inter', weights: ['700'] },
      } as TextAtomData,
      context: { timing: { start: 0, duration: caption.duration } },
    };

    return {
      type: 'layout',
      id: `underlined-word-${index}`,
      componentId: 'BaseLayout',
      effects: [
        {
          id: `underline-fade-out-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: caption.duration - 0.2,
            duration: 0.2,
            mode: 'wrapper',
            ranges: [
              { key: 'opacity', val: 1, prog: 0 },
              { key: 'opacity', val: 0, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        containerProps: {
          className: 'relative inline-block',
        },
        childrenProps: [
          { className: 'pb-1' },
          {
            className: 'absolute bottom-0 left-0 right-0',
            style: { transformOrigin: 'left center' },
          },
        ],
      },
      context: { timing: { start: 0, duration: caption.duration } },
      childrenData: [text, underline],
    } as RenderableComponentData;
  };

  const createBoxWord = (
    word: any,
    index: number,
    config: any,
    caption: any,
  ): RenderableComponentData => {
    const color = config.color || '#FF0000';
    const rgb = hexToRgb(color);

    const box = {
      type: 'atom',
      id: `box-${index}`,
      componentId: 'ShapeAtom',
      effects: [
        {
          id: `box-draw-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: word.start,
            duration: 0.5,
            mode: 'provider',
            targetIds: [`box-${index}`],
            ranges: [
              { key: 'opacity', val: 0, prog: 0 },
              { key: 'opacity', val: 1, prog: 0.2 },
              { key: 'scale', val: 0, prog: 0 },
              { key: 'scale', val: 1.05, prog: 0.7 },
              { key: 'scale', val: 1, prog: 1 },
              {
                key: 'filter',
                val: `drop-shadow(0 0 10px rgba(${rgb.r},${rgb.g},${rgb.b},0.6))`,
                prog: 1,
              },
            ],
          } as GenericEffectData,
        },
        {
          id: `box-shape-fade-out-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: caption.duration - 0.2,
            duration: 0.2,
            mode: 'provider',
            targetIds: [`box-${index}`],
            ranges: [
              { key: 'opacity', val: 1, prog: 0 },
              { key: 'opacity', val: 0, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        shape: 'rectangle' as const,
        color: 'transparent',
        style: {
          border: `4px solid ${color}`,
          borderRadius: '8px',
        },
      },
      context: { timing: { start: 0, duration: caption.duration } },
    };

    const text = {
      type: 'atom',
      id: `boxed-text-${index}`,
      componentId: 'TextAtom',
      effects: [
        {
          id: `boxed-text-fade-in-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-in',
            start: word.start,
            duration: 0.15,
            mode: 'provider',
            targetIds: [`boxed-text-${index}`],
            ranges: [
              { key: 'opacity', val: 0, prog: 0 },
              { key: 'opacity', val: 1, prog: 1 },
            ],
          } as GenericEffectData,
        },
        {
          id: `boxed-text-fade-out-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: caption.duration - 0.2,
            duration: 0.2,
            mode: 'provider',
            targetIds: [`boxed-text-${index}`],
            ranges: [
              { key: 'opacity', val: 1, prog: 0 },
              { key: 'opacity', val: 0, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        text: word.text,
        style: { fontSize: config.fontSize || 55, fontWeight: 900, color },
        font: { family: 'BebasNeue' },
      } as TextAtomData,
      context: { timing: { start: 0, duration: caption.duration } },
    };

    return {
      type: 'layout',
      id: `boxed-${index}`,
      componentId: 'BaseLayout',
      effects: [
        {
          id: `box-fade-out-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: caption.duration - 0.2,
            duration: 0.2,
            mode: 'wrapper',
            ranges: [
              { key: 'opacity', val: 1, prog: 0 },
              { key: 'opacity', val: 0, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        containerProps: {
          className: 'relative inline-block',
          style: { padding: '15px 25px' },
        },
        childrenProps: [
          { className: 'absolute inset-0' },
          { className: 'relative z-10 flex items-center justify-center' },
        ],
      },
      context: { timing: { start: 0, duration: caption.duration } },
      childrenData: [box, text],
    } as RenderableComponentData;
  };

  const createRegularWord = (
    word: any,
    index: number,
    config: any,
    caption: any,
  ): RenderableComponentData => {
    return {
      type: 'atom',
      id: `word-${index}`,
      componentId: 'TextAtom',
      effects: [
        {
          id: `fade-in-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-in',
            start: word.start,
            duration: 0.15,
            mode: 'provider',
            targetIds: [`word-${index}`],
            ranges: [
              { key: 'opacity', val: 0, prog: 0 },
              { key: 'opacity', val: 1, prog: 1 },
            ],
          } as GenericEffectData,
        },
        {
          id: `fade-out-${index}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: caption.duration - 0.2,
            duration: 0.2,
            mode: 'provider',
            targetIds: [`word-${index}`],
            ranges: [
              { key: 'opacity', val: 1, prog: 0 },
              { key: 'opacity', val: 0, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        text: word.text,
        style: {
          fontSize: config.fontSize || 50,
          color: config.color || '#FFFFFF',
        },
        font: { family: 'Inter' },
      } as TextAtomData,
      context: { timing: { start: 0, duration: caption.duration } },
    } as RenderableComponentData;
  };

  // ============================================================
  // Helper functions
  // ============================================================
  const findSentenceStyle = (captionText: string) => {
    for (const style of sentenceStyles) {
      const regex = new RegExp(style.pattern, 'i');
      if (regex.test(captionText)) {
        return style;
      }
    }
    return null;
  };

  const findPatternEffect = (wordText: string) => {
    for (const effect of wordEffects) {
      const regex = new RegExp(effect.pattern, 'i');
      if (regex.test(wordText)) {
        return effect;
      }
    }
    return null;
  };

  const getPositionStyle = (positionOverride?: string) => {
    const pos = positionOverride || position;
    switch (pos) {
      case 'center':
        return {
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        };
      case 'top':
        return {
          top: padding,
          left: '0',
          right: '0',
        };
      case 'bottom':
      default:
        return {
          bottom: padding,
          left: '0',
          right: '0',
        };
    }
  };

  const getCaptionStyles = (caption: any) => {
    const sentenceStyle = findSentenceStyle(caption.text);
    return {
      position: sentenceStyle?.position || position,
      fontSize: sentenceStyle?.fontSize || fontSize,
      color: sentenceStyle?.color || defaultColor,
      backgroundColor: sentenceStyle?.backgroundColor,
      maxWidth: sentenceStyle?.maxWidth || maxWidth,
      textAlign: sentenceStyle?.textAlign || textAlign,
    };
  };

  // ============================================================
  // STEP 3: Main word factory with PRIORITY SYSTEM
  // ============================================================
  const createWord = (word: any, index: number, caption: any, captionStyles: any) => {
    // PRIORITY 1: Check word.metadata (AI)
    if (!disableMetadata && word.metadata?.isHighlight) {
      console.log(`[AI] Highlighting word "${word.text}" via metadata`);
      return createHighlightWord(word, index, {
        color: word.metadata.color || captionStyles.color,
        backgroundColor: word.metadata.backgroundColor,
        fontSize: captionStyles.fontSize,
      }, caption);
    }

    // PRIORITY 2: Check caption.metadata.keyword (AI)
    if (!disableMetadata && caption.metadata?.keyword) {
      if (
        word.text.toLowerCase().includes(caption.metadata.keyword.toLowerCase())
      ) {
        console.log(
          `[AI] Found keyword "${caption.metadata.keyword}" in word "${word.text}"`,
        );
        return createGlowWord(word, index, { fontSize: captionStyles.fontSize }, caption);
      }
    }

    // PRIORITY 3: Check pattern rules (User)
    const patternEffect = findPatternEffect(word.text);
    if (patternEffect) {
      console.log(
        `[User] Pattern match for word "${word.text}": ${patternEffect.effectType}`,
      );
      switch (patternEffect.effectType) {
        case 'highlight':
          return createHighlightWord(word, index, {
            ...patternEffect,
            fontSize: captionStyles.fontSize,
          }, caption);
        case 'circle':
          return createCircleWord(word, index, { ...patternEffect, fontSize: captionStyles.fontSize }, caption);
        case 'glow':
          return createGlowWord(word, index, { ...patternEffect, fontSize: captionStyles.fontSize }, caption);
        case 'counter':
          return createCounterWord(word, index, {
            ...patternEffect,
            fontSize: captionStyles.fontSize,
          }, caption);
        case 'underline':
          return createUnderlineWord(word, index, {
            ...patternEffect,
            fontSize: captionStyles.fontSize,
          }, caption);
        case 'box':
          return createBoxWord(word, index, { ...patternEffect, fontSize: captionStyles.fontSize }, caption);
      }
    }

    // DEFAULT: Regular word
    return createRegularWord(word, index, { fontSize: captionStyles.fontSize, color: captionStyles.color }, caption);
  };

  // ============================================================
  // STEP 4: Process captions
  // ============================================================
  const captionsData = inputCaptions.map((caption, captionIdx) => {
    // Get caption-specific styles (sentence-level pattern matching)
    const captionStyles = getCaptionStyles(caption);
    
    const wordsData = caption.words.map((word: any, wordIdx: number) =>
      createWord(word, wordIdx, caption, captionStyles),
    );

    const containerStyle: any = {
      ...getPositionStyle(captionStyles.position),
      position: 'absolute',
    };

    // Add background color if specified for this sentence
    if (captionStyles.backgroundColor) {
      containerStyle.backgroundColor = captionStyles.backgroundColor;
      containerStyle.padding = '10px 20px';
      containerStyle.borderRadius = '8px';
    }

    // Determine justify-content based on textAlign
    const justifyClass = 
      captionStyles.textAlign === 'left' ? 'justify-start' :
      captionStyles.textAlign === 'right' ? 'justify-end' :
      'justify-center';

    return {
      type: 'layout',
      id: 'caption-' + captionIdx,
      componentId: 'BaseLayout',
      data: {
        containerProps: {
          className: 'flex flex-row flex-wrap gap-4 items-center ' + justifyClass,
          style: {
            ...containerStyle,
            maxWidth: captionStyles.maxWidth,
            marginLeft: 'auto',
            marginRight: 'auto',
          },
        },
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
    output: {
      config: {
        duration: inputCaptions[inputCaptions.length - 1]?.absoluteEnd || 0,
      },
      childrenData: [
        {
          id: 'SubtitlesOverlay',
          componentId: 'BaseLayout',
          type: 'layout',
          data: {
            containerProps: { className: 'absolute inset-0' },
          },
          context: {
            timing: {
              start: 0,
              duration:
                inputCaptions[inputCaptions.length - 1]?.absoluteEnd || 0,
            },
          },
          childrenData: captionsData,
        },
      ],
    },
    options: {
      attachedToId: 'BaseScene',
      attachedContainers: [{ className: 'absolute inset-0' }],
    },
  };
};

// ============================================================
// STEP 5: Define metadata
// ============================================================
const presetMetadata: PresetMetadata = {
  id: 'advanced-subtitles-anims',
  title: 'Advanced Subtitles Animations',
  description:
    'Future-proof subtitle preset with sentence-level styling and word-level effects. Apply different positions/styles to specific sentences, and custom animations to words within them. Supports highlight, circle, glow, counter, underline, and box effects.',
  type: 'predefined',
  presetType: 'children',
  tags: ['subtitle', 'animation', 'effects', 'ai-ready', 'future-proof'],
  defaultInputParams: {
    sentenceStyles: [],
    wordEffects: [],
    disableMetadata: false,
    fontSize: 50,
    defaultColor: '#FFFFFF',
    position: 'bottom',
    padding: '50px',
    maxWidth: '90%',
    textAlign: 'center',
    inputCaptions: [],
  },
};

export const advancedSubtitlesAnimsPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
