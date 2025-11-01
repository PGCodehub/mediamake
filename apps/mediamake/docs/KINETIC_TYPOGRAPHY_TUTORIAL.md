# Kinetic Typography Tutorial: Build Your First Preset

## Introduction

This tutorial will walk you through creating your first kinetic typography preset system from scratch. By the end, you'll have:

1. A layout preset that arranges text
2. An animation preset that animates text
3. A working composition that brings them together

**Time Required**: 30-45 minutes  
**Difficulty**: Intermediate  
**Prerequisites**: Understanding of TypeScript and React

---

## Part 1: Understanding the System

### The Two-Layer Architecture

Think of it like building with LEGO:

- **Layout Layer** = The base plates and structure
- **Animation Layer** = The moving parts and motors

```
Caption Data → Layout Preset → DOM Structure (static)
                                      ↓
                              Animation Preset → Add Motion
                                      ↓
                              Final Rendered Output
```

### Key Concept: Stable IDs

The secret sauce is **stable IDs**. Both layers use the same ID pattern:

```typescript
const wordId = `kinetic-layout-${captionIndex}-word-${wordIndex}`;
```

This allows the animation layer to target elements created by the layout layer.

---

## Part 2: Create Your First Layout Preset

### Step 1: Create the File

Create `apps/mediamake/components/editor/presets/registry/sub-kinetic-layout-simple.ts`

### Step 2: Basic Imports

```typescript
import { Transcription } from '@/app/types/transcription';
import { RenderableComponentData } from '@microfox/datamotion';
import { TextAtomData } from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
import { CSSProperties } from 'react';
```

### Step 3: Define Parameters

```typescript
const presetParams = z.object({
  inputCaptions: z.array(z.any()).describe('input captions'),
  avgFontSize: z.number().default(50).optional(),
  fontChoices: z
    .array(
      z.object({
        primaryFont: z.string(),
        headerFont: z.string(),
      }),
    )
    .optional(),
  colorChoices: z
    .array(
      z.object({
        primary: z.string(),
        accent: z.string(),
      }),
    )
    .optional(),
});
```

### Step 4: Start the Execution Function

```typescript
const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  const { inputCaptions, avgFontSize, fontChoices, colorChoices } = params;

  // Step 4a: Filter captions with KineticTopo flag
  const kineticCaptions = inputCaptions.filter(
    caption => caption.metadata?.KineticTopo === true,
  );

  // Step 4b: Early exit if no kinetic captions
  if (kineticCaptions.length === 0) {
    return {
      output: { config: { duration: 0 }, childrenData: [] },
      options: {
        attachedToId: 'BaseScene',
        attachedContainers: [{ className: 'absolute inset-0' }],
      },
    };
  }

  // More code to come...
};
```

### Step 5: Add Utility Functions

```typescript
// Inside presetExecution, after early exit check

// Find keyword in words
const findKeywordIndex = (words: any[], keyword: string): number => {
  if (!keyword) return -1;
  const cleanKeyword = keyword.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
  return words.findIndex(word => {
    const cleanWord = word.text?.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    return cleanWord?.includes(cleanKeyword);
  });
};
```

### Step 6: Select Font and Colors

```typescript
// Default choices
const FONT_CHOICES =
  fontChoices && fontChoices.length > 0
    ? fontChoices
    : [{ primaryFont: 'Inter:600', headerFont: 'BebasNeue:700' }];

const selectedFont = FONT_CHOICES[0]; // Use first for simplicity

const selectedColor =
  colorChoices && colorChoices.length > 0
    ? colorChoices[0]
    : { primary: '#ffffff', accent: '#ff6b6b' };
```

### Step 7: Create Word Component Generator

```typescript
// Generate a single word component
const createWordComponent = (
  word: any,
  wordId: string,
  isKeyword: boolean,
): RenderableComponentData => {
  const fontSize = avgFontSize || 50;
  const scaledSize = isKeyword ? fontSize * 1.4 : fontSize;

  const font = isKeyword ? selectedFont.headerFont : selectedFont.primaryFont;
  const fontFamily = font.includes(':') ? font.split(':')[0] : font;

  const color = isKeyword ? selectedColor.accent : selectedColor.primary;

  return {
    type: 'atom',
    id: wordId, // ← CRITICAL: Stable ID
    componentId: 'TextAtom',
    effects: [], // ← NO animations in layout
    data: {
      text: word.text,
      style: {
        fontSize: scaledSize,
        color: color,
        opacity: 1, // ← Start visible
        fontFamily: fontFamily,
        fontWeight: isKeyword ? 700 : 600,
      },
    } as TextAtomData,
    context: {
      timing: {
        start: 0,
        duration: word.duration || 1,
      },
    },
  } as RenderableComponentData;
};
```

### Step 8: Process Each Caption

