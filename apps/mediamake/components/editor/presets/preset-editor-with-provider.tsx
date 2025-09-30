"use client";

import { InputCompositionProps, RenderableComponentData } from "@microfox/remotion";
import { useEffect, useState, useRef } from "react";
import { Preset, DatabasePreset, AppliedPreset, AppliedPresetsState } from "./types";
import { PresetProvider, PresetList, PresetPlayer, createAppliedPreset, usePresetContext } from "./index";
import { runPreset, insertPresetToComposition } from "./preset-helpers";
import AudioScene from "../../remotion/test.json";
import { RenderProvider } from "../player";

interface PresetEditorWithProviderProps {
    selectedPresets: (Preset | DatabasePreset)[];
    onPresetsChange?: (presets: AppliedPreset[]) => void;
    onPresetsProcessed?: () => void;
}

// Inner component that uses the context
function PresetEditorContent({ selectedPresets, onPresetsChange, onPresetsProcessed }: PresetEditorWithProviderProps) {
    const {
        appliedPresets,
        setAppliedPresets,
        addPreset,
        configuration,
        setConfiguration,
        setGeneratedOutput,
        setIsGenerating
    } = usePresetContext();

    const processedPresetsRef = useRef<string[]>([]);

    // Default composition props
    const defaultInputProps: InputCompositionProps = {
        childrenData: AudioScene.childrenData as RenderableComponentData[],
        config: AudioScene.config,
        style: { ...AudioScene.style }
    };

    // Add new presets to applied list when selectedPresets changes
    useEffect(() => {
        if (selectedPresets.length > 0) {
            // Get the last selected preset (most recent addition)
            const latestPreset = selectedPresets[selectedPresets.length - 1];
            const newAppliedPreset = createAppliedPreset(latestPreset);

            // Always add the new preset to the list (allow duplicates)
            setAppliedPresets((prev: AppliedPresetsState) => ({
                ...prev,
                presets: [...prev.presets, newAppliedPreset],
                activePresetId: newAppliedPreset.id
            }));

            // Initialize configuration if not set
            if (!configuration.style && !configuration.config) {
                setConfiguration({
                    style: defaultInputProps.style,
                    config: defaultInputProps.config
                });
            }

            // Clear the selectedPresets to avoid reprocessing
            if (onPresetsProcessed) {
                onPresetsProcessed();
            }
        }
    }, [selectedPresets, setAppliedPresets, setConfiguration, configuration.style, configuration.config, onPresetsProcessed]);


    useEffect(() => {

        if (onPresetsChange) {
            onPresetsChange(appliedPresets.presets);
        }

    }, [appliedPresets.presets, onPresetsChange]);

    const generateOutput = async () => {
        if (appliedPresets.presets.length === 0) return;

        setIsGenerating(true);
        try {
            // Create base composition with configuration
            let baseComposition: InputCompositionProps = {
                childrenData: defaultInputProps.childrenData,
                config: configuration.config || defaultInputProps.config,
                style: configuration.style || defaultInputProps.style
            };

            console.log('appliedPresets', appliedPresets.presets.length);
            // Apply all presets in sequence
            for (const appliedPreset of appliedPresets.presets) {
                // Run the preset function with input data
                const presetOutput = runPreset(
                    appliedPreset.inputData,
                    appliedPreset.preset.presetFunction
                );

                if (presetOutput) {
                    // Insert preset output into composition
                    baseComposition = insertPresetToComposition(baseComposition, {
                        presetOutput: presetOutput,
                        presetType: appliedPreset.preset.metadata.presetType
                    });
                }
            }

            setGeneratedOutput(baseComposition);
        } catch (error) {
            console.error('Error generating output:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-row h-[100vh] relative w-full">
            {/* Main Content */}
            {/* Left Panel - Applied Presets List */}
            <div className="flex-1 border-r bg-background">
                <PresetList onGenerateOutput={generateOutput} />
            </div>

            {/* Right Panel - Preview with Configuration Tabs */}
            <div className="flex-1 max-w-[500px] bg-background relative">
                <PresetPlayer />
            </div>
        </div>
    );
}

// Main component that provides the context
export function PresetEditorWithProvider(props: PresetEditorWithProviderProps) {
    return (
        <RenderProvider>
            <PresetProvider>
                <PresetEditorContent {...props} />
            </PresetProvider>
        </RenderProvider>
    );
}
