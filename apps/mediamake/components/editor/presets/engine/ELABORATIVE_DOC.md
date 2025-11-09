# Preset System - Elaborative Documentation

## Table of Contents

1. [Preset Architecture](#preset-architecture)
2. [Defining Presets](#defining-presets)
3. [Preset Types](#preset-types)
4. [Dependency Injection](#dependency-injection)
5. [Preset Execution Flow](#preset-execution-flow)
6. [Composition Merging](#composition-merging)
7. [Standard Library](#standard-library)
8. [Preset Composition](#preset-composition)

---

## Preset Architecture

### Core Components

- **Preset Function**: Stringified executable code that generates composition data
- **Parameter Schema**: Zod schema defining input validation and UI generation
- **Metadata**: Preset identification, type classification, and dependency declarations
- **Registry**: Central collection of all predefined presets

### Type System

```typescript
interface Preset {
  metadata: PresetMetadata;
  presetFunction: string; // Stringified function
  presetParams: any; // JSON schema
}

interface PresetMetadata {
  id: string;
  title: string;
  presetType: 'children' | 'data' | 'context' | 'effects' | 'full';
  dependencies?: {
    helpers?: string[];
    presets?: string[];
  };
}
```

---

## Defining Presets

### Parameter Schema

Use Zod to define input parameters with validation and descriptions:

```typescript
const presetParams = z.object({
  text: z.string().describe('Text to display'),
  fontSize: z.number().min(20).max(120).default(48),
  color: z.string().default('#ffffff'),
});
```

### Execution Function

The function receives parameters and props, returns `PresetOutput`:

```typescript
const presetExecution = (
  params: z.infer<typeof presetParams>,
  props: PresetPassedProps,
): PresetOutput => {
  return {
    output: {
      childrenData: [
        /* components */
      ],
    },
    options: {
      attachedToId: 'BaseScene',
    },
  };
};
```

### Metadata Declaration

```typescript
const presetMetadata: PresetMetadata = {
  id: 'unique-preset-id',
  title: 'Preset Title',
  description: 'What this preset does',
  type: 'predefined',
  presetType: 'children',
  tags: ['tag1', 'tag2'],
  dependencies: {
    helpers: ['createOpacityEffect'],
    presets: ['other-preset-id'],
  },
  defaultInputParams: {
    /* defaults */
  },
};
```

### Export Pattern

```typescript
export const myPreset = {
  metadata: presetMetadata,
  presetFunction: presetExecution.toString(),
  presetParams: z.toJSONSchema(presetParams),
};
```

---

## Preset Types

### `'full'` - Complete Composition

Replaces the entire composition. Use for complete scenes.

```typescript
return {
  output: {
    childrenData: [
      /* all components */
    ],
    config: { duration: 10, fps: 30 },
    style: { width: 1920, height: 1080 },
  },
};
```

### `'children'` - Append Children

Adds components to a target component's children.

```typescript
return {
  output: {
    childrenData: [
      /* new components */
    ],
  },
  options: {
    attachedToId: 'BaseScene', // or specific component ID
  },
};
```

### `'data'` - Merge Data Properties

Updates component data by merging properties.

```typescript
return {
  output: {
    childrenData: [
      {
        id: 'target-component-id',
        data: { fontSize: 48, color: '#ff0000' },
      },
    ],
  },
};
```

### `'context'` - Merge Context

Updates component context (timing, positioning, etc.).

```typescript
return {
  output: {
    childrenData: [
      {
        id: 'target-component-id',
        context: { timing: { start: 0, duration: 5 } },
      },
    ],
  },
};
```

### `'effects'` - Append Effects

Adds effects to a component.

```typescript
return {
  output: {
    childrenData: [
      {
        id: 'target-component-id',
        effects: [
          /* effect objects */
        ],
      },
    ],
  },
};
```

---

## Dependency Injection

### Helper Functions

Declare helpers in metadata, access via `props.helpers`:

```typescript
dependencies: {
  helpers: ['createOpacityEffect', 'hexToRgb'],
}

// In execution function:
const { helpers } = props;
const effect = helpers.createOpacityEffect(wordId, word, caption);
```

Available helpers from `presetStdLib`:

- `findMatchingComponents` - Search components by ID
- `findMatchingComponentsByQuery` - Search by type/componentId
- `hexToRgb` - Color conversion
- `preprocessCaptions` - Process caption data
- `splitSentenceIntoParts` - Split text into lines
- `createOpacityEffect` - Fade-in effect
- `createScaleEffect` - Scale animation
- `createGradientGlowEffect` - Glow effect
- `createWaveFloatEffect` - Floating animation
- `createPulseEffect` - Pulsing animation
- `applyNoGapsExtension` - Extend caption durations

### Preset Dependencies

Declare other presets, call them via `props.presets`:

```typescript
dependencies: {
  presets: ['basic-text-layer', 'glow-effects'],
}

// In execution function:
const { presets } = props;
const childOutput = await presets['basic-text-layer'](
  { /* child preset params */ },
  props,
);
```

---

## Preset Execution Flow

### Step 1: Dependency Injection (`runPreset`)

```typescript
// 1. Create props copy
const injectedProps = { ...props };

// 2. Inject helpers from stdlib
if (metadata.dependencies?.helpers) {
  injectedProps.helpers = {};
  for (const helperName of metadata.dependencies.helpers) {
    injectedProps.helpers[helperName] = presetStdLib[helperName];
  }
}

// 3. Inject presets as callable functions
if (metadata.dependencies?.presets) {
  injectedProps.presets = {};
  for (const presetId of metadata.dependencies.presets) {
    injectedProps.presets[presetId] = async (params, childProps) => {
      return await runPreset(
        params,
        presetFunction,
        { ...injectedProps, ...childProps },
        metadata,
      );
    };
  }
}
```

### Step 2: Function Execution

```typescript
// Convert string to executable function
const presetJsFunction = new Function(
  'data',
  'props',
  `return (${presetFunction})(data, props);`,
);

// Execute with input and injected props
const output = await presetJsFunction(presetInput, injectedProps);
```

### Step 3: Output Validation

Returns `PresetOutput` or `null` if execution fails.

---

## Composition Merging

### `insertPresetToComposition` Logic

#### Full Preset

```typescript
if (presetType === 'full') {
  data.childrenData = outputData.childrenData;
  data.config = { ...data.config, ...outputData.config };
  data.style = { ...data.style, ...outputData.style };
}
```

#### Children Preset

```typescript
if (presetType === 'children') {
  const targetId = outputOptions?.attachedToId || 'BaseScene';
  const targetComponents = findMatchingComponents(data.childrenData, [
    targetId,
  ]);
  const targetComponent = targetComponents[0] || data.childrenData[0];

  targetComponent.childrenData = [
    ...(targetComponent.childrenData || []),
    ...outputData.childrenData,
  ];
}
```

#### Data/Context/Effects Presets

```typescript
// Find matching component by first child's ID
const firstChild = outputData.childrenData[0];
const matchingComponents = findMatchingComponents(data.childrenData, [
  firstChild.id,
]);

// Merge based on type
if (presetType === 'data') {
  // Deep merge data properties
  matchingComponents[0].data = {
    ...matchingComponents[0].data,
    ...firstChild.data,
  };
}
if (presetType === 'context') {
  // Merge context
  matchingComponents[0].context = {
    ...matchingComponents[0].context,
    ...firstChild.context,
  };
}
if (presetType === 'effects') {
  // Append effects array
  matchingComponents[0].effects = [
    ...(matchingComponents[0].effects || []),
    ...firstChild.effects,
  ];
}
```

### Component Finding

`findMatchingComponents` recursively searches the component tree:

```typescript
const findMatchingComponents = (
  childrenData: RenderableComponentData[],
  targetIds: string[],
): RenderableComponentData[] => {
  // Recursively searches all childrenData for matching IDs
};
```

---

## Standard Library

### Helper Categories

**Component Search**:

- `findMatchingComponents(childrenData, targetIds)` - Find by IDs
- `findMatchingComponentsByQuery(childrenData, { type?, componentId? })` - Find by query

**Data Processing**:

- `preprocessCaptions(captions)` - Split combined words
- `splitSentenceIntoParts(words, maxLines?, splitParts?)` - Split into lines
- `applyNoGapsExtension(captions, config)` - Extend durations

**Utilities**:

- `hexToRgb(hex)` - Convert hex to RGB object

**Effect Creators**:

- `createOpacityEffect(wordId, word, caption?)` - Fade-in
- `createScaleEffect(wordId, word, impact)` - Scale animation
- `createGradientGlowEffect(wordId, word, colorOrOptions, impact?)` - Glow
- `createWaveFloatEffect(wordId, word, impact)` - Floating
- `createPulseEffect(wordId, word, impactOrOptions)` - Pulsing

All effect creators return `GenericEffectData` objects ready for use.

---

## Preset Composition

### Calling Presets from Presets

```typescript
// 1. Declare dependency
dependencies: {
  presets: ['child-preset-id'],
}

// 2. Call in execution
const { presets } = props;
const childOutput = await presets['child-preset-id'](
  {
    // Child preset parameters
    inputCaptions: params.captions,
    fontSize: params.fontSize,
  },
  props, // Pass props to maintain context
);

// 3. Merge or transform output
return {
  output: {
    childrenData: [
      ...childOutput.output.childrenData,
      // Add additional components
    ],
  },
};
```

### Merging Multiple Preset Outputs

```typescript
const layer1 = await presets['layer-1'](params1, props);
const layer2 = await presets['layer-2'](params2, props);

return {
  output: {
    childrenData: [
      ...layer1.output.childrenData,
      ...layer2.output.childrenData,
    ],
  },
};
```

### Conditional Preset Calls

```typescript
if (params.useAdvancedEffects) {
  return await presets['advanced-effects'](params, props);
} else {
  return await presets['simple-effects'](params, props);
}
```

---

## Best Practices

### Parameter Design

- Use descriptive parameter names
- Provide sensible defaults
- Use Zod validation for type safety
- Add descriptions for UI generation

### Dependency Management

- Only declare dependencies you actually use
- Prefer helpers over inline implementations
- Use preset composition for complex scenarios

### Output Structure

- Keep output structure consistent
- Use appropriate `presetType` for merge behavior
- Specify `attachedToId` for children presets

### Error Handling

- Validate injected dependencies exist
- Handle missing components gracefully
- Provide clear error messages

### Performance

- Avoid deep nesting in preset composition
- Cache expensive computations
- Use async/await properly for preset calls
