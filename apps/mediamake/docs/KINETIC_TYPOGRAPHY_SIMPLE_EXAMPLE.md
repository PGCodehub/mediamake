# Simple Kinetic Typography Example

## Overview

This guide shows you how to use the simple kinetic typography presets we just created:

1. **`sub-kinetic-layout-vertical`** - Layout Preset (Layer 1)
2. **`sub-kinetic-anim-keyword-focus`** - Animation Preset (Layer 2)

## How It Works

Following the **two-layer architecture**:

- **Layer 1 (Layout)**: Creates the DOM structure, arranges words in vertical parts, assigns stable IDs
- **Layer 2 (Animation)**: Targets the words by ID and applies motion effects

## Example Usage

### Caption Structure

```json
{
  "id": "caption-1",
  "text": "Can you believe a toy being sold for $135,000?",
  "absoluteStart": 0,
  "absoluteEnd": 5,
  "start": 0,
  "end": 5,
  "duration": 5,
  "metadata": {
    "splitParts": ["Can you believe", "a toy being sold for", "$135,000?"],
    "keyword": "$135,000"
  },
  "words": [
    {
      "text": "Can",
      "start": 0,
      "duration": 0.3,
      "absoluteStart": 0,
      "absoluteEnd": 0.3
    },
    {
      "text": "you",
      "start": 0.3,
      "duration": 0.3,
      "absoluteStart": 0.3,
      "absoluteEnd": 0.6
    },
    {
      "text": "believe",
      "start": 0.6,
      "duration": 0.4,
      "absoluteStart": 0.6,
      "absoluteEnd": 1.0
    },
    {
      "text": "a",
      "start": 1.0,
      "duration": 0.2,
      "absoluteStart": 1.0,
      "absoluteEnd": 1.2
    },
    {
      "text": "toy",
      "start": 1.2,
      "duration": 0.3,
      "absoluteStart": 1.2,
      "absoluteEnd": 1.5
    },
    {
      "text": "being",
      "start": 1.5,
      "duration": 0.3,
      "absoluteStart": 1.5,
      "absoluteEnd": 1.8
    },
    {
      "text": "sold",
      "start": 1.8,
      "duration": 0.3,
      "absoluteStart": 1.8,
      "absoluteEnd": 2.1
    },
    {
      "text": "for",
      "start": 2.1,
      "duration": 0.2,
      "absoluteStart": 2.1,
      "absoluteEnd": 2.3
    },
    {
      "text": "$135,000?",
      "start": 2.3,
      "duration": 2.7,
      "absoluteStart": 2.3,
      "absoluteEnd": 5.0
    }
  ]
}
```

### Composition Setup

```typescript
const composition = {
  children: [
    // Layer 1: Layout Preset - Creates structure
    {
      presetId: 'sub-kinetic-layout-vertical',
      params: {
        inputCaptions: captions,
        avgFontSize: 60,
        position: {
          align: 'center',
          verticalAlign: 'center',
        },
        fontChoices: [
          {
            primaryFont: 'Roboto:600',
            headerFont: 'BebasNeue',
          },
        ],
        colorChoices: [
          {
            primary: '#ffffff',
            accent: '#ff6b6b',
          },
        ],
        style: {
          textTransformSub: 'none',
          textTransformMain: 'uppercase',
        },
        fontScaling: {
          highlighted: 1.8, // Keyword will be 1.8x larger
          normal: 1.0, // Normal words at base size
        },
      },
    },

    // Layer 2: Animation Preset - Adds motion
    {
      presetId: 'sub-kinetic-anim-keyword-focus',
      params: {
        inputCaptions: captions,
        animationConfig: {
          normalAnimation: 'fade-in',
          keywordAnimation: 'explosive-scale',
          normalDuration: 0.4,
          keywordDuration: 0.8,
          intensity: 1.0,
        },
        colorChoices: [
          {
            accent: '#ff6b6b',
          },
        ],
      },
    },
  ],
};
```

## Result

### What You'll See:

1. **Layout (splitParts)**:

   ```
   Can you believe
   a toy being sold for
   $135,000?
   ```

   - Three vertical lines (parts)
   - Words within each part are horizontal

