"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    FileAudio,
    Upload,
    Loader2,
    AlertCircle,
    Globe,
    Link,
    CheckCircle
} from "lucide-react";

interface NewTranscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartTranscription: (audioUrl: string, language?: string) => Promise<void>;
}

export function NewTranscriptionModal({ isOpen, onClose, onStartTranscription }: NewTranscriptionModalProps) {
    const [audioUrl, setAudioUrl] = useState("");
    const [language, setLanguage] = useState("");
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!audioUrl.trim()) {
            setError("Please enter an audio URL");
            return;
        }

        if (!isValidUrl(audioUrl)) {
            setError("Please enter a valid URL");
            return;
        }

        setIsTranscribing(true);
        setError(null);

        try {
            await onStartTranscription(audioUrl.trim(), language.trim() || undefined);
            setIsSuccess(true);
            // Close modal after a brief success display
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (error) {
            console.error('Transcription start error:', error);
            setError(error instanceof Error ? error.message : 'Failed to start transcription');
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleClose = () => {
        setAudioUrl("");
        setLanguage("");
        setError(null);
        setIsTranscribing(false);
        setIsSuccess(false);
        onClose();
    };

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isTranscribing) {
            handleSubmit();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileAudio className="h-5 w-5" />
                        Start New Transcription
                    </DialogTitle>
                    <DialogDescription>
                        Enter an audio URL to begin transcribing. The audio will be processed and converted to text with timestamps.
                        {isTranscribing && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                                Processing your audio... This may take a few moments.
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="audioUrl" className="flex items-center gap-2">
                            <Link className="h-4 w-4" />
                            Audio URL *
                        </Label>
                        <Input
                            id="audioUrl"
                            type="url"
                            placeholder="https://example.com/audio.mp3"
                            value={audioUrl}
                            onChange={(e) => setAudioUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isTranscribing}
                            className={error && !audioUrl ? "border-red-500" : ""}
                        />
                        {audioUrl && !isValidUrl(audioUrl) && (
                            <p className="text-sm text-red-500">Please enter a valid URL</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="language" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Language (Optional)
                        </Label>
                        <Input
                            id="language"
                            placeholder="en, es, fr, de, etc."
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isTranscribing}
                        />
                        <p className="text-xs text-muted-foreground">
                            Language code helps improve transcription accuracy. Leave empty for auto-detection.
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-700">{error}</span>
                        </div>
                    )}

                    {isSuccess && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700">Transcription completed successfully!</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isTranscribing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!audioUrl.trim() || !isValidUrl(audioUrl) || isTranscribing || isSuccess}
                        className="min-w-[120px]"
                    >
                        {isTranscribing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Transcribing...
                            </>
                        ) : isSuccess ? (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete!
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Start Transcription
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
