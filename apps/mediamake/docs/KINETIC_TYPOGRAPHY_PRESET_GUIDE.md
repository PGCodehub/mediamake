# Kinetic Typography Preset System Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Two-Layer System](#two-layer-system)
4. [Creating Layout Presets](#creating-layout-presets)
5. [Creating Animation Presets](#creating-animation-presets)
6. [Animation Library](#animation-library)
7. [Organizing Presets by Theme](#organizing-presets-by-theme)
8. [Caption Metadata Structure](#caption-metadata-structure)
9. [Usage Examples](#usage-examples)
10. [Best Practices](#best-practices)
11. [Complete Code Examples](#complete-code-examples)

---

## Overview

The Kinetic Typography Preset System is a flexible, modular architecture for creating dynamic text animations with precise control over layout and animation behavior. It separates concerns into two layers:

- **Layout Layer**: Defines positioning, structure, and arrangement
- **Animation Layer**: Defines motion, effects, and transitions

### Key Benefits

✅ **Separation of Concerns**: Layout and animation logic are independent  
✅ **Reusability**: Mix and match layouts with different animations  
✅ **Modularity**: Each preset stays focused and maintainable  
✅ **Flexibility**: Per-word animation control via metadata  
✅ **Scalability**: Easy to add new layouts and animations  
✅ **Composability**: Layer multiple presets for complex effects

---

## Architecture

### System Overview

```
Caption Metadata
      ↓
┌─────────────────────────────────────────────┐
│  Kinetic Typography System                  │
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │ Layout Layer │  →   │ Animation Layer │ │
│  │              │      │                 │ │
│  │ • Structure  │      │ • Effects       │ │
│  │ • Position   │      │ • Timing        │ │
│  │ • Spacing    │      │ • Transitions   │ │
│  └──────────────┘      └─────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
      ↓
Final Rendered Output
```

### File Organization

```
presets/registry/
├── Layout Presets
│   ├── sub-kinetic-layout-base.ts          (Base layouts)
│   ├── sub-kinetic-layout-spotlight.ts     (Spotlight variations)
│   └── sub-kinetic-layout-circular.ts      (Circular arrangements)
│
└── Animation Presets
    ├── sub-kinetic-anim-explosive.ts       (Explosive animations)
    ├── sub-kinetic-anim-smooth.ts          (Smooth animations)
    ├── sub-kinetic-anim-mechanical.ts      (Mechanical animations)
    └── sub-kinetic-anim-organic.ts         (Organic animations)
```

---

## Two-Layer System

### Layer 1: Layout Preset (Structure)

**Purpose**: Creates the DOM structure, positions elements, and assigns stable IDs

**Responsibilities**:

- Parse caption metadata
- Find keyword in sentence
- Arrange words based on layout strategy
- Apply typography styles (font size, color, weight)
- Position elements in space
- **NO animations** - elements start visible

**Key Characteristics**:

- Elements have stable, predictable IDs
- All timing information preserved
- Opacity starts at 1 (visible)
- No `effects` array (empty)

### Layer 2: Animation Preset (Motion)

**Purpose**: Applies animations to existing elements created by layout layer

**Responsibilities**:

- Target elements by ID (using `mode: 'target'`)
- Apply entrance animations
- Apply keyword special effects
- Handle per-word animation overrides
- Create additional visual effects (glow, particles, etc.)

**Key Characteristics**:

- Uses `mode: 'target'` to affect existing elements
- Does not create new DOM elements
- All effects are additive
- Can be layered multiple times

---

## Creating Layout Presets

### Basic Structure

```typescript
// sub-kinetic-layout-base.ts

import { Transcription } from '@/app/types/transcription';
import { RenderableComponentData } from '@microfox/datamotion';
import { TextAtomData } from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
import { CSSProperties } from 'react';

const presetParams = z.object({
  inputCaptions: z.array(z.any()).describe('input captions (data-referrable)'),
  fontChoices: z
    .array(
      z.object({
        primaryFont: z.string().describe('primary font family'),
        headerFont: z.string().describe('header font family'),
      }),
    )
    .optional()
    .describe('font choices'),
  colorChoices: z
    .array(
      z.object({
        primary: z.string().describe('primary color'),
        secondary: z.string().describe('secondary color'),
        accent: z.string().describe('accent color'),
      }),
    )
    .optional()
    .describe('color choices'),
  avgFontSize: z.number().optional().describe('average font size'),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  const { inputCaptions, fontChoices, colorChoices, avgFontSize } = params;

  // ==========================================
  // STEP 1: DEFINE LAYOUT CONFIGURATIONS
  // ==========================================

  const LAYOUT_CONFIGS: Record<
    string,
    {
      name: string;
      description: string;
      wordSpacing: number; // Multiplier for gap between words
      lineSpacing: number; // Multiplier for gap between lines
      keywordScale: number; // Font size multiplier for keyword
      wordScale: number; // Font size multiplier for regular words
      arrangeWords: (
        words: any[],
        keywordIndex: number,
      ) => {
        structure: string;
        parts: any[];
      };
    }
  > = {
    'keyword-center': {
      name: 'Keyword Center',
      description: 'Keyword in center, words split around it',
      wordSpacing: 1.5,
      lineSpacing: 1.2,
      keywordScale: 1.4,
      wordScale: 1.0,

      arrangeWords: (words, keywordIndex) => {
        if (keywordIndex === -1) {
          return {
            structure: 'horizontal',
            parts: [{ type: 'group', words: words, position: 'center' }],
          };
        }

        const keyword = words[keywordIndex];
        const before = words.slice(0, keywordIndex);
        const after = words.slice(keywordIndex + 1);

        return {
          structure: 'horizontal',
          parts: [
            { type: 'group', words: before, position: 'left' },
            { type: 'keyword', words: [keyword], position: 'center' },
            { type: 'group', words: after, position: 'right' },
          ],
        };
      },
    },

    'keyword-spotlight': {
      name: 'Keyword Spotlight',
      description: 'Keyword large in center, others small around edges',
      wordSpacing: 2.0,
      lineSpacing: 1.5,
      keywordScale: 2.0,
      wordScale: 0.7,

      arrangeWords: (words, keywordIndex) => {
        if (keywordIndex === -1) {
          return {
            structure: 'horizontal',
            parts: [{ type: 'group', words: words, position: 'center' }],
          };
        }

        const keyword = words[keywordIndex];
        const others = words.filter((_, i) => i !== keywordIndex);

        return {
          structure: 'spotlight',
          parts: [
            { type: 'background', words: others, position: 'scattered' },
            { type: 'keyword', words: [keyword], position: 'center-large' },
          ],
        };
      },
    },

    'vertical-stack': {
      name: 'Vertical Stack',
      description: 'Words stacked vertically with keyword emphasized',
      wordSpacing: 1.2,
      lineSpacing: 1.5,
      keywordScale: 1.5,
      wordScale: 1.0,

      arrangeWords: (words, keywordIndex) => {
        return {
          structure: 'vertical',
          parts: words.map((word, i) => ({
            type: i === keywordIndex ? 'keyword' : 'word',
            words: [word],
            position: 'center',
          })),
        };
      },
    },

    'circular-orbit': {
      name: 'Circular Orbit',
      description: 'Keyword in center, words orbit around',
      wordSpacing: 1.8,
      lineSpacing: 1.0,
      keywordScale: 1.6,
      wordScale: 0.9,

      arrangeWords: (words, keywordIndex) => {
        if (keywordIndex === -1) {
          return {
            structure: 'horizontal',
            parts: [{ type: 'group', words: words, position: 'center' }],
          };
        }

        const keyword = words[keywordIndex];
        const others = words.filter((_, i) => i !== keywordIndex);

        return {
          structure: 'circular',
          parts: [
            { type: 'keyword', words: [keyword], position: { type: 'center' } },
            ...others.map((word, i) => ({
              type: 'word',
              words: [word],
              position: {
                type: 'orbit',
                angle: (i / others.length) * 360,
                radius: 200,
              },
            })),
          ],
        };
      },
    },
  };

  // ==========================================
  // STEP 2: UTILITY FUNCTIONS
  // ==========================================

  const findKeywordIndex = (words: any[], keyword: string): number => {
    if (!keyword) return -1;
    const cleanKeyword = keyword.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    return words.findIndex(word => {
      const cleanWord = word.text?.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      return cleanWord?.includes(cleanKeyword);
    });
  };

  // ==========================================
  // STEP 3: FILTER KINETIC CAPTIONS
  // ==========================================

  const kineticCaptions = inputCaptions.filter(
    caption => caption.metadata?.KineticTopo === true,
  );

  if (kineticCaptions.length === 0) {
    return {
      output: {
        config: { duration: 0 },
        childrenData: [],
      },
      options: {
        attachedToId: 'BaseScene',
        attachedContainers: [{ className: 'absolute inset-0' }],
      },
    };
  }

  // ==========================================
  // STEP 4: SELECT FONT AND COLOR
  // ==========================================

  const FONT_CHOICES =
    fontChoices && fontChoices.length > 0
      ? fontChoices
      : [{ primaryFont: 'Inter:600', headerFont: 'BebasNeue:700' }];

  const selectedFontChoice =
    FONT_CHOICES[Math.floor(Math.random() * FONT_CHOICES.length)];

  const selectedColorChoice =
    colorChoices && colorChoices.length > 0
      ? colorChoices[Math.floor(Math.random() * colorChoices.length)]
      : { primary: '#ffffff', secondary: '#cccccc', accent: '#ff6b6b' };

  // ==========================================
  // STEP 5: GENERATE WORD COMPONENTS
  // ==========================================

  const generateWordComponent = (
    word: any,
    wordId: string,
    isKeyword: boolean,
    config: any,
    avgFontSize: number,
  ): RenderableComponentData => {
    const fontSize = avgFontSize || 50;
    const scaledFontSize = isKeyword
      ? fontSize * config.keywordScale
      : fontSize * config.wordScale;

    const font = isKeyword
      ? selectedFontChoice.headerFont
      : selectedFontChoice.primaryFont;
    const fontFamily = font.includes(':') ? font.split(':')[0] : font;

    let fontStyle: CSSProperties = {};
    if (font.includes(':')) {
      const parts = font.split(':');
      if (parts[1]) fontStyle.fontWeight = parseInt(parts[1]);
      if (parts[2]) fontStyle.fontStyle = parts[2];
    }

    const textColor = isKeyword
      ? selectedColorChoice.accent
      : selectedColorChoice.primary;

    return {
      type: 'atom',
      id: wordId, // ← CRITICAL: Stable ID for animation layer
      componentId: 'TextAtom',
      effects: [], // ← NO ANIMATIONS in layout layer
      data: {
        text: word.text,
        className: isKeyword ? 'font-bold tracking-wide' : 'font-normal',
        style: {
          fontSize: scaledFontSize,
          color: textColor,
          opacity: 1, // ← Start visible (animation layer controls this)
          ...fontStyle,
        },
        font: { family: fontFamily },
      } as TextAtomData,
      context: {
        timing: {
          start: 0,
          duration: word.duration || 1,
        },
      },
    } as RenderableComponentData;
  };

  // ==========================================
  // STEP 6: PROCESS CAPTIONS
  // ==========================================

  const processedCaptions = kineticCaptions.map((caption, captionIndex) => {
    const captionId = `kinetic-layout-${captionIndex}`;
    const layoutName = caption.metadata?.kineticLayout || 'keyword-center';
    const config =
      LAYOUT_CONFIGS[layoutName] || LAYOUT_CONFIGS['keyword-center'];

    // Find keyword
    const keyword = caption.metadata?.keyword || '';
    const keywordIndex = findKeywordIndex(caption.words, keyword);

    // Get layout structure
    const layout = config.arrangeWords(caption.words, keywordIndex);

    // Build layout based on structure
    const layoutChildren = layout.parts.map((part, partIndex) => {
      const partId = `${captionId}-part-${partIndex}`;
      const isKeyword = part.type === 'keyword';

      const partWords = part.words.map((word, wordIndex) => {
        // Generate stable word ID
        const originalIndex = caption.words.indexOf(word);
        const wordId = `${captionId}-word-${originalIndex}`;
        return generateWordComponent(
          word,
          wordId,
          isKeyword,
          config,
          avgFontSize || 50,
        );
      });

      // Calculate position style based on part position
      let positionStyle: any = {};

      if (layout.structure === 'horizontal') {
        positionStyle = {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: `${(avgFontSize || 50) * config.wordSpacing * 0.3}px`,
        };
      } else if (layout.structure === 'vertical') {
        positionStyle = {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: `${(avgFontSize || 50) * config.lineSpacing * 0.5}px`,
        };
      } else if (layout.structure === 'circular') {
        if (part.position.type === 'center') {
          positionStyle = {
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          };
        } else if (part.position.type === 'orbit') {
          const radius = part.position.radius || 200;
          const angle = (part.position.angle * Math.PI) / 180;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          positionStyle = {
            position: 'absolute',
            left: `calc(50% + ${x}px)`,
            top: `calc(50% + ${y}px)`,
            transform: 'translate(-50%, -50%)',
          };
        }
      }

      return {
        type: 'layout',
        id: partId,
        componentId: 'BaseLayout',
        data: {
          containerProps: {
            className: 'relative',
            style: positionStyle,
          },
        },
        context: {
          timing: { start: 0, duration: caption.duration },
        },
        childrenData: partWords,
      } as RenderableComponentData;
    });

    // Main caption container
    const mainContainerStyle: any = {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    };

    if (layout.structure === 'horizontal') {
      mainContainerStyle.display = 'flex';
      mainContainerStyle.flexDirection = 'row';
      mainContainerStyle.alignItems = 'center';
      mainContainerStyle.gap = `${(avgFontSize || 50) * config.wordSpacing}px`;
    } else if (layout.structure === 'circular') {
      mainContainerStyle.width = '100%';
      mainContainerStyle.height = '100%';
    }

    return {
      type: 'layout',
      id: captionId,
      componentId: 'BaseLayout',
      data: {
        containerProps: {
          className: 'text-white',
          style: mainContainerStyle,
        },
      },
      context: {
        timing: {
          start: caption.absoluteStart,
          duration: caption.duration,
        },
      },
      childrenData: layoutChildren,
    } as RenderableComponentData;
  });

  // ==========================================
  // STEP 7: RETURN STRUCTURE
  // ==========================================

  const lastCaption = kineticCaptions[kineticCaptions.length - 1];
  const totalDuration = lastCaption.absoluteEnd;

  return {
    output: {
      config: { duration: totalDuration },
      childrenData: [
        {
          id: 'KineticLayoutBase',
          componentId: 'BaseLayout',
          type: 'layout',
          data: {
            containerProps: { className: 'absolute inset-0' },
          },
          context: {
            timing: { start: 0, duration: totalDuration },
          },
          childrenData: processedCaptions,
        },
      ],
    },
    options: {
      attachedToId: 'BaseScene',
      attachedContainers: [{ className: 'absolute inset-0' }],
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'sub-kinetic-layout-base',
  title: 'Kinetic Typography - Layout Base',
  description:
    'Base layout system for kinetic typography with multiple arrangement strategies',
  type: 'predefined',
  presetType: 'children',
  tags: ['kinetic', 'layout', 'typography', 'structure'],
  defaultInputParams: {
    fontChoices: [
      {
        primaryFont: 'Inter:600',
        headerFont: 'BebasNeue:700',
      },
    ],
    colorChoices: [
      {
        primary: '#ffffff',
        secondary: '#cccccc',
        accent: '#ff6b6b',
      },
    ],
    avgFontSize: 50,
    inputCaptions: [],
  },
};

const _presetExecution = presetExecution.toString();

export const subKineticLayoutBasePreset = {
  metadata: presetMetadata,
  presetFunction: _presetExecution,
  presetParams: z.toJSONSchema(presetParams),
};
```

### Key Points for Layout Presets

1. **Stable IDs**: Use predictable ID patterns (e.g., `kinetic-layout-${captionIndex}-word-${wordIndex}`)
2. **No Animations**: Leave `effects` array empty
3. **Initial Visibility**: Set `opacity: 1` so elements are visible from the start
4. **Preserve Timing**: Keep all timing information from caption metadata
5. **Layout Strategies**: Define how words are arranged spatially
6. **Typography**: Apply font sizes, colors, and styles

---

## Creating Animation Presets

### Basic Structure

```typescript
// sub-kinetic-anim-explosive.ts

import { RenderableComponentData } from '@microfox/datamotion';
import { GenericEffectData } from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

const presetParams = z.object({
  inputCaptions: z.array(z.any()).describe('input captions (data-referrable)'),
  globalIntensity: z
    .number()
    .default(1.0)
    .optional()
    .describe('global intensity multiplier'),
  colorChoices: z
    .array(
      z.object({
        primary: z.string().describe('primary color'),
        secondary: z.string().describe('secondary color'),
        accent: z.string().describe('accent color'),
      }),
    )
    .optional()
    .describe('color choices'),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  const { inputCaptions, globalIntensity, colorChoices } = params;

  // ==========================================
  // STEP 1: UTILITY FUNCTIONS
  // ==========================================

  const hexToRgb = (hex: string) => {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  };

  // ==========================================
  // STEP 2: ANIMATION LIBRARY
  // ==========================================

  const ANIMATION_LIBRARY: Record<
    string,
    (
      targetId: string,
      timing: { start: number; duration: number },
      intensity: number,
      colorChoice?: any,
    ) => any | any[]
  > = {
    'fade-in': (targetId, timing, intensity) => ({
      id: `${targetId}-fade`,
      componentId: 'generic',
      data: {
        type: 'ease-out',
        start: timing.start,
        duration: 0.3 * intensity,
        mode: 'target', // ← CRITICAL: Target existing elements!
        targetIds: [targetId],
        ranges: [
          { key: 'opacity', val: 0, prog: 0 },
          { key: 'opacity', val: 1, prog: 1 },
        ],
      } as GenericEffectData,
    }),

    'scale-pop': (targetId, timing, intensity) => ({
      id: `${targetId}-scale`,
      componentId: 'generic',
      data: {
        type: 'spring',
        start: timing.start,
        duration: 0.5 * intensity,
        mode: 'target',
        targetIds: [targetId],
        ranges: [
          { key: 'scale', val: 0, prog: 0 },
          { key: 'scale', val: 1.2, prog: 0.5 },
          { key: 'scale', val: 1, prog: 1 },
        ],
      } as GenericEffectData,
    }),

    'slide-left': (targetId, timing, intensity) => ({
      id: `${targetId}-slide`,
      componentId: 'generic',
      data: {
        type: 'ease-out',
        start: timing.start,
        duration: 0.5 * intensity,
        mode: 'target',
        targetIds: [targetId],
        ranges: [
          { key: 'translateX', val: -50 * intensity, prog: 0 },
          { key: 'translateX', val: 0, prog: 1 },
          { key: 'opacity', val: 0, prog: 0 },
          { key: 'opacity', val: 1, prog: 0.4 },
        ],
      } as GenericEffectData,
    }),

    'slide-right': (targetId, timing, intensity) => ({
      id: `${targetId}-slide`,
      componentId: 'generic',
      data: {
        type: 'ease-out',
        start: timing.start,
        duration: 0.5 * intensity,
        mode: 'target',
        targetIds: [targetId],
        ranges: [
          { key: 'translateX', val: 50 * intensity, prog: 0 },
          { key: 'translateX', val: 0, prog: 1 },
          { key: 'opacity', val: 0, prog: 0 },
          { key: 'opacity', val: 1, prog: 0.4 },
        ],
      } as GenericEffectData,
    }),

    'bounce-down': (targetId, timing, intensity) => ({
      id: `${targetId}-bounce`,
      componentId: 'generic',
      data: {
        type: 'spring',
        start: timing.start,
        duration: 0.6 * intensity,
        mode: 'target',
        targetIds: [targetId],
        ranges: [
          { key: 'translateY', val: -30 * intensity, prog: 0 },
          { key: 'translateY', val: 5 * intensity, prog: 0.6 },
          { key: 'translateY', val: 0, prog: 1 },
          { key: 'opacity', val: 0, prog: 0 },
          { key: 'opacity', val: 1, prog: 0.2 },
        ],
      } as GenericEffectData,
    }),

    'rotate-in': (targetId, timing, intensity) => ({
      id: `${targetId}-rotate`,
      componentId: 'generic',
      data: {
        type: 'ease-out',
        start: timing.start,
        duration: 0.5 * intensity,
        mode: 'target',
        targetIds: [targetId],
        ranges: [
          { key: 'rotate', val: 180 * intensity, prog: 0 },
          { key: 'rotate', val: 0, prog: 1 },
          { key: 'scale', val: 0.5, prog: 0 },
          { key: 'scale', val: 1, prog: 1 },
          { key: 'opacity', val: 0, prog: 0 },
          { key: 'opacity', val: 1, prog: 0.3 },
        ],
      } as GenericEffectData,
    }),

    'blur-reveal': (targetId, timing, intensity) => ({
      id: `${targetId}-blur`,
      componentId: 'generic',
      data: {
        type: 'ease-out',
        start: timing.start,
        duration: 0.6 * intensity,
        mode: 'target',
        targetIds: [targetId],
        ranges: [
          { key: 'filter', val: `blur(${10 * intensity}px)`, prog: 0 },
          { key: 'filter', val: 'blur(0px)', prog: 1 },
          { key: 'opacity', val: 0, prog: 0 },
          { key: 'opacity', val: 1, prog: 0.4 },
        ],
      } as GenericEffectData,
    }),

    typewriter: (targetId, timing, intensity) => ({
      id: `${targetId}-typewriter`,
      componentId: 'generic',
      data: {
        type: 'ease-out',
        start: timing.start,
        duration: 0.2 * intensity,
        mode: 'target',
        targetIds: [targetId],
        ranges: [
          { key: 'opacity', val: 0, prog: 0 },
          { key: 'opacity', val: 1, prog: 0.5 },
          { key: 'translateX', val: -5 * intensity, prog: 0 },
          { key: 'translateX', val: 0, prog: 1 },
        ],
      } as GenericEffectData,
    }),

    // KEYWORD SPECIAL EFFECTS

    explosive: (targetId, timing, intensity, colorChoice) => {
      const accentRgb = hexToRgb(colorChoice.accent);
      return [
        {
          id: `${targetId}-explosive-scale`,
          componentId: 'generic',
          data: {
            type: 'spring',
            start: timing.start,
            duration: 0.6 * intensity,
            mode: 'target',
            targetIds: [targetId],
            ranges: [
              { key: 'scale', val: 0.3, prog: 0 },
              { key: 'scale', val: 1.5, prog: 0.5 },
              { key: 'scale', val: 1, prog: 1 },
              { key: 'opacity', val: 0, prog: 0 },
              { key: 'opacity', val: 1, prog: 0.2 },
            ],
          } as GenericEffectData,
        },
        {
          id: `${targetId}-explosive-glow`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: timing.start,
            duration: 0.8 * intensity,
            mode: 'target',
            targetIds: [targetId],
            ranges: [
              {
                key: 'filter',
                val: `drop-shadow(0 0 0px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0))`,
                prog: 0,
              },
              {
                key: 'filter',
                val: `drop-shadow(0 0 30px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},1))`,
                prog: 0.4,
              },
              {
                key: 'filter',
                val: `drop-shadow(0 0 10px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.7))`,
                prog: 1,
              },
            ],
          } as GenericEffectData,
        },
        {
          id: `${targetId}-explosive-letterspace`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: timing.start,
            duration: timing.duration,
            mode: 'target',
            targetIds: [targetId],
            ranges: [
              { key: 'letterSpacing', val: '0.5em', prog: 0 },
              { key: 'letterSpacing', val: '0.2em', prog: 1 },
            ],
          } as GenericEffectData,
        },
      ];
    },

    shockwave: (targetId, timing, intensity, colorChoice) => {
      const accentRgb = hexToRgb(colorChoice.accent);
      return [
        {
          id: `${targetId}-shockwave-scale`,
          componentId: 'generic',
          data: {
            type: 'spring',
            start: timing.start,
            duration: 0.7 * intensity,
            mode: 'target',
            targetIds: [targetId],
            ranges: [
              { key: 'scale', val: 0.5, prog: 0 },
              { key: 'scale', val: 1.3, prog: 0.4 },
              { key: 'scale', val: 1, prog: 1 },
              { key: 'opacity', val: 0, prog: 0 },
              { key: 'opacity', val: 1, prog: 0.15 },
            ],
          } as GenericEffectData,
        },
        {
          id: `${targetId}-shockwave-ring`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: timing.start,
            duration: 1.0 * intensity,
            mode: 'target',
            targetIds: [targetId],
            ranges: [
              {
                key: 'filter',
                val: `drop-shadow(0 0 0px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0))`,
                prog: 0,
              },
              {
                key: 'filter',
                val: `drop-shadow(0 0 40px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},1)) drop-shadow(0 0 80px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.6))`,
                prog: 0.3,
              },
              {
                key: 'filter',
                val: `drop-shadow(0 0 20px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.5))`,
                prog: 1,
              },
            ],
          } as GenericEffectData,
        },
      ];
    },

    glitch: (targetId, timing, intensity) => {
      const effects = [];

      // Quick glitch flashes
      for (let i = 0; i < 3; i++) {
        effects.push({
          id: `${targetId}-glitch-${i}`,
          componentId: 'generic',
          data: {
            type: 'linear',
            start: timing.start + i * 0.05,
            duration: 0.05,
            mode: 'target',
            targetIds: [targetId],
            ranges: [
              {
                key: 'translateX',
                val: (Math.random() - 0.5) * 20 * intensity,
                prog: 0,
              },
              { key: 'translateX', val: 0, prog: 1 },
            ],
          } as GenericEffectData,
        });
      }

      // Final reveal
      effects.push({
        id: `${targetId}-glitch-reveal`,
        componentId: 'generic',
        data: {
          type: 'ease-out',
          start: timing.start,
          duration: 0.3,
          mode: 'target',
          targetIds: [targetId],
          ranges: [
            { key: 'opacity', val: 0, prog: 0 },
            { key: 'opacity', val: 1, prog: 1 },
          ],
        } as GenericEffectData,
      });

      return effects;
    },
  };

  // ==========================================
  // STEP 3: OWNED ANIMATIONS (for filtering)
  // ==========================================

  const OWNED_ANIMATIONS = ['explosive', 'shockwave', 'glitch'];

  // ==========================================
  // STEP 4: FILTER KINETIC CAPTIONS
  // ==========================================

  const kineticCaptions = inputCaptions.filter(
    caption => caption.metadata?.KineticTopo === true,
  );

  if (kineticCaptions.length === 0) {
    return {
      output: {
        config: { duration: 0 },
        childrenData: [],
      },
      options: {
        attachedToId: 'BaseScene',
        attachedContainers: [{ className: 'absolute inset-0' }],
      },
    };
  }

  // ==========================================
  // STEP 5: SELECT COLOR CHOICE
  // ==========================================

  const selectedColorChoice =
    colorChoices && colorChoices.length > 0
      ? colorChoices[Math.floor(Math.random() * colorChoices.length)]
      : { primary: '#ffffff', secondary: '#cccccc', accent: '#ff6b6b' };

  // ==========================================
  // STEP 6: GENERATE ANIMATION EFFECTS
  // ==========================================

  const allEffects: any[] = [];

  kineticCaptions.forEach((caption, captionIndex) => {
    // Match layout preset's ID pattern
    const captionId = `kinetic-layout-${captionIndex}`;

    // Find keyword
    const keyword = caption.metadata?.keyword || '';
    const keywordIndex = caption.words.findIndex(w =>
      w.text.toLowerCase().includes(keyword.toLowerCase()),
    );

    caption.words.forEach((word, wordIndex) => {
      // Generate the SAME ID that layout preset used
      const wordId = `${captionId}-word-${wordIndex}`;
      const isKeyword = wordIndex === keywordIndex;

      // Determine animation to use
      let animationName = word.metadata?.animation;

      // If no word-level override, use defaults
      if (!animationName) {
        animationName = isKeyword ? 'explosive' : 'fade-in';
      }

      // Only process if this preset owns the animation
      if (!OWNED_ANIMATIONS.includes(animationName) && isKeyword) {
        return; // Skip, another preset will handle it
      }

      const timing = {
        start: word.absoluteStart,
        duration: word.duration,
      };

      // Create animation effects
      const animFunc = ANIMATION_LIBRARY[animationName];
      if (animFunc) {
        const effects = animFunc(
          wordId,
          timing,
          globalIntensity || 1.0,
          selectedColorChoice,
        );

        // Handle both single effect and array of effects
        if (Array.isArray(effects)) {
          allEffects.push(...effects);
        } else {
          allEffects.push(effects);
        }
      }
    });
  });

  // ==========================================
  // STEP 7: RETURN EFFECTS AS SEPARATE LAYER
  // ==========================================

  const lastCaption = kineticCaptions[kineticCaptions.length - 1];
  const totalDuration = lastCaption.absoluteEnd;

  return {
    output: {
      config: { duration: totalDuration },
      childrenData: [
        {
          id: 'KineticAnimExplosive',
          componentId: 'BaseLayout',
          type: 'layout',
          effects: allEffects, // ← All animations here!
          data: {
            containerProps: {
              className: 'absolute inset-0 pointer-events-none',
            },
          },
          context: {
            timing: { start: 0, duration: totalDuration },
          },
          childrenData: [], // ← No children, just effects!
        },
      ],
    },
    options: {
      attachedToId: 'BaseScene',
      attachedContainers: [{ className: 'absolute inset-0' }],
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'sub-kinetic-anim-explosive',
  title: 'Kinetic Typography - Explosive Animations',
  description: 'Explosive animation effects for kinetic typography keywords',
  type: 'predefined',
  presetType: 'children',
  tags: ['kinetic', 'animation', 'explosive', 'effects'],
  availableAnimations: ['explosive', 'shockwave', 'glitch'],
  defaultInputParams: {
    globalIntensity: 1.2,
    colorChoices: [
      {
        primary: '#ffffff',
        secondary: '#cccccc',
        accent: '#ff6b6b',
      },
    ],
    inputCaptions: [],
  },
};

const _presetExecution = presetExecution.toString();

export const subKineticAnimExplosivePreset = {
  metadata: presetMetadata,
  presetFunction: _presetExecution,
  presetParams: z.toJSONSchema(presetParams),
};
```

