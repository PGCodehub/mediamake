# Preset System

A comprehensive preset system for MediaMake that allows users to create, manage, and apply predefined compositions with customizable parameters.

## Features

### 1. Preset Types

- **Predefined Presets**: Built-in presets defined in code
- **Database Presets**: User-created presets stored in MongoDB

### 2. Preset Structure

Each preset contains:

- **Metadata**: Title, description, type, tags, etc.
- **Preset Function**: Stringified JavaScript function that generates composition data
- **Preset Parameters**: JSON schema defining input parameters

### 3. Preset Application Types

- **Full**: Replaces entire children data
- **Children**: Inserts into specific component's children
- **Data**: Updates specific component's data
- **Context**: Updates specific component's context
- **Effects**: Updates specific component's effects

## Components

### PresetEditor

Main component that combines sidebar and content areas. Now supports multiple preset selection and future template support. Uses the new modular architecture with PresetList and PresetPlayer components.

### PresetsSidebar

- Two tabs: Predefined and Database
- Lists available presets with metadata
- Shows preset type badges and tags
- Handles preset selection (adds to applied presets list)

### New Modular Components

#### PresetList

Left panel component for managing applied presets:

- **Expandable preset cards** with individual configuration
- **Generate button** to apply all presets
- **Remove functionality** for individual presets
- **Default value loading** from metadata or schema
- **Empty state** when no presets are applied

```tsx
<PresetList
  appliedPresets={appliedPresets}
  onToggleExpansion={toggleExpansion}
  onUpdateInputData={updateInputData}
  onRemovePreset={removePreset}
  onGenerateOutput={generateOutput}
  isGenerating={isGenerating}
/>
```

#### PresetPlayer

Right panel component with three tabs:

- **Configuration Tab**: Edit style and config properties
- **Generated Output Tab**: View final composition data with copy functionality
- **Preview Tab**: Live preview with Remotion player

```tsx
<PresetPlayer
  appliedPresets={appliedPresets}
  configuration={configuration}
  onConfigurationChange={handleConfigurationChange}
  generatedOutput={generatedOutput}
  isGenerating={isGenerating}
/>
```

#### PresetEditor (New)

Combines PresetList and PresetPlayer with full state management:

- **Multiple preset support** - accepts array of presets
- **Automatic default loading** from metadata or schema
- **Configuration overwrites** for "full" type presets
- **Future template ready** - supports preset sequences

```tsx
<PresetEditor selectedPresets={presetsArray} />
```

### SchemaForm

Dynamic form generator based on JSON schema:

- Supports string, number, boolean, object, array types
- Enum support with dropdowns
- Form and JSON editing modes
- Tooltips for field descriptions
- **Reset functionality** to restore default values
- **Nested object support** with collapsible UI
- **Array management** with add/remove/reorder functionality

## New Architecture

### Component Hierarchy

```
PresetEditor (Main)
├── PresetsSidebar (Exploration & Selection)
└── PresetEditor (New - Content Area)
    ├── PresetList (Left Panel)
    │   ├── Applied Preset Cards
    │   └── SchemaForm (per preset)
    └── PresetPlayer (Right Panel)
        ├── Configuration Tab
        ├── Generated Output Tab
        └── Preview Tab
```

### Key Changes

1. **Input Parameter Change**:
   - **Old**: `selectedPreset: Preset | DatabasePreset | null`
   - **New**: `selectedPresets: (Preset | DatabasePreset)[]`

2. **Modular Design**: Components can be used independently or combined

3. **Future Template Support**: Ready for preset sequences and templates

### New Types

```typescript
interface AppliedPreset {
  id: string;
  preset: Preset | DatabasePreset;
  inputData: PresetInputData;
  isExpanded: boolean;
}

interface AppliedPresetsState {
  presets: AppliedPreset[];
  activePresetId: string | null;
}
```

### Usage Examples

#### Using Individual Components

```tsx
// Use PresetList independently
<PresetList
  appliedPresets={appliedPresets}
  onToggleExpansion={handleToggle}
  onUpdateInputData={handleUpdate}
  onRemovePreset={handleRemove}
  onGenerateOutput={handleGenerate}
  isGenerating={isGenerating}
/>

// Use PresetPlayer independently
<PresetPlayer
  appliedPresets={appliedPresets}
  configuration={configuration}
  onConfigurationChange={handleConfigChange}
  generatedOutput={output}
  isGenerating={isGenerating}
/>
```

#### Using Combined PresetEditor

```tsx
// Simple usage with preset array
<PresetEditor selectedPresets={[preset1, preset2, preset3]} />

// With callback for preset changes
<PresetEditor
  selectedPresets={presets}
  onPresetsChange={(appliedPresets) => {
    // Handle preset changes
  }}
/>
```

#### Creating Applied Presets

```tsx
import { createAppliedPreset } from './preset-list';

// Create applied preset with default values
const appliedPreset = createAppliedPreset(preset);
```

