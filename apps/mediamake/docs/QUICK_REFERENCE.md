# Quick Reference - Preset Creation

Fast lookup for common patterns and code snippets.

## ⚠️ CRITICAL: Combined Approach Template

**ALWAYS use this template for future-proof presets!**

```typescript
const presetParams = z.object({
  inputCaptions: z.array(z.any()),
  wordEffects: z
    .array(
      z.object({
        pattern: z.string(),
        effectType: z.enum(['highlight', 'circle', 'glow']),
        color: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  disableMetadata: z.boolean().optional().default(false),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  const createWord = (word, index, caption) => {
    // PRIORITY 1: Check word.metadata (AI)
    if (!params.disableMetadata && word.metadata?.isHighlight) {
      return createHighlightWord(word, index, word.metadata);
    }

    // PRIORITY 2: Check caption.metadata.keyword (AI)
    if (!params.disableMetadata && caption.metadata?.keyword) {
      if (
        word.text.toLowerCase().includes(caption.metadata.keyword.toLowerCase())
      ) {
        return createKeywordWord(word, index);
      }
    }

    // PRIORITY 3: Check pattern rules (User)
    const patternEffect = findPatternMatch(word.text, params.wordEffects);
    if (patternEffect) {
      return createPatternWord(word, index, patternEffect);
    }

    // DEFAULT: Regular word
    return createRegularWord(word, index);
  };

  // ... process captions
};
```

