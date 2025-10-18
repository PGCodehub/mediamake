# Custom Theme Background Preset - Usage Guide

## Overview

The **Custom Theme Background Preset** is a flexible background layer for your video compositions. It serves as the foundation on which you can layer other presets (text overlays, waveforms, etc.). This preset is designed to work as a `children` type preset, meaning it should be used in combination with a base scene.

## Important Setup

### Base Scene Configuration

Always start with a `base-scene` preset:

```json
{
  "presetId": "base-scene",
  "presetType": "full",
  "presetInputData": {
    "backgroundColor": "black",
    "duration": 20,
    "fitDurationTo": "BaseScene"
  }
}
```

### Theme Background Configuration

Then add this preset as a child:

```json
{
  "presetId": "custom-theme-background",
  "presetType": "children",
  "presetInputData": {
    "paletteMode": "predefined",
    "backgroundType": "linear-gradient",
    "durationMode": "fixed",
    "fixedDuration": 20
  }
}
```

### Layering with Other Presets

Additional presets (like text overlays) should be added after this preset in the children array. They will automatically stack on top of the background due to the preset's z-index management.

## Features

### 🎨 Color Palettes

**Predefined Palettes:**

- **Sunset** - Warm orange and yellow tones
- **Ocean** - Cool blue tones
- **Neon** - Vibrant pink, orange, yellow, purple
- **Forest** - Green nature tones
- **Monochrome** - Grayscale palette
- **Pastel** - Soft, light colors
- **Fire** - Red, orange, gold
- **Purple** - Various purple shades
- **Tropical** - Cyan, pink, gold, mint
- **Autumn** - Brown and tan earth tones

**Custom Colors:**

- Input 1-5 custom hex colors manually
- Example: `#FF6B6B`, `#FFE66D`, `#8338EC`

### 🎭 Background Types

1. **Solid** - Single color from palette
2. **Linear Gradient** - Color gradient in specified direction
3. **Radial Gradient** - Circular gradient from center
4. **Pattern** - Repeating patterns with gradients
   - Dots
   - Stripes (diagonal)
   - Grid
   - Checkerboard
5. **Image Overlay** - Image with color gradient overlay
6. **Video Overlay** - Video with color gradient overlay

### 📐 Gradient Directions (for Linear Gradients)

- `to-right`, `to-left`
- `to-top`, `to-bottom`
- `to-top-right`, `to-top-left`
- `to-bottom-right`, `to-bottom-left`

### 🎬 Animations

- **None** - Static background
- **Gradient Shift** - Colors cycle through hue rotation
- **Gradient Rotate** - Background rotates 360°
- **Parallax** - Subtle up/down motion
- **Slow Pan** - Horizontal panning motion

All animations are smooth and loop seamlessly.

### ⏱️ Duration Modes

- **Fixed** - Set a specific duration (e.g., 20 seconds)
- **Match Component** - Automatically match another component's duration (e.g., match audio track)

### 📱 Aspect Ratios

Common presets:

- `16:9` - Standard widescreen (1920x1080)
- `9:16` - Vertical/mobile (1080x1920)
- `1:1` - Square (1080x1080)
- `4:3` - Classic (1440x1080)

## Usage Examples

### Example 1: Simple Gradient Background

```json
{
  "paletteMode": "predefined",
  "predefinedPalette": "ocean",
  "backgroundType": "linear-gradient",
  "gradientDirection": "to-bottom",
  "animationType": "none",
  "durationMode": "fixed",
  "fixedDuration": 20
}
```

### Example 2: Animated Neon Pattern

```json
{
  "paletteMode": "predefined",
  "predefinedPalette": "neon",
  "backgroundType": "pattern",
  "patternType": "dots",
  "patternDensity": 7,
  "animationType": "gradient-shift",
  "animationSpeed": 15,
  "durationMode": "fixed",
  "fixedDuration": 30
}
```

### Example 3: Video with Color Overlay

```json
{
  "paletteMode": "custom",
  "customColors": ["#FF006E", "#8338EC"],
  "backgroundType": "video-overlay",
  "mediaUrl": "https://example.com/background-video.mp4",
  "mediaOpacity": 0.4,
  "animationType": "none",
  "durationMode": "match-component",
  "matchComponentId": "AudioTrack"
}
```

### Example 4: Custom Colors with Rotation

