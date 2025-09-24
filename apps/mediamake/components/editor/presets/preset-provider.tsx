"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, Dispatch, SetStateAction } from 'react';
import { InputCompositionProps } from '@microfox/remotion';
import { AppliedPresetsState, AppliedPreset, PresetInputData, PresetConfiguration } from './types';
import { useRender } from '../player/render-provider';
import useLocalState from '../../studio/context/hooks/useLocalState';

interface PresetContextType {
    // Applied presets state
    appliedPresets: AppliedPresetsState;
    setAppliedPresets: Dispatch<SetStateAction<AppliedPresetsState>>
    // Individual preset operations
    addPreset: (preset: AppliedPreset) => void;
    removePreset: (presetId: string) => void;
    updatePresetInputData: (presetId: string, inputData: PresetInputData) => void;
    togglePresetExpansion: (presetId: string) => void;

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
    const [generatedOutput, setGeneratedOutput] = useLocalState<InputCompositionProps | null>('preset-generated-output', null);
    const [editableOutput, setEditableOutput] = useLocalState<InputCompositionProps | null>('preset-editable-output', null);

    const [isGenerating, setIsGenerating] = useState(false);
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
    }, []);

    const removePreset = useCallback((presetId: string) => {
        setAppliedPresets((prev: AppliedPresetsState) => ({
            ...prev,
            presets: prev.presets.filter((p: AppliedPreset) => p.id !== presetId),
            activePresetId: prev.activePresetId === presetId ? null : prev.activePresetId
        }));
    }, []);

    const updatePresetInputData = useCallback((presetId: string, inputData: PresetInputData) => {
        setAppliedPresets((prev: AppliedPresetsState) => ({
            ...prev,
            presets: prev.presets.map((p: AppliedPreset) =>
                p.id === presetId ? { ...p, inputData } : p
            )
        }));
    }, []);

    const togglePresetExpansion = useCallback((presetId: string) => {
        setAppliedPresets((prev: AppliedPresetsState) => ({
            ...prev,
            presets: prev.presets.map((p: AppliedPreset) =>
                p.id === presetId ? { ...p, isExpanded: !p.isExpanded } : p
            )
        }));
    }, []);

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
        configuration,
        setConfiguration,
        generatedOutput,
        setGeneratedOutput,
        editableOutput,
        setEditableOutput,
        isGenerating,
        setIsGenerating,
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
