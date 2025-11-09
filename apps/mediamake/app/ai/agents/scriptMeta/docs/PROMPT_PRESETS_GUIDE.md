# Image Prompt Presets Guide

This guide explains how to use the prompt preset system for text-to-image generation.

## Overview

The `textToImageAgent` now has **unified prompt management** built-in, supporting:
- **5 Built-in Presets**: Ready-to-use professional styles
- **Custom Prompts**: Define and save your own unique styles
- **View & Edit**: See the full system prompt of any preset and modify it
- **Dynamic Selection**: Choose different styles per generation

## Built-in Presets

### 1. Graphic Novel (Default)
- **ID**: `graphic-novel`
- **Style**: Hand-drawn illustration with heavy ink outlines
- **Colors**: Limited palette (indigo, burnt orange, muted tan)
- **Best for**: Explainer videos, storytelling, artistic content

### 2. Cinematic Realism
- **ID**: `cinematic-realism`
- **Style**: Photo-realistic with dramatic lighting
- **Colors**: Natural with cinematic color grading
- **Best for**: Professional presentations, realistic scenes

### 3. Minimalist Flat
- **ID**: `minimalist-flat`
- **Style**: Clean geometric shapes, flat design
- **Colors**: Bold, vibrant with high contrast
- **Best for**: Tech content, modern aesthetics, infographics

### 4. Watercolor Artistic
- **ID**: `watercolor-artistic`
- **Style**: Soft watercolor with organic textures
- **Colors**: Harmonious pastels with deeper accents
- **Best for**: Gentle content, lifestyle, wellness

### 5. Abstract Geometric
- **ID**: `abstract-geometric`
- **Style**: Bold geometric abstraction
- **Colors**: Vibrant with strong contrast
- **Best for**: Creative content, modern art, dynamic visuals

## Usage Examples

### Using a Preset

```typescript
// Generate images with cinematic style
await generateImagesForTranscription({
  transcriptionId: '...',
  promptPresetId: 'cinematic-realism',
  imageSize: 'landscape_16_9',
  imageResolution: '1K'
});
```

### Using Custom Prompt

```typescript
// Define your own style
const customPrompt = `
You are an AI specialized in creating retro 80s style image prompts.
Style: Neon colors, synthwave aesthetic, grid patterns, purple/pink/cyan palette.
Include the caption text in bold neon lettering.
`;

await generateImagesForTranscription({
  transcriptionId: '...',
  customPrompt: customPrompt,
  imageSize: 'landscape_16_9'
});
```

### Listing Available Presets

```typescript
// Using textToImageAgent - all in one place!

// Get all presets
const { presets } = await textToImageAgent['/prompts/list']();

// Filter by category
const { presets } = await textToImageAgent['/prompts/list']({
  category: 'illustration'
});

// Search presets
const { presets } = await textToImageAgent['/prompts/list']({
  search: 'watercolor'
});
```

### Getting Preset Details (View Full Prompt)

```typescript
// Get full details including the complete system prompt text
const { preset } = await textToImageAgent['/prompts/get/:id']({
  id: 'graphic-novel'
});

console.log(preset.name);           // "Graphic Novel"
console.log(preset.description);    // Description
console.log(preset.systemPrompt);   // FULL prompt text - view & edit this!
```

### Saving Custom Prompts

```typescript
// After getting and editing a prompt, save it
await textToImageAgent['/prompts/save']({
  id: 'my-custom-style',
  name: 'My Awesome Style',
  description: 'Custom modification of graphic novel style',
  systemPrompt: '...your edited prompt here...',
  category: 'illustration',
  tags: ['custom', 'modified']
});
```

### Deleting Custom Prompts

```typescript
// Delete your custom prompts
await textToImageAgent['/prompts/delete/:id']({
  id: 'my-custom-style'
});
```

## API Parameters

### textToImageAgent Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `transcriptionId` | string | required | ID of transcription to process |
| `userRequest` | string | optional | Additional user instructions |
| `imageSize` | enum | `landscape_16_9` | Image dimensions |
| `imageResolution` | enum | `1K` | Image quality |
| `promptPresetId` | enum | `graphic-novel` | Which preset to use |
| `customPrompt` | string | optional | Custom system prompt (overrides preset) |

### Image Size Options
- `square`, `square_hd`
- `portrait_4_3`, `portrait_3_2`, `portrait_16_9`
- `landscape_4_3`, `landscape_3_2`, `landscape_16_9`, `landscape_21_9`

### Image Resolution Options
- `1K` - Fast, good quality
- `2K` - Balanced
- `4K` - Highest quality, slower

## Adding New Presets

To add a new preset to the registry:

1. Open `imagePromptRegistry.ts`
2. Add to `PROMPT_PRESETS` object:

```typescript
'your-preset-id': {
  id: 'your-preset-id',
  name: 'Your Preset Name',
  description: 'Brief description of the style',
  category: 'illustration', // or other category
  tags: ['keyword1', 'keyword2'],
  systemPrompt: dedent`
    Your detailed system prompt here...
    Include style guidelines, color palette, examples, etc.
  `,
}
```

3. Update the enum in `textToImageAgent.ts` tool schema to include your new preset ID

## Best Practices

1. **Preset Selection**: Choose based on content type and audience
2. **Consistency**: Use same preset across a video series for cohesive look
3. **Custom Prompts**: Test thoroughly before production use
4. **Resolution**: Use 1K for testing, 2K/4K for final production
5. **User Requests**: Combine presets with `userRequest` for fine-tuning

## Metadata Storage

Each generated image stores:
- `imagePrompt`: The AI-generated prompt
- `promptPresetId`: Which preset was used (if any)
- `taskId`: Task tracking ID
- `imageUrl`: Final image URL
- `status`: Generation status
- Other technical metadata

This allows tracking which style was used for each image.

## Examples

### Educational Content
```typescript
promptPresetId: 'graphic-novel'  // Clear, engaging
```

### Corporate Presentation
```typescript
promptPresetId: 'cinematic-realism'  // Professional
```

### Tech Startup
```typescript
promptPresetId: 'minimalist-flat'  // Modern, clean
```

### Lifestyle Brand
```typescript
promptPresetId: 'watercolor-artistic'  // Warm, approachable
```

### Creative Agency
```typescript
promptPresetId: 'abstract-geometric'  // Bold, artistic
```

## Troubleshooting

**Issue**: Preset not found error
- Check preset ID spelling
- Use `listImagePromptPresets()` to see available IDs

**Issue**: Custom prompt not working as expected
- Ensure prompt includes clear style guidelines
- Add examples in the prompt for better results
- Test with single captions first

**Issue**: Images don't match expected style
- Check `promptPresetId` is correct
- Review preset's `systemPrompt` to understand what it generates
- Consider using `userRequest` to add specific instructions

