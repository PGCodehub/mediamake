# Typography Preset Guide

## 1. Caption Data Schema

### Caption Structure

```typescript
interface Caption {
  id: string; // Unique identifier
  text: string; // Full sentence text
  start: number; // Relative start time (relative to caption start = 0)
  end: number; // Relative end time
  duration: number; // Relative duration (end - start)
  absoluteStart: number; // Absolute start in caption timeline (scene-relative)
  absoluteEnd: number; // Absolute end in caption timeline (scene-relative)
  words: Word[]; // Array of word objects
  metadata?: {
    // Optional metadata for typography customization
    keyword?: string; // Keyword to highlight
    splitParts?: string[]; // How to split sentence into parts
    impact?: number; // Effect intensity multiplier (0.1 - 3.0)
    sentiment?: string; // 'positive' | 'negative' | 'neutral'
    emotion?: string; // Custom emotion tag
    [key: string]: any; // Any custom properties
  };
}
```

### Word Structure

```typescript
interface Word {
  id?: string; // Optional unique identifier
  text: string; // Word text
  start: number; // Relative start time (relative to caption start)
  end: number; // Relative end time
  duration: number; // Word duration
  absoluteStart: number; // Absolute start in caption timeline
  absoluteEnd: number; // Absolute end in caption timeline
  confidence?: number; // Speech recognition confidence (0-1)
  // NOTE: Words do NOT have metadata
}
```

### Key Concepts

**Relative vs Absolute Timing:**

- `start`/`end`/`duration`: Relative to the caption's start (caption starts at 0)
- `absoluteStart`/`absoluteEnd`: Absolute positions in the caption timeline (scene-relative)
- **Important**: `absoluteStart`/`absoluteEnd` are relative to the caption timeline, not the video timeline. Consider all captions bunched together as a scene.

**Metadata Usage:**

- `caption.metadata` contains variable data helpful for typography decisions
- Use `caption.metadata.impact` for per-caption effect intensity (if available)
- Use preset input params for global impact configuration
- Common metadata fields: `keyword`, `splitParts`, `impact`, `sentiment`, `emotion`

**Example:**

```typescript
const caption = {
  id: 'caption-1',
  text: 'Hello world',
  start: 0, // Relative: caption starts at 0
  end: 2.5, // Relative: caption ends at 2.5s
  duration: 2.5, // Relative duration
  absoluteStart: 10.0, // Absolute: this caption starts at 10s in scene
  absoluteEnd: 12.5, // Absolute: this caption ends at 12.5s in scene
  words: [
    {
      text: 'Hello',
      start: 0, // Relative: word starts at 0s within caption
      end: 1.0,
      duration: 1.0,
      absoluteStart: 10.0, // Absolute: word starts at 10s in scene
      absoluteEnd: 11.0,
    },
    {
      text: 'world',
      start: 1.0, // Relative: word starts at 1.0s within caption
      end: 2.5,
      duration: 1.5,
      absoluteStart: 11.0, // Absolute: word starts at 11s in scene
      absoluteEnd: 12.5,
    },
  ],
  metadata: {
    impact: 1.2, // 20% more intense effects
    keyword: 'Hello',
  },
};
```

---

## 2. How to Do Typography

### Context Timing Rules

**General Rule: Use sentence-level timing for all words**

When words are in a flex layout (horizontal/vertical), their positions are interconnected. Using word-level `context.timing` will cause words to appear/disappear at different times, destabilizing the layout and motion kinetics.

```typescript
// ✅ CORRECT: All words use sentence duration
words.forEach((word, index) => {
  const wordComponent = {
    id: `word-${index}`,
    type: 'atom',
    componentId: 'TextAtom',
    context: {
      timing: {
        start: 0, // All words start together
        duration: caption.duration, // All words last for full sentence
      },
    },
    // ... word data
  };
});
```

**Exception: Word-by-word animation**

Only use word-level `context.timing` when:

- Each word's position does NOT affect other words' positions
- You want sequential reveal where words appear/disappear independently
- Words are positioned absolutely (not in flex layout)

```typescript
// ⚠️ ONLY USE WHEN: Words don't affect each other's positions
words.forEach((word, index) => {
  const wordComponent = {
    id: `word-${index}`,
    context: {
      timing: {
        start: word.start, // Each word starts at its own time
        duration: word.duration, // Each word has its own duration
      },
    },
    // ... word data
  };
});
```

**Why this matters:**

