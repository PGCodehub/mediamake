"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Bot,
    Sparkles,
    Loader2,
    Check,
    X,
    AlertCircle,
    Users,
    Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Transcription } from "@/app/types/transcription";
import { fixTranscriptionErrors } from "../transcription-metadata";
import { toast } from "sonner";

interface AutofixDialogProps {
    isOpen: boolean;
    onClose: () => void;
    transcriptionData: Transcription;
    onTranscriptionDataUpdate: (data: any) => void;
    onRefreshTranscription: () => Promise<void>;
}

export function AutofixDialog({
    isOpen,
    onClose,
    transcriptionData,
    onTranscriptionDataUpdate,
    onRefreshTranscription
}: AutofixDialogProps) {
    const [userRequest, setUserRequest] = useState("");
    const [userWrittenTranscription, setUserWrittenTranscription] = useState("");
    const [isAIFixing, setIsAIFixing] = useState(false);
    const [aiChanges, setAiChanges] = useState<any[]>([]);
    const [aiConfidence, setAiConfidence] = useState<number>(0);
    const [aiFixesAppliedToDatabase, setAiFixesAppliedToDatabase] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load existing autofix data if available
    useEffect(() => {
        if (transcriptionData.processingData?.step2?.aiAutofix) {
            const autofix = transcriptionData.processingData.step2.aiAutofix;
            setUserRequest(autofix.userRequest || "");
            setUserWrittenTranscription(autofix.userWrittenTranscription || "");
        }
    }, [transcriptionData]);

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

                    toast.success(`AI autofix completed and applied! ${result.changes.length} changes made with ${(result.confidence * 100).toFixed(1)}% confidence.`);
                } else {
                    setAiFixesAppliedToDatabase(false);
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
        if (aiChanges.length === 0) {
            setError("No AI fixes to apply");
            return;
        }

        try {
            const updatedData = {
                ...transcriptionData,
                processingData: {
                    ...transcriptionData.processingData,
                    step2: {
                        ...transcriptionData.processingData?.step2,
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
            onClose();
        } catch (error) {
            console.error('Error applying AI fixes:', error);
            setError("Failed to apply AI fixes");
        }
    };

    const handleClear = () => {
        setAiChanges([]);
        setAiConfidence(0);
        setAiFixesAppliedToDatabase(false);
        setError(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        AI Autofix
                    </DialogTitle>
                    <DialogDescription>
                        Use AI to automatically fix transcription errors, improve word boundaries, and enhance sentence structure.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* AI Autofix Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="h-5 w-5 text-blue-600" />
                                AI Autofixer
                                <Badge variant="outline" className="text-xs">Beta</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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

                                {aiChanges.length > 0 && !aiFixesAppliedToDatabase && (
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
                                            onClick={handleClear}
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
                        </CardContent>
                    </Card>

                    {/* Human Correction Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-green-600" />
                                Human Correction
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">
                                For manual corrections, use the main editor interface. This dialog focuses on AI-powered autofix capabilities.
                            </div>
                        </CardContent>
                    </Card>

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
                </div>
            </DialogContent>
        </Dialog>
    );
}