### Key Points for Animation Presets

1. **Mode: 'target'**: CRITICAL - Use `mode: 'target'` to affect existing elements
2. **Match IDs**: Use the SAME ID pattern as layout preset
3. **Owned Animations**: Define which animations this preset handles
4. **No DOM Elements**: Don't create new elements, only effects
5. **Additive**: Effects are additive, can layer multiple animation presets
6. **Effect Arrays**: Some animations return multiple effects (scale + glow + etc.)

---

## Animation Library

### Animation Categories

#### Basic Entrance Animations

- `fade-in`: Simple opacity fade
- `scale-pop`: Spring scale from small to normal
- `slide-left`: Slide in from left
- `slide-right`: Slide in from right
- `bounce-down`: Bounce from top
- `rotate-in`: Rotate and scale entrance

#### Special Effects

- `blur-reveal`: Blur to sharp focus
- `typewriter`: Rapid character-by-character reveal
- `wave-motion`: Sine wave floating
- `glitch`: Digital glitch effect

#### Keyword Special Effects

- `explosive`: Large scale + intense glow + letter spacing
- `shockwave`: Ring expansion with glow waves
- `nuclear-burst`: Multi-stage explosion effect
- `magnetic-pull`: Attract surrounding words

### Animation Function Signature

```typescript
type AnimationFunction = (
  targetId: string,
  timing: { start: number; duration: number },
  intensity: number,
  colorChoice?: { primary: string; secondary: string; accent: string },
) => GenericEffectData | GenericEffectData[];
```

