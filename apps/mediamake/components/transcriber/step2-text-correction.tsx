"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    FileText,
    ArrowLeft,
    ArrowRight,
    AlertCircle,
    Copy,
    RotateCcw,
    Users,
    Settings,
    Check,
    X,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { humanCorrectionMutator } from "@microfox/datamotion";
import { Transcription } from "@/app/types/transcription";

interface Step2TextCorrectionProps {
    transcriptionData: Transcription;
    onTextCorrectionComplete: (correctedText: string) => void;
    onStepChange: (step: 1 | 2 | 3) => void;
    onTranscriptionDataUpdate?: (updatedData: any) => Promise<void>;
}


const constructCorrectedText = (transcriptionData: Transcription) => {
    if (transcriptionData.processingData.humanCorrectedText && transcriptionData.processingData.humanCorrectedText.length > 0) {
        return transcriptionData.processingData.humanCorrectedText;
    }

    if (transcriptionData.captions && transcriptionData.captions.length > 0) {
        return transcriptionData.captions.map((caption) => caption.text).join('\n');
    }

    return transcriptionData.processingData.step1?.rawText || "";
}


export function Step2TextCorrection({ transcriptionData, onTextCorrectionComplete, onStepChange, onTranscriptionDataUpdate }: Step2TextCorrectionProps) {
    const [correctedText, setCorrectedText] = useState(constructCorrectedText(transcriptionData));
    const [error, setError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // New state for caption mutation
    const [originalCaptions, setOriginalCaptions] = useState(transcriptionData.captions || []);
    const [mutatedCaptions, setMutatedCaptions] = useState<any[]>([]);
    const [isMutating, setIsMutating] = useState(false);
    const [showSplitView, setShowSplitView] = useState(false);
    const [mutationApplied, setMutationApplied] = useState(false);

    useEffect(() => {
        setCorrectedText(constructCorrectedText(transcriptionData));
        setHasChanges(false);
    }, [transcriptionData]);

    const handleTextChange = (value: string) => {
        setCorrectedText(value);
        setHasChanges(value !== constructCorrectedText(transcriptionData));
    };


    const handleReset = () => {
        setCorrectedText(transcriptionData.processingData.step1?.rawText || "");
        setHasChanges(false);
    };

    const handleContinue = () => {
        if (!correctedText.trim()) {
            setError("Please enter corrected text");
            return;
        }
        onTextCorrectionComplete(correctedText);
    };

    // Caption mutation functions
    const handleHumanCorrectionMutate = async () => {
        if (!correctedText.trim()) {
            setError("Please enter corrected text first");
            return;
        }

        setIsMutating(true);
        setError(null);

        try {
            const mutated = humanCorrectionMutator(originalCaptions, {
                humanCorrectedText: correctedText,
                fallbackOptions: {
                    logAlignmentIssues: true,
                },
            });

            setMutatedCaptions(mutated);
            setShowSplitView(true);
            setMutationApplied(false);
        } catch (error) {
            console.error('Caption mutation error:', error);
            setError("Failed to mutate captions. Please check your text format.");
        } finally {
            setIsMutating(false);
        }
    };

    const handleExecuteMutation = async () => {
        if (mutatedCaptions.length === 0) {
            setError("No mutations to apply");
            return;
        }

        try {
            // Update the transcription data with mutated captions
            const updatedData = {
                ...transcriptionData,
                captions: mutatedCaptions,
                correctedText: correctedText,
                processingData: {
                    ...transcriptionData.processingData,
                    step2: {
                        humanCorrectedText: correctedText,
                        mutatedCaptions: mutatedCaptions,
                        mutationApplied: true
                    }
                }
            };

            // Call the parent callback to update the data
            if (onTranscriptionDataUpdate) {
                await onTranscriptionDataUpdate(updatedData);
            }

            setMutationApplied(true);
            setError(null);
        } catch (error) {
            console.error('Error applying mutations:', error);
            setError("Failed to apply mutations");
        }
    };

    const handleResetMutation = () => {
        setMutatedCaptions([]);
        setShowSplitView(false);
        setMutationApplied(false);
        setError(null);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(correctedText);
    };


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Step 2: Text Correction
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Original Text Display */}
                    <div className="space-y-2">
                        <Label>Original Transcription</Label>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {transcriptionData.processingData.step1?.rawText}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Text Correction Area */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="correctedText">Corrected Text</Label>
                                <p className="text-sm text-muted-foreground">
                                    Scentence splitting & Misspelled words or direct oaste your lyrics here. You can also apply corrections to caption timing and structure.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyToClipboard}
                                >
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReset}
                                    disabled={!hasChanges}
                                >
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    Reset
                                </Button>
                            </div>
                        </div>

                        {/* Caption Mutation Buttons */}
                        <div className="space-y-4">
                            <Separator />
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Button
                                        onClick={handleHumanCorrectionMutate}
                                        disabled={!correctedText.trim() || isMutating}
                                        variant="default"
                                        size="sm"
                                    >
                                        {isMutating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Mutating...
                                            </>
                                        ) : (
                                            <>
                                                <Users className="h-4 w-4 mr-2" />
                                                Human Correction Mutate
                                            </>
                                        )}
                                    </Button>

                                    {mutatedCaptions.length > 0 && (
                                        <>
                                            <Button
                                                onClick={handleExecuteMutation}
                                                disabled={mutationApplied}
                                                variant="default"
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <Check className="h-4 w-4 mr-2" />
                                                {mutationApplied ? 'Applied' : 'Execute'}
                                            </Button>
                                            <Button
                                                onClick={handleResetMutation}
                                                variant="outline"
                                                size="sm"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Reset
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>


                        {/* Split View - Before/After Captions */}
                        {showSplitView && mutatedCaptions.length > 0 && (
                            <div className="space-y-4">
                                <Separator />
                                <div className="space-y-2">
                                    <Label>Caption Comparison</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Compare original captions with mutated versions
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Original Captions */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Original Captions
                                                <Badge variant="outline" className="ml-auto">
                                                    {originalCaptions.length}
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ScrollArea className="h-[300px]">
                                                <div className="space-y-2">
                                                    {originalCaptions.map((caption, index) => (
                                                        <div
                                                            key={caption.id || index}
                                                            className="p-3 bg-muted rounded-lg text-sm"
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {caption.absoluteStart?.toFixed(2)}s - {caption.absoluteEnd?.toFixed(2)}s
                                                                </span>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {caption.words?.length || 0} words
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm">{caption.text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>

                                    {/* Mutated Captions */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                Mutated Captions
                                                <Badge variant="outline" className="ml-auto">
                                                    {mutatedCaptions.length}
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ScrollArea className="h-[300px]">
                                                <div className="space-y-2">
                                                    {mutatedCaptions.map((caption, index) => (
                                                        <div
                                                            key={caption.id || index}
                                                            className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm"
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {caption.absoluteStart?.toFixed(2)}s - {caption.absoluteEnd?.toFixed(2)}s
                                                                </span>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {caption.words?.length || 0} words
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm">{caption.text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Mutation Summary */}
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                                        <Settings className="h-4 w-4" />
                                        <span className="font-medium">Mutation Summary</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <div className="font-medium text-blue-800">Original</div>
                                            <div className="text-blue-600">{originalCaptions.length} captions</div>
                                        </div>
                                        <div>
                                            <div className="font-medium text-blue-800">Mutated</div>
                                            <div className="text-blue-600">{mutatedCaptions.length} captions</div>
                                        </div>
                                        <div>
                                            <div className="font-medium text-blue-800">Total Words</div>
                                            <div className="text-blue-600">
                                                {mutatedCaptions.reduce((sum, c) => sum + (c.words?.length || 0), 0)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-medium text-blue-800">Status</div>
                                            <div className="text-blue-600">
                                                {mutationApplied ? (
                                                    <Badge className="bg-green-100 text-green-800">Applied</Badge>
                                                ) : (
                                                    <Badge variant="outline">Pending</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!showSplitView && <Textarea
                            id="correctedText"
                            value={correctedText}
                            onChange={(e) => handleTextChange(e.target.value)}
                            className="min-h-[200px] max-h-[400px] overflow-y-auto"
                            placeholder="Edit the transcription text here..."
                        />}

                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                {correctedText.length} characters
                            </div>
                        </div>


                    </div>


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

        </div>
    );
}
