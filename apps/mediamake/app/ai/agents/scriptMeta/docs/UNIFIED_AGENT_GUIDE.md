# Unified textToImageAgent - Complete Guide

## Overview

The `textToImageAgent` is now a **unified, all-in-one agent** that handles:
1. ✅ **Image Generation** - Generate images from captions
2. ✅ **Prompt Discovery** - Browse available styles
3. ✅ **Prompt Viewing** - See full system prompt text
4. ✅ **Prompt Editing** - Create and modify custom prompts
5. ✅ **Prompt Storage** - Save your custom styles

**Everything in one place!** No need to switch between agents.

---

## Quick Start

### 1️⃣ Browse Available Styles

```typescript
// See all available prompt presets
const { presets, builtInCount, customCount } = await textToImageAgent['/prompts/list']();

console.log(`Found ${builtInCount} built-in + ${customCount} custom presets`);

presets.forEach(preset => {
  console.log(`${preset.id}: ${preset.name}`);
  console.log(`   ${preset.description}`);
});
```

### 2️⃣ View a Specific Prompt (Full Details)

```typescript
// Get the FULL system prompt for editing
const { preset } = await textToImageAgent['/prompts/get/:id']({ 
  id: 'graphic-novel' 
});

console.log('Name:', preset.name);
console.log('Description:', preset.description);
console.log('Full System Prompt:');
console.log(preset.systemPrompt); // <-- The complete prompt text!
```

### 3️⃣ Generate Images with a Preset

```typescript
// Use the preset you just viewed
await textToImageAgent['/']({
  transcriptionId: 'abc123',
  promptPresetId: 'graphic-novel',
  imageSize: 'landscape_16_9',
  imageResolution: '2K'
});
```

### 4️⃣ Edit and Save a Custom Prompt

```typescript
// Step 1: Get the original
const { preset } = await textToImageAgent['/prompts/get/:id']({ 
  id: 'graphic-novel' 
});

// Step 2: Edit the systemPrompt
let customPrompt = preset.systemPrompt;
customPrompt = customPrompt.replace('Dark Indigo', 'Deep Purple'); // Example edit

// Step 3: Save as new custom preset
await textToImageAgent['/prompts/save']({
  id: 'my-purple-novel',
  name: 'Purple Graphic Novel',
  description: 'Like graphic novel but with purple instead of indigo',
  systemPrompt: customPrompt,
  category: 'illustration',
  tags: ['custom', 'purple', 'graphic-novel']
});

// Step 4: Use your custom preset
await textToImageAgent['/']({
  transcriptionId: 'abc123',
  promptPresetId: 'my-purple-novel', // Your new custom style!
  imageSize: 'landscape_16_9'
});
```

### 5️⃣ Override a Built-in Preset

```typescript
// Save with the SAME ID to override
await textToImageAgent['/prompts/save']({
  id: 'graphic-novel', // Same ID as built-in
  name: 'My Custom Graphic Novel',
  systemPrompt: '...your modified version...',
  isBuiltInOverride: true, // <-- Important!
  category: 'illustration'
});

// Now when you use 'graphic-novel', it uses YOUR version
await textToImageAgent['/']({
  transcriptionId: 'abc123',
  promptPresetId: 'graphic-novel', // Uses your override now
});

// To restore original: delete your override
await textToImageAgent['/prompts/delete/:id']({ id: 'graphic-novel' });
```

### 6️⃣ Delete Custom Prompts

```typescript
// Delete your custom prompts (cannot delete built-in ones)
await textToImageAgent['/prompts/delete/:id']({ 
  id: 'my-purple-novel' 
});
```

---

## Complete Route Reference

| Route | Purpose | Returns |
|-------|---------|---------|
| `/` | **Generate images** from captions | Image generation results |
| `/prompts/list` | **List all presets** (built-in + custom) | Array of presets with full details |
| `/prompts/get/:id` | **Get specific preset** including full systemPrompt | Single preset object |
| `/prompts/save` | **Save/update** a custom preset | Success message + saved preset |
| `/prompts/delete/:id` | **Delete** a custom preset | Success message |

---

## Built-in Presets