### Creating New Animations

```typescript
// Simple animation (returns single effect)
'my-animation': (targetId, timing, intensity) => ({
  id: `${targetId}-my-anim`,
  componentId: 'generic',
  data: {
    type: 'ease-out',
    start: timing.start,
    duration: 0.5 * intensity,
    mode: 'target',
    targetIds: [targetId],
    ranges: [
      // Your animation keyframes here
    ],
  } as GenericEffectData,
}),

// Complex animation (returns multiple effects)
'my-complex-animation': (targetId, timing, intensity, colorChoice) => {
  return [
    {
      id: `${targetId}-effect-1`,
      componentId: 'generic',
      data: { /* ... */ } as GenericEffectData,
    },
    {
      id: `${targetId}-effect-2`,
      componentId: 'generic',
      data: { /* ... */ } as GenericEffectData,
    },
  ];
},
```

---

## Organizing Presets by Theme

### Theme-Based Organization

```
Layout Presets (one for all layouts)
└── sub-kinetic-layout-base.ts

Animation Presets (by theme/style)
├── sub-kinetic-anim-explosive.ts    (explosive, shockwave, nuclear-burst)
├── sub-kinetic-anim-smooth.ts       (smooth-wave, flow-reveal, gentle-drift)
├── sub-kinetic-anim-mechanical.ts   (typewriter, glitch, tech-grid)
└── sub-kinetic-anim-organic.ts      (bounce, float, spring, breathing)
```