```typescript
// Process all kinetic captions
const processedCaptions = kineticCaptions.map((caption, captionIndex) => {
  const captionId = `kinetic-layout-${captionIndex}`;

  // Find keyword
  const keyword = caption.metadata?.keyword || '';
  const keywordIndex = findKeywordIndex(caption.words, keyword);

  // Split words into before/keyword/after
  const before = keywordIndex > 0 ? caption.words.slice(0, keywordIndex) : [];
  const keywordWord = keywordIndex >= 0 ? [caption.words[keywordIndex]] : [];
  const after = keywordIndex >= 0 ? caption.words.slice(keywordIndex + 1) : [];
  const allWords =
    keywordIndex >= 0 ? [...before, ...keywordWord, ...after] : caption.words;

  // Generate word components
  const wordComponents = allWords.map((word, wordIndex) => {
    const originalIndex = caption.words.indexOf(word);
    const wordId = `${captionId}-word-${originalIndex}`;
    const isKeyword = originalIndex === keywordIndex;

    return createWordComponent(word, wordId, isKeyword);
  });

  // Create caption container
  return {
    type: 'layout',
    id: captionId,
    componentId: 'BaseLayout',
    data: {
      containerProps: {
        className: 'flex flex-row items-center justify-center text-white',
        style: {
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          gap: '20px',
        },
      },
    },
    context: {
      timing: {
        start: caption.absoluteStart,
        duration: caption.duration,
      },
    },
    childrenData: wordComponents,
  } as RenderableComponentData;
});
```

### Step 9: Return the Final Structure

```typescript
  // Calculate total duration
  const lastCaption = kineticCaptions[kineticCaptions.length - 1];
  const totalDuration = lastCaption.absoluteEnd;

  // Return final structure
  return {
    output: {
      config: { duration: totalDuration },
      childrenData: [{
        id: 'KineticLayoutSimple',
        componentId: 'BaseLayout',
        type: 'layout',
        data: {
          containerProps: { className: 'absolute inset-0' },
        },
        context: {
          timing: { start: 0, duration: totalDuration },
        },
        childrenData: processedCaptions,
      }],
    },
    options: {
      attachedToId: 'BaseScene',
      attachedContainers: [{ className: 'absolute inset-0' }],
    },
  };
};
```

### Step 10: Add Metadata and Export

```typescript
const presetMetadata: PresetMetadata = {
  id: 'sub-kinetic-layout-simple',
  title: 'Kinetic Typography - Simple Layout',
  description: 'Simple horizontal layout with keyword highlighting',
  type: 'predefined',
  presetType: 'children',
  tags: ['kinetic', 'layout', 'simple'],
  defaultInputParams: {
    avgFontSize: 50,
    fontChoices: [{ primaryFont: 'Inter:600', headerFont: 'BebasNeue:700' }],
    colorChoices: [{ primary: '#ffffff', accent: '#ff6b6b' }],
    inputCaptions: [],
  },
};

const _presetExecution = presetExecution.toString();

export const subKineticLayoutSimplePreset = {
  metadata: presetMetadata,
  presetFunction: _presetExecution,
  presetParams: z.toJSONSchema(presetParams),
};
```

**🎉 Congratulations! You've created your first layout preset!**

---

## Part 3: Create Your First Animation Preset

### Step 1: Create the File

Create `apps/mediamake/components/editor/presets/registry/sub-kinetic-anim-basic.ts`

### Step 2: Basic Imports

```typescript
import { RenderableComponentData } from '@microfox/datamotion';
import { GenericEffectData } from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';
```

### Step 3: Define Parameters

```typescript
const presetParams = z.object({
  inputCaptions: z.array(z.any()).describe('input captions'),
  globalIntensity: z.number().default(1.0).optional(),
  colorChoices: z
    .array(
      z.object({
        primary: z.string(),
        accent: z.string(),
      }),
    )
    .optional(),
});
```

### Step 4: Start Execution with Utilities

```typescript
const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  const { inputCaptions, globalIntensity, colorChoices } = params;

  // Utility: Convert hex to RGB
  const hexToRgb = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });

  // More code to come...
};
```

### Step 5: Create Animation Library

