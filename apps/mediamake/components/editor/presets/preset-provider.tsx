"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, Dispatch, SetStateAction } from 'react';
import { InputCompositionProps } from '@microfox/remotion';
import { AppliedPresetsState, AppliedPreset, PresetInputData, PresetConfiguration } from './types';
import { useRender } from '../player/render-provider';
import useLocalState from '../../studio/context/hooks/useLocalState';
import useIndexedDbState from '@/components/studio/context/hooks/useIndexedDbState';

interface PresetContextType {
    // Applied presets state
    appliedPresets: AppliedPresetsState;
    setAppliedPresets: Dispatch<SetStateAction<AppliedPresetsState>>
    // Individual preset operations
    addPreset: (preset: AppliedPreset) => void;
    removePreset: (presetId: string) => void;
    updatePresetInputData: (presetId: string, inputData: PresetInputData) => void;
    togglePresetExpansion: (presetId: string) => void;
    togglePresetDisabled: (presetId: string) => void;
    refreshPreset: (presetId: string) => void;
    reorderPresets: (oldIndex: number, newIndex: number) => void;

    // Configuration state
    configuration: PresetConfiguration;
    setConfiguration: (configuration: PresetConfiguration) => void;

    // Generated output state
    generatedOutput: InputCompositionProps | null;
    setGeneratedOutput: (output: InputCompositionProps | null) => void;

    // Editable output state (for the output card in preset list)
    editableOutput: InputCompositionProps | null;
    setEditableOutput: (output: InputCompositionProps | null) => void;

    // Generation state
    isGenerating: boolean;
    setIsGenerating: (generating: boolean) => void;

    // Currently loaded preset tracking
    currentLoadedPreset: string | null;
    setCurrentLoadedPreset: (presetId: string | null) => void;

    // Actions
    generateOutput: () => void;
}

const PresetContext = createContext<PresetContextType | undefined>(undefined);

interface PresetProviderProps {
    children: ReactNode;
}

export function PresetProvider({ children }: PresetProviderProps) {
    const [appliedPresets, setAppliedPresets] = useLocalState<AppliedPresetsState>('preset-applied-presets', {
        presets: [],
        activePresetId: null
    });
    const [configuration, setConfiguration] = useLocalState<PresetConfiguration>('preset-configuration', {});
    const [generatedOutput, setGeneratedOutput] = useIndexedDbState<InputCompositionProps | null>('preset-generated-output', null);
    const [editableOutput, setEditableOutput] = useIndexedDbState<InputCompositionProps | null>('preset-editable-output', null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [currentLoadedPreset, setCurrentLoadedPreset] = useIndexedDbState<string | null>('preset-current-loaded', null);
    const { updateSetting } = useRender();

    useEffect(() => {
        updateSetting('inputProps', JSON.stringify(generatedOutput, null, 2));
    }, [generatedOutput]);

    const addPreset = useCallback((preset: AppliedPreset) => {
        setAppliedPresets((prev: AppliedPresetsState) => ({
            ...prev,
            presets: [...prev.presets, preset],
            activePresetId: preset.id
        }));
    }, [setAppliedPresets]);

    const removePreset = useCallback((presetId: string) => {
        setAppliedPresets((prev: AppliedPresetsState) => ({
            ...prev,
            presets: prev.presets.filter((p: AppliedPreset) => p.id !== presetId),
            activePresetId: prev.activePresetId === presetId ? null : prev.activePresetId
        }));
    }, [setAppliedPresets]);

    const updatePresetInputData = useCallback((presetId: string, inputData: PresetInputData) => {
        setAppliedPresets((prev: AppliedPresetsState) => ({
            ...prev,
            presets: prev.presets.map((p: AppliedPreset) =>
                p.id === presetId ? { ...p, inputData } : p
            )
        }));
    }, [setAppliedPresets]);

    const togglePresetExpansion = useCallback((presetId: string) => {
        setAppliedPresets((prev: AppliedPresetsState) => ({
            ...prev,
            presets: prev.presets.map((p: AppliedPreset) =>
                p.id === presetId ? { ...p, isExpanded: !p.isExpanded } : p
            )
        }));
    }, [setAppliedPresets]);

    const togglePresetDisabled = useCallback((presetId: string) => {
        setAppliedPresets((prev: AppliedPresetsState) => ({
            ...prev,
            presets: prev.presets.map((p: AppliedPreset) =>
                p.id === presetId ? { ...p, disabled: !p.disabled } : p
            )
        }));
    }, [setAppliedPresets]);

    const refreshPreset = useCallback((presetId: string) => {
        setAppliedPresets((prev: AppliedPresetsState) => {
            const presetToRefresh = prev.presets.find((p: AppliedPreset) => p.id === presetId);
            if (!presetToRefresh) return prev;

            // For predefined presets, reload from registry
            if (presetToRefresh.preset.metadata.type === 'predefined') {
                // Import the registry dynamically to get the latest version
                import('./registry/presets-registry').then(({ getPresetById }) => {
                    const refreshedPreset = getPresetById(presetToRefresh.preset.metadata.id);
                    if (refreshedPreset) {
                        setAppliedPresets((currentPrev: AppliedPresetsState) => ({
                            ...currentPrev,
                            presets: currentPrev.presets.map((p: AppliedPreset) =>
                                p.id === presetId
                                    ? {
                                        ...p,
                                        preset: {
                                            ...p.preset,
                                            presetFunction: refreshedPreset.presetFunction,
                                            presetParams: refreshedPreset.presetParams
                                        }
                                    }
                                    : p
                            )
                        }));
                    }
                });
            }

            // For database presets, we would need to fetch from the database
            // This would require an API call to get the latest version
            // For now, we'll just return the current state
            return prev;
        });
    }, []);

    const reorderPresets = useCallback((oldIndex: number, newIndex: number) => {
        setAppliedPresets((prev: AppliedPresetsState) => ({
            ...prev,
            presets: prev.presets.map((preset, index) => {
                if (index === oldIndex) {
                    return prev.presets[newIndex];
                } else if (index === newIndex) {
                    return prev.presets[oldIndex];
                }
                return preset;
            })
        }));
    }, [setAppliedPresets]);

    const generateOutput = useCallback(() => {
        // This will be implemented by the parent component that uses the provider
        // The provider just manages the state, the actual generation logic should be passed in
        console.log('Generate output called - implement this in parent component');
    }, []);

    const contextValue: PresetContextType = {
        appliedPresets,
        setAppliedPresets,
        addPreset,
        removePreset,
        updatePresetInputData,
        togglePresetExpansion,
        togglePresetDisabled,
        refreshPreset,
        reorderPresets,
        configuration,
        setConfiguration,
        generatedOutput,
        setGeneratedOutput,
        editableOutput,
        setEditableOutput,
        isGenerating,
        setIsGenerating,
        currentLoadedPreset,
        setCurrentLoadedPreset,
        generateOutput
    };

    return (
        <PresetContext.Provider value={contextValue}>
            {children}
        </PresetContext.Provider>
    );
}

export function usePresetContext() {
    const context = useContext(PresetContext);
    if (context === undefined) {
        throw new Error('usePresetContext must be used within a PresetProvider');
    }
    return context;
}
