# Preset System - Main Documentation

## Overview

The preset system allows creating reusable composition templates with customizable parameters. Presets are building blocks that can be combined to create complex video compositions.

## Defining Presets

A preset consists of three parts:

1. **Parameter Schema** - Zod schema defining input parameters
2. **Execution Function** - Function that generates composition data from parameters
3. **Metadata** - Preset identification, type, dependencies, and default values

```typescript
const presetParams = z.object({
  /* ... */
});
const presetExecution = (params, props) => {
  /* ... */
};
const presetMetadata: PresetMetadata = {
  /* ... */
};
export const myPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
```

## Registering Presets

Predefined presets are registered in `presets-registry.ts`:

```typescript
import { myPreset } from './my-preset';
export const predefinedPresets: Preset[] = [
  // ... other presets
  myPreset,
];
```

Or registered into the database check `scripts/push_presets.ts`;

## Using Presets

Presets are executed via `runPreset()` which:

- Injects dependencies (helpers from stdlib, other presets from predefined/databse)
- Executes the preset function with input data and props
- Returns a `PresetOutput` containing composition data

The output is then merged into the composition using `insertPresetToComposition()`.

## How It Works

### `runPreset` Function

`runPreset` handles preset execution and dependency injection:

1. **Dependency Injection** - If metadata declares dependencies:
   - **Helpers**: Injects functions from `presetStdLib` into `props.helpers`
   - **Presets**: Injects other presets as callable functions into `props.presets` meaning whatever is actually defined in dpendencies of the current preset metadata

2. **Function Execution** - Converts stringified function to executable code and runs it with:
   - `data`: The preset input parameters
   - `props`: Context including config, style, fetcher, and injected dependencies

3. **Output Return** - Returns `PresetOutput` or `null` if execution fails

### `insertPresetToComposition` Function

`insertPresetToComposition` merges preset output into the composition based on `presetType`:

- **`'full'`** - Replaces entire composition (childrenData, config, style)
- **`'children'`** - Appends childrenData to target component (default: `BaseScene`)
- **`'data'`** - Merges data properties into matching component
- **`'context'`** - Merges context properties into matching component
- **`'effects'`** - Appends effects array to matching component

The function uses `findMatchingComponents` to locate target components by ID, then applies the appropriate merge strategy.