```typescript
// Inside presetExecution

const ANIMATION_LIBRARY: Record<
  string,
  (
    targetId: string,
    timing: { start: number; duration: number },
    intensity: number,
    colorChoice?: any,
  ) => any | any[]
> = {
  // Simple fade-in
  'fade-in': (targetId, timing, intensity) => ({
    id: `${targetId}-fade`,
    componentId: 'generic',
    data: {
      type: 'ease-out',
      start: timing.start,
      duration: 0.3 * intensity,
      mode: 'target', // ← CRITICAL!
      targetIds: [targetId],
      ranges: [
        { key: 'opacity', val: 0, prog: 0 },
        { key: 'opacity', val: 1, prog: 1 },
      ],
    } as GenericEffectData,
  }),

  // Scale pop
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

  // Explosive (for keywords)
  explosive: (targetId, timing, intensity, colorChoice) => {
    const rgb = hexToRgb(colorChoice.accent);
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
              val: `drop-shadow(0 0 0px rgba(${rgb.r},${rgb.g},${rgb.b},0))`,
              prog: 0,
            },
            {
              key: 'filter',
              val: `drop-shadow(0 0 30px rgba(${rgb.r},${rgb.g},${rgb.b},1))`,
              prog: 0.4,
            },
            {
              key: 'filter',
              val: `drop-shadow(0 0 10px rgba(${rgb.r},${rgb.g},${rgb.b},0.7))`,
              prog: 1,
            },
          ],
        } as GenericEffectData,
      },
    ];
  },
};
```

### Step 6: Filter Captions

```typescript
// Filter kinetic captions
const kineticCaptions = inputCaptions.filter(
  c => c.metadata?.KineticTopo === true,
);

if (kineticCaptions.length === 0) {
  return {
    output: { config: { duration: 0 }, childrenData: [] },
    options: {
      attachedToId: 'BaseScene',
      attachedContainers: [{ className: 'absolute inset-0' }],
    },
  };
}
```

### Step 7: Select Colors

```typescript
const selectedColor =
  colorChoices && colorChoices.length > 0
    ? colorChoices[0]
    : { primary: '#ffffff', accent: '#ff6b6b' };
```

### Step 8: Generate Animation Effects

```typescript
// Collect all effects
const allEffects: any[] = [];

kineticCaptions.forEach((caption, captionIndex) => {
  // Match layout preset's ID pattern
  const captionId = `kinetic-layout-${captionIndex}`;

  // Find keyword
  const keyword = caption.metadata?.keyword || '';
  const keywordIndex = caption.words.findIndex(w =>
    w.text.toLowerCase().includes(keyword.toLowerCase()),
  );

  // Process each word
  caption.words.forEach((word, wordIndex) => {
    // Generate the SAME ID that layout preset used
    const wordId = `${captionId}-word-${wordIndex}`;
    const isKeyword = wordIndex === keywordIndex;

    // Determine animation
    const animationName =
      word.metadata?.animation || (isKeyword ? 'explosive' : 'fade-in');

    // Get timing
    const timing = {
      start: word.absoluteStart,
      duration: word.duration,
    };

    // Create animation
    const animFunc = ANIMATION_LIBRARY[animationName];
    if (animFunc) {
      const effects = animFunc(
        wordId,
        timing,
        globalIntensity || 1.0,
        selectedColor,
      );

      // Handle single or array of effects
      if (Array.isArray(effects)) {
        allEffects.push(...effects);
      } else {
        allEffects.push(effects);
      }
    }
  });
});
```

### Step 9: Return Effects

```typescript
  // Calculate duration
  const lastCaption = kineticCaptions[kineticCaptions.length - 1];
  const totalDuration = lastCaption.absoluteEnd;

  // Return effects only (no children!)
  return {
    output: {
      config: { duration: totalDuration },
      childrenData: [{
        id: 'KineticAnimBasic',
        componentId: 'BaseLayout',
        type: 'layout',
        effects: allEffects,  // ← All animations here
        data: {
          containerProps: {
            className: 'absolute inset-0 pointer-events-none',
          },
        },
        context: {
          timing: { start: 0, duration: totalDuration },
        },
        childrenData: [],  // ← No children!
      }],
    },
    options: {
      attachedToId: 'BaseScene',
      attachedContainers: [{ className: 'absolute inset-0' }],
    },
  };
};
```

### Step 10: Add Metadata and Export

```typescript
const presetMetadata: PresetMetadata = {
  id: 'sub-kinetic-anim-basic',
  title: 'Kinetic Typography - Basic Animations',
  description: 'Basic animation effects for kinetic typography',
  type: 'predefined',
  presetType: 'children',
  tags: ['kinetic', 'animation', 'basic'],
  availableAnimations: ['fade-in', 'scale-pop', 'explosive'],
  defaultInputParams: {
    globalIntensity: 1.0,
    colorChoices: [{ primary: '#ffffff', accent: '#ff6b6b' }],
    inputCaptions: [],
  },
};

const _presetExecution = presetExecution.toString();

export const subKineticAnimBasicPreset = {
  metadata: presetMetadata,
  presetFunction: _presetExecution,
  presetParams: z.toJSONSchema(presetParams),
};
```

**🎉 Congratulations! You've created your first animation preset!**

---

## Part 4: Register Your Presets

### Step 1: Import in Registry

Edit `apps/mediamake/components/editor/presets/registry/index.ts`:

