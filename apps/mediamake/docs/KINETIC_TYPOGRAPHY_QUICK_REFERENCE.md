# Kinetic Typography Quick Reference

## Quick Start

### 1. Caption Metadata

```json
{
  "metadata": {
    "KineticTopo": true, // Enable kinetic processing
    "kineticLayout": "keyword-center", // Layout strategy
    "keyword": "AMAZING" // Word to highlight
  },
  "words": [
    {
      "text": "This",
      "metadata": { "animation": "slide-right" } // Per-word override
    }
  ]
}
```

### 2. Composition Setup

```typescript
const composition = {
  children: [
    // Layer 1: Layout
    {
      presetId: 'sub-kinetic-layout-base',
      params: { inputCaptions: captions },
    },
    // Layer 2: Animation
    {
      presetId: 'sub-kinetic-anim-explosive',
      params: { inputCaptions: captions, globalIntensity: 1.2 },
    },
  ],
};
```

---

## Layout Preset Template

```typescript
// LAYOUT: Creates structure, NO animations

const generateWordComponent = (word, wordId, isKeyword, config) => ({
  type: 'atom',
  id: wordId, // ← Stable ID for animation layer
  componentId: 'TextAtom',
  effects: [], // ← NO ANIMATIONS!
  data: {
    text: word.text,
    style: {
      opacity: 1, // ← Start visible
      fontSize: isKeyword ? 70 : 50,
    },
  },
});

// Key Points:
// ✓ Stable IDs: kinetic-layout-${captionIndex}-word-${wordIndex}
// ✓ No effects array
// ✓ opacity: 1 (visible)
```

---

## Animation Preset Template

```typescript
// ANIMATION: Adds effects to existing elements

const ANIMATION_LIBRARY = {
  'fade-in': (targetId, timing, intensity) => ({
    id: `${targetId}-fade`,
    componentId: 'generic',
    data: {
      type: 'ease-out',
      start: timing.start,
      duration: 0.3 * intensity,
      mode: 'target', // ← CRITICAL!
      targetIds: [targetId], // ← Match layout IDs
      ranges: [
        { key: 'opacity', val: 0, prog: 0 },
        { key: 'opacity', val: 1, prog: 1 },
      ],
    },
  }),
};

// Generate effects for existing elements
allEffects.push({
  id: 'effect-1',
  componentId: 'generic',
  data: ANIMATION_LIBRARY['fade-in'](wordId, timing, intensity),
});

// Return effects (no children)
return {
  output: {
    childrenData: [
      {
        effects: allEffects, // ← All effects here
        childrenData: [], // ← No children!
      },
    ],
  },
};

// Key Points:
// ✓ mode: 'target' (affects existing elements)
// ✓ Match layout IDs exactly
// ✓ No DOM elements, only effects
```

---

## ID Consistency (CRITICAL!)

```typescript
// Layout Preset
const wordId = `kinetic-layout-${captionIndex}-word-${wordIndex}`;

// Animation Preset (MUST MATCH!)
const wordId = `kinetic-layout-${captionIndex}-word-${wordIndex}`;
```

**If IDs don't match, animations won't apply!**

---

## Animation Library Structure

```typescript
const ANIMATION_LIBRARY = {
  // Basic (single effect)
  'fade-in': (targetId, timing, intensity) => ({
    /* GenericEffectData */
  }),

  // Complex (multiple effects)
  explosive: (targetId, timing, intensity, colorChoice) => [
    {
      /* scale effect */
    },
    {
      /* glow effect */
    },
    {
      /* letter-spacing effect */
    },
  ],
};

// Usage
const animFunc = ANIMATION_LIBRARY[animationName];
const effects = animFunc(wordId, timing, intensity, colorChoice);

// Handle both single and array
if (Array.isArray(effects)) {
  allEffects.push(...effects);
} else {
  allEffects.push(effects);
}
```

---

## Common Animation Patterns

### Fade In

```typescript
ranges: [
  { key: 'opacity', val: 0, prog: 0 },
  { key: 'opacity', val: 1, prog: 1 },
];
```

### Scale Pop

```typescript
ranges: [
  { key: 'scale', val: 0, prog: 0 },
  { key: 'scale', val: 1.2, prog: 0.5 },
  { key: 'scale', val: 1, prog: 1 },
];
```

### Slide In

```typescript
ranges: [
  { key: 'translateX', val: -50, prog: 0 },
  { key: 'translateX', val: 0, prog: 1 },
  { key: 'opacity', val: 0, prog: 0 },
  { key: 'opacity', val: 1, prog: 0.4 },
];
```

### Glow Effect

```typescript
const rgb = hexToRgb(color);
ranges: [
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
];
```

---

## Layout Strategies

### keyword-center

```
[before words] KEYWORD [after words]
```

### keyword-spotlight

```
   small  small
      KEYWORD
   small  small
```

### vertical-stack

```
Word 1
Word 2
KEYWORD
Word 3
```

### circular-orbit

```
  word    word
word  KEYWORD  word
  word    word
```

---

## Caption Metadata Reference