### Theme Examples

#### Explosive Theme

- High-energy animations
- Large scale changes
- Intense glows and effects
- Fast timing
- Bold visual impact

**Animations**: explosive, shockwave, nuclear-burst, impact-ripple, blast-scatter

#### Smooth Theme

- Gentle transitions
- Fluid motion
- Soft glows
- Longer durations
- Elegant feel

**Animations**: smooth-wave, flow-reveal, gentle-drift, silk-fade, water-ripple

#### Mechanical Theme

- Precise timing
- Technical feel
- Sharp transitions
- Grid-based movement
- Digital aesthetics

**Animations**: typewriter, glitch, snap-lock, grid-shift, binary-reveal

#### Organic Theme

- Natural motion
- Bouncy springs
- Breathing effects
- Curved paths
- Lifelike movement

**Animations**: bounce-float, spring-rise, breathing, leaf-drift, petal-fall

---

## Caption Metadata Structure

### Complete Metadata Schema

```typescript
interface CaptionMetadata {
  // REQUIRED for kinetic processing
  KineticTopo: boolean; // Flag to enable kinetic processing

  // Layout configuration
  kineticLayout?: string; // Layout strategy name (e.g., 'keyword-center')
  keyword?: string; // Keyword to highlight

  // Additional metadata
  strength?: number; // Intensity (1-10)
  keywordFeel?: string; // Emotion/style hint
  splitParts?: string[]; // Manual sentence splitting
  confidence?: number; // Word confidence scores
}

interface WordMetadata {
  animation?: string; // Override animation for this word
  isHighlight?: boolean; // Mark as important
}
```