```typescript
// Add these imports
import { subKineticLayoutSimplePreset } from './sub-kinetic-layout-simple';
import { subKineticAnimBasicPreset } from './sub-kinetic-anim-basic';

// Add to the registry export
export const presetRegistry = {
  // ... existing presets
  'sub-kinetic-layout-simple': subKineticLayoutSimplePreset,
  'sub-kinetic-anim-basic': subKineticAnimBasicPreset,
};
```

---

## Part 5: Test Your Presets

### Create Test Caption Data

```typescript
const testCaptions = [
  {
    text: 'This is AMAZING!',
    absoluteStart: 0,
    absoluteEnd: 2.5,
    duration: 2.5,
    words: [
      {
        text: 'This',
        absoluteStart: 0,
        absoluteEnd: 0.5,
        duration: 0.5,
      },
      {
        text: 'is',
        absoluteStart: 0.5,
        absoluteEnd: 0.8,
        duration: 0.3,
      },
      {
        text: 'AMAZING!',
        absoluteStart: 0.8,
        absoluteEnd: 2.5,
        duration: 1.7,
      },
    ],
    metadata: {
      KineticTopo: true,
      keyword: 'AMAZING',
    },
  },
];
```

### Create Composition

```typescript
const composition = {
  children: [
    // Layout layer
    {
      presetId: 'sub-kinetic-layout-simple',
      params: {
        inputCaptions: testCaptions,
        avgFontSize: 50,
      },
    },
    // Animation layer
    {
      presetId: 'sub-kinetic-anim-basic',
      params: {
        inputCaptions: testCaptions,
        globalIntensity: 1.2,
      },
    },
  ],
};
```

### Expected Result

1. Words appear in a horizontal line
2. "This" and "is" fade in normally
3. "AMAZING!" has explosive scale + glow effect
4. "AMAZING!" is larger and colored with accent color

---

## Part 6: Add More Animations

### Add a Slide Animation

In your animation preset, add to `ANIMATION_LIBRARY`:

```typescript
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
```

### Test with Per-Word Override

```typescript
const testCaptions = [
  {
    words: [
      {
        text: 'This',
        metadata: { animation: 'slide-left' }, // ← Override!
      },
      // ... other words
    ],
  },
];
```

---

## Part 7: Add More Layout Strategies

### Add Vertical Stack Layout

In your layout preset, modify the caption processing:

```typescript
// In processedCaptions.map()
const layoutStrategy = caption.metadata?.kineticLayout || 'horizontal';

let containerStyle: any = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
};

if (layoutStrategy === 'vertical') {
  containerStyle = {
    ...containerStyle,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
  };
} else {
  containerStyle = {
    ...containerStyle,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '20px',
  };
}
```

### Test Vertical Layout

```typescript
metadata: {
  KineticTopo: true,
  kineticLayout: "vertical",  // ← Use vertical
  keyword: "AMAZING",
}
```

---

## Troubleshooting

### Issue: Nothing shows up

**Check**:

1. Is `KineticTopo: true` in metadata?
2. Are caption times correct (absoluteStart/End)?
3. Is layout preset setting `opacity: 1`?

### Issue: Animations don't work

**Check**:

1. Do IDs match between presets?
2. Is animation using `mode: 'target'`?
3. Are you including both presets in composition?

### Issue: Wrong words animated

**Check**:

1. Is keyword matching correctly?
2. Are word indices consistent?
3. Check browser console for word IDs

---

## Next Steps

Now that you have the basics:

1. **Add more animations**: bounce, rotate, blur-reveal
2. **Add more layouts**: circular, scattered, grid
3. **Create themed presets**: explosive, smooth, mechanical
4. **Add enhancement layer**: particles, backgrounds, spotlights

---

## Complete File Reference

### Layout Preset Structure

```
├── Imports
├── Parameter Schema
├── Execution Function
│   ├── Filter Captions
│   ├── Utility Functions
│   ├── Select Font/Colors
│   ├── Create Word Component
│   ├── Process Captions
│   └── Return Structure
├── Metadata
└── Export
```

### Animation Preset Structure

```
├── Imports
├── Parameter Schema
├── Execution Function
│   ├── Utility Functions (hexToRgb)
│   ├── Animation Library
│   ├── Filter Captions
│   ├── Select Colors
│   ├── Generate Effects
│   └── Return Effects
├── Metadata
└── Export
```

---

## Summary

You've learned:

✅ How to create a layout preset (structure)  
✅ How to create an animation preset (motion)  
✅ How to use stable IDs to connect them  
✅ How to handle keywords and per-word overrides  
✅ How to test and debug your presets

**You're now ready to build complex kinetic typography systems!**

For more advanced features, see:

- `KINETIC_TYPOGRAPHY_PRESET_GUIDE.md` - Complete guide
- `KINETIC_TYPOGRAPHY_QUICK_REFERENCE.md` - Quick reference



