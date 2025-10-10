"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
    CheckCircle,
    Bot,
    Sparkles
} from "lucide-react";
import { Transcription } from "@/app/types/transcription";
import { Tag } from "@/app/types/media";

interface NewTranscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTranscriptionComplete: (transcription: Transcription) => void;
    preselectedTags?: string[];
}

export function NewTranscriptionModal({ isOpen, onClose, onTranscriptionComplete, preselectedTags = [] }: NewTranscriptionModalProps) {
    const [audioUrl, setAudioUrl] = useState("");
    const [language, setLanguage] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // Autofix options
    const [enableAutofix, setEnableAutofix] = useState(false);
    const [userRequest, setUserRequest] = useState("");
    const [userWrittenTranscription, setUserWrittenTranscription] = useState("");

    // Progress states
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isAutofixing, setIsAutofixing] = useState(false);
    const [progressMessage, setProgressMessage] = useState("");

    // Tag management
    const [selectedTags, setSelectedTags] = useState<string[]>(preselectedTags);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [newTagName, setNewTagName] = useState("");

    // Fetch available tags
    useEffect(() => {
        if (isOpen) {
            fetchTags();
        }
    }, [isOpen]);

    const fetchTags = async () => {
        try {
            const response = await fetch('/api/tags');
            if (response.ok) {
                const data = await response.json();
                setAvailableTags(data);
            }
        } catch (error) {
            console.error('Error fetching tags:', error);
        }
    };

    const handleTagToggle = (tagId: string) => {
        setSelectedTags(
            selectedTags.includes(tagId)
                ? selectedTags.filter(id => id !== tagId)
                : [...selectedTags, tagId]
        );
    };

    const createAndAddTag = async () => {
        if (!newTagName.trim()) return;

        const generatedId = generateTagId(newTagName.trim());

        try {
            const response = await fetch('/api/tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: generatedId,
                    displayName: newTagName.trim(),
                }),
            });

            if (response.ok) {
                const newTag = await response.json();
                setAvailableTags(prev => [...prev, newTag]);
                setSelectedTags([...selectedTags, newTag.id]);
                setNewTagName("");
            }
        } catch (error) {
            console.error('Error creating tag:', error);
        }
    };

    // Function to generate tag ID from display name
    const generateTagId = (displayName: string): string => {
        return displayName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, '') // Remove spaces
            .trim();
    };

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
        setProgressMessage("Starting transcription...");

        try {
            console.log('Starting transcription with audio URL:', audioUrl.trim(), 'and language:', language.trim() || undefined);

            // Call the transcription API
            const response = await fetch('/api/transcribe/assembly', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audioUrl: audioUrl.trim(),
                    language: language?.trim() || undefined,
                    tags: selectedTags,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Transcription failed');
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Transcription failed');
            }

            setProgressMessage("Transcription completed! Processing with AI...");

            // If autofix is enabled, trigger it automatically
            if (enableAutofix && result.transcription.assemblyId) {
                setIsAutofixing(true);
                setProgressMessage("AI is fixing transcription errors...");
                try {
                    const autofixResponse = await fetch('/api/studio/chat/agent/transcription-fixer', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            assemblyId: result.transcription.assemblyId,
                            userRequest: userRequest.trim() || undefined,
                            userWrittenTranscription: userWrittenTranscription.trim() || undefined,
                        }),
                    });

                    if (autofixResponse.ok) {
                        const autofixResult = await autofixResponse.json();
                        if (autofixResult.success) {
                            // Update the transcription with AI fixes
                            result.transcription.captions = autofixResult.transcription.captions;
                            result.transcription.processingData = {
                                ...result.transcription.processingData,
                                step2: {
                                    ...result.transcription.processingData?.step2,
                                    aiAutofix: {
                                        changes: autofixResult.changes,
                                        confidence: autofixResult.confidence,
                                        appliedAt: new Date().toISOString(),
                                        userRequest,
                                        userWrittenTranscription,
                                    }
                                }
                            };
                        }
                    }
                } catch (autofixError) {
                    console.warn('Autofix failed, continuing with original transcription:', autofixError);
                    setProgressMessage("AI autofix failed, using original transcription");
                } finally {
                    setIsAutofixing(false);
                }
            }

            setProgressMessage("Transcription completed successfully!");
            onTranscriptionComplete(result.transcription);
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
        setIsAutofixing(false);
        setIsSuccess(false);
        setProgressMessage("");
        setEnableAutofix(false);
        setUserRequest("");
        setUserWrittenTranscription("");
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
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden">
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

                <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto">
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

                    {/* AI Autofix Section */}
                    <div className="space-y-3">
                        <Separator />
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Bot className="h-4 w-4 text-blue-600" />
                                <Label className="text-sm font-semibold">AI Autofix</Label>
                                <Badge variant="outline" className="text-xs">Beta</Badge>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="enableAutofix"
                                    checked={enableAutofix}
                                    onCheckedChange={(checked) => setEnableAutofix(checked as boolean)}
                                    disabled={isTranscribing}
                                />
                                <Label htmlFor="enableAutofix" className="text-sm">
                                    Automatically fix transcription errors with AI
                                </Label>
                            </div>

                            {enableAutofix && (
                                <div className="space-y-3 pl-4 border-l-2 border-blue-200 bg-blue-50/30 p-3 rounded-r-lg">
                                    <div className="space-y-2">
                                        <Label htmlFor="userRequest" className="text-sm">User Request (Optional)</Label>
                                        <Textarea
                                            id="userRequest"
                                            value={userRequest}
                                            onChange={(e) => setUserRequest(e.target.value)}
                                            placeholder="e.g., Fix spelling errors and improve sentence flow..."
                                            className="h-[60px] resize-none text-sm overflow-y-auto"
                                            disabled={isTranscribing}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="userWrittenTranscription" className="text-sm">Your Written Version (Optional)</Label>
                                        <Textarea
                                            id="userWrittenTranscription"
                                            value={userWrittenTranscription}
                                            onChange={(e) => setUserWrittenTranscription(e.target.value)}
                                            placeholder="Paste your corrected version here for reference..."
                                            className="h-[80px] resize-none text-sm overflow-y-auto"
                                            disabled={isTranscribing}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Sparkles className="h-3 w-3" />
                                        <span>AI will analyze and fix word boundaries, spelling, and sentence structure</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags Section */}
                    <div className="space-y-3">
                        <Separator />
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Tags</Label>
                            <p className="text-xs text-muted-foreground">
                                Add tags to organize and categorize your transcription
                            </p>

                            <div className="flex flex-wrap gap-2 mb-2">
                                {availableTags.map((tag) => (
                                    <div key={tag._id?.toString()} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={tag.id}
                                            checked={selectedTags.includes(tag.id)}
                                            onCheckedChange={() => handleTagToggle(tag.id)}
                                            disabled={isTranscribing}
                                        />
                                        <Label htmlFor={tag.id} className="text-sm">
                                            {tag.displayName}
                                        </Label>
                                    </div>
                                ))}
                            </div>

                            {/* Create New Tag */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Tag Name (ID will be auto-generated)"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    className="flex-1"
                                    disabled={isTranscribing}
                                />
                                <Button
                                    size="sm"
                                    onClick={createAndAddTag}
                                    disabled={isTranscribing || !newTagName.trim()}
                                >
                                    Add Tag
                                </Button>
                            </div>
                        </div>
                    </div>

                    {(isTranscribing || isAutofixing) && progressMessage && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                            <span className="text-sm text-blue-700">{progressMessage}</span>
                        </div>
                    )}

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
                        disabled={!audioUrl.trim() || !isValidUrl(audioUrl) || isTranscribing || isAutofixing || isSuccess}
                        className="min-w-[120px]"
                    >
                        {isTranscribing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Transcribing...
                            </>
                        ) : isAutofixing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                AI Fixing...
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
