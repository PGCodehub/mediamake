# Image Effects Preset Example

This preset allows you to apply pan, zoom, and generic effects to single or multiple images.

## Features

- **Multiple Image Support**: Add any number of images
- **Multiple Effects**: Apply pan, zoom, and generic effects
- **Track Support**: Configure track name and duration fitting

## Usage Examples

### Single Image with Pan Effect

```json
{
  "trackName": "image-track",
  "images": [
    {
      "src": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
      "duration": 5,
      "fit": "cover"
    }
  ],
  "effects": [
    {
      "type": "pan",
      "panDirection": "up",
      "panDistance": 200,
      "loopTimes": 1
    }
  ]
}
```

### Multiple Images with Pan and Zoom Effects

```json
{
  "trackName": "multi-image-track",
  "images": [
    {
      "src": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
      "duration": 5
    },
    {
      "src": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
      "duration": 5
    }
  ],
  "effects": [
    {
      "type": "pan",
      "panDirection": "up",
      "panDistance": 200,
      "loopTimes": 2
    },
    {
      "type": "zoom",
      "zoomDirection": "in",
      "zoomDepth": 1.3,
      "loopTimes": 1
    }
  ]
}
```

### Multiple Images with Generic Effects

```json
{
  "trackName": "generic-effects-track",
  "trackFitDurationTo": "BaseScene",
  "images": [
    {
      "src": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      "duration": 3
    },
    {
      "src": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
      "duration": 3
    }
  ],
  "effects": [
    {
      "type": "generic",
      "animationRanges": [
        { "key": "opacity", "val": 0, "prog": 0 },
        { "key": "opacity", "val": 1, "prog": 1 },
        { "key": "transform", "val": "scale(0.8)", "prog": 0 },
        { "key": "transform", "val": "scale(1)", "prog": 1 }
      ],
      "duration": 2
    }
  ]
}
```

## Parameters

### Track Configuration

- `trackName` (string): Name of the track (used for the ID)
- `trackFitDurationTo` (string, optional): Fit duration to the track (only for aligned/random tracks)

### Images

- `src` (string): Image source URL
- `duration` (number, optional): Duration in seconds (default: 5)
- `fit` (string, optional): How the image should fit - 'cover', 'contain', 'fill', 'none', 'scale-down' (default: 'cover')

### Effects

#### Pan Effect

- `type`: "pan"
- `panDirection` (string, optional): 'up', 'down', 'left', 'right' (default: 'up')
- `panDistance` (number, optional): Pan distance in pixels (default: 200)
- `loopTimes` (number, optional): Number of times to loop (default: 1)

#### Zoom Effect

- `type`: "zoom"
- `zoomDirection` (string, optional): 'in', 'out' (default: 'in')
- `zoomDepth` (number, optional): Zoom depth multiplier (default: 1.2)
- `loopTimes` (number, optional): Number of times to loop (default: 1)

#### Generic Effect

- `type`: "generic"
- `animationRanges` (array, optional): Array of animation keyframes
- `duration` (number, optional): Effect duration in seconds (default: 2)

## Effect Combinations

You can combine multiple effects on the same image. Effects are applied in the order they are specified:

```json
{
  "trackName": "combined-effects-track",
  "effects": [
    {
      "type": "pan",
      "panDirection": "right",
      "panDistance": 300,
      "loopTimes": 1
    },
    {
      "type": "zoom",
      "zoomDirection": "in",
      "zoomDepth": 1.1,
      "loopTimes": 1
    }
  ]
}
```

This will apply pan, then zoom effects to each image.