### Example Captions

#### Basic Example

```json
{
  "text": "Can you believe this?",
  "absoluteStart": 0,
  "absoluteEnd": 2.5,
  "duration": 2.5,
  "words": [
    {
      "id": "word-0",
      "text": "Can",
      "absoluteStart": 0,
      "absoluteEnd": 0.3,
      "duration": 0.3
    },
    {
      "id": "word-1",
      "text": "you",
      "absoluteStart": 0.3,
      "absoluteEnd": 0.6,
      "duration": 0.3
    },
    {
      "id": "word-2",
      "text": "believe",
      "absoluteStart": 0.6,
      "absoluteEnd": 1.2,
      "duration": 0.6
    },
    {
      "id": "word-3",
      "text": "this?",
      "absoluteStart": 1.2,
      "absoluteEnd": 2.5,
      "duration": 1.3
    }
  ],
  "metadata": {
    "KineticTopo": true,
    "kineticLayout": "keyword-center",
    "keyword": "believe"
  }
}
```

#### Advanced Example with Per-Word Animations

```json
{
  "text": "This is AMAZING content!",
  "absoluteStart": 0,
  "absoluteEnd": 3.0,
  "duration": 3.0,
  "words": [
    {
      "text": "This",
      "absoluteStart": 0,
      "duration": 0.4,
      "metadata": {
        "animation": "slide-right"
      }
    },
    {
      "text": "is",
      "absoluteStart": 0.4,
      "duration": 0.3,
      "metadata": {
        "animation": "bounce-down"
      }
    },
    {
      "text": "AMAZING",
      "absoluteStart": 0.7,
      "duration": 1.5,
      "metadata": {
        "isHighlight": true
      }
    },
    {
      "text": "content!",
      "absoluteStart": 2.2,
      "duration": 0.8,
      "metadata": {
        "animation": "rotate-in"
      }
    }
  ],
  "metadata": {
    "KineticTopo": true,
    "kineticLayout": "keyword-spotlight",
    "keyword": "AMAZING",
    "keywordFeel": "intense",
    "strength": 9
  }
}
```