```json
{
  "paletteMode": "custom",
  "customColors": ["#FF1493", "#00CED1", "#FFD700"],
  "backgroundType": "radial-gradient",
  "animationType": "gradient-rotate",
  "animationSpeed": 20,
  "durationMode": "fixed",
  "fixedDuration": 25
}
```

## Tips & Best Practices

1. **Preset Order**: This preset must be added as a child to a base-scene preset
2. **Z-Index Management**:
   - Background automatically uses `zIndex: 0`
   - Text overlays and other content will automatically appear on top
   - No need to manually set z-index for child presets
3. **Match Durations**: Use "match-component" mode to sync with audio tracks
4. **Pattern Density**: Start with 5, increase for denser patterns (max 10)
5. **Media Overlays**: Use opacity 0.3-0.6 for best visibility of overlaid content
6. **Animations**: Keep animation speed between 10-20 seconds for smooth effects
7. **Custom Colors**:
   - Colors are evenly distributed across gradients
   - For two-color gradients, use exactly two colors in customColors
   - For more complex gradients, add up to 5 colors for smooth transitions
8. **Aspect Ratio**: Choose based on target platform:
   - YouTube/Desktop: 16:9
   - Instagram/TikTok: 9:16
   - Instagram Post: 1:1

## Combining with Other Presets

This preset works great with:

- **Text Overlay** - Add titles, captions, or credits
- **Waveform** - Audio visualizations
- **Media Track** - Additional video/image layers
- **Subtitles** - Synchronized captions

### Example Workflow

1. Apply **Custom Theme Background** (gradient + animation)
2. Add **Media Track** preset (audio)
3. Add **Waveform** preset (audio visualization)
4. Add **Text Overlay** preset (title)
5. Add **Subtitles** preset (captions)

Result: Professional music video with animated background!

## Advanced Features

### Pattern Background Size Calculation

Pattern density inversely affects size:

- Density 1 → ~18.5px pattern size (sparse)
- Density 5 → ~12.5px pattern size (medium)
- Density 10 → ~5px pattern size (dense)

### Animation Loop Behavior

All animations automatically loop for the entire duration:

- **Gradient Shift**: Complete 360° hue rotation
- **Gradient Rotate**: Full 360° rotation
- **Parallax**: Smooth up-down-up motion
- **Slow Pan**: Left-to-right pan

### Media Overlay Layers

When using image/video overlays:

1. Base media layer (full size, object-cover)
2. Color gradient overlay (with opacity control)
3. Result: Blended effect

## Troubleshooting

**Issue**: Background not visible or black screen

- **Solution**: Ensure you've added this preset as a child to a base-scene preset
- **Solution**: Check that backgroundType and colors are properly set

**Issue**: Text or other elements not visible on top of background

- **Solution**: Make sure other presets are added after this preset in the children array
- **Solution**: The background automatically uses `zIndex: 0`, so other elements will stack on top

**Issue**: Colors don't show correctly in gradient

- **Solution**: Ensure hex colors start with `#` (e.g., `#FF0000`)
- **Solution**: For gradients, provide at least two colors
- **Solution**: Colors are evenly spaced; add intermediate colors for complex gradients

**Issue**: Pattern doesn't appear

- **Solution**: Try increasing pattern density or changing pattern type
- **Solution**: Ensure pattern colors have sufficient contrast

**Issue**: Video/Image overlay not working

- **Solution**: Verify mediaUrl is accessible and valid format
- **Solution**: Check that backgroundType is set to 'image-overlay' or 'video-overlay'
- **Solution**: Adjust mediaOpacity if overlay is too transparent/opaque

**Issue**: Animation too fast/slow

- **Solution**: Adjust animationSpeed (higher = slower, lower = faster)
- **Solution**: Ensure animationType is not set to 'none'

**Issue**: Background doesn't match audio duration

- **Solution**: Set durationMode to "match-component" and provide correct matchComponentId
- **Solution**: Verify the matchComponentId exists in your composition

## Component IDs Reference

Default IDs generated:

- Background container: `theme-background-[random]`
- Media element: `media-element-[random]`
- Overlay layer: `overlay-layer-[random]`

For duration matching, use the ID of your audio/video component (e.g., "AudioTrack", "BaseScene").

---

**Preset ID**: `custom-theme-background`
**Preset Type**: `full` (replaces entire composition)
**Tags**: background, theme, gradient, pattern, animation
