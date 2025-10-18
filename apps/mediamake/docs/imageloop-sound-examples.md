# Image Loop with Sound Effects Preset

A powerful preset that combines image slideshows with transition sound effects, perfect for creating dynamic photo montages and Ken Burns-style videos with audio.

## Features

- ✅ **Multiple Images**: Loop through any number of images
- ✅ **Visual Effects**: Pan, zoom, shake, and generic effects
- ✅ **Transition Sounds**: Play sound effects between image transitions
- ✅ **Flexible Sound Selection**: Sequential, random, or single sound mode
- ✅ **Timing Control**: Precise control over when sounds play
- ✅ **Image Filters**: Apply CSS filters (blur, vintage, dramatic, etc.)

## Basic Example

```typescript
{
  trackName: 'my-slideshow',
  images: [
    {
      src: 'https://example.com/photo1.jpg',
      duration: 3,
      fit: 'cover'
    },
    {
      src: 'https://example.com/photo2.jpg',
      duration: 3,
      fit: 'cover'
    },
    {
      src: 'https://example.com/photo3.jpg',
      duration: 3,
      fit: 'cover'
    }
  ],
  effects: [
    {
      type: 'zoom',
      zoom: {
        direction: 'in',
        depth: 1.3,
        loopTimes: 1
      }
    }
  ],
  transitionSounds: {
    enabled: true,
    sounds: [
      'https://cdn.pixabay.com/download/audio/2022/03/10/audio_d1718ab41b.mp3?filename=whoosh-6316.mp3'
    ],
    volume: 0.7,
    timing: 'end',
    offset: -0.2,
    duration: 0.5,
    selectionMode: 'single'
  }
}
```

## Advanced Examples

### 1. Multiple Sounds with Sequential Selection

Different sound for each transition:

```typescript
{
  trackName: 'multi-sound-slideshow',
  images: [
    { src: 'photo1.jpg', duration: 4 },
    { src: 'photo2.jpg', duration: 4 },
    { src: 'photo3.jpg', duration: 4 },
    { src: 'photo4.jpg', duration: 4 }
  ],
  effects: [
    {
      type: 'pan',
      pan: { direction: 'up', distance: 200, loopTimes: 1 }
    }
  ],
  transitionSounds: {
    enabled: true,
    sounds: [
      'swoosh1.mp3',
      'whoosh2.mp3',
      'pop3.mp3'
    ],
    volume: 0.8,
    timing: 'end',
    offset: -0.3,
    duration: 0.6,
    selectionMode: 'sequential'  // Cycles through sounds
  }
}
```

### 2. Random Sound Selection

Pick a random sound for each transition:

```typescript
{
  transitionSounds: {
    enabled: true,
    sounds: [
      'impact1.mp3',
      'impact2.mp3',
      'impact3.mp3',
      'impact4.mp3'
    ],
    volume: 0.9,
    timing: 'overlap',  // Sound spans the transition
    selectionMode: 'random'
  }
}
```

### 3. With Image Filters

Apply visual filters to images:

```typescript
{
  images: [
    {
      src: 'photo1.jpg',
      duration: 5,
      filter: 'vintage',      // Sepia-toned vintage look
      opacity: 0.95
    },
    {
      src: 'photo2.jpg',
      duration: 5,
      filter: 'dramatic',     // High contrast dramatic
      opacity: 1
    },
    {
      src: 'photo3.jpg',
      duration: 5,
      filter: 'soft',         // Soft dreamy look
      opacity: 0.9
    }
  ],
  transitionSounds: {
    enabled: true,
    sounds: ['gentle-swoosh.mp3'],
    volume: 0.6,
    timing: 'end',
    offset: -0.15
  }
}
```

### 4. Complex Effects with Sound

Combine multiple effects:

```typescript
{
  images: [
    { src: 'photo1.jpg', duration: 6 },
    { src: 'photo2.jpg', duration: 6 },
    { src: 'photo3.jpg', duration: 6 }
  ],
  effects: [
    {
      type: 'zoom',
      zoom: { direction: 'in', depth: 1.5, loopTimes: 1 }
    },
    {
      type: 'shake',
      duration: 1,
      start: 5,  // Shake for 1 second at the 5th second
      shake: { amplitude: 5, frequency: 0.2, axis: 'both' }
    }
  ],
  transitionSounds: {
    enabled: true,
    sounds: ['dramatic-impact.mp3'],
    volume: 0.85,
    timing: 'start',  // Play at the start of each new image
    offset: 0,
    duration: 0.8
  }
}
```