---

## Usage Examples

### Example 1: Single Layout + Single Animation

```typescript
const composition = {
  children: [
    // Layout
    {
      presetId: 'sub-kinetic-layout-base',
      params: {
        inputCaptions: captions,
        avgFontSize: 50,
      },
    },
    // Animation
    {
      presetId: 'sub-kinetic-anim-explosive',
      params: {
        inputCaptions: captions,
        globalIntensity: 1.2,
      },
    },
  ],
};
```

### Example 2: Single Layout + Multiple Animations

```typescript
const composition = {
  children: [
    // Layout (handles all captions)
    {
      presetId: 'sub-kinetic-layout-base',
      params: {
        inputCaptions: captions,
      },
    },
    // Explosive animations (handles captions with explosive, shockwave, etc.)
    {
      presetId: 'sub-kinetic-anim-explosive',
      params: {
        inputCaptions: captions,
        globalIntensity: 1.5,
      },
    },
    // Smooth animations (handles captions with smooth-wave, flow-reveal, etc.)
    {
      presetId: 'sub-kinetic-anim-smooth',
      params: {
        inputCaptions: captions,
        globalIntensity: 0.8,
      },
    },
  ],
};
```

### Example 3: Different Layouts + Animations

```typescript
const composition = {
  children: [
    // Spotlight layout (for certain captions)
    {
      presetId: 'sub-kinetic-layout-spotlight',
      params: {
        inputCaptions: captions.filter(
          c => c.metadata?.kineticLayout === 'keyword-spotlight',
        ),
      },
    },
    // Regular layout (for other captions)
    {
      presetId: 'sub-kinetic-layout-base',
      params: {
        inputCaptions: captions.filter(
          c => c.metadata?.kineticLayout !== 'keyword-spotlight',
        ),
      },
    },
    // Animations apply to all
    {
      presetId: 'sub-kinetic-anim-explosive',
      params: {
        inputCaptions: captions,
      },
    },
  ],
};
```