See [Pattern 10](./ADVANCED_PRESET_GUIDE.md#pattern-10-future-proof-preset-design-combined-approach-) for complete implementation.

---

## 🔌 Plug & Play: Reusable Effect Library

**Don't repeat code! Build a shared library once, use everywhere.**

```typescript
// Create: apps/mediamake/components/editor/presets/helpers/word-effects.ts
export const createHighlightWord = (word, index, config) => {
  /* ... */
};
export const createCircleWord = (word, index, config) => {
  /* ... */
};
export const createCounterWord = (word, index, config) => {
  /* ... */
};
export const createGlowWord = (word, index, config) => {
  /* ... */
};

// Use in ANY preset:
import {
  createHighlightWord,
  createCircleWord,
  createCounterWord,
} from '../helpers/word-effects';

// Just plug in!
switch (effectType) {
  case 'highlight':
    return createHighlightWord(word, index, config);
  case 'circle':
    return createCircleWord(word, index, config);
  case 'counter':
    return createCounterWord(word, index, config);
}
```

**Benefits:** ✅ Write once ✅ Update once ✅ Consistent ✅ No duplication

See [Pattern 11](./ADVANCED_PRESET_GUIDE.md#pattern-11-plug--play-effect-libraries-reusable-helpers-) for complete library code.

---

## 🎯 Basic Preset Template

```typescript
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

const presetParams = z.object({
  inputCaptions: z.array(z.any()),
  // your params here
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  // your logic here
  return {
    output: {
      config: { duration: totalDuration },
      childrenData: [
        /* components */
      ],
    },
    options: {
      attachedToId: 'BaseScene',
      attachedContainers: [{ className: 'absolute inset-0' }],
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'unique-id',
  title: 'Display Name',
  description: 'What it does',
  type: 'predefined',
  presetType: 'children',
  tags: ['tag1', 'tag2'],
  defaultInputParams: {
    /* defaults */
  },
};

export const myPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
```

---

## 📦 Component Snippets

### TextAtom

```typescript
{
  type: 'atom',
  id: 'text-1',
  componentId: 'TextAtom',
  data: {
    text: 'Hello',
    className: 'font-bold',
    style: {
      fontSize: 50,
      color: '#FFFFFF',
      fontWeight: 700,
    },
    font: { family: 'Inter', weights: ['400', '700'] },
  },
  context: { timing: { start: 0, duration: 5 } },
}
```

### ShapeAtom (Circle)

```typescript
{
  type: 'atom',
  id: 'circle-1',
  componentId: 'ShapeAtom',
  data: {
    shape: 'circle',
    color: 'transparent',
    style: {
      border: '4px solid #FF0000',
      boxShadow: '0 0 10px rgba(255,0,0,0.5)',
    },
  },
  context: { timing: { start: 0, duration: 5 } },
}
```

### ShapeAtom (Rectangle)

```typescript
{
  type: 'atom',
  id: 'box-1',
  componentId: 'ShapeAtom',
  data: {
    shape: 'rectangle',
    color: '#FF0000',
    style: {
      borderRadius: '8px',
    },
  },
  context: { timing: { start: 0, duration: 5 } },
}
```

### BaseLayout (Container)

```typescript
{
  type: 'layout',
  id: 'container-1',
  componentId: 'BaseLayout',
  data: {
    containerProps: {
      className: 'flex flex-row gap-4',
      style: { padding: '20px' },
    },
    childrenProps: [
      { className: 'absolute inset-0' },  // Child 1
      { className: 'relative z-10' },     // Child 2
    ],
  },
  context: { timing: { start: 0, duration: 5 } },
  childrenData: [/* children here */],
}
```

---

## ✨ Effect Snippets

### Fade In

```typescript
{
  id: 'fade-in',
  componentId: 'generic',
  data: {
    type: 'ease-in',
    start: 0,
    duration: 0.3,
    mode: 'provider',
    targetIds: ['my-component'],
    ranges: [
      { key: 'opacity', val: 0, prog: 0 },
      { key: 'opacity', val: 1, prog: 1 },
    ],
  },
}
```

### Scale Pop

```typescript
{
  id: 'scale-pop',
  componentId: 'generic',
  data: {
    type: 'spring',
    start: 0,
    duration: 0.3,
    mode: 'provider',
    targetIds: ['my-component'],
    ranges: [
      { key: 'scale', val: 0.5, prog: 0 },
      { key: 'scale', val: 1.1, prog: 0.5 },
      { key: 'scale', val: 1, prog: 1 },
    ],
  },
}
```

### Slide In (from right)

```typescript
{
  id: 'slide-in',
  componentId: 'generic',
  data: {
    type: 'ease-out',
    start: 0,
    duration: 0.5,
    mode: 'provider',
    targetIds: ['my-component'],
    ranges: [
      { key: 'translateX', val: 100, prog: 0 },
      { key: 'translateX', val: 0, prog: 1 },
      { key: 'opacity', val: 0, prog: 0 },
      { key: 'opacity', val: 1, prog: 1 },
    ],
  },
}
```

### Glow Effect

```typescript
{
  id: 'glow',
  componentId: 'generic',
  data: {
    type: 'ease-out',
    start: 0,
    duration: 0.5,
    mode: 'provider',
    targetIds: ['my-component'],
    ranges: [
      {
        key: 'filter',
        val: 'drop-shadow(0 0 0px rgba(255,215,0,0))',
        prog: 0,
      },
      {
        key: 'filter',
        val: 'drop-shadow(0 0 20px rgba(255,215,0,0.8))',
        prog: 1,
      },
    ],
  },
}
```

### Blur Effect

```typescript
{
  id: 'blur',
  componentId: 'generic',
  data: {
    type: 'ease-out',
    start: 0,
    duration: 0.4,
    mode: 'provider',
    targetIds: ['my-component'],
    ranges: [
      { key: 'filter', val: 'blur(8px)', prog: 0 },
      { key: 'filter', val: 'blur(0px)', prog: 1 },
    ],
  },
}
```

### Rotate

```typescript
{
  id: 'rotate',
  componentId: 'generic',
  data: {
    type: 'ease-out',
    start: 0,
    duration: 0.5,
    mode: 'provider',
    targetIds: ['my-component'],
    ranges: [
      { key: 'rotate', val: -10, prog: 0 },
      { key: 'rotate', val: 0, prog: 1 },
    ],
  },
}
```

### Continuous Pulse (Loop)

```typescript
// First add the loop wrapper
{
  id: 'pulse-loop',
  componentId: 'loop',
  data: {
    durationInFrames: 30,  // 1 second at 30fps
    times: Infinity,
    layout: 'none',
  },
},
// Then add the pulse effect
{
  id: 'pulse',
  componentId: 'generic',
  data: {
    type: 'ease-in-out',
    start: 0,
    duration: 1,
    mode: 'provider',
    targetIds: ['my-component'],
    ranges: [
      { key: 'scale', val: 1, prog: 0 },
      { key: 'scale', val: 1.1, prog: 0.5 },
      { key: 'scale', val: 1, prog: 1 },
    ],
  },
}
```

---

## 🎨 Common Patterns

### Pattern Matching (Regex)

```typescript
// In params
positionRules: z.array(
  z.object({
    pattern: z.string(),
    position: z.enum(['bottom', 'center', 'top']),
  }),
);

// In execution
const getPositionForCaption = caption => {
  for (const rule of positionRules) {
    const regex = new RegExp(rule.pattern, 'i');
    if (regex.test(caption.text)) {
      return rule.position;
    }
  }
  return defaultPosition;
};
```

### Word Effect Factory

```typescript
const createWord = (word, index, effect) => {
  if (!effect) return createRegularWord(word, index);

  switch (effect.effectType) {
    case 'highlight':
      return createHighlightWord(word, index, effect);
    case 'circle':
      return createCircleWord(word, index, effect);
    case 'glow':
      return createGlowWord(word, index, effect);
    default:
      return createRegularWord(word, index);
  }
};
```

### Helper Functions

```typescript
// Convert hex to RGB
const hexToRgb = hex => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

// Extract number from text
const extractNumber = text => {
  const cleaned = text.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

// Position helper
const getPositionStyle = position => {
  switch (position) {
    case 'center':
      return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    case 'top':
      return { top: '50px', left: 0, right: 0 };
    case 'bottom':
    default:
      return { bottom: '50px', left: 0, right: 0 };
  }
};
```

---

## 🎬 Complete Mini-Patterns

### Yellow Highlight Word

```typescript
{
  type: 'atom',
  id: `highlight-${i}`,
  componentId: 'TextAtom',
  effects: [
    {
      id: `draw-${i}`,
      componentId: 'generic',
      data: {
        type: 'ease-out',
        start: word.start,
        duration: 0.3,
        mode: 'provider',
        targetIds: [`highlight-${i}`],
        ranges: [
          { key: 'scaleX', val: 0, prog: 0 },
          { key: 'scaleX', val: 1, prog: 1 },
        ],
      },
    },
  ],
  data: {
    text: word.text,
    style: {
      fontSize: 55,
      color: '#000000',
      backgroundColor: '#FFEB3B',
      padding: '4px 12px',
      borderRadius: '6px',
      display: 'inline-block',
      transformOrigin: 'left center',
    },
    font: { family: 'Inter', weights: ['700'] },
  },
  context: { timing: { start: 0, duration: word.duration } },
}
```

### Circle Around Word

```typescript
// Layer 1: Circle
const circle = {
  type: 'atom',
  id: `circle-${i}`,
  componentId: 'ShapeAtom',
  effects: [
    {
      id: `circle-draw-${i}`,
      componentId: 'generic',
      data: {
        type: 'ease-out',
        start: word.start,
        duration: 0.5,
        mode: 'provider',
        targetIds: [`circle-${i}`],
        ranges: [
          { key: 'scale', val: 0, prog: 0 },
          { key: 'scale', val: 1.1, prog: 0.7 },
          { key: 'scale', val: 1, prog: 1 },
          { key: 'rotate', val: -10, prog: 0 },
          { key: 'rotate', val: 0, prog: 1 },
        ],
      },
    },
  ],
  data: {
    shape: 'circle',
    color: 'transparent',
    style: { border: '5px solid #FF0000' },
  },
  context: { timing: { start: 0, duration: word.duration } },
};

// Layer 2: Text
const text = {
  type: 'atom',
  id: `text-${i}`,
  componentId: 'TextAtom',
  data: {
    text: word.text,
    style: { fontSize: 55, fontWeight: 900, color: '#FF0000' },
    font: { family: 'BebasNeue' },
  },
  context: { timing: { start: 0, duration: word.duration } },
};

// Wrapper: Layer them
{
  type: 'layout',
  id: `circled-${i}`,
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
}
```

---

## 🔧 Common Animatable Properties

| Property          | Example Values                      | Description              |
| ----------------- | ----------------------------------- | ------------------------ |
| `opacity`         | `0`, `0.5`, `1`                     | Transparency             |
| `translateX`      | `-100`, `0`, `100`                  | Horizontal position (px) |
| `translateY`      | `-50`, `0`, `50`                    | Vertical position (px)   |
| `scale`           | `0.5`, `1`, `1.5`                   | Uniform scale            |
| `scaleX`          | `0`, `1`, `2`                       | Horizontal scale         |
| `scaleY`          | `0.5`, `1`, `1.5`                   | Vertical scale           |
| `rotate`          | `-45`, `0`, `90`                    | Rotation (degrees)       |
| `letterSpacing`   | `'0.1em'`, `'0.2em'`                | Text spacing             |
| `filter`          | `'blur(5px)'`, `'drop-shadow(...)'` | Filter effects           |
| `color`           | `'#FF0000'`, `'rgb(255,0,0)'`       | Text color               |
| `backgroundColor` | `'#FFEB3B'`                         | Background color         |

---

## 📏 Timing Patterns

### Sequential Words

```typescript
caption.words.map((word, i) => ({
  context: {
    timing: {
      start: word.start, // Each word starts at its own time
      duration: caption.duration, // All stay for full caption
    },
  },
}));
```

### Staggered Animation

```typescript
words.map((word, i) => ({
  effects: [
    {
      data: {
        start: word.start + i * 0.1, // Stagger by 0.1s
        duration: 0.3,
      },
    },
  ],
}));
```

### Simultaneous

```typescript
words.map(word => ({
  context: {
    timing: {
      start: 0, // All start together
      duration: caption.duration,
    },
  },
}));
```

---

## 🎯 Effect Types

| Type          | Description          | Use Case                |
| ------------- | -------------------- | ----------------------- |
| `ease-in`     | Slow start, fast end | Fade in, zoom in        |
| `ease-out`    | Fast start, slow end | Fade out, slide in      |
| `ease-in-out` | Slow both ends       | Smooth transitions      |
| `linear`      | Constant speed       | Progress bars, counters |
| `spring`      | Bouncy               | Pop effects, emphasis   |

---

## 🔧 Metadata Quick Reference

### Word Metadata

```typescript
word.metadata = {
  isHighlight: true, // Should highlight this word
  color: '#FFD700', // Custom color
  importance: 0.9, // AI confidence score (0-1)
};

// Check in preset
if (word.metadata?.isHighlight) {
  return createHighlightWord(word, index);
}
```

### Caption Metadata

```typescript
caption.metadata = {
  keyword: 'important', // Word to emphasize
  splitParts: 2, // Multi-line split
  sentiment: 'positive', // AI sentiment
  importance: 0.8, // Caption score
};

// Find keyword
const keywordIndex = caption.words.findIndex(w =>
  w.text.toLowerCase().includes(caption.metadata.keyword.toLowerCase()),
);
```

### Combining Metadata + Patterns

```typescript
const getEffectForWord = (word, caption) => {
  // Priority 1: Check word metadata
  if (word.metadata?.isHighlight) {
    return { type: 'highlight', color: word.metadata.color || '#FFEB3B' };
  }

  // Priority 2: Check caption keyword
  if (
    caption.metadata?.keyword &&
    word.text.toLowerCase().includes(caption.metadata.keyword.toLowerCase())
  ) {
    return { type: 'glow', color: '#FFD700' };
  }

  // Priority 3: Pattern matching
  if (/\$[0-9,]+/.test(word.text)) {
    return { type: 'circle', color: '#FF0000' };
  }

  return null; // Regular word
};
```

---

## 🚀 Quick Tips

1. **Stack effects** - Add multiple effects to one component
2. **Use targetIds** - Precise control with provider mode
3. **Layer with BaseLayout** - Use childrenProps for positioning
4. **Test incrementally** - Add one feature at a time
5. **Copy patterns** - Start from existing presets
6. **Use helpers** - Create reusable functions
7. **Regex patterns** - Match content flexibly
8. **Transform origin** - Set for scale/rotate effects
9. **Support metadata** - Check metadata first, fall back to patterns
10. **Disable metadata** - Add `disableMetadata` param for flexibility
11. **🔌 Build libraries** - Create shared effect helpers to avoid code duplication

---

## 📚 Full Documentation

See [ADVANCED_PRESET_GUIDE.md](./ADVANCED_PRESET_GUIDE.md) for complete patterns and examples.

**Metadata Guide:** [Pattern 9: Using Caption and Word Metadata](./ADVANCED_PRESET_GUIDE.md#pattern-9-using-caption-and-word-metadata)

**Plug & Play Guide:** [Pattern 11: Plug & Play Effect Libraries](./ADVANCED_PRESET_GUIDE.md#pattern-11-plug--play-effect-libraries-reusable-helpers-)