### 5. Blend Modes and Opacity

Create layered visual effects:

```typescript
{
  images: [
    {
      src: 'photo1.jpg',
      duration: 4,
      blendMode: 'overlay',
      opacity: 0.8,
      filter: 'contrast'
    },
    {
      src: 'photo2.jpg',
      duration: 4,
      blendMode: 'screen',
      opacity: 0.9,
      filter: 'brightness'
    }
  ],
  transitionSounds: {
    enabled: true,
    sounds: ['subtle-whoosh.mp3'],
    volume: 0.5,
    timing: 'overlap',
    duration: 1.0  // Longer sound for smoother transition
  }
}
```

## Sound Timing Options

### `timing: 'start'`

Sound plays at the start of the new image (after transition):

```
Image 1 -----> [SOUND + Image 2] -----> [SOUND + Image 3]
```

### `timing: 'end'` (Default)

Sound plays before the current image ends (before transition):

```
Image 1 ---[SOUND]-> Image 2 ---[SOUND]-> Image 3
```

### `timing: 'overlap'`

Sound is centered on the transition point:

```
Image 1 --[SO]UND-> Image 2 --[SO]UND-> Image 3
```

## Offset Parameter

Fine-tune when the sound plays:

- **Negative offset**: Play sound earlier (before the calculated time)

  ```typescript
  offset: -0.3; // Play 0.3 seconds before transition
  ```

- **Zero offset**: Play exactly at calculated time

  ```typescript
  offset: 0;
  ```

- **Positive offset**: Play sound later (after the calculated time)
  ```typescript
  offset: 0.2; // Play 0.2 seconds after transition
  ```

## Available Filters

- `none` - No filter
- `blur` - Blur effect
- `brightness` - Increase brightness
- `contrast` - Increase contrast
- `saturate` - Boost saturation
- `grayscale` - Black and white
- `sepia` - Sepia tone
- `hue-rotate` - Rotate hues
- `invert` - Invert colors
- `distorted` - Distorted colors effect
- `vintage` - Vintage film look
- `dramatic` - High contrast dramatic
- `soft` - Soft dreamy look
- `sharp` - Sharp and crisp

## Available Blend Modes

All CSS blend modes are supported:

- `normal`, `multiply`, `screen`, `overlay`
- `darken`, `lighten`, `color-dodge`, `color-burn`
- `hard-light`, `soft-light`, `difference`, `exclusion`
- `hue`, `saturation`, `color`, `luminosity`

## Track Configuration

### Basic Track

```typescript
{
  trackName: 'my-track',
  trackStartOffset: 0  // Start immediately
}
```

### Fitted Track

```typescript
{
  trackName: 'my-track',
  trackFitDurationTo: 'audio-track-id',  // Sync with another track
  trackStartOffset: 2  // Start 2 seconds in
}
```

## Free Sound Resources

Here are some great sources for free transition sound effects:

- **Pixabay**: https://pixabay.com/sound-effects/search/whoosh/
- **Freesound**: https://freesound.org/search/?q=swoosh
- **Zapsplat**: https://www.zapsplat.com/sound-effect-category/whooshes/
- **BBC Sound Effects**: https://sound-effects.bbcrewind.co.uk/

## Tips for Best Results

1. **Sound Duration**: Keep transition sounds short (0.3-0.8 seconds) for best effect
2. **Volume**: Start with lower volumes (0.6-0.8) and adjust up
3. **Timing**: Use `offset: -0.2` with `timing: 'end'` for smooth transitions
4. **Image Duration**: 3-5 seconds per image works well for most content
5. **Effects**: Match effect intensity to image duration (longer images = more subtle effects)
6. **Sound Selection**: Use consistent sound styles throughout for professional results

## Troubleshooting

### Sound Not Playing

- Verify the sound URL is accessible
- Check that `enabled: true` in transitionSounds
- Ensure sound duration isn't longer than transition timing allows

### Sound Playing at Wrong Time

- Adjust the `offset` parameter
- Try different `timing` modes
- Check image durations are correct

### Sound Too Loud/Quiet

- Adjust `volume` parameter (0-1 range)
- Consider sound file normalization before uploading
- Different timing modes affect perceived loudness

## Performance Considerations

- Keep sound files small (< 100KB for short effects)
- Use MP3 or OGG format for best browser compatibility
- Limit to 1-2 sound effects per transition for clean audio mixing
- For many images, consider using `selectionMode: 'single'` or `'sequential'` with 2-3 sounds