---

## Best Practices

### 1. ID Consistency

**Always use the same ID pattern** between layout and animation presets:

```typescript
// Layout preset
const wordId = `kinetic-layout-${captionIndex}-word-${wordIndex}`;

// Animation preset (must match!)
const wordId = `kinetic-layout-${captionIndex}-word-${wordIndex}`;
```

### 2. Initial Visibility

**Layout preset should start elements visible:**

```typescript
style: {
  opacity: 1,  // ← Animation layer will control this
}
```

### 3. Use mode: 'target'

**Animation preset MUST use target mode:**

```typescript
data: {
  mode: 'target',  // ← Affects existing elements
  targetIds: [wordId],
  // ...
}
```

### 4. Owned Animations

**Define which animations each preset owns:**

```typescript
const OWNED_ANIMATIONS = ['explosive', 'shockwave', 'glitch'];

// Only process if we own this animation
if (!OWNED_ANIMATIONS.includes(animationName)) {
  return; // Skip
}
```

### 5. Fallback Handling

**Always provide fallback values:**

```typescript
const config = LAYOUT_CONFIGS[layoutName] || LAYOUT_CONFIGS['keyword-center'];
const animFunc =
  ANIMATION_LIBRARY[animationName] || ANIMATION_LIBRARY['fade-in'];
```

### 6. Timing Precision

**Preserve exact timing from caption data:**

```typescript
const timing = {
  start: word.absoluteStart, // Use absoluteStart, not start
  duration: word.duration,
};
```

### 7. Intensity Scaling

**Apply global intensity to all values:**

```typescript
duration: 0.5 * intensity,
val: 50 * intensity,
val: `${10 * intensity}px`,
```

### 8. Color RGB Conversion

**Convert hex colors for filter effects:**

```typescript
const hexToRgb = (hex: string) => {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
};

// Usage
val: `drop-shadow(0 0 10px rgba(${rgb.r},${rgb.g},${rgb.b},0.8))`,
```

### 9. Empty Result Handling

**Return empty structure if no captions to process:**

```typescript
if (kineticCaptions.length === 0) {
  return {
    output: {
      config: { duration: 0 },
      childrenData: [],
    },
    options: {
      attachedToId: 'BaseScene',
      attachedContainers: [{ className: 'absolute inset-0' }],
    },
  };
}
```

### 10. File Size Management

**Keep presets focused and under 500 lines:**

- 3-5 layout strategies per layout preset
- 5-8 animations per animation preset
- Split by theme when growing too large

---

## Complete Code Examples

See the full implementation examples in:

1. **Layout Preset**: `sub-kinetic-layout-base.ts` (provided above)
2. **Animation Preset**: `sub-kinetic-anim-explosive.ts` (provided above)

