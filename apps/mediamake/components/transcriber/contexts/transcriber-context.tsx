"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Transcription } from "@/app/types/transcription";

type CurrentView = 'explorer' | 'assembly' | 'elevenlabs' | 'settings' | 'new' | 'editor' | 'info' | 'video' | 'metadata' | 'autofix';
interface TranscriberContextType {
    // Navigation state
    currentView: CurrentView;
    setCurrentView: (view: CurrentView) => void;

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
}

const TranscriberContext = createContext<TranscriberContextType | undefined>(undefined);

export function TranscriberProvider({ children }: { children: ReactNode }) {
    const [currentView, setCurrentView] = useState<CurrentView>('explorer');
    const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
    const [transcriptionData, setTranscriptionData] = useState<Transcription | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Direct refresh function
    const refreshTranscription = useCallback(async () => {
        if (selectedTranscription) {
            try {
                setIsRefreshing(true);
                const response = await fetch(`/api/transcriptions/${selectedTranscription}`);
                if (response.ok) {
                    const data = await response.json();
                    setTranscriptionData(data.transcription);
                    setError(null);
                } else {
                    setError('Transcription not found');
                }
            } catch (error) {
                console.error('Error refreshing transcription:', error);
                setError('Failed to refresh transcription');
            } finally {
                setIsRefreshing(false);
            }
        }
    }, []);

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
            refreshTranscription
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
