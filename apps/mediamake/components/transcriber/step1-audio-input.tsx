"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    FileAudio,
    Upload,
    Play,
    Pause,
    Volume2,
    ArrowRight,
    AlertCircle,
    CheckCircle,
    Loader2,
    Hash,
    Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { Transcription } from "@/app/types/transcription";
import { useAudioPlayer } from "./audio-player-context";

interface Step1AudioInputProps {
    transcriptionData: Transcription | null;
    onTranscriptionDataUpdate?: (updatedData: any) => Promise<void>;
    initialAudioUrl?: string;
    initialLanguage?: string;
}

export function Step1AudioInput({ transcriptionData, initialAudioUrl, initialLanguage, onTranscriptionDataUpdate }: Step1AudioInputProps) {
    const { setAudioUrl } = useAudioPlayer();
    const [audioUrl, setAudioUrlState] = useState(transcriptionData?.audioUrl || initialAudioUrl || "");
    const [language, setLanguage] = useState(transcriptionData?.language || initialLanguage || "");
    const [transcriptionId, setTranscriptionId] = useState("");
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isLoadingExisting, setIsLoadingExisting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);


    // Update audio URL in context when local state changes
    const handleAudioUrlChange = (url: string) => {
        setAudioUrlState(url);
        if (url && isValidUrl(url)) {
            setAudioUrl(url);
        }
    };

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    return (
        <div className="space-y-6 max-h-[600px] overflow-auto">
            <Card>
                <CardContent className="space-y-6">
                    {/* Audio URL Input */}
                    <div className="space-x-4 flex flex-row w-full">
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="audioUrl">Audio URL</Label>
                            <Input
                                id="audioUrl"
                                type="url"
                                placeholder="https://example.com/audio.mp3"
                                value={audioUrl}
                                onChange={(e) => handleAudioUrlChange(e.target.value)}
                                disabled={isTranscribing}
                            />
                            {audioUrl && !isValidUrl(audioUrl) && (
                                <p className="text-sm text-red-500">Please enter a valid URL</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="language">Language (Optional)</Label>
                            <Input
                                id="language"
                                placeholder="en, es, fr, etc."
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                disabled={isTranscribing}
                            />
                        </div>

                    </div>

                    {/* Progress Bar */}
                    {isTranscribing && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Transcription Progress</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="w-full" />
                        </div>
                    )}


                    {/* Error Display */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700">
                                <AlertCircle className="h-4 w-4" />
                                <span className="font-medium">Error:</span>
                            </div>
                            <p className="text-red-600 mt-1">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>


            {/* Transcription Results */}
            {transcriptionData?.captions && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            Transcription Complete
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Badge variant="default">
                                {transcriptionData.captions.length} sentences
                            </Badge>
                            {transcriptionData.language && (
                                <Badge variant="outline">
                                    <Globe className="h-3 w-3 mr-1" />
                                    {transcriptionData.language}
                                </Badge>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Raw Transcription Text</Label>
                            <Textarea
                                value={transcriptionData.processingData.step1?.rawText || ""}
                                readOnly
                                className="min-h-[100px]"
                            />
                        </div>

                    </CardContent>
                </Card>
            )}

            {/* Text Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Text Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {transcriptionData?.processingData.step1?.rawText.split(' ').filter((word: string) => word.trim()).length}
                            </div>
                            <div className="text-sm text-muted-foreground">RAW Words</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {transcriptionData?.captions.length}
                            </div>
                            <div className="text-sm text-muted-foreground">Processed Sentences</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {transcriptionData?.captions.flatMap((caption: any) => caption.words).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Processed Words</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