### Additional Animation Preset Example: Smooth Theme

```typescript
// sub-kinetic-anim-smooth.ts

const ANIMATION_LIBRARY = {
  'smooth-wave': (targetId, timing, intensity, colorChoice) => {
    return [
      {
        id: `${targetId}-wave-enter`,
        componentId: 'generic',
        data: {
          type: 'ease-in-out',
          start: timing.start,
          duration: 0.8 * intensity,
          mode: 'target',
          targetIds: [targetId],
          ranges: [
            { key: 'translateY', val: 20 * intensity, prog: 0 },
            { key: 'translateY', val: 0, prog: 1 },
            { key: 'opacity', val: 0, prog: 0 },
            { key: 'opacity', val: 1, prog: 0.6 },
          ],
        } as GenericEffectData,
      },
      {
        id: `${targetId}-wave-float`,
        componentId: 'generic',
        data: {
          type: 'ease-in-out',
          start: timing.start + 0.5,
          duration: Math.max(1.5, timing.duration - 0.5),
          mode: 'target',
          targetIds: [targetId],
          ranges: [
            { key: 'translateY', val: 0, prog: 0 },
            { key: 'translateY', val: -3 * intensity, prog: 0.5 },
            { key: 'translateY', val: 0, prog: 1 },
          ],
        } as GenericEffectData,
      },
    ];
  },

  'flow-reveal': (targetId, timing, intensity, colorChoice) => {
    const accentRgb = hexToRgb(colorChoice.accent);
    return [
      {
        id: `${targetId}-flow-blur`,
        componentId: 'generic',
        data: {
          type: 'ease-out',
          start: timing.start,
          duration: 1.0 * intensity,
          mode: 'target',
          targetIds: [targetId],
          ranges: [
            { key: 'filter', val: `blur(8px)`, prog: 0 },
            { key: 'filter', val: `blur(2px)`, prog: 0.6 },
            { key: 'filter', val: `blur(0px)`, prog: 1 },
            { key: 'opacity', val: 0, prog: 0 },
            { key: 'opacity', val: 0.5, prog: 0.3 },
            { key: 'opacity', val: 1, prog: 1 },
          ],
        } as GenericEffectData,
      },
      {
        id: `${targetId}-flow-glow`,
        componentId: 'generic',
        data: {
          type: 'ease-out',
          start: timing.start + 0.3,
          duration: 0.7 * intensity,
          mode: 'target',
          targetIds: [targetId],
          ranges: [
            {
              key: 'filter',
              val: `drop-shadow(0 0 0px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0))`,
              prog: 0,
            },
            {
              key: 'filter',
              val: `drop-shadow(0 0 12px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.5))`,
              prog: 0.5,
            },
            {
              key: 'filter',
              val: `drop-shadow(0 0 6px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.3))`,
              prog: 1,
            },
          ],
        } as GenericEffectData,
      },
    ];
  },

  'gentle-drift': (targetId, timing, intensity, colorChoice) => {
    return [
      {
        id: `${targetId}-drift-enter`,
        componentId: 'generic',
        data: {
          type: 'ease-out',
          start: timing.start,
          duration: 0.6 * intensity,
          mode: 'target',
          targetIds: [targetId],
          ranges: [
            { key: 'translateX', val: -15 * intensity, prog: 0 },
            { key: 'translateX', val: 0, prog: 1 },
            { key: 'opacity', val: 0, prog: 0 },
            { key: 'opacity', val: 1, prog: 0.5 },
            { key: 'scale', val: 0.95, prog: 0 },
            { key: 'scale', val: 1, prog: 1 },
          ],
        } as GenericEffectData,
      },
      {
        id: `${targetId}-drift-motion`,
        componentId: 'generic',
        data: {
          type: 'ease-in-out',
          start: timing.start + 0.4,
          duration: Math.max(2.0, timing.duration - 0.4),
          mode: 'target',
          targetIds: [targetId],
          ranges: [
            { key: 'translateX', val: 0, prog: 0 },
            { key: 'translateX', val: 3 * intensity, prog: 0.5 },
            { key: 'translateX', val: 0, prog: 1 },
            { key: 'translateY', val: 0, prog: 0 },
            { key: 'translateY', val: 2 * intensity, prog: 0.5 },
            { key: 'translateY', val: 0, prog: 1 },
          ],
        } as GenericEffectData,
      },
    ];
  },
};

const OWNED_ANIMATIONS = ['smooth-wave', 'flow-reveal', 'gentle-drift'];
```

---

## Troubleshooting

### Issue: Animations not applying

**Solution**: Check ID consistency

```typescript
// Layout
const wordId = `kinetic-layout-${captionIndex}-word-${wordIndex}`;

// Animation (must match exactly!)
const wordId = `kinetic-layout-${captionIndex}-word-${wordIndex}`;
```

### Issue: Elements not visible

**Solution**: Ensure layout preset sets initial opacity

```typescript
// In layout preset
style: {
  opacity: 1,  // ← Must start visible
}
```

### Issue: Effects not targeting

**Solution**: Use `mode: 'target'` in animation preset

```typescript
data: {
  mode: 'target',  // ← CRITICAL
  targetIds: [wordId],
}
```

### Issue: Multiple presets conflicting

**Solution**: Use OWNED_ANIMATIONS filter

```typescript
const OWNED_ANIMATIONS = ['explosive', 'shockwave'];

if (!OWNED_ANIMATIONS.includes(animationName)) {
  return; // Let another preset handle it
}
```

---

## Summary

The Kinetic Typography Preset System provides a powerful, flexible architecture for creating dynamic text animations:

1. **Two-Layer Design**: Layout creates structure, Animation adds motion
2. **Modular Organization**: Split presets by theme/style
3. **Per-Word Control**: Override animations via metadata
4. **Composable**: Mix and match layouts and animations
5. **Maintainable**: Each preset stays focused and under 500 lines
6. **Scalable**: Easy to add new layouts and animations

Start with the base layout preset and one animation theme, then expand as needed!



