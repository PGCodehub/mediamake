"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    FileAudio,
    AlertCircle,
    CheckCircle,
    Clock,
    Play,
    Calendar,
    Hash,
    ArrowRight,
    ArrowLeft,
    Download,
    Copy,
    RefreshCw,
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { Step1AudioInput } from "./step1-audio-input";
import { Step2TextCorrection } from "./step2-text-correction";
import { Step3CaptionEditor } from "./step3-caption-editor";
import { Step4MetadataEditor } from "./step4-meta-editor";
import { Transcription } from "@/app/types/transcription";
import { AudioPlayerProvider, useAudioPlayer } from "./audio-player-context";
import { AudioPlayer } from "./audio-player";

interface TranscriptionContentProps {
    selectedTranscription: string | null;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    transcriptionData: Transcription | null;
    setTranscriptionData: (data: Transcription | null) => void;
    onNewTranscription?: () => void;
    modalAudioUrl?: string;
    modalLanguage?: string;
}

// Internal component that uses the audio player context
function TranscriptionContentInner({
    selectedTranscription,
    currentStep,
    setCurrentStep,
    transcriptionData,
    setTranscriptionData,
    onNewTranscription,
    modalAudioUrl,
    modalLanguage
}: TranscriptionContentProps) {
    const { setAudioUrl } = useAudioPlayer();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
    }, [selectedTranscription, setTranscriptionData]);

    // Set audio URL when transcription data changes
    useEffect(() => {
        if (transcriptionData?.audioUrl) {
            setAudioUrl(transcriptionData.audioUrl);
        } else if (modalAudioUrl) {
            setAudioUrl(modalAudioUrl);
        }
    }, [transcriptionData?.audioUrl, modalAudioUrl, setAudioUrl]);

    const handleStepChange = (step: number) => {
        setCurrentStep(step);
    };

    // Convert Transcription to legacy format for step components
    const convertToLegacyFormat = (transcription: Transcription) => {
        return {
            id: transcription._id?.toString() || '',
            audioUrl: transcription.audioUrl,
            language: transcription.language,
            captions: transcription.captions,
            rawText: transcription.processingData?.step1?.rawText,
            correctedText: transcription.processingData?.step2?.humanCorrectedText,
            processedCaptions: transcription.processingData?.step3?.processedCaptions
        };
    };

    const handleTranscriptionComplete = async (data: any) => {
        setTranscriptionData(data);
        setCurrentStep(2);

        // Save to MongoDB
        try {
            const response = await fetch(`/api/transcriptions/${data._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'step2',
                    processingData: {
                        ...data.processingData,
                        step1: {
                            ...data.processingData?.step1,
                            rawText: data.captions?.map((caption: any) => caption.text).join(' ')
                        }
                    }
                }),
            });

            if (!response.ok) {
                console.error('Failed to update transcription in database');
            }
        } catch (error) {
            console.error('Error saving transcription to database:', error);
        }
    };

    const handleTextCorrectionComplete = async (correctedText: string) => {
        if (transcriptionData) {
            const updatedData = {
                ...transcriptionData,
                processingData: {
                    ...transcriptionData.processingData,
                    step2: {
                        ...transcriptionData.processingData?.step2,
                        humanCorrectedText: correctedText
                    }
                }
            };
            setTranscriptionData(updatedData);
            setCurrentStep(3);

            // Update MongoDB
            try {
                const response = await fetch(`/api/transcriptions/${transcriptionData._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status: 'step3',
                        processingData: updatedData.processingData
                    }),
                });

                if (!response.ok) {
                    console.error('Failed to update transcription in database');
                }
            } catch (error) {
                console.error('Error updating transcription:', error);
            }
        }
    };

    const handleTranscriptionDataUpdate = useCallback(async (updatedData: any) => {

        // Update MongoDB with the new data
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
            }
            else {
                const data = await response.json();
                if (data.success) {
                    setTranscriptionData(data.transcription);
                }
            }
        } catch (error) {
            console.error('Error updating transcription:', error);
        }
    }, [transcriptionData?._id]);

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

    if (!selectedTranscription) {
        return (
            <div className="flex-1 flex items-center justify-center bg-muted/20">
                <div className="text-center max-w-md">
                    <FileAudio className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
                    <h3 className="text-2xl font-semibold mb-4">Welcome to Transcriber</h3>
                    <p className="text-muted-foreground mb-6">
                        Start a new transcription by entering an audio URL, or select an existing transcription from the sidebar to continue editing.
                    </p>
                    <div className="space-y-3">
                        <Button
                            onClick={onNewTranscription}
                            size="lg"
                            className="w-full"
                        >
                            <FileAudio className="h-5 w-5 mr-2" />
                            Start New Transcription
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            Or choose from your transcription history in the sidebar
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !transcriptionData) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <h3 className="text-lg font-semibold mb-2">Error Loading Transcription</h3>
                    <p className="text-muted-foreground mb-4">
                        {error || 'Failed to load transcription details'}
                    </p>
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

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-scoll overflow-x-hidden">
            <div className="flex-1 px-4 space-y-4 w-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileAudio className="h-6 w-6 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold">Transcription Editor</h1>
                            <p className="text-muted-foreground">
                                ID: {transcriptionData._id?.toString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onNewTranscription && (
                            <Button
                                onClick={onNewTranscription}
                                variant="outline"
                                size="sm"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                New
                            </Button>
                        )}
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

                <Separator />

                {/* Audio Player */}
                {transcriptionData?.audioUrl && (
                    <div className="space-y-2 sticky top-0 bg-white z-12">
                        <h3 className="text-sm font-medium">Audio Player</h3>
                        <AudioPlayer />
                    </div>
                )}

                <Separator />

                {/* Step Navigation */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant={currentStep === 1 ? "default" : "outline"}
                            onClick={() => handleStepChange(1)}
                            className="flex items-center gap-2"
                        >
                            Audio Info
                        </Button>
                        <Button
                            variant={currentStep === 2 ? "default" : "outline"}
                            onClick={() => handleStepChange(2)}
                            className="flex items-center gap-2"
                            disabled={!transcriptionData.captions}
                        >
                            Text Correction (Lyrics)
                        </Button>
                        <Button
                            variant={currentStep === 3 ? "default" : "outline"}
                            onClick={() => handleStepChange(3)}
                            className="flex items-center gap-2"
                            disabled={!transcriptionData.captions}
                        >
                            Caption Editor
                        </Button>
                        <Button
                            variant={currentStep === 4 ? "default" : "outline"}
                            onClick={() => handleStepChange(4)}
                            className="flex items-center gap-2"
                            disabled={!transcriptionData.captions}
                        >
                            Metadata
                        </Button>
                    </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 min-h-0">
                    {currentStep === 1 && transcriptionData && (
                        <Step1AudioInput
                            transcriptionData={transcriptionData}
                            onTranscriptionDataUpdate={handleTranscriptionDataUpdate}
                            initialAudioUrl={modalAudioUrl}
                            initialLanguage={modalLanguage}
                        />
                    )}
                    {currentStep === 2 && transcriptionData && (
                        <Step2TextCorrection
                            transcriptionData={transcriptionData}
                            onTextCorrectionComplete={handleTextCorrectionComplete}
                            onStepChange={handleStepChange}
                            onTranscriptionDataUpdate={handleTranscriptionDataUpdate}
                        />
                    )}
                    {currentStep === 3 && transcriptionData && (
                        <Step3CaptionEditor
                            transcriptionData={transcriptionData}
                            onTranscriptionDataUpdate={handleTranscriptionDataUpdate}
                            onStepChange={handleStepChange}
                        />
                    )}
                    {currentStep === 4 && transcriptionData && (
                        <Step4MetadataEditor
                            transcriptionData={transcriptionData}
                            onTranscriptionDataUpdate={handleTranscriptionDataUpdate}
                            onStepChange={handleStepChange}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// Main component that provides the audio player context
export function TranscriptionContent(props: TranscriptionContentProps) {
    return (
        <AudioPlayerProvider>
            <TranscriptionContentInner {...props} />
        </AudioPlayerProvider>
    );
}
