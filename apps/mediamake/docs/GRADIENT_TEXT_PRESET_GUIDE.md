# Kinetic Gradient Flow Subtitles Preset

A stunning subtitle preset that combines gradient text effects with kinetic animations for visually captivating video subtitles.

## Overview

The **Kinetic Gradient Flow** preset leverages the new TextAtom gradient feature to create beautiful animated subtitles with gradient color effects. This preset is perfect for music videos, promotional content, social media videos, and any content that needs eye-catching text animations.

## Features

- **8 Unique Animation Styles**: Each with distinct visual characteristics
- **Gradient Text Effects**: Beautiful color gradients applied to text using CSS gradients
- **Smart Word Highlighting**: Automatically highlights important words with different gradient styles
- **Customizable Gradients**: 5 pre-built gradient schemes or bring your own
- **Flexible Layouts**: Horizontal or vertical text arrangements
- **Font Scaling**: Highlighted words automatically scaled larger
- **Position Control**: Left, center, right, circle, random, or fixed positioning
- **Impact Control**: Global animation intensity multiplier

## Animation Styles

### 1. Gradient Wave Float
- Smooth wave-like floating motion
- Gradient colors flow through text
- Perfect for: Melodic content, smooth transitions

### 2. Gradient Pulse Glow
- Pulsing scale animation with glow effects
- Breathing effect synchronized with word timing
- Perfect for: Rhythmic content, beats

### 3. Gradient Shimmer Slide
- Words slide in sequentially from left
- Shimmer effect as they appear
- Perfect for: Horizontal layouts, reveals

### 4. Gradient Rainbow Flow
- Multiple effects combined for rainbow-like flow
- Wave float + pulse + glow
- Perfect for: Colorful, energetic content

### 5. Gradient Neon Burst
- Explosive entrance with intense glow
- Neon-style effects
- Perfect for: High-energy content, EDM

### 6. Gradient Metallic Shine
- Metallic shine effect with brightness variation
- Smooth scale entrance
- Perfect for: Luxury content, premium feel

### 7. Gradient Aurora Drift
- Aurora borealis-style drifting motion
- Gentle movement in multiple directions
- Perfect for: Ambient content, nature themes

### 8. Gradient Fire Flicker
- Flickering effect simulating fire
- Random intensity variations
- Perfect for: Dynamic content, dramatic themes

## Pre-built Gradient Schemes

