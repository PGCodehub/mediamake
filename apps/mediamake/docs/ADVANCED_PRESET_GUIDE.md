# Advanced Preset Creation Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Core Architecture](#core-architecture)
3. [Building Blocks](#building-blocks)
4. [Effect System](#effect-system)
5. [Advanced Patterns](#advanced-patterns)
   - Pattern 1: Conditional Sentence Positioning
   - Pattern 2: Word-Level Effect Rules
   - Pattern 3: Yellow Highlight Effect
   - Pattern 4: Circle Draw Effect
   - Pattern 5: Box Frame Effect
   - Pattern 6: Simulated Counter Animation
   - Pattern 7: Glow Pulse Effect
   - Pattern 8: Underline Draw Effect
   - Pattern 9: Using Caption and Word Metadata
   - **Pattern 10: Future-Proof Preset Design (Combined Approach)** ⭐⭐⭐ **CRITICAL**
   - **Pattern 11: Plug & Play Effect Libraries (Reusable Helpers)** 🔌 **RECOMMENDED**
6. [Complete Examples](#complete-examples)
7. [Best Practices](#best-practices)

---

## Introduction

This guide covers advanced techniques for creating custom presets with special effects, animations, and conditional behaviors. You'll learn how to create sophisticated subtitle presets without writing custom components.

### What You Can Achieve

- **Conditional Positioning**: Place specific sentences at different screen positions
- **Word-Level Effects**: Apply special effects to specific words (highlights, circles, glows)
- **Number Animations**: Create counting animations for numbers
- **Layered Components**: Stack multiple visual elements (shapes, text, effects)
- **Complex Animations**: Combine multiple effects for sophisticated motion
- **Pattern Matching**: Use regex to target specific content

### Key Principle

**You don't need custom atoms!** Use existing building blocks:

- `TextAtom` - for text rendering
- `ShapeAtom` - for shapes (circles, rectangles)
- `ImageAtom` - for images
- `VideoAtom` - for videos
- `BaseLayout` - for composition and layering
- `GenericEffectData` - for all animations

---

## Core Architecture

### Preset Structure

Every preset follows this structure:

```typescript
// 1. Define input parameters with Zod schema
const presetParams = z.object({
  inputCaptions: z.array(z.any()),
  // ... your custom parameters
});

// 2. Execution function
const presetExecution = (params: z.infer<typeof presetParams>): PresetOutput => {
  // Process captions and generate component tree
  return {
    output: {
      config: { duration: totalDuration },
      childrenData: [...], // Array of RenderableComponentData
    },
    options: {
      attachedToId: 'BaseScene',
      attachedContainers: [{ className: 'absolute inset-0' }],
    },
  };
};

// 3. Metadata
const presetMetadata: PresetMetadata = {
  id: 'unique-preset-id',
  title: 'Display Title',
  description: 'What this preset does',
  type: 'predefined',
  presetType: 'children',
  tags: ['subtitle', 'animation'],
  defaultInputParams: { /* defaults */ },
};

// 4. Export
export const myPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
```

### Component Data Structure

Each component in the tree is a `RenderableComponentData`:

```typescript
{
  id: 'unique-id',              // Unique identifier
  type: 'atom' | 'layout',      // Component type
  componentId: 'TextAtom',      // Which registered component to use
  data: { /* component props */ },
  context: {
    timing: {
      start: 0,                 // Start time in seconds
      duration: 5,              // Duration in seconds
    },
    boundaries: {               // Optional positioning
      reset: true,              // Reset parent boundaries
    },
  },
  effects: [],                  // Array of effect definitions
  childrenData: [],             // Nested components (for layouts)
}
```

---

## Building Blocks

### TextAtom

Renders text with font loading support.

```typescript
{
  type: 'atom',
  id: 'my-text',
  componentId: 'TextAtom',
  data: {
    text: 'Hello World',
    className: 'font-bold text-2xl',
    style: {
      fontSize: 50,
      fontWeight: 700,
      color: '#FFFFFF',
      backgroundColor: '#FF0000',
      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    },
    font: {
      family: 'Roboto',          // Font family
      weights: ['400', '700'],   // Font weights to load
      display: 'swap',           // Font display strategy
    },
  },
  context: {
    timing: { start: 0, duration: 5 },
  },
}
```

**Text Transform Tricks**:

```typescript
// Apply transformations in your code
const transformedText = word.text.toUpperCase();
// or
const transformedText = word.text.toLowerCase();
```

### ShapeAtom

Renders basic shapes.

```typescript
{
  type: 'atom',
  id: 'my-circle',
  componentId: 'ShapeAtom',
  data: {
    shape: 'circle',           // 'circle' | 'rectangle'
    color: 'transparent',      // Fill color
    style: {
      border: '4px solid #FF0000',
      boxShadow: '0 0 10px rgba(255,0,0,0.5)',
      width: '100%',
      height: '100%',
    },
  },
  context: {
    timing: { start: 0, duration: 5 },
  },
}
```

### BaseLayout

Container for composing multiple components.

```typescript
{
  type: 'layout',
  id: 'my-container',
  componentId: 'BaseLayout',
  data: {
    containerProps: {
      className: 'relative flex flex-row gap-4',
      style: { padding: '20px' },
    },
    isAbsoluteFill: false,      // Cover entire parent?
    childrenProps: [            // Individual props for each child
      { className: 'absolute inset-0' },  // First child
      { className: 'relative z-10' },     // Second child
    ],
  },
  context: {
    timing: { start: 0, duration: 5 },
    boundaries: { reset: true },
  },
  childrenData: [
    // Child components here
  ],
}
```

**Key Features**:

- `childrenProps` - Apply different props to each child
- `isAbsoluteFill` - Stretch to fill parent
- `boundaries.reset` - Reset positioning context

---

## Effect System

### GenericEffectData Structure

Effects animate component properties over time.

```typescript
{
  type: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | 'spring',
  start: 0,                    // Start time (relative to component)
  duration: 1,                 // Effect duration in seconds
  mode: 'provider' | 'wrapper', // How to apply
  targetIds: ['word-1'],       // Which components to affect (provider mode)
  ranges: [
    { key: 'opacity', val: 0, prog: 0 },      // At 0% progress
    { key: 'opacity', val: 1, prog: 1 },      // At 100% progress
  ],
}
```

### Animatable Properties

#### Transform Properties

```typescript
{ key: 'translateX', val: 100, prog: 0 }     // Horizontal movement
{ key: 'translateY', val: -50, prog: 0 }     // Vertical movement
{ key: 'scale', val: 1.5, prog: 1 }          // Uniform scale
{ key: 'scaleX', val: 2, prog: 1 }           // Horizontal scale
{ key: 'scaleY', val: 0.5, prog: 1 }         // Vertical scale
{ key: 'rotate', val: 45, prog: 1 }          // Rotation in degrees
```

#### Visual Properties

```typescript
{ key: 'opacity', val: 0.5, prog: 0 }        // Transparency
{ key: 'letterSpacing', val: '0.2em', prog: 1 }  // Text spacing
```

#### Filter Effects

```typescript
// Drop shadow with glow
{
  key: 'filter',
  val: 'drop-shadow(0 0 20px rgba(255,215,0,0.8))',
  prog: 1
}

// Blur
{
  key: 'filter',
  val: 'blur(5px)',
  prog: 0
}

// Multiple filters
{
  key: 'filter',
  val: 'blur(4px) drop-shadow(0 0 10px #ff0000) contrast(1.5) brightness(1.2)',
  prog: 1
}
```

#### Color Properties

```typescript
{ key: 'color', val: 'rgb(255,107,107)', prog: 1 }
{ key: 'backgroundColor', val: '#FFEB3B', prog: 0.5 }
```

### Effect Modes

#### Provider Mode

Target specific components by ID:

```typescript
{
  mode: 'provider',
  targetIds: ['word-1', 'word-2'],  // Affects these components only
  // ...
}
```

#### Wrapper Mode

Affects the component and all children:

```typescript
{
  mode: 'wrapper',
  // No targetIds needed - wraps entire tree
  // ...
}
```

### Stacking Multiple Effects

You can apply multiple effects to a single component:

```typescript
{
  type: 'atom',
  id: 'animated-word',
  componentId: 'TextAtom',
  effects: [
    // Effect 1: Fade in
    {
      id: 'fade-in',
      componentId: 'generic',
      data: {
        type: 'ease-in',
        start: 0,
        duration: 0.3,
        mode: 'provider',
        targetIds: ['animated-word'],
        ranges: [
          { key: 'opacity', val: 0, prog: 0 },
          { key: 'opacity', val: 1, prog: 1 },
        ],
      },
    },
    // Effect 2: Scale pop
    {
      id: 'scale-pop',
      componentId: 'generic',
      data: {
        type: 'spring',
        start: 0,
        duration: 0.3,
        mode: 'provider',
        targetIds: ['animated-word'],
        ranges: [
          { key: 'scale', val: 0.5, prog: 0 },
          { key: 'scale', val: 1.1, prog: 0.5 },
          { key: 'scale', val: 1, prog: 1 },
        ],
      },
    },
    // Effect 3: Glow
    {
      id: 'glow',
      componentId: 'generic',
      data: {
        type: 'ease-out',
        start: 0.2,
        duration: 0.5,
        mode: 'provider',
        targetIds: ['animated-word'],
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
    },
  ],
  data: { /* ... */ },
}
```

---

## Advanced Patterns

### Pattern 1: Conditional Sentence Positioning

Position specific sentences based on content:

```typescript
const presetParams = z.object({
  inputCaptions: z.array(z.any()),
  positionRules: z
    .array(
      z.object({
        pattern: z.string(),
        position: z.enum(['bottom', 'top', 'center', 'left', 'right']),
      }),
    )
    .optional()
    .default([]),
  defaultPosition: z.enum(['bottom', 'center', 'top']).default('bottom'),
});

const presetExecution = params => {
  // Helper: Check which position to use
  const getPositionForCaption = caption => {
    for (const rule of params.positionRules) {
      const regex = new RegExp(rule.pattern, 'i');
      if (regex.test(caption.text)) {
        return rule.position;
      }
    }
    return params.defaultPosition;
  };

  // Helper: Generate position style
  const getPositionStyle = position => {
    switch (position) {
      case 'center':
        return {
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        };
      case 'top':
        return {
          position: 'absolute',
          top: '50px',
          left: '0',
          right: '0',
        };
      case 'bottom':
      default:
        return {
          position: 'absolute',
          bottom: '50px',
          left: '0',
          right: '0',
        };
    }
  };

  const captionsData = params.inputCaptions.map((caption, i) => {
    const position = getPositionForCaption(caption);

    return {
      type: 'layout',
      id: `caption-${i}`,
      componentId: 'BaseLayout',
      data: {
        containerProps: {
          className: 'flex items-center justify-center',
          style: getPositionStyle(position),
        },
      },
      context: {
        timing: {
          start: caption.absoluteStart,
          duration: caption.duration,
        },
      },
      childrenData: [
        /* words here */
      ],
    };
  });

  // Return with individual positioning
  return {
    output: {
      childrenData: [
        {
          id: 'SubtitlesOverlay',
          componentId: 'BaseLayout',
          type: 'layout',
          data: {
            containerProps: { className: 'absolute inset-0' },
            childrenProps: captionsData.map((c, i) => ({
              className: 'absolute',
              style: getPositionStyle(
                getPositionForCaption(params.inputCaptions[i]),
              ),
            })),
          },
          childrenData: captionsData,
        },
      ],
    },
  };
};
```

**Usage Example**:

```json
{
  "positionRules": [
    {
      "pattern": "paying.*150.*000",
      "position": "center"
    },
    {
      "pattern": "BREAKING",
      "position": "top"
    }
  ],
  "defaultPosition": "bottom"
}
```

### Pattern 2: Word-Level Effect Rules

Apply different effects to specific words:

```typescript
const presetParams = z.object({
  inputCaptions: z.array(z.any()),
  wordEffects: z
    .array(
      z.object({
        pattern: z.string(),
        effectType: z.enum(['highlight', 'circle', 'glow', 'box']),
        color: z.string().optional(),
        backgroundColor: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
});

const presetExecution = params => {
  // Helper: Find matching effect rule
  const getEffectForWord = wordText => {
    for (const effect of params.wordEffects) {
      const regex = new RegExp(effect.pattern, 'i');
      if (regex.test(wordText)) {
        return effect;
      }
    }
    return null;
  };

  // Helper: Create word with effect
  const createWord = (word, index, caption) => {
    const effectRule = getEffectForWord(word.text);

    if (effectRule) {
      switch (effectRule.effectType) {
        case 'highlight':
          return createHighlightWord(word, index, effectRule);
        case 'circle':
          return createCircleWord(word, index, effectRule);
        case 'glow':
          return createGlowWord(word, index, effectRule);
        default:
          return createRegularWord(word, index);
      }
    }

    return createRegularWord(word, index);
  };

  // Process captions
  const captionsData = params.inputCaptions.map(caption => {
    const words = caption.words.map((word, i) => createWord(word, i, caption));

    return {
      type: 'layout',
      id: `caption-${caption.id}`,
      componentId: 'BaseLayout',
      data: {
        containerProps: {
          className: 'flex flex-row gap-4',
        },
      },
      childrenData: words,
    };
  });

  return { output: { childrenData: captionsData } };
};
```

**Usage Example**:

```json
{
  "wordEffects": [
    {
      "pattern": "\\$150[,]?000",
      "effectType": "circle",
      "color": "#FFD700"
    },
    {
      "pattern": "TINY|TOY",
      "effectType": "highlight",
      "backgroundColor": "#FFEB3B",
      "color": "#000000"
    }
  ]
}
```

### Pattern 3: Yellow Highlight Effect

News-style marker highlight:

```typescript
const createHighlightWord = (word, wordIndex, effectRule) => {
  return {
    type: 'atom',
    id: `highlight-${wordIndex}`,
    componentId: 'TextAtom',
    effects: [
      {
        id: `highlight-draw-${wordIndex}`,
        componentId: 'generic',
        data: {
          type: 'ease-out',
          start: word.start,
          duration: 0.3,
          mode: 'provider',
          targetIds: [`highlight-${wordIndex}`],
          ranges: [
            // Marker-style drawing from left to right
            { key: 'scaleX', val: 0, prog: 0 },
            { key: 'scaleX', val: 1, prog: 1 },
            { key: 'opacity', val: 0.8, prog: 0 },
            { key: 'opacity', val: 1, prog: 1 },
          ],
        },
      },
    ],
    data: {
      text: word.text,
      className: 'px-3 py-1 font-bold',
      style: {
        fontSize: 55,
        fontWeight: 700,
        color: effectRule.color || '#000000',
        backgroundColor: effectRule.backgroundColor || '#FFEB3B',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'inline-block',
        transformOrigin: 'left center', // Scale from left
      },
      font: { family: 'Inter', weights: ['700'] },
    },
    context: {
      timing: { start: 0, duration: word.duration },
    },
  };
};
```

### Pattern 4: Circle Draw Effect

Hand-drawn circle around word:

```typescript
const createCircleWord = (word, wordIndex, effectRule) => {
  const color = effectRule.color || '#FF0000';

  // Create circle shape
  const circleShape = {
    type: 'atom',
    id: `circle-${wordIndex}`,
    componentId: 'ShapeAtom',
    effects: [
      {
        id: `circle-draw-${wordIndex}`,
        componentId: 'generic',
        data: {
          type: 'ease-out',
          start: word.start,
          duration: 0.5,
          mode: 'provider',
          targetIds: [`circle-${wordIndex}`],
          ranges: [
            // Draw effect: scale from 0
            { key: 'scale', val: 0, prog: 0 },
            { key: 'scale', val: 1.1, prog: 0.7 },
            { key: 'scale', val: 1, prog: 1 },
            // Rotate while drawing
            { key: 'rotate', val: -10, prog: 0 },
            { key: 'rotate', val: 0, prog: 1 },
            // Fade in
            { key: 'opacity', val: 0, prog: 0 },
            { key: 'opacity', val: 1, prog: 0.3 },
            // Add glow
            {
              key: 'filter',
              val: `drop-shadow(0 0 0px ${color})`,
              prog: 0,
            },
            {
              key: 'filter',
              val: `drop-shadow(0 0 15px ${color})`,
              prog: 1,
            },
          ],
        },
      },
    ],
    data: {
      shape: 'circle',
      color: 'transparent',
      style: {
        border: `5px solid ${color}`,
      },
    },
    context: {
      timing: { start: 0, duration: word.duration },
    },
  };

  // Create text that pops in after circle starts
  const textAtom = {
    type: 'atom',
    id: `circled-text-${wordIndex}`,
    componentId: 'TextAtom',
    effects: [
      {
        id: `text-pop-${wordIndex}`,
        componentId: 'generic',
        data: {
          type: 'spring',
          start: word.start + 0.2, // Delay after circle starts
          duration: 0.2,
          mode: 'provider',
          targetIds: [`circled-text-${wordIndex}`],
          ranges: [
            { key: 'scale', val: 0.5, prog: 0 },
            { key: 'scale', val: 1.1, prog: 0.5 },
            { key: 'scale', val: 1, prog: 1 },
            { key: 'opacity', val: 0, prog: 0 },
            { key: 'opacity', val: 1, prog: 1 },
          ],
        },
      },
    ],
    data: {
      text: word.text,
      className: 'text-center font-black',
      style: {
        fontSize: 55,
        fontWeight: 900,
        color: color,
      },
      font: { family: 'BebasNeue' },
    },
    context: {
      timing: { start: 0, duration: word.duration },
    },
  };

  // Layer them using BaseLayout
  return {
    type: 'layout',
    id: `circled-word-${wordIndex}`,
    componentId: 'BaseLayout',
    data: {
      containerProps: {
        className: 'relative inline-block',
        style: { padding: '25px' },
      },
      childrenProps: [
        // Circle fills container
        { className: 'absolute inset-0' },
        // Text centered on top
        { className: 'relative z-10 flex items-center justify-center' },
      ],
    },
    context: {
      timing: { start: 0, duration: word.duration },
    },
    childrenData: [circleShape, textAtom],
  };
};
```

### Pattern 5: Box Frame Effect

Similar to circle but with rectangle:

```typescript
const createBoxWord = (word, wordIndex, effectRule) => {
  // Same pattern as circle, but use:
  const boxShape = {
    // ...
    data: {
      shape: 'rectangle', // Use rectangle instead of circle
      color: 'transparent',
      style: {
        border: `4px solid ${color}`,
        borderRadius: '8px', // Rounded corners
      },
    },
    // ...
  };

  // Rest is the same as circle pattern
};
```

### Pattern 6: Simulated Counter Animation

Animate numbers counting up without custom atom:

```typescript
const createCounterWord = (word, wordIndex, effectRule) => {
  const endValue = extractNumber(word.text); // e.g., "150000" from "$150,000"
  const startValue = effectRule.counterStart || 0;
  const steps = 20; // Number of intermediate values
  const stepDuration = word.duration / steps;

  // Create a TextAtom for each step
  const counterSteps = Array.from({ length: steps }, (_, i) => {
    const progress = i / (steps - 1);
    const currentValue = Math.round(
      startValue + (endValue - startValue) * progress,
    );

    // Format number
    const formattedValue = effectRule.formatNumber
      ? `${effectRule.prefix || ''}${currentValue.toLocaleString()}`
      : `${effectRule.prefix || ''}${currentValue}`;

    return {
      type: 'atom',
      id: `counter-step-${wordIndex}-${i}`,
      componentId: 'TextAtom',
      effects: [
        {
          id: `fade-${wordIndex}-${i}`,
          componentId: 'generic',
          data: {
            type: 'linear',
            start: 0,
            duration: stepDuration * 1.2, // Slight overlap
            mode: 'provider',
            targetIds: [`counter-step-${wordIndex}-${i}`],
            ranges: [
              { key: 'opacity', val: 1, prog: 0 },
              { key: 'opacity', val: 0, prog: 1 }, // Fade out
            ],
          },
        },
      ],
      data: {
        text: formattedValue,
        className: 'absolute inset-0 font-black',
        style: {
          fontSize: 70,
          fontWeight: 900,
          color: effectRule.color || '#FFD700',
          textShadow: '0 0 20px rgba(255,215,0,0.6)',
        },
        font: { family: 'BebasNeue' },
      },
      context: {
        timing: {
          start: stepDuration * i, // Stagger each step
          duration: stepDuration * 1.2,
        },
      },
    };
  });

  // Wrap all steps in container
  return {
    type: 'layout',
    id: `counter-${wordIndex}`,
    componentId: 'BaseLayout',
    data: {
      containerProps: {
        className: 'relative inline-block',
        style: {
          minWidth: '250px', // Reserve space
          height: '80px',
        },
      },
    },
    context: {
      timing: { start: 0, duration: word.duration },
    },
    childrenData: counterSteps,
  };
};

// Helper to extract number from text
const extractNumber = text => {
  const cleaned = text.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};
```

### Pattern 7: Glow Pulse Effect

Continuous pulsing glow:

```typescript
const createGlowWord = (word, wordIndex, effectRule) => {
  const color = effectRule.color || '#FFD700';
  const rgb = hexToRgb(color);

  return {
    type: 'atom',
    id: `glow-word-${wordIndex}`,
    componentId: 'TextAtom',
    effects: [
      // Entrance animation
      {
        id: `entrance-${wordIndex}`,
        componentId: 'generic',
        data: {
          type: 'ease-out',
          start: word.start,
          duration: 0.3,
          mode: 'provider',
          targetIds: [`glow-word-${wordIndex}`],
          ranges: [
            { key: 'scale', val: 0.5, prog: 0 },
            { key: 'scale', val: 1.2, prog: 0.6 },
            { key: 'scale', val: 1, prog: 1 },
            { key: 'opacity', val: 0, prog: 0 },
            { key: 'opacity', val: 1, prog: 1 },
          ],
        },
      },
      // Loop wrapper for pulse
      {
        id: `pulse-loop-${wordIndex}`,
        componentId: 'loop',
        data: {
          durationInFrames: 30, // 1 second at 30fps
          times: Infinity,
          layout: 'none',
        },
      },
      // Pulse effect (loops inside wrapper)
      {
        id: `pulse-${wordIndex}`,
        componentId: 'generic',
        data: {
          type: 'ease-in-out',
          start: 0,
          duration: 1, // 1 second
          mode: 'provider',
          targetIds: [`glow-word-${wordIndex}`],
          ranges: [
            { key: 'scale', val: 1, prog: 0 },
            { key: 'scale', val: 1.1, prog: 0.5 },
            { key: 'scale', val: 1, prog: 1 },
            {
              key: 'filter',
              val: `drop-shadow(0 0 5px rgba(${rgb.r},${rgb.g},${rgb.b},0.5))`,
              prog: 0,
            },
            {
              key: 'filter',
              val: `drop-shadow(0 0 25px rgba(${rgb.r},${rgb.g},${rgb.b},0.9))`,
              prog: 0.5,
            },
            {
              key: 'filter',
              val: `drop-shadow(0 0 5px rgba(${rgb.r},${rgb.g},${rgb.b},0.5))`,
              prog: 1,
            },
          ],
        },
      },
    ],
    data: {
      text: word.text,
      className: 'font-black',
      style: {
        fontSize: 60,
        fontWeight: 900,
        color: color,
      },
      font: { family: 'BebasNeue' },
    },
    context: {
      timing: { start: 0, duration: word.duration },
    },
  };
};

// Helper function
const hexToRgb = hex => {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
};
```

### Pattern 8: Underline Draw Effect

Animated underline appearing:

```typescript
const createUnderlineWord = (word, wordIndex, effectRule) => {
  const color = effectRule.color || '#FFD700';

  // Underline as a shape
  const underline = {
    type: 'atom',
    id: `underline-${wordIndex}`,
    componentId: 'ShapeAtom',
    effects: [
      {
        id: `underline-draw-${wordIndex}`,
        componentId: 'generic',
        data: {
          type: 'ease-out',
          start: word.start,
          duration: 0.4,
          mode: 'provider',
          targetIds: [`underline-${wordIndex}`],
          ranges: [
            // Draw from left to right
            { key: 'scaleX', val: 0, prog: 0 },
            { key: 'scaleX', val: 1, prog: 1 },
          ],
        },
      },
    ],
    data: {
      shape: 'rectangle',
      color: color,
      style: {
        height: '4px',
        width: '100%',
      },
    },
    context: {
      timing: { start: 0, duration: word.duration },
    },
  };

  // Text
  const text = {
    type: 'atom',
    id: `underlined-text-${wordIndex}`,
    componentId: 'TextAtom',
    effects: [],
    data: {
      text: word.text,
      className: 'font-bold',
      style: {
        fontSize: 50,
        fontWeight: 700,
        color: color,
      },
      font: { family: 'Inter', weights: ['700'] },
    },
    context: {
      timing: { start: 0, duration: word.duration },
    },
  };

  // Stack them
  return {
    type: 'layout',
    id: `underlined-word-${wordIndex}`,
    componentId: 'BaseLayout',
    data: {
      containerProps: {
        className: 'relative inline-block',
      },
      childrenProps: [
        { className: 'pb-1' }, // Text with padding for underline
        {
          className: 'absolute bottom-0 left-0 right-0',
          style: { transformOrigin: 'left center' },
        }, // Underline
      ],
    },
    context: {
      timing: { start: 0, duration: word.duration },
    },
    childrenData: [text, underline],
  };
};
```

### Pattern 9: Using Caption and Word Metadata

Metadata provides intelligent, content-aware behavior without manual pattern rules. This is used by advanced presets like `testing-kinetics.ts` and `sub-vertical-float.ts`.

#### Metadata Structure

**Caption Metadata:**

```typescript
caption.metadata = {
  keyword: 'important', // Word to emphasize/highlight
  splitParts: 2, // How many lines to split caption into
  // Add any custom properties you need
};
```

**Word Metadata:**

```typescript
word.metadata = {
  isHighlight: true, // Should this word be highlighted?
  importance: 0.8, // Custom importance score
  // Add any custom properties you need
};
```

#### When to Use Metadata

**Use metadata when:**

- ✅ Your caption data comes from an AI/API that pre-analyzes content
- ✅ You want automatic intelligent detection
- ✅ Building systems with machine learning or sentiment analysis
- ✅ Need per-word or per-caption custom data

**Use pattern rules when:**

- ✅ User defines rules via UI
- ✅ Simple predictable matching
- ✅ No pre-processing available

**Best practice:** Support both! Fall back to patterns if metadata isn't available.

#### Pattern 9a: Word Highlighting with Metadata

```typescript
const presetParams = z.object({
  inputCaptions: z.array(z.any()),
  disableMetadata: z.boolean().optional().default(false),
  fallbackHighlightColor: z.string().optional().default('#FFEB3B'),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  const { inputCaptions, disableMetadata, fallbackHighlightColor } = params;

  const createWord = (word: any, index: number, caption: any) => {
    // Check metadata first
    const isHighlight = !disableMetadata && word.metadata?.isHighlight;

    if (isHighlight) {
      return {
        type: 'atom',
        id: `word-${index}`,
        componentId: 'TextAtom',
        effects: [
          {
            id: `highlight-${index}`,
            componentId: 'generic',
            data: {
              type: 'ease-out',
              start: word.start,
              duration: 0.3,
              mode: 'provider',
              targetIds: [`word-${index}`],
              ranges: [
                { key: 'scale', val: 0.9, prog: 0 },
                { key: 'scale', val: 1.2, prog: 0.5 },
                { key: 'scale', val: 1, prog: 1 },
                { key: 'opacity', val: 0, prog: 0 },
                { key: 'opacity', val: 1, prog: 1 },
              ],
            },
          },
        ],
        data: {
          text: word.text,
          style: {
            fontSize: 60,
            fontWeight: 900,
            color: '#000000',
            backgroundColor: fallbackHighlightColor,
            padding: '8px 16px',
            borderRadius: '8px',
          },
          font: { family: 'Inter', weights: ['900'] },
        },
        context: {
          timing: { start: 0, duration: caption.duration },
        },
      };
    }

    // Regular word
    return {
      type: 'atom',
      id: `word-${index}`,
      componentId: 'TextAtom',
      data: {
        text: word.text,
        style: { fontSize: 50, color: '#FFFFFF' },
        font: { family: 'Inter' },
      },
      context: {
        timing: { start: 0, duration: caption.duration },
      },
    };
  };

  const captionsData = inputCaptions.map((caption, captionIdx) => {
    const wordsData = caption.words.map((word: any, wordIdx: number) =>
      createWord(word, wordIdx, caption),
    );

    return {
      type: 'layout',
      id: `caption-${captionIdx}`,
      componentId: 'BaseLayout',
      data: {
        containerProps: {
          className: 'flex flex-row gap-4 items-center justify-center',
        },
      },
      context: {
        timing: {
          start: caption.absoluteStart,
          duration: caption.duration,
        },
      },
      childrenData: wordsData,
    };
  });

  return {
    output: {
      config: {
        duration: inputCaptions[inputCaptions.length - 1].absoluteEnd,
      },
      childrenData: captionsData,
    },
  };
};
```

#### Pattern 9b: Keyword-Based Highlighting

Use `caption.metadata.keyword` to automatically find and highlight specific words:

```typescript
const createWordsFromCaption = (caption: any, captionIndex: number) => {
  let highlightedWordIndex = -1;

  // Check if metadata provides a keyword
  if (caption.metadata?.keyword?.length > 0) {
    highlightedWordIndex = caption.words.findIndex((word: any) =>
      word.text.toLowerCase().includes(caption.metadata.keyword.toLowerCase()),
    );
  }

  return caption.words.map((word: any, wordIdx: number) => {
    const shouldHighlight = wordIdx === highlightedWordIndex;

    if (shouldHighlight) {
      // Apply special effect to keyword word
      return {
        type: 'atom',
        id: `keyword-${captionIndex}-${wordIdx}`,
        componentId: 'TextAtom',
        effects: [
          {
            id: `glow-${captionIndex}-${wordIdx}`,
            componentId: 'generic',
            data: {
              type: 'ease-in-out',
              start: word.start,
              duration: 0.5,
              mode: 'provider',
              targetIds: [`keyword-${captionIndex}-${wordIdx}`],
              ranges: [
                { key: 'scale', val: 1, prog: 0 },
                { key: 'scale', val: 1.3, prog: 0.5 },
                { key: 'scale', val: 1.1, prog: 1 },
                {
                  key: 'filter',
                  val: 'drop-shadow(0 0 0px rgba(255,215,0,0))',
                  prog: 0,
                },
                {
                  key: 'filter',
                  val: 'drop-shadow(0 0 20px rgba(255,215,0,1))',
                  prog: 0.5,
                },
                {
                  key: 'filter',
                  val: 'drop-shadow(0 0 10px rgba(255,215,0,0.8))',
                  prog: 1,
                },
              ],
            },
          },
        ],
        data: {
          text: word.text,
          style: {
            fontSize: 70,
            fontWeight: 900,
            color: '#FFD700',
          },
          font: { family: 'BebasNeue' },
        },
        context: {
          timing: { start: 0, duration: caption.duration },
        },
      };
    }

    // Regular word
    return {
      type: 'atom',
      id: `word-${captionIndex}-${wordIdx}`,
      componentId: 'TextAtom',
      data: {
        text: word.text,
        style: { fontSize: 50, color: '#FFFFFF' },
        font: { family: 'Inter' },
      },
      context: {
        timing: { start: 0, duration: caption.duration },
      },
    };
  });
};
```

#### Pattern 9c: Synchronized Highlighting

When all words in a caption have `isHighlight: true`, synchronize their animation:

```typescript
const generateWordsData = (
  words: any[],
  caption: any,
  captionIndex: number,
) => {
  // Check if all words are highlighted
  const isAllWordsHighlighted = words.every(word => word.metadata?.isHighlight);

  // For synchronized highlighting, use shared timing
  const syncStart =
    isAllWordsHighlighted && words.length > 0 ? words[0].start : null;

  const syncDuration =
    isAllWordsHighlighted && caption.duration > 1
      ? Math.min(caption.duration * 0.3, 1.5)
      : null;

  return words.map((word, wordIdx) => {
    const isHighlight = word.metadata?.isHighlight;
    const shouldAnimate = word.duration >= 1 || isAllWordsHighlighted;

    // Determine animation timing
    const animStart = syncStart !== null ? syncStart : word.start;
    const animDuration = syncDuration !== null ? syncDuration : word.duration;

    const effects = [];

    if (shouldAnimate && isHighlight) {
      effects.push({
        id: `fade-${captionIndex}-${wordIdx}`,
        componentId: 'generic',
        data: {
          type: 'ease-out',
          start: animStart,
          duration: Math.min(animDuration, 0.5),
          mode: 'provider',
          targetIds: [`word-${captionIndex}-${wordIdx}`],
          ranges: [
            { key: 'opacity', val: 0, prog: 0 },
            { key: 'opacity', val: 1, prog: 1 },
            { key: 'scale', val: 0.8, prog: 0 },
            { key: 'scale', val: 1.1, prog: 0.7 },
            { key: 'scale', val: 1, prog: 1 },
          ],
        },
      });
    }

    return {
      type: 'atom',
      id: `word-${captionIndex}-${wordIdx}`,
      componentId: 'TextAtom',
      effects,
      data: {
        text: word.text,
        style: {
          fontSize: isHighlight ? 60 : 50,
          fontWeight: isHighlight ? 900 : 400,
          color: isHighlight ? '#FFD700' : '#FFFFFF',
        },
        font: { family: isHighlight ? 'BebasNeue' : 'Inter' },
      },
      context: {
        timing: { start: 0, duration: caption.duration },
      },
    };
  });
};
```

#### Pattern 9d: Combining Metadata with Pattern Rules

Best practice: support both methods with fallback:

```typescript
const presetParams = z.object({
  inputCaptions: z.array(z.any()),
  disableMetadata: z.boolean().optional().default(false),
  // Pattern rules as fallback
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
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  const { inputCaptions, disableMetadata, wordEffects } = params;

  // Helper: Find effect via pattern matching
  const getEffectFromPattern = (wordText: string) => {
    for (const effect of wordEffects) {
      const regex = new RegExp(effect.pattern, 'i');
      if (regex.test(wordText)) {
        return effect;
      }
    }
    return null;
  };

  const createWord = (word: any, index: number, caption: any) => {
    // Priority 1: Use word.metadata if available
    if (!disableMetadata && word.metadata?.isHighlight) {
      return createHighlightWord(word, index, {
        effectType: 'highlight',
        color: word.metadata.color || '#FFEB3B',
      });
    }

    // Priority 2: Check caption.metadata.keyword
    if (!disableMetadata && caption.metadata?.keyword) {
      if (
        word.text.toLowerCase().includes(caption.metadata.keyword.toLowerCase())
      ) {
        return createHighlightWord(word, index, {
          effectType: 'glow',
          color: '#FFD700',
        });
      }
    }

    // Priority 3: Use pattern rules
    const patternEffect = getEffectFromPattern(word.text);
    if (patternEffect) {
      switch (patternEffect.effectType) {
        case 'highlight':
          return createHighlightWord(word, index, patternEffect);
        case 'circle':
          return createCircleWord(word, index, patternEffect);
        case 'glow':
          return createGlowWord(word, index, patternEffect);
      }
    }

    // Default: Regular word
    return createRegularWord(word, index);
  };

  // ... rest of preset
};
```

#### Pattern 9e: Split Parts with Metadata

Use `caption.metadata.splitParts` to control multi-line layout:

```typescript
const splitSentenceIntoParts = (
  words: any[],
  maxLines: number,
  explicitSplitParts?: number,
) => {
  // Use explicit split if provided in metadata
  const targetLines = explicitSplitParts || maxLines;
  const wordsPerLine = Math.ceil(words.length / targetLines);

  const parts = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    parts.push(words.slice(i, i + wordsPerLine));
  }

  return parts;
};

const createCaptionLayout = (caption: any, captionIndex: number) => {
  // Check for metadata-driven split
  const sentenceParts = splitSentenceIntoParts(
    caption.words,
    2, // default max lines
    caption.metadata?.splitParts, // override from metadata
  );

  // Create layout for each part
  const partLayouts = sentenceParts.map((part, partIdx) => {
    const words = part.map((word, wordIdx) =>
      createWord(word, wordIdx, caption),
    );

    return {
      type: 'layout',
      id: `part-${captionIndex}-${partIdx}`,
      componentId: 'BaseLayout',
      data: {
        containerProps: {
          className: 'flex flex-row gap-3',
        },
      },
      childrenData: words,
    };
  });

  return {
    type: 'layout',
    id: `caption-${captionIndex}`,
    componentId: 'BaseLayout',
    data: {
      containerProps: {
        className: 'flex flex-col gap-2 items-center',
      },
    },
    context: {
      timing: {
        start: caption.absoluteStart,
        duration: caption.duration,
      },
    },
    childrenData: partLayouts,
  };
};
```

#### Metadata Data Structure

**Full caption data structure with metadata:**

```typescript
interface Caption {
  text: string;
  start: number;
  end: number;
  absoluteStart: number;
  absoluteEnd: number;
  duration: number;
  words: Word[];
  metadata?: {
    keyword?: string; // Word to emphasize
    splitParts?: number; // How many lines
    sentiment?: string; // 'positive' | 'negative' | 'neutral'
    importance?: number; // 0-1 score
    emotion?: string; // Custom emotion tag
    [key: string]: any; // Any custom properties
  };
}

interface Word {
  text: string;
  start: number; // Relative to caption
  end: number;
  duration: number;
  metadata?: {
    isHighlight?: boolean; // Should highlight
    color?: string; // Custom color
    importance?: number; // 0-1 score
    partOfSpeech?: string; // 'noun', 'verb', etc.
    [key: string]: any; // Any custom properties
  };
}
```

#### Generating Metadata with AI

Example of pre-processing captions with AI to add metadata:

```typescript
const addMetadataWithAI = async (captions: Caption[]) => {
  return Promise.all(
    captions.map(async caption => {
      // Call your AI service
      const analysis = await analyzeCaption(caption.text);

      return {
        ...caption,
        metadata: {
          keyword: analysis.keyPhrase,
          sentiment: analysis.sentiment,
          importance: analysis.importance,
        },
        words: caption.words.map((word, idx) => ({
          ...word,
          metadata: {
            isHighlight: analysis.highlightIndices.includes(idx),
            importance: analysis.wordScores[idx],
          },
        })),
      };
    }),
  );
};

// Use in your preset
const presetExecution = async (
  params: z.infer<typeof presetParams>,
  props: PresetPassedProps,
): Promise<PresetOutput> => {
  // Enhance captions with AI metadata
  const enhancedCaptions = await addMetadataWithAI(params.inputCaptions);

  // Now use enhanced captions with metadata
  const captionsData = enhancedCaptions.map(caption =>
    createCaptionWithMetadata(caption),
  );

  // ... return output
};
```

#### Debugging Metadata

Add console logs to inspect metadata:

```typescript
const createWord = (word: any, index: number, caption: any) => {
  console.log('Caption metadata:', caption.metadata);
  console.log(`Word ${index} metadata:`, word.metadata);

  // Your logic here
};
```

#### Summary: Metadata vs Pattern Rules

| Feature           | Metadata                  | Pattern Rules               |
| ----------------- | ------------------------- | --------------------------- |
| **When to use**   | AI/API pre-processed data | User-defined rules          |
| **Flexibility**   | Per-word custom data      | Pattern matching            |
| **Setup effort**  | Requires pre-processing   | Define rules in params      |
| **Best for**      | Intelligent systems       | Simple, predictable effects |
| **Combines with** | Pattern rules (fallback)  | Metadata (priority)         |

**Recommended approach:** Support both! Check metadata first, fall back to pattern rules.

### Pattern 10: Future-Proof Preset Design (Combined Approach) ⭐⭐⭐

**CRITICAL: Always design presets with both metadata AND pattern rules support from day one!**

This pattern ensures your preset works today with user input AND tomorrow with AI metadata — **without any code modifications**.

#### Why This Matters

| Design Approach     | Works Today (User Rules) | Works Tomorrow (AI) | Requires Refactoring  |
| ------------------- | ------------------------ | ------------------- | --------------------- |
| Pattern-only        | ✅ Yes                   | ❌ No               | 🔧 Yes, major changes |
| Metadata-only       | ❌ No                    | ✅ Yes              | 🔧 Yes, major changes |
| **Combined (Best)** | ✅ Yes                   | ✅ Yes              | ✅ **Never!**         |

#### The Problem

**Bad Approach #1: Pattern-only**

```typescript
// ❌ Only supports user-defined patterns
const createWord = (word, index) => {
  // Only checks pattern rules
  if (/\$[0-9,]+/.test(word.text)) {
    return createHighlightWord(word, index);
  }
  return createRegularWord(word, index);
};
```

**Result:** When you add AI later, you must refactor the entire preset. 😢

**Bad Approach #2: Metadata-only**

```typescript
// ❌ Only supports AI metadata
const createWord = (word, index) => {
  // Only checks metadata
  if (word.metadata?.isHighlight) {
    return createHighlightWord(word, index);
  }
  return createRegularWord(word, index);
};
```

**Result:** Doesn't work today without AI. Must add patterns later. 😢

#### The Solution: Combined Approach

**Good Approach: Support Both from Day One** ✅

```typescript
const presetParams = z.object({
  inputCaptions: z.array(z.any()),

  // User-defined pattern rules (works today)
  wordEffects: z
    .array(
      z.object({
        pattern: z.string(),
        effectType: z.enum(['highlight', 'circle', 'glow']),
        color: z.string().optional(),
        backgroundColor: z.string().optional(),
      }),
    )
    .optional()
    .default([]),

  // Flexibility option
  disableMetadata: z.boolean().optional().default(false),

  // Default styling
  defaultHighlightColor: z.string().optional().default('#FFEB3B'),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  const { inputCaptions, disableMetadata, wordEffects, defaultHighlightColor } =
    params;

  // Helper: Pattern matcher
  const findPatternEffect = (wordText: string) => {
    for (const effect of wordEffects) {
      const regex = new RegExp(effect.pattern, 'i');
      if (regex.test(wordText)) {
        return effect;
      }
    }
    return null;
  };

  // Main word factory with PRIORITY SYSTEM
  const createWord = (word: any, index: number, caption: any) => {
    // PRIORITY 1: Check word.metadata (AI/pre-processed)
    if (!disableMetadata && word.metadata?.isHighlight) {
      return createHighlightWord(word, index, {
        effectType: 'highlight',
        color: word.metadata.color || defaultHighlightColor,
        backgroundColor: word.metadata.backgroundColor,
      });
    }

    // PRIORITY 2: Check caption.metadata.keyword (AI keyword detection)
    if (!disableMetadata && caption.metadata?.keyword) {
      if (
        word.text.toLowerCase().includes(caption.metadata.keyword.toLowerCase())
      ) {
        return createHighlightWord(word, index, {
          effectType: 'glow',
          color: '#FFD700',
        });
      }
    }

    // PRIORITY 3: Check user-defined pattern rules
    const patternEffect = findPatternEffect(word.text);
    if (patternEffect) {
      switch (patternEffect.effectType) {
        case 'highlight':
          return createHighlightWord(word, index, patternEffect);
        case 'circle':
          return createCircleWord(word, index, patternEffect);
        case 'glow':
          return createGlowWord(word, index, patternEffect);
      }
    }

    // DEFAULT: Regular word
    return createRegularWord(word, index);
  };

  // ... rest of preset implementation
};
```

#### Complete Working Example: Future-Proof Subtitle Preset

```typescript
import { RenderableComponentData } from '@microfox/datamotion';
import { GenericEffectData, TextAtomData } from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

// ============================================================
// STEP 1: Define comprehensive params (supports both approaches)
// ============================================================
const presetParams = z.object({
  inputCaptions: z.array(z.any()),

  // Pattern rules for user input
  wordEffects: z
    .array(
      z.object({
        pattern: z.string().describe('Regex pattern to match words'),
        effectType: z.enum(['highlight', 'circle', 'glow']),
        color: z.string().optional(),
        backgroundColor: z.string().optional(),
      }),
    )
    .optional()
    .default([]),

  // Control options
  disableMetadata: z
    .boolean()
    .optional()
    .default(false)
    .describe('Disable metadata-based effects'),

  // Styling defaults
  fontSize: z.number().optional().default(50),
  highlightColor: z.string().optional().default('#FFEB3B'),
  glowColor: z.string().optional().default('#FFD700'),
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
    wordEffects,
    fontSize,
    highlightColor,
    glowColor,
  } = params;

  // Helper: Convert hex to RGB
  const hexToRgb = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });

  // Helper: Find pattern match
  const findPatternEffect = (wordText: string) => {
    for (const effect of wordEffects) {
      const regex = new RegExp(effect.pattern, 'i');
      if (regex.test(wordText)) {
        return effect;
      }
    }
    return null;
  };

  // Factory: Create highlight word
  const createHighlightWord = (word: any, idx: number, config: any) => {
    return {
      type: 'atom',
      id: `highlight-${idx}`,
      componentId: 'TextAtom',
      effects: [
        {
          id: `draw-${idx}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: word.start,
            duration: 0.3,
            mode: 'provider',
            targetIds: [`highlight-${idx}`],
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
          fontSize: fontSize + 5,
          fontWeight: 900,
          color: config.color || '#000000',
          backgroundColor: config.backgroundColor || highlightColor,
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

  // Factory: Create circle word
  const createCircleWord = (word: any, idx: number, config: any) => {
    const color = config.color || glowColor;
    const rgb = hexToRgb(color);

    const circle = {
      type: 'atom',
      id: `circle-${idx}`,
      componentId: 'ShapeAtom',
      effects: [
        {
          id: `circle-draw-${idx}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: word.start,
            duration: 0.5,
            mode: 'provider',
            targetIds: [`circle-${idx}`],
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
      id: `text-${idx}`,
      componentId: 'TextAtom',
      effects: [
        {
          id: `pop-${idx}`,
          componentId: 'generic',
          data: {
            type: 'spring',
            start: word.start + 0.2,
            duration: 0.2,
            mode: 'provider',
            targetIds: [`text-${idx}`],
            ranges: [
              { key: 'scale', val: 0.5, prog: 0 },
              { key: 'scale', val: 1, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        text: word.text,
        style: { fontSize: fontSize + 5, fontWeight: 900, color },
        font: { family: 'BebasNeue' },
      } as TextAtomData,
      context: { timing: { start: 0, duration: word.duration } },
    };

    return {
      type: 'layout',
      id: `circled-${idx}`,
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

  // Factory: Create glow word
  const createGlowWord = (word: any, idx: number, config: any) => {
    const color = config.color || glowColor;
    const rgb = hexToRgb(color);

    return {
      type: 'atom',
      id: `glow-${idx}`,
      componentId: 'TextAtom',
      effects: [
        {
          id: `glow-entrance-${idx}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: word.start,
            duration: 0.4,
            mode: 'provider',
            targetIds: [`glow-${idx}`],
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
          fontSize: fontSize + 10,
          fontWeight: 900,
          color: color,
        },
        font: { family: 'BebasNeue' },
      } as TextAtomData,
      context: { timing: { start: 0, duration: word.duration } },
    } as RenderableComponentData;
  };

  // Factory: Create regular word
  const createRegularWord = (word: any, idx: number) => {
    return {
      type: 'atom',
      id: `word-${idx}`,
      componentId: 'TextAtom',
      effects: [
        {
          id: `fade-${idx}`,
          componentId: 'generic',
          data: {
            type: 'ease-in',
            start: word.start,
            duration: 0.15,
            mode: 'provider',
            targetIds: [`word-${idx}`],
            ranges: [
              { key: 'opacity', val: 0, prog: 0 },
              { key: 'opacity', val: 1, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        text: word.text,
        style: { fontSize, color: '#FFFFFF' },
        font: { family: 'Inter' },
      } as TextAtomData,
      context: { timing: { start: 0, duration: word.duration } },
    } as RenderableComponentData;
  };

  // ============================================================
  // STEP 3: Main word factory with PRIORITY SYSTEM
  // ============================================================
  const createWord = (word: any, index: number, caption: any) => {
    // PRIORITY 1: Check word.metadata (AI)
    if (!disableMetadata && word.metadata?.isHighlight) {
      console.log(`[AI] Highlighting word "${word.text}" via metadata`);
      return createHighlightWord(word, index, {
        effectType: 'highlight',
        color: word.metadata.color,
        backgroundColor: word.metadata.backgroundColor,
      });
    }

    // PRIORITY 2: Check caption.metadata.keyword (AI)
    if (!disableMetadata && caption.metadata?.keyword) {
      if (
        word.text.toLowerCase().includes(caption.metadata.keyword.toLowerCase())
      ) {
        console.log(
          `[AI] Found keyword "${caption.metadata.keyword}" in word "${word.text}"`,
        );
        return createGlowWord(word, index, { color: glowColor });
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
          return createHighlightWord(word, index, patternEffect);
        case 'circle':
          return createCircleWord(word, index, patternEffect);
        case 'glow':
          return createGlowWord(word, index, patternEffect);
      }
    }

    // DEFAULT: Regular word
    return createRegularWord(word, index);
  };

  // ============================================================
  // STEP 4: Process captions
  // ============================================================
  const captionsData = inputCaptions.map((caption, captionIdx) => {
    const wordsData = caption.words.map((word: any, wordIdx: number) =>
      createWord(word, wordIdx, caption),
    );

    return {
      type: 'layout',
      id: `caption-${captionIdx}`,
      componentId: 'BaseLayout',
      data: {
        containerProps: {
          className:
            'absolute bottom-0 left-0 right-0 flex flex-row gap-4 items-center justify-center',
          style: { padding: '50px' },
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
        duration: inputCaptions[inputCaptions.length - 1].absoluteEnd,
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
              duration: inputCaptions[inputCaptions.length - 1].absoluteEnd,
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
  id: 'future-proof-subtitles',
  title: 'Future-Proof Smart Subtitles',
  description: 'Works with user patterns today and AI metadata tomorrow',
  type: 'predefined',
  presetType: 'children',
  tags: ['subtitle', 'smart', 'ai-ready', 'future-proof'],
  defaultInputParams: {
    wordEffects: [
      { pattern: '\\$[0-9,]+', effectType: 'circle', color: '#FFD700' },
      { pattern: 'IMPORTANT|URGENT', effectType: 'glow', color: '#FF0000' },
    ],
    disableMetadata: false,
    fontSize: 50,
    highlightColor: '#FFEB3B',
    glowColor: '#FFD700',
    inputCaptions: [],
  },
};

export const futureProofSubtitlesPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
```

#### How It Works: Usage Scenarios

**Scenario 1: Today (User Input)**

```json
{
  "wordEffects": [
    { "pattern": "\\$150[,]?000", "effectType": "circle", "color": "#FFD700" }
  ],
  "inputCaptions": [
    {
      "text": "Price is $150,000",
      "words": [{ "text": "$150,000", "start": 1.0, "duration": 0.5 }]
    }
  ]
}
```

**Output:** `$150,000` gets circle effect via pattern matching (Priority 3) ✅

**Scenario 2: Tomorrow (With AI)**

```json
{
  "wordEffects": [],
  "inputCaptions": [
    {
      "text": "Price is $150,000",
      "words": [
        {
          "text": "$150,000",
          "start": 1.0,
          "duration": 0.5,
          "metadata": { "isHighlight": true }
        }
      ]
    }
  ]
}
```

**Output:** `$150,000` gets highlight effect via metadata (Priority 1) ✅

**Scenario 3: Hybrid (Best of Both)**

```json
{
  "wordEffects": [
    { "pattern": "URGENT", "effectType": "glow", "color": "#FF0000" }
  ],
  "inputCaptions": [
    {
      "text": "URGENT: Price is $150,000",
      "words": [
        { "text": "URGENT", "start": 0.5, "duration": 0.4 },
        {
          "text": "$150,000",
          "start": 1.5,
          "duration": 0.5,
          "metadata": { "isHighlight": true }
        }
      ]
    }
  ]
}
```

**Output:**

- `URGENT` gets glow (via pattern, Priority 3) ✅
- `$150,000` gets highlight (via metadata, Priority 1) ✅

#### Key Takeaways

1. **Always include both systems** from day one
2. **Metadata checks are harmless** - they return `undefined` if no metadata exists
3. **Pattern rules always work** - they're the fallback
4. **Priority system is key**: Metadata → Keyword → Pattern → Default
5. **Zero refactoring needed** when adding AI later
6. **Add `disableMetadata` param** for flexibility
7. **Log which system triggered** for debugging

#### Implementation Checklist

When creating any new preset, ensure you:

- ✅ Accept `wordEffects` or similar pattern rules in params
- ✅ Accept `disableMetadata` boolean option
- ✅ Check `word.metadata?.isHighlight` first (Priority 1)
- ✅ Check `caption.metadata?.keyword` second (Priority 2)
- ✅ Check pattern rules third (Priority 3)
- ✅ Have a default behavior (Priority 4)
- ✅ Add console.log to show which priority triggered
- ✅ Use TypeScript `optional()` for all metadata fields
- ✅ Test with both pattern rules and mock metadata

**Follow this pattern and your preset will work forever, regardless of how your data evolves!** 🚀

---

### Pattern 11: Plug & Play Effect Libraries (Reusable Helpers) 🔌

**IMPORTANT: Don't repeat effect code in every preset! Build a shared library instead.**

Instead of copy-pasting effect implementations across presets, create reusable effect factories that you import and use anywhere.

#### The Problem: Code Duplication

**Bad Approach: Repeating Everything**

```typescript
// preset-1.ts
const createHighlightWord = (word, index, config) => {
  // 50 lines of code...
};

// preset-2.ts
const createHighlightWord = (word, index, config) => {
  // Same 50 lines of code... ❌ DUPLICATED!
};

// preset-3.ts
const createHighlightWord = (word, index, config) => {
  // Same 50 lines of code... ❌ DUPLICATED AGAIN!
};
```

**Problems:**

- ❌ Maintain same code in 10+ files
- ❌ Bug fix requires updating everywhere
- ❌ New feature needs changes in all presets
- ❌ Inconsistent behavior across presets

#### The Solution: Shared Effect Library

**Create once, use everywhere!**

#### Step 1: Create Shared Effect Library

**File: `apps/mediamake/components/editor/presets/helpers/word-effects.ts`**

```typescript
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
): RenderableComponentData => {
  return {
    type: 'atom',
    id: `word-${index}`,
    componentId: 'TextAtom',
    effects: [
      {
        id: `fade-${index}`,
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
    ],
    data: {
      text: word.text,
      style: {
        fontSize: config.fontSize || 50,
        color: config.color || '#FFFFFF',
      },
      font: { family: 'Inter' },
    } as TextAtomData,
    context: { timing: { start: 0, duration: word.duration } },
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
```

#### Step 2: Use in Any Preset (Plug & Play!)

```typescript
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

// 🔌 IMPORT THE EFFECTS YOU NEED
import {
  createHighlightWord,
  createCircleWord,
  createGlowWord,
  createCounterWord,
  createRegularWord,
  createUnderlineWord,
  createBoxWord,
} from '../helpers/word-effects';

const presetParams = z.object({
  inputCaptions: z.array(z.any()),
  wordEffects: z
    .array(
      z.object({
        pattern: z.string(),
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
    .default([]),
  disableMetadata: z.boolean().optional().default(false),
  fontSize: z.number().optional().default(50),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  const { inputCaptions, disableMetadata, wordEffects, fontSize } = params;

  const findPatternEffect = (wordText: string) => {
    for (const effect of wordEffects) {
      const regex = new RegExp(effect.pattern, 'i');
      if (regex.test(wordText)) return effect;
    }
    return null;
  };

  // 🎯 Just plug in the helpers!
  const createWord = (word: any, index: number, caption: any) => {
    // PRIORITY 1: Metadata
    if (!disableMetadata && word.metadata?.isHighlight) {
      return createHighlightWord(word, index, {
        color: word.metadata.color,
        backgroundColor: word.metadata.backgroundColor,
        fontSize,
      });
    }

    // PRIORITY 2: Keyword
    if (!disableMetadata && caption.metadata?.keyword) {
      if (
        word.text.toLowerCase().includes(caption.metadata.keyword.toLowerCase())
      ) {
        return createGlowWord(word, index, { fontSize });
      }
    }

    // PRIORITY 3: Pattern rules
    const patternEffect = findPatternEffect(word.text);
    if (patternEffect) {
      switch (patternEffect.effectType) {
        case 'highlight':
          return createHighlightWord(word, index, patternEffect);
        case 'circle':
          return createCircleWord(word, index, patternEffect);
        case 'glow':
          return createGlowWord(word, index, patternEffect);
        case 'counter':
          return createCounterWord(word, index, patternEffect);
        case 'underline':
          return createUnderlineWord(word, index, patternEffect);
        case 'box':
          return createBoxWord(word, index, patternEffect);
      }
    }

    // DEFAULT
    return createRegularWord(word, index, { fontSize });
  };

  // Process captions (standard code)
  const captionsData = inputCaptions.map((caption, captionIdx) => {
    const wordsData = caption.words.map((word: any, wordIdx: number) =>
      createWord(word, wordIdx, caption),
    );

    return {
      type: 'layout',
      id: `caption-${captionIdx}`,
      componentId: 'BaseLayout',
      data: {
        containerProps: {
          className:
            'absolute bottom-0 left-0 right-0 flex flex-row gap-4 items-center justify-center',
          style: { padding: '50px' },
        },
      },
      context: {
        timing: {
          start: caption.absoluteStart,
          duration: caption.duration,
        },
      },
      childrenData: wordsData,
    };
  });

  return {
    output: {
      config: {
        duration: inputCaptions[inputCaptions.length - 1].absoluteEnd,
      },
      childrenData: [
        {
          id: 'SubtitlesOverlay',
          componentId: 'BaseLayout',
          type: 'layout',
          data: { containerProps: { className: 'absolute inset-0' } },
          context: {
            timing: {
              start: 0,
              duration: inputCaptions[inputCaptions.length - 1].absoluteEnd,
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

const presetMetadata: PresetMetadata = {
  id: 'pluggable-effects-preset',
  title: 'Pluggable Effects Preset',
  description: 'Uses shared effect library - clean and maintainable!',
  type: 'predefined',
  presetType: 'children',
  tags: ['subtitle', 'effects', 'reusable'],
  defaultInputParams: {
    wordEffects: [
      { pattern: '\\$[0-9,]+', effectType: 'counter', counterStart: 10000 },
      { pattern: 'URGENT', effectType: 'glow', color: '#FF0000' },
    ],
    disableMetadata: false,
    fontSize: 50,
    inputCaptions: [],
  },
};

export const pluggableEffectsPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
```

#### Benefits Comparison

| Approach        | Code Duplication | Maintainability         | Reusability    | Consistency |
| --------------- | ---------------- | ----------------------- | -------------- | ----------- |
| All-in-One      | ❌ Very High     | ❌ Update 10+ files     | ❌ Copy-paste  | ❌ Varies   |
| **Plug & Play** | ✅ Zero          | ✅ Update once, fix all | ✅ Import only | ✅ Perfect  |

#### Extending The Library

Want a new "shake" effect? Just add to the library:

```typescript
// Add to word-effects.ts
export const createShakeWord = (
  word: any,
  index: number,
  config: { intensity?: number; fontSize?: number },
): RenderableComponentData => {
  return {
    type: 'atom',
    id: `shake-${index}`,
    componentId: 'TextAtom',
    effects: [
      {
        id: `shake-${index}`,
        componentId: 'generic',
        data: {
          type: 'linear',
          start: word.start,
          duration: 0.5,
          mode: 'provider',
          targetIds: [`shake-${index}`],
          ranges: [
            { key: 'translateX', val: -5, prog: 0 },
            { key: 'translateX', val: 5, prog: 0.2 },
            { key: 'translateX', val: -5, prog: 0.4 },
            { key: 'translateX', val: 5, prog: 0.6 },
            { key: 'translateX', val: -5, prog: 0.8 },
            { key: 'translateX', val: 0, prog: 1 },
          ],
        } as GenericEffectData,
      },
    ],
    data: {
      text: word.text,
      style: {
        fontSize: config.fontSize || 55,
        fontWeight: 900,
        color: '#FF0000',
      },
      font: { family: 'BebasNeue' },
    } as TextAtomData,
    context: { timing: { start: 0, duration: word.duration } },
  } as RenderableComponentData;
};

// Use immediately in ANY preset!
import { createShakeWord } from '../helpers/word-effects';
```

#### Available Effects Library

After creating the library, you have:

| Effect    | Function              | Use Case                 |
| --------- | --------------------- | ------------------------ |
| Highlight | `createHighlightWord` | Yellow marker style      |
| Circle    | `createCircleWord`    | Hand-drawn circle        |
| Glow      | `createGlowWord`      | Pulsing emphasis         |
| Counter   | `createCounterWord`   | Animated number counting |
| Underline | `createUnderlineWord` | Animated underline       |
| Box       | `createBoxWord`       | Rectangular frame        |
| Regular   | `createRegularWord`   | Default styling          |
| Custom... | `createYourEffect`    | Add your own!            |

#### Key Takeaways

1. **Write once, use everywhere** - Build a toolkit
2. **Update once, fix everything** - Single source of truth
3. **Mix and match** - Import only what you need
4. **Extend easily** - Add new effects to library
5. **Clean presets** - Focus on logic, not implementation
6. **Consistent behavior** - All presets use same code

#### File Structure

```
apps/mediamake/components/editor/presets/
├── helpers/
│   ├── word-effects.ts         ← Shared effect library
│   ├── position-helpers.ts     ← Position utilities
│   └── animation-helpers.ts    ← Animation utilities
├── registry/
│   ├── preset-1.ts            ← Import & use effects
│   ├── preset-2.ts            ← Import & use effects
│   └── preset-3.ts            ← Import & use effects
└── types.ts
```

**Best Practice:** Always build reusable libraries. Never duplicate effect code!

---

## Complete Examples

### Example 1: Basic Subtitle with Conditional Positioning

```typescript
import { Transcription } from '@/app/types/transcription';
import { RenderableComponentData } from '@microfox/datamotion';
import { GenericEffectData, TextAtomData } from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

const presetParams = z.object({
  inputCaptions: z.array(z.any()),
  positionRules: z
    .array(
      z.object({
        pattern: z.string(),
        position: z.enum(['bottom', 'center', 'top']),
      }),
    )
    .optional()
    .default([]),
  defaultPosition: z.enum(['bottom', 'center', 'top']).default('bottom'),
  fontSize: z.number().optional().default(50),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  const { inputCaptions, positionRules, defaultPosition, fontSize } = params;

  // Helpers
  const getPositionForCaption = (caption: any) => {
    for (const rule of positionRules) {
      const regex = new RegExp(rule.pattern, 'i');
      if (regex.test(caption.text)) {
        return rule.position;
      }
    }
    return defaultPosition;
  };

  const getPositionStyle = (position: string) => {
    switch (position) {
      case 'center':
        return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
      case 'top':
        return { top: '50px', left: '0', right: '0' };
      case 'bottom':
      default:
        return { bottom: '50px', left: '0', right: '0' };
    }
  };

  // Process captions
  const captionsData = inputCaptions.map((caption, captionIdx) => {
    const position = getPositionForCaption(caption);

    // Create words
    const wordsData = caption.words.map((word: any, wordIdx: number) => {
      return {
        type: 'atom',
        id: `word-${captionIdx}-${wordIdx}`,
        componentId: 'TextAtom',
        effects: [
          {
            id: `fade-${captionIdx}-${wordIdx}`,
            componentId: 'generic',
            data: {
              type: 'ease-in',
              start: word.start,
              duration: 0.15,
              mode: 'provider',
              targetIds: [`word-${captionIdx}-${wordIdx}`],
              ranges: [
                { key: 'opacity', val: 0, prog: 0 },
                { key: 'opacity', val: 1, prog: 1 },
              ],
            } as GenericEffectData,
          },
        ],
        data: {
          text: word.text,
          className: 'text-white',
          style: { fontSize },
          font: { family: 'Inter' },
        } as TextAtomData,
        context: {
          timing: { start: 0, duration: caption.duration },
        },
      } as RenderableComponentData;
    });

    // Caption container
    return {
      type: 'layout',
      id: `caption-${captionIdx}`,
      componentId: 'BaseLayout',
      data: {
        containerProps: {
          className: 'flex flex-row gap-4 items-center justify-center',
          style: { ...getPositionStyle(position), position: 'absolute' },
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
        duration: inputCaptions[inputCaptions.length - 1].absoluteEnd,
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
              duration: inputCaptions[inputCaptions.length - 1].absoluteEnd,
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

const presetMetadata: PresetMetadata = {
  id: 'conditional-position-subtitles',
  title: 'Conditional Position Subtitles',
  description: 'Subtitles with rule-based positioning',
  type: 'predefined',
  presetType: 'children',
  tags: ['subtitle', 'conditional', 'position'],
  defaultInputParams: {
    positionRules: [{ pattern: 'important', position: 'center' }],
    defaultPosition: 'bottom',
    fontSize: 50,
    inputCaptions: [],
  },
};

export const conditionalPositionSubtitlesPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
```

### Example 2: Advanced Word Effects

```typescript
import { Transcription } from '@/app/types/transcription';
import { RenderableComponentData } from '@microfox/datamotion';
import { GenericEffectData, TextAtomData } from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

const presetParams = z.object({
  inputCaptions: z.array(z.any()),
  wordEffects: z
    .array(
      z.object({
        pattern: z.string(),
        effectType: z.enum(['highlight', 'circle', 'glow']),
        color: z.string().optional(),
        backgroundColor: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  const { inputCaptions, wordEffects } = params;

  // Helpers
  const hexToRgb = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });

  const getEffectForWord = (wordText: string) => {
    for (const effect of wordEffects) {
      const regex = new RegExp(effect.pattern, 'i');
      if (regex.test(wordText)) {
        return effect;
      }
    }
    return null;
  };

  const createHighlightWord = (word: any, idx: number, effect: any) => {
    return {
      type: 'atom',
      id: `highlight-${idx}`,
      componentId: 'TextAtom',
      effects: [
        {
          id: `draw-${idx}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: word.start,
            duration: 0.3,
            mode: 'provider',
            targetIds: [`highlight-${idx}`],
            ranges: [
              { key: 'scaleX', val: 0, prog: 0 },
              { key: 'scaleX', val: 1, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        text: word.text,
        style: {
          fontSize: 55,
          color: effect.color || '#000',
          backgroundColor: effect.backgroundColor || '#FFEB3B',
          padding: '4px 12px',
          borderRadius: '6px',
          display: 'inline-block',
          transformOrigin: 'left center',
        },
        font: { family: 'Inter', weights: ['700'] },
      } as TextAtomData,
      context: {
        timing: { start: 0, duration: word.duration },
      },
    } as RenderableComponentData;
  };

  const createCircleWord = (word: any, idx: number, effect: any) => {
    const color = effect.color || '#FF0000';
    const rgb = hexToRgb(color);

    const circle = {
      type: 'atom',
      id: `circle-${idx}`,
      componentId: 'ShapeAtom',
      effects: [
        {
          id: `circle-draw-${idx}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: word.start,
            duration: 0.5,
            mode: 'provider',
            targetIds: [`circle-${idx}`],
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
      id: `text-${idx}`,
      componentId: 'TextAtom',
      effects: [
        {
          id: `pop-${idx}`,
          componentId: 'generic',
          data: {
            type: 'spring',
            start: word.start + 0.2,
            duration: 0.2,
            mode: 'provider',
            targetIds: [`text-${idx}`],
            ranges: [
              { key: 'scale', val: 0.5, prog: 0 },
              { key: 'scale', val: 1, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        text: word.text,
        style: { fontSize: 55, fontWeight: 900, color },
        font: { family: 'BebasNeue' },
      } as TextAtomData,
      context: { timing: { start: 0, duration: word.duration } },
    };

    return {
      type: 'layout',
      id: `circled-${idx}`,
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

  const createGlowWord = (word: any, idx: number, effect: any) => {
    const color = effect.color || '#FFD700';
    const rgb = hexToRgb(color);

    return {
      type: 'atom',
      id: `glow-${idx}`,
      componentId: 'TextAtom',
      effects: [
        {
          id: `entrance-${idx}`,
          componentId: 'generic',
          data: {
            type: 'ease-out',
            start: word.start,
            duration: 0.3,
            mode: 'provider',
            targetIds: [`glow-${idx}`],
            ranges: [
              { key: 'scale', val: 0.5, prog: 0 },
              { key: 'scale', val: 1, prog: 1 },
            ],
          } as GenericEffectData,
        },
        {
          id: `loop-${idx}`,
          componentId: 'loop',
          data: { durationInFrames: 30, times: Infinity, layout: 'none' },
        },
        {
          id: `pulse-${idx}`,
          componentId: 'generic',
          data: {
            type: 'ease-in-out',
            start: 0,
            duration: 1,
            mode: 'provider',
            targetIds: [`glow-${idx}`],
            ranges: [
              { key: 'scale', val: 1, prog: 0 },
              { key: 'scale', val: 1.1, prog: 0.5 },
              { key: 'scale', val: 1, prog: 1 },
              {
                key: 'filter',
                val: `drop-shadow(0 0 5px rgba(${rgb.r},${rgb.g},${rgb.b},0.5))`,
                prog: 0,
              },
              {
                key: 'filter',
                val: `drop-shadow(0 0 25px rgba(${rgb.r},${rgb.g},${rgb.b},0.9))`,
                prog: 0.5,
              },
              {
                key: 'filter',
                val: `drop-shadow(0 0 5px rgba(${rgb.r},${rgb.g},${rgb.b},0.5))`,
                prog: 1,
              },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        text: word.text,
        style: { fontSize: 60, fontWeight: 900, color },
        font: { family: 'BebasNeue' },
      } as TextAtomData,
      context: { timing: { start: 0, duration: word.duration } },
    } as RenderableComponentData;
  };

  const createRegularWord = (word: any, idx: number) => {
    return {
      type: 'atom',
      id: `word-${idx}`,
      componentId: 'TextAtom',
      effects: [
        {
          id: `fade-${idx}`,
          componentId: 'generic',
          data: {
            type: 'ease-in',
            start: word.start,
            duration: 0.15,
            mode: 'provider',
            targetIds: [`word-${idx}`],
            ranges: [
              { key: 'opacity', val: 0, prog: 0 },
              { key: 'opacity', val: 1, prog: 1 },
            ],
          } as GenericEffectData,
        },
      ],
      data: {
        text: word.text,
        style: { fontSize: 50, color: '#FFFFFF' },
        font: { family: 'Inter' },
      } as TextAtomData,
      context: { timing: { start: 0, duration: word.duration } },
    } as RenderableComponentData;
  };

  // Process captions
  const captionsData = inputCaptions.map((caption, captionIdx) => {
    const wordsData = caption.words.map((word: any, wordIdx: number) => {
      const effect = getEffectForWord(word.text);

      if (effect) {
        switch (effect.effectType) {
          case 'highlight':
            return createHighlightWord(word, wordIdx, effect);
          case 'circle':
            return createCircleWord(word, wordIdx, effect);
          case 'glow':
            return createGlowWord(word, wordIdx, effect);
        }
      }

      return createRegularWord(word, wordIdx);
    });

    return {
      type: 'layout',
      id: `caption-${captionIdx}`,
      componentId: 'BaseLayout',
      data: {
        containerProps: {
          className:
            'absolute bottom-0 left-0 right-0 flex flex-row gap-4 items-center justify-center',
          style: { padding: '50px' },
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
        duration: inputCaptions[inputCaptions.length - 1].absoluteEnd,
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
              duration: inputCaptions[inputCaptions.length - 1].absoluteEnd,
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

const presetMetadata: PresetMetadata = {
  id: 'word-effects-subtitles',
  title: 'Word Effects Subtitles',
  description: 'Subtitles with special word effects',
  type: 'predefined',
  presetType: 'children',
  tags: ['subtitle', 'effects', 'highlight', 'circle', 'glow'],
  defaultInputParams: {
    wordEffects: [
      { pattern: '\\$[0-9,]+', effectType: 'circle', color: '#FFD700' },
      {
        pattern: 'important',
        effectType: 'highlight',
        backgroundColor: '#FFEB3B',
      },
    ],
    inputCaptions: [],
  },
};

export const wordEffectsSubtitlesPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
```

---

## Best Practices

### 0. ⭐⭐⭐ ALWAYS Use the Combined Approach (Pattern 10)

**This is the single most important best practice!**

Never create a preset that only supports pattern rules OR metadata. Always support BOTH from day one:

```typescript
const createWord = (word, index, caption) => {
  // PRIORITY 1: Check metadata (AI)
  if (!disableMetadata && word.metadata?.isHighlight) {
    return createHighlightWord(word, index, word.metadata);
  }

  // PRIORITY 2: Check caption keyword (AI)
  if (!disableMetadata && caption.metadata?.keyword?.includes(word.text)) {
    return createKeywordWord(word, index);
  }

  // PRIORITY 3: Check pattern rules (User)
  const patternEffect = findPatternMatch(word.text);
  if (patternEffect) {
    return createPatternWord(word, index, patternEffect);
  }

  // DEFAULT: Regular word
  return createRegularWord(word, index);
};
```

**Why this matters:**

- ✅ Works today with user input
- ✅ Works tomorrow with AI
- ✅ Zero refactoring ever needed
- ✅ Hybrid mode supported
- ✅ Future-proof

See [Pattern 10: Future-Proof Preset Design](#pattern-10-future-proof-preset-design-combined-approach-) for complete implementation.

### 1. Use Provider Mode for Targeted Effects

Always use `mode: 'provider'` with `targetIds` for precise control:

```typescript
{
  mode: 'provider',
  targetIds: ['word-1', 'word-2'],  // Exact targeting
  // ...
}
```

### 2. Layer Components with BaseLayout

Use `childrenProps` to position children individually:

```typescript
{
  type: 'layout',
  componentId: 'BaseLayout',
  data: {
    childrenProps: [
      { className: 'absolute inset-0' },     // Background layer
      { className: 'relative z-10' },        // Foreground layer
    ],
  },
  childrenData: [backgroundComponent, foregroundComponent],
}
```

### 3. Timing is Relative to Parent

Component timing is relative to its parent's timing context:

```typescript
// Parent starts at 5 seconds
{
  context: { timing: { start: 5, duration: 10 } },
  childrenData: [
    {
      // This child starts at 5 seconds (parent's start)
      // NOT at 0 seconds
      context: { timing: { start: 0, duration: 5 } },
    },
  ],
}
```

### 4. Stack Effects for Rich Animation

Combine multiple effects on a single component:

```typescript
effects: [
  { id: 'fade' /* opacity animation */ },
  { id: 'scale' /* scale animation */ },
  { id: 'glow' /* filter animation */ },
  { id: 'rotate' /* rotation animation */ },
];
```

### 5. Use Helpers and Factories

Create reusable helper functions:

```typescript
const createOpacityEffect = (id, start, duration) => ({
  id: `opacity-${id}`,
  componentId: 'generic',
  data: {
    type: 'ease-in',
    start,
    duration,
    mode: 'provider',
    targetIds: [id],
    ranges: [
      { key: 'opacity', val: 0, prog: 0 },
      { key: 'opacity', val: 1, prog: 1 },
    ],
  },
});
```

### 6. Validate with TypeScript

Use proper type imports:

```typescript
import { RenderableComponentData } from '@microfox/datamotion';
import {
  GenericEffectData,
  TextAtomData,
  // ... other types
} from '@microfox/remotion';

// Type your functions
const createWord = (word: any, index: number): RenderableComponentData => {
  // ...
};
```

### 7. Test Incrementally

Build up complexity gradually:

1. Start with basic text rendering
2. Add simple fade effects
3. Add conditional logic
4. Add layered components
5. Add complex animations

### 8. Performance Considerations

- Avoid too many simultaneous effects
- Use `durationInFrames` for loop effects
- Keep effect durations reasonable (0.1-2 seconds typically)
- Limit the number of TextAtom steps for counter animations (15-30 max)

### 9. Debugging Tips

Add console logs in your preset execution:

```typescript
const presetExecution = params => {
  console.log('Input params:', params);

  const result = processData(params);
  console.log('Generated components:', result);

  return result;
};
```

### 10. Reuse Patterns from Existing Presets

Study these presets for inspiration:

- **`sub-vertical-float.ts`** - Complex stacked effects
- **`sub-fast-rap-static.ts`** - Sentence transitions
- **`testing-kinetics.ts`** - Smart word selection

---

## Summary

You now have all the tools to create sophisticated subtitle presets with:

✅ **Future-proof design** - Pattern 10 combined approach (MOST IMPORTANT!)  
✅ **Conditional positioning** - Rule-based sentence placement  
✅ **Word-level effects** - Highlights, circles, glows, boxes  
✅ **Number animations** - Simulated counting effects  
✅ **Layered components** - Stack shapes and text  
✅ **Complex animations** - Multiple simultaneous effects  
✅ **Pattern matching** - Regex-based targeting  
✅ **Metadata support** - AI-driven intelligent effects

**Remember**:

1. **You don't need custom atoms!** Use the existing building blocks creatively.
2. **Always use Pattern 10!** Support both metadata AND pattern rules from day one.

### Next Steps

1. **Study Pattern 10** - The Future-Proof Preset Design (Combined Approach)
2. Copy the complete example from Pattern 10
3. Modify parameters to match your needs
4. Implement the priority system (Metadata → Keyword → Pattern → Default)
5. Add `disableMetadata` and `wordEffects` params
6. Test with both pattern rules and mock metadata
7. Refine and optimize

**Golden Rule:** Every preset you create should work today with user patterns AND tomorrow with AI metadata — without any code changes!

Happy preset building! 🎬
