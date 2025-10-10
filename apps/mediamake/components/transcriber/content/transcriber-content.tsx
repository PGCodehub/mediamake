"use client";

import { useEffect } from "react";
import { useTranscriber } from "../contexts/transcriber-context";
import { ExplorerUI } from "../explorer/explorer-ui";
import { EditorUI } from "../editor/editor-ui";
import { NewTranscriptionUI } from "../new/new-transcription-ui";
import { AssemblyUI } from "../assembly/assembly-ui";
import { ElevenLabsUI } from "../elevenlabs/elevenlabs-ui";
import { SettingsUI } from "../settings/settings-ui";
import { InfoUI } from "../info/info-ui";
import { Transcription } from "@/app/types/transcription";

export function TranscriberContent() {
    const {
        currentView,
        selectedTranscription,
        setTranscriptionData,
        setError,
        setIsLoading,
        setIsRefreshing,
        setRefreshTranscription
    } = useTranscriber();

    // Load selected transcription from MongoDB
    useEffect(() => {
        if (selectedTranscription) {
            const loadTranscription = async () => {
                try {
                    setIsLoading(true);
                    const response = await fetch(`/api/transcriptions/${selectedTranscription}`);
                    if (response.ok) {
                        const data = await response.json();
                        setTranscriptionData(data.transcription);
                        setError(null);
                    } else {
                        setError('Transcription not found');
                    }
                } catch (error) {
                    console.error('Error loading transcription:', error);
                    setError('Failed to load transcription');
                } finally {
                    setIsLoading(false);
                }
            };
            loadTranscription();
        } else {
            setTranscriptionData(null);
            setError(null);
        }
    }, [selectedTranscription, setTranscriptionData, setError, setIsLoading]);

    // Set up refresh function
    useEffect(() => {
        const refreshFunction = async () => {
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
        };

        setRefreshTranscription(refreshFunction);
    }, [selectedTranscription, setTranscriptionData, setError, setIsLoading, setRefreshTranscription]);

    const renderContent = () => {
        switch (currentView) {
            case 'explorer':
                return <ExplorerUI />;
            case 'assembly':
                return <AssemblyUI />;
            case 'elevenlabs':
                return <ElevenLabsUI />;
            case 'settings':
                return <SettingsUI />;
            case 'new':
                return <NewTranscriptionUI />;
            case 'editor':
                return <EditorUI />;
            case 'info':
                return <InfoUI />;
            default:
                return <ExplorerUI />;
        }
    };

    return (
        <div className="flex-1 w-full flex flex-col h-full overflow-hidden">
            {renderContent()}
        </div>
    );
}
