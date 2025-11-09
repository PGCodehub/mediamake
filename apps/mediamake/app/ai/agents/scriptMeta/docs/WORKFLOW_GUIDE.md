# Easy Workflow: View, Edit & Save Prompts

## The Problem You Had

When selecting a preset from the dropdown, you couldn't see the actual prompt text or edit it inline.

## The Solution

Two new helper routes that make the workflow super easy:

1. **`/prompts/preview`** - Shows you the full prompt text when you select a preset
2. **`/prompts/save-and-use`** - Saves your edited prompt and tells you the new ID to use

---

## 🎯 Complete Workflow (3 Simple Steps)

### **Step 1: Preview the Prompt**

After selecting a preset from the dropdown, preview it to see the full text:

```typescript
// You selected 'graphic-novel' from dropdown
// Now preview it:
const result = await textToImageAgent['/prompts/preview']({
  promptPresetId: 'graphic-novel'
});

console.log('Prompt Name:', result.preset.name);
console.log('Full Prompt Text:');
console.log(result.preset.systemPrompt); // <-- Copy this!
```

**Output:**
```
Prompt Name: Graphic Novel
Full Prompt Text:
You are an AI specialized in creating image generation prompts...
[full prompt text shown here - copy it!]
```

---

### **Step 2: Edit the Prompt**

Copy the `systemPrompt` text and make your edits:

```typescript
// Copy the prompt from preview
let myEditedPrompt = result.preset.systemPrompt;

// Make your changes
myEditedPrompt = myEditedPrompt.replace('Dark Indigo', 'Deep Purple');
myEditedPrompt = myEditedPrompt.replace('Burnt Orange', 'Hot Pink');

// Or write a completely new prompt!
```

---

### **Step 3: Save & Get New ID**

Save your edited prompt and get the ID to use:

```typescript
const saved = await textToImageAgent['/prompts/save-and-use']({
  newPromptId: 'my-purple-style',      // Your new ID
  name: 'Purple Graphic Novel',         // Display name
  systemPrompt: myEditedPrompt,         // Your edited prompt
  description: 'Like graphic novel but with purple/pink colors',
  category: 'illustration',
  tags: ['custom', 'purple'],
  basePromptId: 'graphic-novel'         // What you based it on
});

console.log(saved.message);
// "Prompt 'Purple Graphic Novel' saved successfully! 
//  Use promptPresetId: 'my-purple-style' when generating images."

console.log('Use this ID:', saved.useThisId); // 'my-purple-style'
```

---

### **Step 4: Generate Images with Your Custom Prompt**

```typescript
await textToImageAgent['/']({
  transcriptionId: 'abc123',
  promptPresetId: 'my-purple-style', // <-- Your custom ID!
  imageSize: 'landscape_16_9',
  imageResolution: '2K'
});
```

✅ **Done!** Your images will use your custom purple style!

---

## 📋 Quick Reference

| What You Want | Route to Use | Parameters |
|---------------|--------------|------------|
| **See full prompt** | `/prompts/preview` | `promptPresetId: 'graphic-novel'` |
| **Save edited prompt** | `/prompts/save-and-use` | `newPromptId, name, systemPrompt` |
| **List all presets** | `/prompts/list` | _(optional filters)_ |
| **Generate images** | `/` | `transcriptionId, promptPresetId` |
| **Delete custom** | `/prompts/delete/:id` | `id: 'my-custom-id'` |

---

## 🎨 Example: Complete Custom Prompt Creation

```typescript
// 1️⃣ Select and preview
const preview = await textToImageAgent['/prompts/preview']({
  promptPresetId: 'cinematic-realism'
});

// 2️⃣ Create your custom version
const myPrompt = `
You are an AI creating retro 80s synthwave images.

Style: Neon colors (hot pink, cyan, purple), grid patterns, 
sunset gradients, chrome effects, VHS scan lines.

Example:
Input: "Data flows through networks"
Output: Retro 80s style with neon blue data streams on purple 
grid, hot pink accents, chrome "DATA FLOWS" text, sunset 
gradient background, VHS aesthetic.
`;

// 3️⃣ Save it
const saved = await textToImageAgent['/prompts/save-and-use']({
  newPromptId: 'retro-synthwave',
  name: '80s Synthwave',
  systemPrompt: myPrompt,
  description: 'Neon retro 80s aesthetic',
  category: 'artistic',
  tags: ['80s', 'neon', 'retro'],
  basePromptId: 'cinematic-realism'
});

console.log('✅', saved.message);
console.log('Use ID:', saved.useThisId); // 'retro-synthwave'

// 4️⃣ Generate with your style!
await textToImageAgent['/']({
  transcriptionId: 'my-video',
  promptPresetId: 'retro-synthwave', // Your custom style!
  imageSize: 'landscape_16_9'
});
```

---

## 💡 Tips

**✅ Always preview first** - See what you're working with  
**✅ Copy-paste the systemPrompt** - Don't type from scratch  
**✅ Use descriptive IDs** - Like `dark-cinematic-v2`, not `test123`  
**✅ Add tags** - Makes searching easier later  
**✅ Test before production** - Try on a few captions first  

---

## 🔄 Update an Existing Custom Prompt

If you already have a custom prompt and want to update it:

```typescript
// 1. Preview your existing custom
const preview = await textToImageAgent['/prompts/preview']({
  promptPresetId: 'my-purple-style' // Your existing custom
});

// 2. Edit the prompt
let updated = preview.preset.systemPrompt;
updated = updated.replace('something', 'something else');

// 3. Save with SAME ID to update
const saved = await textToImageAgent['/prompts/save-and-use']({
  newPromptId: 'my-purple-style', // Same ID = update
  name: 'Purple Graphic Novel v2',
  systemPrompt: updated,
  description: 'Updated version',
  category: 'illustration'
});

console.log('✅ Updated!');
```

---

## 🎯 Summary

**The workflow is now:**
1. Select preset → Preview (`/prompts/preview`)
2. See full prompt → Copy & edit
3. Save (`/prompts/save-and-use`) → Get new ID
4. Generate (`/`) → Use your custom ID

**All in the same agent!** No need to juggle multiple endpoints or guess at syntax. 🚀