```typescript
{
  // Caption level
  metadata: {
    KineticTopo: boolean,        // Enable kinetic
    kineticLayout: string,       // Layout strategy name
    keyword: string,             // Keyword to highlight
    strength: number,            // 1-10 intensity
    keywordFeel: string,         // Style hint
    splitParts: string[],        // Manual splitting
  },

  // Word level
  words: [{
    text: string,
    metadata: {
      animation: string,         // Override animation
      isHighlight: boolean,      // Mark as important
    }
  }]
}
```

---

## File Organization

```
presets/registry/
├── sub-kinetic-layout-base.ts           (Layout strategies)
├── sub-kinetic-anim-explosive.ts        (Explosive animations)
├── sub-kinetic-anim-smooth.ts           (Smooth animations)
├── sub-kinetic-anim-mechanical.ts       (Mechanical animations)
└── sub-kinetic-anim-organic.ts          (Organic animations)
```

---

## Checklist for New Preset

### Layout Preset

- [ ] Define layout strategies
- [ ] Generate stable word IDs
- [ ] NO effects array
- [ ] Set opacity: 1
- [ ] Preserve timing info
- [ ] Return structure only

### Animation Preset

- [ ] Define animation library
- [ ] Use mode: 'target'
- [ ] Match layout IDs exactly
- [ ] Define owned animations
- [ ] Handle single/array effects
- [ ] Return effects only (no children)

---

## Common Mistakes

### ❌ Wrong: Creating new elements in animation preset

```typescript
childrenData: [
  { type: 'atom', id: 'word', ... }  // DON'T DO THIS!
]
```

### ✅ Right: Targeting existing elements

```typescript
effects: [{ data: { mode: 'target', targetIds: ['word'] } }];
```

---

### ❌ Wrong: ID mismatch

```typescript
// Layout
const wordId = `layout-${index}`;

// Animation
const wordId = `word-${index}`; // DOESN'T MATCH!
```

### ✅ Right: Consistent IDs

```typescript
// Both presets
const wordId = `kinetic-layout-${captionIndex}-word-${wordIndex}`;
```

---

### ❌ Wrong: Starting invisible

```typescript
style: {
  opacity: 0,  // Animation won't work!
}
```

### ✅ Right: Start visible

```typescript
style: {
  opacity: 1,  // Animation layer controls this
}
```

---

## Debugging Tips

### Issue: Animations not applying

```typescript
// 1. Check ID in browser console
console.log('Layout ID:', wordId);
console.log('Animation targeting:', targetId);

// 2. Verify mode is 'target'
data: {
  mode: 'target';
} // Not 'provider'!

// 3. Check timing
console.log('Animation start:', timing.start);
console.log('Word start:', word.absoluteStart);
```

### Issue: Elements not showing

```typescript
// Check layout preset
style: {
  opacity: 1,        // Must be 1
  display: 'block',  // Not 'none'
}
```

### Issue: Effects conflicting

```typescript
// Use owned animations filter
const OWNED_ANIMATIONS = ['explosive', 'shockwave'];

if (!OWNED_ANIMATIONS.includes(animationName)) {
  return; // Skip, another preset handles it
}
```

---

## Performance Tips

1. **Limit effects per word**: Max 3-4 effects per word
2. **Use shorter durations**: 0.3-0.8 seconds for most animations
3. **Filter early**: Check `KineticTopo` flag immediately
4. **Reuse color calculations**: Calculate RGB once, reuse
5. **Batch effects**: Push to array, apply once

---

## Testing Strategy

```typescript
// 1. Test with single word
const testCaption = {
  text: 'Test',
  words: [{ text: 'Test', absoluteStart: 0, duration: 1 }],
  metadata: { KineticTopo: true, keyword: 'Test' },
};

// 2. Test with keyword
const testCaption = {
  text: 'This is TEST',
  words: [
    { text: 'This', absoluteStart: 0, duration: 0.3 },
    { text: 'is', absoluteStart: 0.3, duration: 0.3 },
    { text: 'TEST', absoluteStart: 0.6, duration: 1.0 },
  ],
  metadata: { KineticTopo: true, keyword: 'TEST' },
};

// 3. Test with per-word overrides
const testCaption = {
  words: [
    { text: 'This', metadata: { animation: 'slide-left' } },
    { text: 'TEST', metadata: { animation: 'explosive' } },
  ],
};
```

---

## Resources

- **Full Guide**: `KINETIC_TYPOGRAPHY_PRESET_GUIDE.md`
- **Examples**: See `sub-kinetic-layout-base.ts` and `sub-kinetic-anim-*.ts`
- **Types**: `@microfox/remotion` and `@microfox/datamotion`

---

## Quick Copy-Paste

### Hex to RGB

```typescript
const hexToRgb = (hex: string) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});
```

### Find Keyword

```typescript
const findKeywordIndex = (words: any[], keyword: string) => {
  const clean = keyword.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
  return words.findIndex(w =>
    w.text
      ?.toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '')
      .includes(clean),
  );
};
```

### Filter Kinetic Captions

```typescript
const kineticCaptions = inputCaptions.filter(
  c => c.metadata?.KineticTopo === true,
);
```

### Empty Return

```typescript
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
```