### 1. Purple Dream
- **Normal**: Purple to violet gradient (#667eea → #764ba2)
- **Highlight**: Pink to coral gradient (#f093fb → #f5576c)
- **Use**: Elegant, modern

### 2. Ocean Breeze
- **Normal**: Blue to cyan gradient (#4facfe → #00f2fe)
- **Highlight**: Green to turquoise gradient (#43e97b → #38f9d7)
- **Use**: Fresh, cool

### 3. Sunset Fusion
- **Normal**: Pink to yellow gradient (#fa709a → #fee140)
- **Highlight**: Cyan to deep purple gradient (#30cfd0 → #330867)
- **Use**: Warm, vibrant

### 4. Soft Pastel
- **Normal**: Mint to pink gradient (#a8edea → #fed6e3)
- **Highlight**: Rose to lavender gradient (#ff9a9e → #fecfef)
- **Use**: Soft, gentle

### 5. Peachy Coral
- **Normal**: Cream to peach gradient (#ffecd2 → #fcb69f)
- **Highlight**: Coral to sky blue gradient (#ff6e7f → #bfe9ff)
- **Use**: Warm, inviting

## Usage Example

```typescript
{
  subtitleSync: {
    animationStyle: 'gradient-wave-float',
    layout: 'horizontal',
    negativeOffset: 0.15,
    maxLines: 5,
    floatThreshold: 15,
    disableMetadata: false,
    noGaps: {
      enabled: false,
      maxLength: 3,
    },
    fontScaling: {
      highlighted: 1.5,  // Highlighted words are 1.5x larger
      normal: 0.9,       // Normal words are 0.9x size
    },
    impact: 1.0,  // Animation intensity multiplier
  },
  position: {
    align: 'center',
    randomize: false,
    textAlign: 'center',
  },
  gradientChoices: [
    {
      normalGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      highlightGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      accentColor: '#f5576c',
    },
  ],
  style: {
    textTransformSub: 'uppercase',
    textTransformMain: 'uppercase',
  },
  avgFontSize: 60,
  inputCaptions: [...], // Your caption data
}
```

## Custom Gradients

You can create custom gradients using standard CSS gradient syntax:

```typescript
gradientChoices: [
  {
    normalGradient: 'linear-gradient(45deg, #your-color-1 0%, #your-color-2 100%)',
    highlightGradient: 'linear-gradient(90deg, #your-color-3 0%, #your-color-4 100%)',
    accentColor: '#your-accent-color',
  },
]
```

### Gradient Tips

1. **Angle**: Use different angles (0deg, 45deg, 90deg, 135deg, 180deg) for variety
2. **Color Stops**: Add multiple color stops for complex gradients
   - Example: `linear-gradient(135deg, #color1 0%, #color2 50%, #color3 100%)`
3. **Contrast**: Ensure good contrast between gradient colors for readability
4. **Accent Color**: Should match or complement your highlight gradient

## Parameters Reference

### subtitleSync
- `animationStyle`: Animation style to use (see Animation Styles above)
- `layout`: 'horizontal' | 'vertical' - How parts are arranged
- `negativeOffset`: Timing offset in seconds (default: 0.15)
- `maxLines`: Maximum lines to split text into (default: 5)
- `floatThreshold`: Float animation displacement amount
- `disableMetadata`: Ignore metadata for highlighting
- `noGaps.enabled`: Extend captions to reduce gaps
- `noGaps.maxLength`: Maximum gap extension in seconds
- `fontScaling.highlighted`: Font size multiplier for highlights
- `fontScaling.normal`: Font size multiplier for normal words
- `impact`: Global animation intensity (0.1-2.0)

### position
- `align`: 'left' | 'center' | 'right' | 'circle' | 'random' | 'fixed'
- `textAlign`: 'left' | 'center' | 'right'
- `top`, `left`, `right`, `bottom`: Used with align='fixed'
- `radius`: Radius for circle positioning
- `randomize`: Boolean to randomize position

### style
- `textTransformSub`: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
- `textTransformMain`: 'none' | 'uppercase' | 'lowercase' | 'capitalize'

### Other
- `avgFontSize`: Base font size (default: 60)
- `fontChoices`: Array of font pairs (primary and header fonts)
- `gradientChoices`: Array of gradient color schemes

## Best Practices

1. **Choose the right animation style** for your content type:
   - Music videos: gradient-pulse-glow, gradient-rainbow-flow
   - Podcasts: gradient-wave-float, gradient-aurora-drift
   - High-energy: gradient-neon-burst, gradient-fire-flicker
   - Elegant: gradient-metallic-shine, gradient-shimmer-slide

2. **Adjust impact** based on content pace:
   - Slow content: 0.5-0.8
   - Normal content: 0.8-1.2
   - Fast content: 1.2-2.0

3. **Font size considerations**:
   - Start with avgFontSize: 60 for 1080p videos
   - Adjust fontScaling for emphasis balance
   - Highlighted words should be 1.3-1.8x normal size

4. **Gradient contrast**:
   - Use high-contrast gradients for better readability
   - Test on different background types (dark, light, colorful)
   - Consider accessibility guidelines

5. **Position alignment**:
   - Center: Most versatile, works with most content
   - Left/Right: Good for horizontal layouts
   - Circle/Random: Best for creative, dynamic content

## Technical Details

### TextAtom Gradient Feature

The preset uses the TextAtom gradient feature which applies gradients using:
```css
background-image: [gradient];
background-clip: text;
-webkit-background-clip: text;
color: transparent;
```

This ensures the gradient is clipped to the text shape, creating stunning visual effects.

### Font Loading

Fonts are dynamically loaded using the `useFont` hook with:
- Support for Google Fonts
- Multiple font weights
- Font preloading for performance
- Graceful fallbacks

### Effect System

The preset uses the provider-mode effect system to:
- Apply effects to words independently
- Coordinate timing across multiple elements
- Combine multiple animation properties
- Create smooth, performant animations

## Troubleshooting

### Gradients not showing
- Ensure gradient strings are valid CSS
- Check that TextAtom component has gradient support
- Verify font loading is complete

### Animation too fast/slow
- Adjust `impact` parameter
- Check word duration values in captions
- Modify individual effect durations if needed

### Poor contrast/readability
- Choose higher-contrast gradients
- Increase font size
- Add stronger glow effects via accentColor
- Adjust background for better separation

## Related Presets

- **sub-vertical-float**: Original kinetic subtitle preset (no gradients)
- **sub-kinetic-motion**: Advanced kinetic animations
- **advanced-subtitles-anims**: Traditional subtitle animations

## Examples

See the `examples/` directory for sample compositions using this preset with various configurations and animation styles.



