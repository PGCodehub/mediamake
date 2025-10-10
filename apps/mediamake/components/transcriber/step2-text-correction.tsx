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
    Loader2,
    Bot,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { humanCorrectionMutator } from "@microfox/datamotion";
import { Transcription } from "@/app/types/transcription";
import { toast } from "sonner";
import { fixTranscriptionErrors } from "./transcription-metadata";

interface Step2TextCorrectionProps {
    transcriptionData: Transcription;
    onTextCorrectionComplete: (correctedText: string) => void;
    onStepChange: (step: 1 | 2 | 3) => void;
    onTranscriptionDataUpdate?: (updatedData: any) => Promise<void>;
    onRefreshTranscription?: () => Promise<void>;
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


export function Step2TextCorrection({ transcriptionData, onTextCorrectionComplete, onStepChange, onTranscriptionDataUpdate, onRefreshTranscription }: Step2TextCorrectionProps) {
    const [correctedText, setCorrectedText] = useState(constructCorrectedText(transcriptionData));
    const [error, setError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // New state for caption mutation
    const [originalCaptions, setOriginalCaptions] = useState(transcriptionData.captions || []);
    const [mutatedCaptions, setMutatedCaptions] = useState<any[]>([]);
    const [isMutating, setIsMutating] = useState(false);
    const [showSplitView, setShowSplitView] = useState(false);
    const [mutationApplied, setMutationApplied] = useState(false);

    // AI Autofixer state
    const [isAIFixing, setIsAIFixing] = useState(false);
    const [aiFixedCaptions, setAiFixedCaptions] = useState<any[]>([]);
    const [aiChanges, setAiChanges] = useState<any[]>([]);
    const [aiConfidence, setAiConfidence] = useState<number>(0);
    const [userRequest, setUserRequest] = useState("");
    const [userWrittenTranscription, setUserWrittenTranscription] = useState("");
    const [aiFixesAppliedToDatabase, setAiFixesAppliedToDatabase] = useState(false);

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

    // AI Autofixer functions
    const handleAIAutofix = async () => {
        if (!transcriptionData.assemblyId) {
            setError("Assembly ID not found. Cannot perform AI autofix.");
            return;
        }

        setIsAIFixing(true);
        setError(null);

        try {
            const result = await fixTranscriptionErrors(
                transcriptionData.assemblyId,
                userRequest.trim() || undefined,
                userWrittenTranscription.trim() || undefined,
            );

            if (result && result.success) {
                setAiChanges(result.changes);
                setAiConfidence(result.confidence);

                // If fixes were automatically applied to database, refresh and update UI
                if (result.appliedToDatabase) {
                    setAiFixesAppliedToDatabase(true);

                    // Refresh transcription data from database to get the latest updates
                    if (onRefreshTranscription) {
                        await onRefreshTranscription();
                    }

                    // Update the corrected text with AI-fixed version from the refreshed data
                    const aiCorrectedText = result.transcription.captions.map((caption: any) => caption.text).join('\n');
                    setCorrectedText(aiCorrectedText);
                    setHasChanges(true);

                    toast.success(`AI autofix completed and applied! ${result.changes.length} changes made with ${(result.confidence * 100).toFixed(1)}% confidence.`);
                } else {
                    setAiFixesAppliedToDatabase(false);

                    // If not automatically applied, show the preview for manual application
                    setAiFixedCaptions(result.transcription.captions);

                    // Update the corrected text with AI-fixed version
                    const aiCorrectedText = result.transcription.captions.map((caption: any) => caption.text).join('\n');
                    setCorrectedText(aiCorrectedText);
                    setHasChanges(true);

                    toast.success(`AI autofix completed! ${result.changes.length} changes made with ${(result.confidence * 100).toFixed(1)}% confidence. Review and apply changes.`);
                }
            } else {
                throw new Error('AI autofix failed - no result returned');
            }
        } catch (err) {
            console.error('AI autofix error:', err);
            setError(err instanceof Error ? err.message : 'Failed to perform AI autofix');
            toast.error('AI autofix failed');
        } finally {
            setIsAIFixing(false);
        }
    };

    const handleApplyAIFixes = async () => {
        if (aiFixedCaptions.length === 0) {
            setError("No AI fixes to apply");
            return;
        }

        try {
            const updatedData = {
                ...transcriptionData,
                captions: aiFixedCaptions,
                processingData: {
                    ...transcriptionData.processingData,
                    step2: {
                        ...transcriptionData.processingData?.step2,
                        humanCorrectedText: correctedText,
                        aiAutofix: {
                            changes: aiChanges,
                            confidence: aiConfidence,
                            appliedAt: new Date().toISOString(),
                            userRequest,
                            userWrittenTranscription,
                        }
                    }
                }
            };

            if (onTranscriptionDataUpdate) {
                await onTranscriptionDataUpdate(updatedData);
            }

            toast.success("AI fixes applied successfully!");
        } catch (error) {
            console.error('Error applying AI fixes:', error);
            setError("Failed to apply AI fixes");
        }
    };


    return (
        <div className="space-y-6 max-h-[600px] overflow-auto">
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

                        {/* AI Autofixer Section */}
                        <div className="space-y-4">
                            <Separator />
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Bot className="h-5 w-5 text-blue-600" />
                                    <Label className="text-base font-semibold">AI Autofixer</Label>
                                    <Badge variant="outline" className="text-xs">Beta</Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="userRequest">User Request (Optional)</Label>
                                        <Textarea
                                            id="userRequest"
                                            value={userRequest}
                                            onChange={(e) => setUserRequest(e.target.value)}
                                            placeholder="e.g., Fix spelling errors and improve sentence flow..."
                                            className="h-[80px] resize-none overflow-y-auto"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="userWrittenTranscription">Your Written Version (Optional)</Label>
                                        <Textarea
                                            id="userWrittenTranscription"
                                            value={userWrittenTranscription}
                                            onChange={(e) => setUserWrittenTranscription(e.target.value)}
                                            placeholder="Paste your corrected version here for reference..."
                                            className="h-[80px] resize-none overflow-y-auto"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <Button
                                        onClick={handleAIAutofix}
                                        disabled={isAIFixing}
                                        variant="default"
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isAIFixing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                AI Fixing...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                AI Autofix
                                            </>
                                        )}
                                    </Button>

                                    {aiFixedCaptions.length > 0 && !aiFixesAppliedToDatabase && (
                                        <>
                                            <Button
                                                onClick={handleApplyAIFixes}
                                                variant="default"
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <Check className="h-4 w-4 mr-2" />
                                                Apply AI Fixes
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setAiFixedCaptions([]);
                                                    setAiChanges([]);
                                                    setAiConfidence(0);
                                                }}
                                                variant="outline"
                                                size="sm"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Clear
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {/* AI Changes Display */}
                                {aiChanges.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Label>AI Changes Made</Label>
                                            {aiFixesAppliedToDatabase && (
                                                <Badge className="bg-green-100 text-green-800">
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Applied to Database
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="space-y-2">
                                                {aiChanges.map((change, index) => (
                                                    <div key={index} className="text-sm">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant="outline" className="text-xs">
                                                                {change.type.replace('_', ' ')}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {change.confidence ? `${(change.confidence * 100).toFixed(0)}% confidence` : ''}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs">
                                                            <span className="text-red-600 line-through">{change.original}</span>
                                                            <span className="mx-2">→</span>
                                                            <span className="text-green-600">{change.fixed}</span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {change.reason}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Human Correction Section */}
                        <div className="space-y-4">
                            <Separator />
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-green-600" />
                                    <Label className="text-base font-semibold">Human Correction</Label>
                                </div>
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
                            className="h-[300px] resize-none overflow-y-auto"
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
