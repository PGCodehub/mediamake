"use client";

import { PresetEditorWithProvider } from './preset-editor-with-provider';
import { Preset, DatabasePreset } from './types';

// Example usage of the new PresetProvider system
export function PresetUsageExample() {
    // Example presets - these would come from your preset registry or database
    const examplePresets: (Preset | DatabasePreset)[] = [
        // Add your presets here
    ];

    const handlePresetsChange = (presets: any[]) => {
        console.log('Presets changed:', presets);
        // Handle preset changes if needed
    };

    return (
        <div className="w-full h-screen">
            <PresetEditorWithProvider
                selectedPresets={examplePresets}
                onPresetsChange={handlePresetsChange}
            />
        </div>
    );
}

// Alternative: If you want to use the components separately with manual context management
export function ManualPresetUsage() {
    return (
        <div className="w-full h-screen">
            {/* You would wrap your custom layout with PresetProvider */}
            {/* <PresetProvider>
                <YourCustomLayout />
            </PresetProvider> */}
        </div>
    );
}
