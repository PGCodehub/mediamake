"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    FileAudio,
    Brain,
    Sparkles,
    Settings,
    Download,
    Copy,
    RefreshCw,
    Loader2
} from "lucide-react";
import { useTranscriber } from "../contexts/transcriber-context";
import { AudioPlayerProvider, useAudioPlayer } from "../audio-player-context";
import { AudioPlayer } from "../audio-player";
import { TiptapCaptionEditor } from "../tiptap/tiptap-caption-editor";
import { MetadataDialog } from "../dialogs/metadata-dialog";
import { AutofixDialog } from "../dialogs/autofix-dialog";
import { Transcription } from "@/app/types/transcription";

// Internal component that uses the audio player context
function EditorUIInner() {
    const {
        transcriptionData,
        setTranscriptionData,
        refreshTranscription,
        isLoading,
        setIsLoading,
        isRefreshing,
        error,
        setError
    } = useTranscriber();

    const { currentTime, isPlaying, seekTo, togglePlayPause, setAudioUrl } = useAudioPlayer();

    const [showMetadataDialog, setShowMetadataDialog] = useState(false);
    const [showAutofixDialog, setShowAutofixDialog] = useState(false);

    // Set audio URL when transcription data changes
    useEffect(() => {
        if (transcriptionData?.audioUrl) {
            console.log('Setting audio URL:', transcriptionData.audioUrl);
            setAudioUrl(transcriptionData.audioUrl);
        }
    }, [transcriptionData?.audioUrl, setAudioUrl]);

    const handleTranscriptionDataUpdate = async (updatedData: any) => {
        try {
            const response = await fetch(`/api/transcriptions/${updatedData._id ?? transcriptionData?._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...(updatedData.captions && { captions: updatedData.captions }),
                    ...(updatedData.processingData && { processingData: updatedData.processingData }),
                    ...(updatedData.status && { status: updatedData.status }),
                    ...(updatedData.error && { error: updatedData.error }),
                    ...(updatedData.tags && { tags: updatedData.tags })
                }),
            });

            if (!response.ok) {
                console.error('Failed to update transcription in database');
            } else {
                const data = await response.json();
                if (data.success) {
                    setTranscriptionData(data.transcription);
                }
            }
        } catch (error) {
            console.error('Error updating transcription:', error);
        }
    };

    const exportCaptionJson = () => {
        if (!transcriptionData) return;

        const exportData = {
            id: transcriptionData._id,
            audioUrl: transcriptionData.audioUrl,
            language: transcriptionData.language,
            captions: transcriptionData.captions,
            correctedText: transcriptionData.processingData?.step2?.humanCorrectedText,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transcription-${transcriptionData._id}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const copyCaptionJson = () => {
        if (!transcriptionData) return;

        const exportData = {
            id: transcriptionData._id,
            audioUrl: transcriptionData.audioUrl,
            language: transcriptionData.language,
            captions: transcriptionData.captions,
            correctedText: transcriptionData.processingData?.step2?.humanCorrectedText,
            exportedAt: new Date().toISOString()
        };

        navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    };

    // Show loading state first (even if transcriptionData is null during loading)
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-16 w-16 mx-auto mb-6 text-primary animate-spin" />
                    <h3 className="text-2xl font-semibold mb-4">Loading Transcription</h3>
                    <p className="text-muted-foreground">
                        Please wait while we load the transcription data...
                    </p>
                </div>
            </div>
        );
    }

    // Show refreshing state when refreshing existing transcription
    if (isRefreshing) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="h-16 w-16 mx-auto mb-6 text-primary animate-spin" />
                    <h3 className="text-2xl font-semibold mb-4">Refreshing Transcription</h3>
                    <p className="text-muted-foreground">
                        Updating transcription data...
                    </p>
                </div>
            </div>
        );
    }

    // Show error state if there's an error
    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-4">{error}</div>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    // Show no transcription selected only if not loading and no error
    if (!transcriptionData) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <FileAudio className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
                    <h3 className="text-2xl font-semibold mb-4">No Transcription Selected</h3>
                    <p className="text-muted-foreground">
                        Select a transcription from the explorer to start editing.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1 max-w-[50%]">
                        <FileAudio className="h-6 w-6 text-primary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl font-bold truncate">
                                {transcriptionData.title || 'Untitled Transcription'}
                            </h1>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {transcriptionData.tags?.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs flex-shrink-0">
                                        {tag}
                                    </Badge>
                                ))}
                                {/* {transcriptionData.keywords?.slice(0, 5).map((keyword, index) => (
                                    <Badge key={index} variant="outline" className="text-xs flex-shrink-0">
                                        {keyword}
                                    </Badge>
                                ))} */}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            onClick={() => setShowAutofixDialog(true)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <Sparkles className="h-4 w-4" />
                            AI Autofix
                        </Button>
                        <Button
                            onClick={() => setShowMetadataDialog(true)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <Brain className="h-4 w-4" />
                            Metadata
                        </Button>
                        <Button
                            onClick={copyCaptionJson}
                            variant="outline"
                            size="sm"
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy JSON
                        </Button>
                        <Button
                            onClick={exportCaptionJson}
                            variant="outline"
                            size="sm"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export JSON
                        </Button>
                    </div>
                </div>
            </div>

            {/* Audio Player */}
            {transcriptionData?.audioUrl && (
                <div className="p-4 border-b border-border">
                    <div className="mb-2 text-sm text-muted-foreground">
                        Audio Player (URL: {transcriptionData.audioUrl})
                    </div>
                    <AudioPlayer />
                </div>
            )}

            {/* Main Editor Content */}
            <div className="flex-1 flex min-h-0">
                {/* Caption Editor with integrated timeline */}
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 p-4">
                        <TiptapCaptionEditor
                            key={transcriptionData?._id + '-' + (transcriptionData?.updatedAt || '')}
                            transcriptionData={transcriptionData}
                            onTranscriptionDataUpdate={handleTranscriptionDataUpdate}
                            onStepChange={() => { }}
                            onRefreshTranscription={refreshTranscription}
                        />
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <MetadataDialog
                isOpen={showMetadataDialog}
                onClose={() => setShowMetadataDialog(false)}
                transcriptionData={transcriptionData}
                onTranscriptionDataUpdate={handleTranscriptionDataUpdate}
                onRefreshTranscription={refreshTranscription}
            />

            <AutofixDialog
                isOpen={showAutofixDialog}
                onClose={() => setShowAutofixDialog(false)}
                transcriptionData={transcriptionData}
                onTranscriptionDataUpdate={handleTranscriptionDataUpdate}
                onRefreshTranscription={refreshTranscription}
            />
        </div>
    );
}

// Main component that provides the audio player context
export function EditorUI() {
    return (
        <AudioPlayerProvider>
            <EditorUIInner />
        </AudioPlayerProvider>
    );
}
