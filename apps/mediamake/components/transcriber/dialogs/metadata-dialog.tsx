"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Brain,
    BarChart3,
    CheckCircle2,
    Loader2,
    Sparkles,
    Eye,
    Edit3,
    Heart,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Transcription } from "@/app/types/transcription";
import {
    analyzeTranscriptionMetadata,
    getHighImpactSentences,
    TranscriptionMetadataResult,
    createAnalysisSummary
} from "../transcription-metadata";
import { toast } from "sonner";

interface MetadataDialogProps {
    isOpen: boolean;
    onClose: () => void;
    transcriptionData: Transcription;
    onTranscriptionDataUpdate: (data: any) => void;
    onRefreshTranscription?: () => Promise<void>;
}

export function MetadataDialog({
    isOpen,
    onClose,
    transcriptionData,
    onTranscriptionDataUpdate,
    onRefreshTranscription
}: MetadataDialogProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [metadataResult, setMetadataResult] = useState<TranscriptionMetadataResult | null>(null);
    const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [shouldGenerateOverallAnalysis, setShouldGenerateOverallAnalysis] = useState(false);
    const [userRequest, setUserRequest] = useState("");

    // Load existing metadata if available
    useEffect(() => {
        if (transcriptionData.processingData?.step4?.metadata) {
            setMetadataResult(transcriptionData.processingData.step4.metadata);
        }
    }, [transcriptionData]);

    const generateMetadata = async () => {
        if (!transcriptionData.captions) {
            setError("No captions available for metadata generation");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const result = await analyzeTranscriptionMetadata(
                transcriptionData.assemblyId,
                shouldGenerateOverallAnalysis,
                userRequest || undefined
            );

            if (!result) {
                setError("Failed to generate metadata");
                toast.error("Failed to generate metadata");
                return;
            }

            setMetadataResult(result);

            if (onRefreshTranscription && typeof onRefreshTranscription === 'function') {
                await onRefreshTranscription();
            }

            toast.success("Metadata generated and saved successfully!");

        } catch (err) {
            console.error("Error generating metadata:", err);
            setError(err instanceof Error ? err.message : "Failed to generate metadata");
        } finally {
            setIsGenerating(false);
        }
    };

    const getFeelColor = (feel: string) => {
        const colors: Record<string, string> = {
            joyful: "bg-yellow-100 text-yellow-800 border-yellow-200",
            melancholic: "bg-blue-100 text-blue-800 border-blue-200",
            energetic: "bg-red-100 text-red-800 border-red-200",
            calm: "bg-green-100 text-green-800 border-green-200",
            dramatic: "bg-purple-100 text-purple-800 border-purple-200",
            romantic: "bg-pink-100 text-pink-800 border-pink-200",
            aggressive: "bg-orange-100 text-orange-800 border-orange-200",
            hopeful: "bg-emerald-100 text-emerald-800 border-emerald-200",
            nostalgic: "bg-indigo-100 text-indigo-800 border-indigo-200",
            mysterious: "bg-gray-100 text-gray-800 border-gray-200",
            triumphant: "bg-amber-100 text-amber-800 border-amber-200",
            sorrowful: "bg-slate-100 text-slate-800 border-slate-200",
            playful: "bg-cyan-100 text-cyan-800 border-cyan-200",
            intense: "bg-rose-100 text-rose-800 border-rose-200",
            peaceful: "bg-teal-100 text-teal-800 border-teal-200"
        };
        return colors[feel] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    const getStrengthColor = (strength: number) => {
        if (strength >= 8) return "text-red-600";
        if (strength >= 6) return "text-orange-600";
        if (strength >= 4) return "text-yellow-600";
        return "text-green-600";
    };

    if (!transcriptionData.captions || transcriptionData.captions.length === 0) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            Metadata Generation
                        </DialogTitle>
                        <DialogDescription>
                            No captions available. Please complete the previous steps first.
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Lyricography Metadata Analysis
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header */}
                    <Card>
                        <CardHeader>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            Generate AI-powered metadata for each sentence including emotional analysis,
                                            keyword extraction, and split recommendations for optimal lyricography.
                                        </p>
                                        {metadataResult && (
                                            <div className="text-sm text-green-600 flex items-center gap-1">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Metadata generated successfully
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        onClick={generateMetadata}
                                        disabled={isGenerating}
                                        className="flex items-center gap-2"
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-4 w-4" />
                                        )}
                                        {isGenerating ? "Generating..." : "Generate Metadata"}
                                    </Button>
                                </div>

                                {/* User Request Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="userRequest" className="text-sm font-medium">
                                        Specific Request (Optional)
                                    </Label>
                                    <Textarea
                                        id="userRequest"
                                        value={userRequest}
                                        onChange={(e) => setUserRequest(e.target.value)}
                                        placeholder="e.g., Focus on emotional keywords, emphasize dramatic moments, highlight technical terms..."
                                        rows={3}
                                        className="resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Provide specific instructions for how you want the metadata analysis to be tailored.
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="text-red-700">{error}</div>
                        </div>
                    )}

                    {metadataResult && metadataResult.sentences && (
                        <>
                            {/* Analysis Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Analysis Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-primary">
                                                {metadataResult.totalSentences}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Total Sentences</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {getHighImpactSentences(metadataResult).length}
                                            </div>
                                            <div className="text-sm text-muted-foreground">High Impact</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {metadataResult.confidence?.toFixed(1) || 'N/A'}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Avg Confidence</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {metadataResult.averageStrength?.toFixed(1)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Avg Strength</div>
                                        </div>
                                    </div>

                                    <Separator className="my-4" />

                                    {metadataResult.overallAnalysis && (
                                        <div className="space-y-2">
                                            <div>
                                                <span className="font-medium">Overall Mood:</span> {metadataResult.overallAnalysis.overallMood}
                                            </div>
                                            <div>
                                                <span className="font-medium">Key Themes:</span> {metadataResult.overallAnalysis.keyThemes.join(", ")}
                                            </div>
                                            <div>
                                                <span className="font-medium">Emotional Arc:</span> {metadataResult.overallAnalysis.emotionalArc}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Sentences List */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Sentence Selection */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Eye className="h-5 w-5" />
                                            Sentence Analysis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[400px]">
                                            <div className="space-y-3">
                                                {metadataResult.sentences.map((sentence, index) => (
                                                    <div
                                                        key={index}
                                                        className={cn(
                                                            "p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                                                            selectedSentenceIndex === index
                                                                ? "border-primary bg-primary/5"
                                                                : "border-border hover:border-primary/50"
                                                        )}
                                                        onClick={() => setSelectedSentenceIndex(index)}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium mb-2 line-clamp-2">
                                                                    {sentence.originalText}
                                                                </div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn("text-xs", getFeelColor(sentence.metadata.keywordFeel))}
                                                                    >
                                                                        <Heart className="h-3 w-3 mr-1" />
                                                                        {sentence.metadata.keywordFeel}
                                                                    </Badge>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn("text-xs", getStrengthColor(sentence.metadata.strength))}
                                                                    >
                                                                        <Zap className="h-3 w-3 mr-1" />
                                                                        {sentence.metadata.strength}/10
                                                                    </Badge>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    Keyword: {sentence.metadata.keyword}
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                #{index + 1}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>

                                {/* Selected Sentence Details */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Edit3 className="h-5 w-5" />
                                            Sentence Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedSentenceIndex !== null ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="font-medium mb-2">Selected Sentence:</h4>
                                                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                                        {metadataResult.sentences[selectedSentenceIndex].originalText}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h4 className="font-medium mb-2">Metadata:</h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <span className="font-medium">Keyword:</span> {metadataResult.sentences[selectedSentenceIndex].metadata.keyword}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Feel:</span> {metadataResult.sentences[selectedSentenceIndex].metadata.keywordFeel}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Strength:</span> {metadataResult.sentences[selectedSentenceIndex].metadata.strength}/10
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                                <div className="text-center">
                                                    <Edit3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                    <p>Select a sentence to view its metadata</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}

                    {!metadataResult && !isGenerating && (
                        <Card>
                            <CardContent className="flex items-center justify-center h-[200px]">
                                <div className="text-center">
                                    <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <h3 className="text-lg font-semibold mb-2">Ready to Generate Metadata</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Click "Generate Metadata" to analyze your transcription for lyricography insights.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