| ID | Name | Style |
|----|------|-------|
| `graphic-novel` | Graphic Novel | Hand-drawn, limited palette (indigo, orange, tan) |
| `cinematic-realism` | Cinematic Realism | Photo-realistic with dramatic lighting |
| `minimalist-flat` | Minimalist Flat | Clean geometric shapes, bold colors |
| `watercolor-artistic` | Watercolor Artistic | Soft painted style with color bleeding |
| `abstract-geometric` | Abstract Geometric | Bold shapes and vibrant colors |

---

## Common Workflows

### Workflow A: Quick Image Generation
```
1. Pick a preset ID: 'cinematic-realism'
2. textToImageAgent['/']({ transcriptionId, promptPresetId: 'cinematic-realism' })
✅ Done!
```

### Workflow B: Browse → View → Generate
```
1. textToImageAgent['/prompts/list']() → Browse all
2. textToImageAgent['/prompts/get/:id']({ id: 'watercolor-artistic' }) → See full prompt
3. textToImageAgent['/']({ transcriptionId, promptPresetId: 'watercolor-artistic' })
✅ Done!
```

### Workflow C: View → Edit → Save → Generate
```
1. textToImageAgent['/prompts/get/:id']({ id: 'minimalist-flat' })
2. Edit the systemPrompt text
3. textToImageAgent['/prompts/save']({ id: 'my-style', systemPrompt: '...' })
4. textToImageAgent['/']({ transcriptionId, promptPresetId: 'my-style' })
✅ Done!
```

### Workflow D: One-time Custom (No Save)
```
1. textToImageAgent['/']({ 
     transcriptionId, 
     customPrompt: 'Your custom prompt here...' 
   })
✅ Done! (Not saved, just used once)
```

---

## Tips & Best Practices

✅ **View before using** - Always check the full system prompt to understand the style  
✅ **Save variations** - Create multiple versions of a preset for different moods  
✅ **Use descriptive IDs** - Name custom presets clearly (e.g., `dark-cinematic-v2`)  
✅ **Tag your prompts** - Use tags for easy searching later  
✅ **Override cautiously** - Overriding built-in presets affects all users  
✅ **Test before production** - Try custom prompts on a few captions first  

---

## Example: Complete Custom Prompt Creation

```typescript
// 1. Get inspiration from existing preset
const { preset } = await textToImageAgent['/prompts/get/:id']({ 
  id: 'cinematic-realism' 
});

// 2. Create your custom version
const myCustomPrompt = `
You are an AI specialized in creating retro 80s synthwave image prompts.

Style Guidelines:
- Neon colors: Hot pink, electric blue, purple, cyan
- Grid patterns and retro computer graphics
- Sunset/sunrise gradients
- Chrome and glass effects
- VHS aesthetic with scan lines

Examples:
User Input: "Data flows through the network"
Generated Prompt: A retro 80s synthwave illustration showing neon blue data streams flowing across a purple grid pattern. Hot pink accents on data nodes. Chrome text "DATA FLOWS" in futuristic font against a sunset gradient background. VHS scan lines, high contrast, retro computer aesthetic.
`;

// 3. Save it
await textToImageAgent['/prompts/save']({
  id: 'retro-synthwave',
  name: 'Retro 80s Synthwave',
  description: 'Neon colors, grids, VHS aesthetic, and chrome effects',
  systemPrompt: myCustomPrompt,
  category: 'artistic',
  tags: ['80s', 'synthwave', 'retro', 'neon', 'custom']
});

// 4. Use it!
await textToImageAgent['/']({
  transcriptionId: 'my-video-123',
  promptPresetId: 'retro-synthwave',
  imageSize: 'landscape_16_9',
  imageResolution: '2K'
});

console.log('✨ Your images are generating in retro 80s synthwave style!');
```

---

## Summary

**One agent. All features. Super simple.**

- Browse styles with `/prompts/list`
- View details with `/prompts/get/:id`  
- Save customs with `/prompts/save`
- Generate images with `/`
- Delete customs with `/prompts/delete/:id`

No need to juggle multiple agents or endpoints. Everything you need for image generation and style management in one unified `textToImageAgent`! 🚀