- Words with `opacity: 0` still take up space in flex layouts
- If a word disappears early, other words shift position
- This breaks the intended motion kinetics
- For expansion animations, use `width`, `opacity`, and `translateX` in effects, not `context.timing`

### Effect Timing

**Effects are relative to parent component**

- Use `word.start` (relative), NOT `word.absoluteStart`
- Effect `start` = when the word should start animating (relative to parent)
- Effect `duration` = how long the animation takes

```typescript
// ✅ CORRECT: Use relative timing
const effect = {
  type: 'ease-out',
  start: word.start, // Relative to caption start
  duration: 0.3, // Fast fade-in
  mode: 'provider',
  targetIds: [wordId],
  ranges: [
    { key: 'opacity', val: 0, prog: 0 },
    { key: 'opacity', val: 1, prog: 1 },
  ],
};

// ❌ WRONG: Don't use absolute timing
const badEffect = {
  start: word.absoluteStart, // This is wrong!
  // ...
};
```

**Effect Duration Strategy**

Effect duration depends on:

1. **Effect type**: Fast fade-in (0.3s) vs slow reveal (2s)
2. **User preference**: Slow melodious songs need longer animations
3. **Impact multiplier**: Adjust intensity based on metadata or input params

```typescript
// Get impact from metadata (per-caption) or input params (global)
const impact = caption.metadata?.impact ?? inputParams.defaultImpact ?? 1.0;

// Base duration for effect type
const baseDuration = 0.3; // Fast fade-in default

// Calculate final duration
const effectDuration = baseDuration * impact;

// Or make it dependent on word duration with multiplier
const effectDuration = Math.min(word.duration * 0.5 * impact, 2.0);
```

**Example with impact:**

```typescript
const createWordEffect = (word, wordId, caption, inputParams) => {
  // Get impact: per-caption metadata takes precedence
  const impact = caption.metadata?.impact ?? inputParams.effectImpact ?? 1.0;

  // Base duration for this effect type
  const baseDuration = 0.3;

  // Apply impact multiplier
  const duration = baseDuration * impact;

  return {
    type: 'ease-out',
    start: word.start, // Relative to caption
    duration: duration,
    mode: 'provider',
    targetIds: [wordId],
    ranges: [
      { key: 'opacity', val: 0, prog: 0 },
      { key: 'opacity', val: 1, prog: 1 },
    ],
  };
};
```

### Layout Positioning

**Parent Container Controls Layout**

The parent `BaseLayout` container defines the overall layout structure:

```typescript
const container = {
  id: 'text-container',
  type: 'layout',
  componentId: 'BaseLayout',
  data: {
    containerProps: {
      className: 'flex items-center justify-center', // Layout direction
      style: {
        // Dynamic positioning based on input params (NOT animations)
        gap: `${fontSize * 0.2}px`, // Gap based on font size
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
};
```

**Dynamic Layout via `containerProps.style`**

Use `data.containerProps.style` for dynamic positioning based on **input parameters only** (not animations):

```typescript
data: {
  containerProps: {
    className: 'flex flex-row items-center',
    style: {
      gap: `${params.wordSpacing}px`,           // From input params
      padding: `${params.containerPadding}px`,   // From input params
      justifyContent: params.alignment,          // From input params
    },
  },
}
```

**All animations go in effects**, not in `containerProps.style`.

### Using `repeatChildrenProps` for Individual Word Positioning

`BaseLayout` supports `repeatChildrenProps` to apply different props to each child. Useful for individual word positioning or styling.

**Example: Background blur box for each word**

```typescript
const container = {
  id: 'text-container',
  type: 'layout',
  componentId: 'BaseLayout',
  data: {
    containerProps: {
      className: 'flex flex-row items-center justify-center',
    },
    repeatChildrenProps: {
      className: 'px-3 py-2 rounded-lg',
      style: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        marginRight: '0.5em',
      },
    },
  },
  childrenData: wordComponents,
};
```

This creates a blurred background box around each word with padding, instead of using `gap` in the container. Each word gets its own styled wrapper.

**When to use `repeatChildrenProps`:**

- Individual word backgrounds/borders
- Per-word padding/margins
- Word-specific positioning
- Custom styling per word

**When NOT to use:**

- Simple gap spacing (use `containerProps.style.gap`)
- Layout direction (use `containerProps.className`)
- Animations (use effects)

---

## 3. How to use componentalised Preset for Effects