## New Features

### Default Input Parameters

All presets now automatically load with default input parameters:

1. **Metadata Priority**: Uses `metadata.defaultInputParams` if available
2. **Schema Fallback**: Generates defaults from JSON schema if no metadata defaults
3. **Smart Defaults**: Type-appropriate defaults (empty strings, 0, false, empty arrays)

### Configuration Overwrites

"Full" type presets can now define configuration overwrites:

```typescript
const preset: Preset = {
  metadata: {
    // ... other metadata
    presetType: 'full',
    configOverWrites: {
      duration: 10,
      fps: 60,
    },
    styleOverWrites: {
      backgroundColor: '#000000',
      width: 1920,
      height: 1080,
    },
  },
  // ... rest of preset
};
```

### Enhanced SchemaForm

- **Reset Button**: Restore default values with one click
- **Required Field Indicators**: Red asterisks for required fields at all nesting levels
- **Nested Object Support**: Collapsible UI for complex object structures
- **Array Management**: Add, remove, and reorder array items
- **Clean UI**: Removed card borders for better focus

### Future Template Support

The new architecture is ready for preset templates:

```typescript
// Future template structure
interface PresetTemplate {
  id: string;
  title: string;
  description: string;
  presets: {
    preset: Preset | DatabasePreset;
    inputData?: PresetInputData;
    order: number;
  }[];
}

// Usage
<PresetEditor selectedPresets={template.presets.map(p => p.preset)} />
```

## API Routes

All API routes use MongoDB for persistence, following the same pattern as transcriptions.

### GET /api/presets

Fetch database presets with filtering and pagination:

- `type`: Filter by preset type (predefined/database)
- `presetType`: Filter by application type (children/data/context/effects/full)
- `tags`: Comma-separated list of tags to filter by
- `page`: Page number for pagination
- `limit`: Number of items per page
- `sortBy`: Sort field (createdAt/updatedAt/title)
- `sortOrder`: Sort direction (asc/desc)

### POST /api/presets

Create a new database preset with validation:

- Validates required fields (metadata, presetFunction, presetParams)
- Checks for duplicate titles per client
- Generates unique IDs
- Sets timestamps automatically

### GET /api/presets/[id]

Fetch specific preset by MongoDB ObjectId with client isolation

### PUT /api/presets/[id]

Update existing preset with partial updates and client isolation

### DELETE /api/presets/[id]

Delete preset with client isolation

## Usage

### Creating a Predefined Preset

```typescript
import { Preset } from './types';

const myPreset: Preset = {
  metadata: {
    id: 'my-preset',
    title: 'My Custom Preset',
    description: 'A custom preset for audio visualization',
    type: 'predefined',
    presetType: 'full',
    tags: ['audio', 'visualization'],
  },
  presetFunction: myPresetFunction.toString(),
  presetParams: myPresetSchema,
};
```

### Using the Preset System

```tsx
import { PresetEditor } from '@/components/editor/presets';

function MyPage() {
  return <PresetEditor />;
}
```

## Preset Function Structure

Preset functions should:

1. Accept input parameters as their first argument
2. Return composition data compatible with `InputCompositionProps`
3. Be pure functions (no side effects)
4. Be serializable (no closures or external dependencies)

Example:

```typescript
const myPresetFunction = (params: MyPresetParams) => {
  return {
    id: 'MyComposition',
    componentId: 'BaseLayout',
    type: 'layout',
    data: {
      // composition data
    },
    childrenData: [
      // child components
    ],
  };
};
```

## JSON Schema for Parameters

Use JSON Schema to define input parameters:

```json
{
  "type": "object",
  "properties": {
    "audio": {
      "type": "object",
      "properties": {
        "src": { "type": "string" },
        "volume": { "type": "number", "minimum": 0, "maximum": 1 }
      },
      "required": ["src"]
    },
    "text": {
      "type": "string",
      "description": "Main text content"
    }
  },
  "required": ["audio", "text"]
}
```

## MongoDB Integration

The preset system uses MongoDB for database presets, following the same patterns as transcriptions:

### Database Schema

```typescript
interface DatabasePreset {
  _id?: ObjectId;
  clientId?: string;
  metadata: PresetMetadata;
  presetFunction: string;
  presetParams: any;
  createdAt: Date;
  updatedAt: Date;
}
```

### Client Isolation

- Presets are isolated by `clientId` for multi-tenant support
- Global presets (no clientId) are accessible to all users
- Client-specific presets are only accessible to that client

### Environment Setup

Ensure your `.env.local` has:

```
MONGODB_URI=your_mongodb_connection_string
MONGODB_DATABASE=mediamake
```

## Integration with Existing Player

The preset system integrates seamlessly with the existing MediaMake player:

- Uses the same `CompositionLayout` component
- Supports the same rendering pipeline
- Maintains compatibility with existing compositions
- Provides live preview functionality
