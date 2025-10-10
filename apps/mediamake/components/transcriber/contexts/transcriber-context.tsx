"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Transcription } from "@/app/types/transcription";

interface TranscriberContextType {
    // Navigation state
    currentView: 'explorer' | 'assembly' | 'elevenlabs' | 'settings' | 'new' | 'editor' | 'info';
    setCurrentView: (view: 'explorer' | 'assembly' | 'elevenlabs' | 'settings' | 'new' | 'editor' | 'info') => void;

    // Selected transcription
    selectedTranscription: string | null;
    setSelectedTranscription: (id: string | null) => void;

    // Transcription data
    transcriptionData: Transcription | null;
    setTranscriptionData: (data: Transcription | null) => void;

    // Loading states
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    isRefreshing: boolean;
    setIsRefreshing: (refreshing: boolean) => void;

    // Error state
    error: string | null;
    setError: (error: string | null) => void;

    // Refresh function
    refreshTranscription: () => Promise<void>;
    setRefreshTranscription: (fn: () => Promise<void>) => void;
}

const TranscriberContext = createContext<TranscriberContextType | undefined>(undefined);

export function TranscriberProvider({ children }: { children: ReactNode }) {
    const [currentView, setCurrentView] = useState<'explorer' | 'assembly' | 'elevenlabs' | 'settings' | 'new' | 'editor' | 'info'>('explorer');
    const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
    const [transcriptionData, setTranscriptionData] = useState<Transcription | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshTranscription, setRefreshTranscription] = useState<() => Promise<void>>(() => async () => { });

    // Auto-switch to editor view when transcription is selected (only from explorer)
    useEffect(() => {
        console.log('Context: selectedTranscription changed to:', selectedTranscription, 'currentView:', currentView);
        if (selectedTranscription && (currentView === 'explorer' || currentView === 'assembly' || currentView === 'elevenlabs' || currentView === 'new')) {
            console.log('Switching to editor view from explorer');
            setCurrentView('editor');
        }
    }, [selectedTranscription, currentView]);

    return (
        <TranscriberContext.Provider value={{
            currentView,
            setCurrentView,
            selectedTranscription,
            setSelectedTranscription,
            transcriptionData,
            setTranscriptionData,
            isLoading,
            setIsLoading,
            isRefreshing,
            setIsRefreshing,
            error,
            setError,
            refreshTranscription,
            setRefreshTranscription
        }}>
            {children}
        </TranscriberContext.Provider>
    );
}

export function useTranscriber() {
    const context = useContext(TranscriberContext);
    if (context === undefined) {
        throw new Error('useTranscriber must be used within a TranscriberProvider');
    }
    return context;
}