2. **Normal Words** ("Can", "you", "believe", etc.):
   - Fade in at their spoken time
   - Stay visible until sentence ends
   - Standard white color
   - Standard size (1.0x base)

3. **Keyword** ("$135,000"):
   - Explosive entrance animation
   - Scales from 0.5 → 1.3 → 1.0 with spring physics
   - Glowing red accent color effect
   - Larger size (1.8x base)
   - Uppercase transform

## Animation Options

### Normal Word Animations

Available in `animationConfig.normalAnimation`:

- `fade-in` - Simple fade in
- `fade-in-slide` - Fade in with upward slide
- `fade-in-scale` - Fade in with scale
- `fade-in-blur` - Fade in with blur clear

### Keyword Animations

Available in `animationConfig.keywordAnimation`:

- `explosive-scale` - Explosive scale with glow (recommended)
- `glow-pulse` - Continuous pulsing glow
- `shake-glow` - Shake effect with glow
- `bounce-glow` - Bounce from top with glow
- `rotate-glow` - Rotation with scale and glow

## Customization

### Change Position

```typescript
position: {
  align: 'left',        // 'left', 'center', 'right'
  verticalAlign: 'top', // 'top', 'center', 'bottom'
}
```

### Change Fonts

```typescript
fontChoices: [
  {
    primaryFont: 'Inter:600', // Normal words
    headerFont: 'Montserrat:900', // Keywords
  },
];
```

### Change Colors

```typescript
colorChoices: [
  {
    primary: '#e0e0e0', // Normal words
    accent: '#00ff88', // Keywords
  },
];
```

### Adjust Font Sizes

```typescript
avgFontSize: 70,
fontScaling: {
  highlighted: 2.0,  // Keywords 2x larger
  normal: 0.9,       // Normal words 0.9x base
}
```

### Adjust Animation Intensity

```typescript
animationConfig: {
  intensity: 1.5,  // Increase all animation effects by 1.5x
  normalDuration: 0.3,   // Faster normal animations
  keywordDuration: 1.2,  // Longer keyword animations
}
```

## Metadata Requirements

For the presets to work correctly, your captions need:

1. **`splitParts`** (optional but recommended):
   - Array of strings
   - Each string becomes a vertical line
   - Words distributed to match the split parts

2. **`keyword`** (optional):
   - String containing the keyword to highlight
   - Can be partial match (e.g., "135000" matches "$135,000")
   - Without this, no special keyword animation

### Example Without Metadata:

```json
{
  "text": "Hello world",
  "words": [...],
  "metadata": {}
}
```

Result:

- All words in single line
- All words treated as normal (no keyword effects)

### Example With Full Metadata:

```json
{
  "text": "Hello amazing world",
  "words": [...],
  "metadata": {
    "splitParts": ["Hello", "amazing world"],
    "keyword": "amazing"
  }
}
```

Result:

- "Hello" on line 1
- "amazing world" on line 2
- "amazing" gets keyword animation

## Testing Tips

1. **Start Simple**: Test with one caption first
2. **Check IDs**: Both presets must use same ID pattern for targeting
3. **Timing**: Make sure `absoluteStart` and `start` timings match
4. **Preview**: Use the preview feature to see the effect in real-time

## Common Issues

### Keywords Not Animating

- Check that `keyword` in metadata matches word text
- Check that both presets receive same `inputCaptions`
- Verify keyword animation is enabled with `intensity > 0`

### Layout Issues

- Verify `splitParts` matches actual word count
- Check that all words have proper timing data
- Ensure `position` settings are valid

### Animation Not Targeting

- Both presets must use identical caption data
- Word IDs are generated consistently in both presets
- Check that animation preset is added AFTER layout preset

## Next Steps

Once you've tested this simple example:

1. Try different animation combinations
2. Experiment with multiple keywords per caption
3. Create your own animation variations
4. Read the full [KINETIC_TYPOGRAPHY_PRESET_GUIDE.md](./KINETIC_TYPOGRAPHY_PRESET_GUIDE.md)



