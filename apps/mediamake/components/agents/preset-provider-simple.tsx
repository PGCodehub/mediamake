"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { InputCompositionProps } from '@microfox/remotion';

interface SimplePresetContextType {
    generatedOutput: InputCompositionProps | null;
    setGeneratedOutput: (output: InputCompositionProps | null) => void;
    isGenerating: boolean;
    setIsGenerating: (generating: boolean) => void;
}

const SimplePresetContext = createContext<SimplePresetContextType | undefined>(undefined);

interface SimplePresetProviderProps {
    children: ReactNode;
    initialOutput?: InputCompositionProps | null;
}

export function SimplePresetProvider({ children, initialOutput = null }: SimplePresetProviderProps) {
    const [generatedOutput, setGeneratedOutput] = useState<InputCompositionProps | null>(initialOutput);
    const [isGenerating, setIsGenerating] = useState(false);

    const contextValue: SimplePresetContextType = {
        generatedOutput,
        setGeneratedOutput,
        isGenerating,
        setIsGenerating
    };

    return (
        <SimplePresetContext.Provider value={contextValue}>
            {children}
        </SimplePresetContext.Provider>
    );
}

export function useSimplePresetContext() {
    const context = useContext(SimplePresetContext);
    if (context === undefined) {
        throw new Error('useSimplePresetContext must be used within a SimplePresetProvider');
    }
    return context;
}
