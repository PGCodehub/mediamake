# Kinetic Typography Debugging Guide

## Common Issue: Words Not Appearing One by One

### Symptoms

- All words appear at the same time
- Only keyword animation is visible
- Words appear with correct styling but no timing

### Root Causes & Solutions

## 1. Layout Preset Initial Opacity

**Problem**: Layout preset sets `opacity: 1`, making all words visible immediately.

**Solution**: Set `opacity: 0` in layout preset:

```typescript
// In sub-kinetic-layout-vertical.ts
style: {
  fontSize: fontCalculatedSize,
  color: textColor,
  opacity: 0,  // ← Must be 0 for animation to control visibility
  ...fontStyle,
}
```

## 2. ID Mismatch Between Presets

**Problem**: Animation targets don't match layout IDs.

**Both presets MUST generate identical IDs:**

```typescript
// Layout preset generates:
const wordId = `word-${globalWordIndex}-${partId}-${captionId}`;

// Animation preset MUST target same ID:
const wordId = `word-${globalWordIndex}-${partId}-${captionId}`;
```

**Check**:

- Both use same `splitSentenceIntoParts` logic
- Both calculate `globalWordIndex` the same way
- Both generate `partId` the same way

## 3. Word Timing Issues

**Problem**: `word.start` vs `word.absoluteStart` confusion.

**Correct timing**:

```typescript
// In animation preset
{
  type: 'ease-out',
  start: word.start,  // ← Relative to caption start
  duration: 0.4,
  // ...
  context: {
    timing: {
      start: caption.absoluteStart,  // ← Absolute time
      duration: caption.duration,
    }
  }
}
```

Word appears at: `caption.absoluteStart + word.start`

## 4. Animation Duration Too Long

**Problem**: Fade-in overlaps between words.

Example with 0.4s fade-in:

```
Can:     [0.0s ----fade----> 0.4s] visible
you:           [0.3s ----fade----> 0.7s] visible
believe:             [0.6s ----fade----> 1.0s] visible
         ^^^^^^^ All overlapping!
```

**Solution**: Use shorter duration or instant appearance:

```typescript
normalDuration: 0.2,  // Faster fade
// or
normalDuration: 0.05, // Almost instant
```

## 5. Testing Checklist

### Test 1: Verify IDs Match

Add logging to both presets:

```typescript
// In layout preset
console.log('Layout creating:', wordId, word.text);

// In animation preset
console.log('Animation targeting:', wordId, word.text);
```

**Expected**: Same IDs for same words.

### Test 2: Verify Timing

```typescript
// In animation preset
console.log(
  'Word:',
  word.text,
  'starts at:',
  word.start,
  'absolute:',
  word.absoluteStart,
);
```

**Expected**: Each word has different `start` time.

### Test 3: Single Word Test

Use caption with just one word:

```json
{
  "text": "Hello",
  "words": [
    {
      "text": "Hello",
      "start": 0,
      "duration": 1.0,
      "absoluteStart": 0,
      "absoluteEnd": 1.0
    }
  ],
  "metadata": { "keyword": "Hello" }
}
```

**Expected**: Word fades in and has keyword animation.

### Test 4: Two Words Test

```json
{
  "text": "Hello World",
  "words": [
    {
      "text": "Hello",
      "start": 0,
      "duration": 0.5,
      "absoluteStart": 0,
      "absoluteEnd": 0.5
    },
    {
      "text": "World",
      "start": 1.0,
      "duration": 0.5,
      "absoluteStart": 1.0,
      "absoluteEnd": 1.5
    }
  ],
  "metadata": { "keyword": "World" }
}
```

**Expected**:

- "Hello" fades in at 0s (normal animation)
- "World" fades in at 1.0s with explosive animation

## 6. Quick Fixes

### Make Animations More Visible

Increase duration and intensity:

```typescript
normalDuration: 0.6,  // Slower fade
keywordDuration: 1.2, // Longer explosion
intensity: 1.5,       // Stronger effects
```

### Use More Distinct Animations

```typescript
normalAnimation: 'fade-in-slide',  // Slide up while fading
keywordAnimation: 'bounce-glow',   // Bounce with glow
```

### Simplify for Testing

Start with minimal config:

```typescript
{
  presetId: 'sub-kinetic-layout-vertical',
  params: {
    inputCaptions: testCaptions,
    avgFontSize: 80,  // Larger for visibility
  }
},
{
  presetId: 'sub-kinetic-anim-keyword-focus',
  params: {
    inputCaptions: testCaptions,
    animationConfig: {
      normalAnimation: 'fade-in',
      keywordAnimation: 'explosive-scale',
      normalDuration: 0.5,
      keywordDuration: 1.0,
      intensity: 1.5,
    },
  }
}
```

## 7. Verify Effect Structure

The animation preset should create effects like this:

```typescript
{
  type: 'atom',
  id: 'effect-id',
  componentId: 'generic',
  data: {
    type: 'ease-out',
    start: 0.3,  // Word's start time
    duration: 0.4,
    mode: 'provider',
    targetIds: ['word-1-part-0-caption-0'],
    ranges: [
      { key: 'opacity', val: 0, prog: 0 },
      { key: 'opacity', val: 1, prog: 1 }
    ]
  },
  context: {
    timing: {
      start: 0,  // Caption's absolute start
      duration: 5  // Caption's duration
    }
  }
}
```

## 8. Common Mistakes

❌ **Wrong**: Using `mode: 'target'` (doesn't exist)
✅ **Right**: Using `mode: 'provider'`

❌ **Wrong**: Layout with `opacity: 1` and animation trying to override
✅ **Right**: Layout with `opacity: 0` and animation controls visibility

❌ **Wrong**: Different ID patterns in layout vs animation
✅ **Right**: Identical ID generation logic in both presets

❌ **Wrong**: Using `word.absoluteStart` in effect.start
✅ **Right**: Using `word.start` (relative to caption)

## 9. Browser Console Debugging

Open browser console and check:

1. Are layout elements being created?
2. Are animation effects being created?
3. Do the IDs match?
4. Are there any errors?

## 10. Next Steps

If words still don't appear one by one:

1. Share your caption data structure
2. Check browser console for errors
3. Verify both presets are being applied
4. Test with minimal caption (1-2 words)
5. Try different animation styles

---

**Still stuck?** Check the example in `KINETIC_TYPOGRAPHY_SIMPLE_EXAMPLE.md`



