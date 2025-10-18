import { RenderableComponentData } from '@microfox/datamotion';
import { GenericEffectData, TextAtomData } from '@microfox/remotion';

// ============================================================
// SHARED UTILITIES
// ============================================================
export const hexToRgb = (hex: string) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

export const extractNumber = (text: string) => {
  const cleaned = text.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

// ============================================================
// HIGHLIGHT EFFECT - Yellow marker style
// ============================================================
export const createHighlightWord = (
  word: any,
  index: number,
  config: {
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
  },
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
            { key: 'scaleX', val: 0, prog: 0 },
            { key: 'scaleX', val: 1, prog: 1 },
            { key: 'scale', val: 1, prog: 0 },
            { key: 'scale', val: 1.1, prog: 0.5 },
            { key: 'scale', val: 1, prog: 1 },
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
      timing: { start: 0, duration: word.duration },
    },
  } as RenderableComponentData;
};

// ============================================================
// CIRCLE EFFECT - Hand-drawn circle around word
// ============================================================
export const createCircleWord = (
  word: any,
  index: number,
  config: {
    color?: string;
    fontSize?: number;
  },
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
    ],
    data: {
      shape: 'circle' as const,
      color: 'transparent',
      style: { border: `5px solid ${color}` },
    },
    context: { timing: { start: 0, duration: word.duration } },
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
    ],
    data: {
      text: word.text,
      style: { fontSize: config.fontSize || 55, fontWeight: 900, color },
      font: { family: 'BebasNeue' },
    } as TextAtomData,
    context: { timing: { start: 0, duration: word.duration } },
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
    context: { timing: { start: 0, duration: word.duration } },
    childrenData: [circle, text],
  } as RenderableComponentData;
};

// ============================================================
// GLOW EFFECT - Pulsing glow with emphasis
// ============================================================
export const createGlowWord = (
  word: any,
  index: number,
  config: {
    color?: string;
    fontSize?: number;
  },
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
    context: { timing: { start: 0, duration: word.duration } },
  } as RenderableComponentData;
};

// ============================================================
// COUNTER EFFECT - Animated number counting
// ============================================================
export const createCounterWord = (
  word: any,
  index: number,
  config: {
    counterStart?: number;
    counterEnd?: number;
    color?: string;
    fontSize?: number;
    steps?: number;
    prefix?: string;
  },
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
      timing: { start: 0, duration: word.duration },
    },
    childrenData: counterSteps,
  } as RenderableComponentData;
};

// ============================================================
// REGULAR WORD - Default styling
// ============================================================
export const createRegularWord = (
  word: any,
  index: number,
  config: {
    fontSize?: number;
    color?: string;
  } = {},
  caption?: any,
): RenderableComponentData => {
  return {
    type: 'atom',
    id: `word-${index}`,
    componentId: 'TextAtom',
    effects: caption
      ? [
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
        ]
      : [], // No caption provided = no animation
    data: {
      text: word.text,
      style: {
        fontSize: config.fontSize || 50,
        color: config.color || '#FFFFFF',
      },
      font: { family: 'Inter' },
    } as TextAtomData,
    context: {
      timing: { start: 0, duration: caption?.duration || word.duration },
    },
  } as RenderableComponentData;
};

// ============================================================
// UNDERLINE EFFECT - Animated underline
// ============================================================
export const createUnderlineWord = (
  word: any,
  index: number,
  config: {
    color?: string;
    fontSize?: number;
  },
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
            { key: 'scaleX', val: 0, prog: 0 },
            { key: 'scaleX', val: 1, prog: 1 },
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
    context: { timing: { start: 0, duration: word.duration } },
  };

  const text = {
    type: 'atom',
    id: `underlined-text-${index}`,
    componentId: 'TextAtom',
    effects: [],
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
    context: { timing: { start: 0, duration: word.duration } },
  };

  return {
    type: 'layout',
    id: `underlined-word-${index}`,
    componentId: 'BaseLayout',
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
    context: { timing: { start: 0, duration: word.duration } },
    childrenData: [text, underline],
  } as RenderableComponentData;
};

// ============================================================
// BOX EFFECT - Rectangular frame around word
// ============================================================
export const createBoxWord = (
  word: any,
  index: number,
  config: {
    color?: string;
    fontSize?: number;
  },
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
    ],
    data: {
      shape: 'rectangle' as const,
      color: 'transparent',
      style: {
        border: `4px solid ${color}`,
        borderRadius: '8px',
      },
    },
    context: { timing: { start: 0, duration: word.duration } },
  };

  const text = {
    type: 'atom',
    id: `boxed-text-${index}`,
    componentId: 'TextAtom',
    data: {
      text: word.text,
      style: { fontSize: config.fontSize || 55, fontWeight: 900, color },
      font: { family: 'BebasNeue' },
    } as TextAtomData,
    context: { timing: { start: 0, duration: word.duration } },
  };

  return {
    type: 'layout',
    id: `boxed-${index}`,
    componentId: 'BaseLayout',
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
    context: { timing: { start: 0, duration: word.duration } },
    childrenData: [box, text],
  } as RenderableComponentData;
};

