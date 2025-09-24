"use client";

import { Transcription } from "@/app/types/transcription";
import { JsonEditor } from "@/components/editor/player/json-editor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    analyzeTranscriptionMetadata,
    getHighImpactSentences,
    TranscriptionMetadataResult,
    createAnalysisSummary
} from "@/lib/transcription-metadata";
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    BarChart3,
    Brain,
    CheckCircle2,
    Edit3,
    Eye,
    Heart,
    Loader2,
    Plus,
    RotateCcw,
    Save,
    Scissors,
    Sparkles,
    Tag,
    X,
    Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Step4MetadataEditorProps {
    transcriptionData: Transcription;
    onTranscriptionDataUpdate: (data: any) => void;
    onStepChange: (step: number) => void;
}

export function Step4MetadataEditor({
    transcriptionData,
    onTranscriptionDataUpdate,
    onStepChange
}: Step4MetadataEditorProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [metadataResult, setMetadataResult] = useState<TranscriptionMetadataResult | null>(null);
    const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [shouldGenerateOverallAnalysis, setShouldGenerateOverallAnalysis] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    // Load existing metadata if available
    useEffect(() => {
        if (transcriptionData.processingData?.step4?.metadata) {
            setMetadataResult(transcriptionData.processingData.step4.metadata);
        }
    }, [transcriptionData]);

    // Load existing tags
    useEffect(() => {
        setTags(transcriptionData.tags || []);
    }, [transcriptionData.tags]);

    const generateMetadata = async () => {
        if (!transcriptionData.captions) {
            setError("No captions available for metadata generation");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            // Extract sentences from captions
            const sentences = transcriptionData.captions.map(caption => caption.text.trim());

            // Generate metadata using the AI agent
            const result = await analyzeTranscriptionMetadata(sentences, shouldGenerateOverallAnalysis);

            if (!result) {
                setError("Failed to generate metadata");
                toast.error("Failed to generate metadata");
                return;
            }

            setMetadataResult(result);

            // Save to transcription data
            const updatedData = {
                ...transcriptionData,
                status: "completed",
                captions: transcriptionData.captions.map((caption, index) => {
                    const resultSentence = index < result.sentences.length ? result.sentences[index] : null;
                    return {
                        ...caption,
                        metadata: resultSentence?.metadata,
                    }
                }),
                processingData: {
                    ...transcriptionData.processingData,
                    step4: {
                        ...transcriptionData.processingData?.step4,
                        metadata: result,
                        generatedAt: new Date().toISOString()
                    }
                }
            };
            onTranscriptionDataUpdate(updatedData);
        } catch (err) {
            console.error("Error generating metadata:", err);
            setError(err instanceof Error ? err.message : "Failed to generate metadata");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSentenceSelect = (index: number) => {
        setSelectedSentenceIndex(index);
        setIsEditing(false);
    };

    const handleMetadataEdit = (updatedMetadata: any) => {
        if (selectedSentenceIndex === null || !metadataResult) return;

        const updatedSentences = [...metadataResult.sentences];
        updatedSentences[selectedSentenceIndex] = {
            ...updatedSentences[selectedSentenceIndex],
            metadata: updatedMetadata
        };

        const updatedResult = {
            ...metadataResult,
            sentences: updatedSentences
        };

        setMetadataResult(updatedResult);
    };

    const saveMetadataChanges = async () => {
        if (!metadataResult) return;

        setIsSaving(true);
        try {
            const updatedData = {
                ...transcriptionData,
                status: "completed",
                captions: transcriptionData.captions.map((caption, index) => {
                    const resultSentence = index < metadataResult.sentences.length ? metadataResult.sentences[index] : null;
                    return {
                        ...caption,
                        metadata: resultSentence?.metadata,
                    }
                }),
                processingData: {
                    ...transcriptionData.processingData,
                    step4: {
                        ...transcriptionData.processingData?.step4,
                        metadata: metadataResult,
                        updatedAt: new Date().toISOString()
                    }
                }
            };

            onTranscriptionDataUpdate(updatedData);
            setIsEditing(false);
        } catch (err) {
            console.error("Error saving metadata:", err);
            setError("Failed to save metadata changes");
        } finally {
            setIsSaving(false);
        }
    };

    const addTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            const updatedTags = [...tags, newTag.trim()];
            setTags(updatedTags);
            setNewTag("");

            // Update transcription data
            const updatedData = {
                ...transcriptionData,
                tags: updatedTags
            };
            onTranscriptionDataUpdate(updatedData);
            toast.success("Tag added successfully");
        }
    };

    const removeTag = (tagToRemove: string) => {
        const updatedTags = tags.filter(tag => tag !== tagToRemove);
        setTags(updatedTags);

        // Update transcription data
        const updatedData = {
            ...transcriptionData,
            tags: updatedTags
        };
        onTranscriptionDataUpdate(updatedData);
        toast.success("Tag removed successfully");
    };

    const handleTagKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Metadata Generation
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            No captions available. Please complete the previous steps first.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    // console.log(metadataResult);

    // if (!metadataResult || !metadataResult.sentences) {
    //     return (
    //         <Card>
    //             <CardHeader>
    //                 <CardTitle className="flex items-center gap-2">
    //                     <Brain className="h-5 w-5" />
    //                     Metadata Generation
    //                 </CardTitle>
    //             </CardHeader>
    //             <CardContent>
    //                 <Alert>
    //                     <AlertCircle className="h-4 w-4" />
    //                     <AlertDescription>
    //                         No metadata available. Please generate metadata first.
    //                     </AlertDescription>
    //                 </Alert>
    //             </CardContent>
    //         </Card>
    //     );
    // }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Lyricography Metadata Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
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

                        <Separator />

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="overall-analysis"
                                checked={shouldGenerateOverallAnalysis}
                                onCheckedChange={(checked) => setShouldGenerateOverallAnalysis(checked as boolean)}
                            />
                            <Label htmlFor="overall-analysis" className="text-sm">
                                Generate overall analysis (mood, themes, emotional arc)
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Overall analysis provides additional insights but may take longer to generate. ( VERY COSTLY )
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Tags Management */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Transcription Tags
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Add Tag Input */}
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Add a new tag..."
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyPress={handleTagKeyPress}
                                className="flex-1"
                            />
                            <Button
                                onClick={addTag}
                                disabled={!newTag.trim() || tags.includes(newTag.trim())}
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add
                            </Button>
                        </div>

                        {/* Tags Display */}
                        {tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="flex items-center gap-1 px-3 py-1"
                                    >
                                        <Tag className="h-3 w-3" />
                                        {tag}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                            onClick={() => removeTag(tag)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No tags added yet. Add tags to help organize and categorize your transcriptions.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
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
                                    <div className="text-2xl font-bold text-red-600">
                                        {metadataResult.splitRecommendations}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Split Recommendations</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {metadataResult.averageStrength?.toFixed(1)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Avg Strength</div>
                                </div>
                            </div>

                            <Separator className="my-4" />

                            {metadataResult.overallAnalysis && <div className="space-y-2">
                                <div>
                                    <span className="font-medium">Overall Mood:</span> {metadataResult.overallAnalysis.overallMood}
                                </div>
                                <div>
                                    <span className="font-medium">Key Themes:</span> {metadataResult.overallAnalysis.keyThemes.join(", ")}
                                </div>
                                <div>
                                    <span className="font-medium">Emotional Arc:</span> {metadataResult.overallAnalysis.emotionalArc}
                                </div>
                            </div>}
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
                                <ScrollArea className="h-[500px]">
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
                                                onClick={() => handleSentenceSelect(index)}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium mb-2 line-clamp-2">
                                                            {sentence.originalText}
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn("text-xs", getFeelColor(sentence.metadata.feel))}
                                                            >
                                                                <Heart className="h-3 w-3 mr-1" />
                                                                {sentence.metadata.feel}
                                                            </Badge>
                                                            <Badge
                                                                variant="outline"
                                                                className={cn("text-xs", getStrengthColor(sentence.metadata.strength))}
                                                            >
                                                                <Zap className="h-3 w-3 mr-1" />
                                                                {sentence.metadata.strength}/10
                                                            </Badge>
                                                            {sentence.metadata.shouldSplit && (
                                                                <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                                                                    <Scissors className="h-3 w-3 mr-1" />
                                                                    Split
                                                                </Badge>
                                                            )}
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

                        {/* Metadata Editor */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Edit3 className="h-5 w-5" />
                                    Metadata Editor
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
                                            <h4 className="font-medium mb-2">Edit Metadata:</h4>
                                            <JsonEditor
                                                value={metadataResult.sentences[selectedSentenceIndex].metadata}
                                                onChange={handleMetadataEdit}
                                                height="300px"
                                                className="border rounded-md"
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                onClick={saveMetadataChanges}
                                                disabled={isSaving}
                                                className="flex items-center gap-2"
                                            >
                                                {isSaving ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Save className="h-4 w-4" />
                                                )}
                                                {isSaving ? "Saving..." : "Save Changes"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => setSelectedSentenceIndex(null)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                                        <div className="text-center">
                                            <Edit3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>Select a sentence to edit its metadata</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={() => onStepChange(3)}
                            className="flex items-center gap-2"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Back to Caption Editor
                        </Button>
                        <Button
                            onClick={() => onStepChange(5)}
                            className="flex items-center gap-2"
                        >
                            Continue to Next Step
                        </Button>
                    </div>

                    {/* Analysis Summary - Only show if overall analysis was generated */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Detailed Analysis Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted p-4 rounded-lg">
                                <pre className="text-sm whitespace-pre-wrap font-mono">
                                    {createAnalysisSummary(metadataResult)}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {!metadataResult && !isGenerating && (
                <Card>
                    <CardContent className="flex items-center justify-center h-[300px]">
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
    );
}
