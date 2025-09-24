"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
    analyzeTranscriptionMetadata,
    extractSentencesFromTranscription,
    getDominantFeel,
    type TranscriptionMetadataResult
} from "@/lib/transcription-metadata";
import { cn } from "@/lib/utils";
import { TranscriptionSentence } from "@microfox/datamotion";
import {
    AlertCircle,
    Brain,
    CheckCircle,
    Loader2,
    Scissors,
    TrendingUp,
    Zap
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TranscriptionMetadataAnalyzerProps {
    transcriptionSentences?: TranscriptionSentence[];
    onAnalysisComplete?: (result: TranscriptionMetadataResult) => void;
}

export function TranscriptionMetadataAnalyzer({
    transcriptionSentences,
    onAnalysisComplete,
}: TranscriptionMetadataAnalyzerProps) {
    const [inputText, setInputText] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<TranscriptionMetadataResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!inputText.trim() && !transcriptionSentences) {
            setError("Please provide text to analyze");
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            let sentences: string[];

            if (transcriptionSentences) {
                sentences = extractSentencesFromTranscription(transcriptionSentences);
            } else {
                // Split input text into sentences
                sentences = inputText
                    .split(/[.!?]+/)
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
            }

            if (sentences.length === 0) {
                throw new Error("No valid sentences found");
            }

            const result = await analyzeTranscriptionMetadata(sentences, false);
            setAnalysisResult(result);
            if (!result) {
                throw new Error("Failed to generate metadata");
            }
            onAnalysisComplete?.(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Analysis failed");
            toast.error("Analysis failed");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getFeelColor = (feel: string) => {
        const colors = {
            joyful: "bg-yellow-100 text-yellow-800",
            melancholic: "bg-blue-100 text-blue-800",
            energetic: "bg-red-100 text-red-800",
            calm: "bg-green-100 text-green-800",
            dramatic: "bg-purple-100 text-purple-800",
            romantic: "bg-pink-100 text-pink-800",
            aggressive: "bg-orange-100 text-orange-800",
            hopeful: "bg-emerald-100 text-emerald-800",
            nostalgic: "bg-indigo-100 text-indigo-800",
            mysterious: "bg-gray-100 text-gray-800",
            triumphant: "bg-amber-100 text-amber-800",
            sorrowful: "bg-slate-100 text-slate-800",
            playful: "bg-cyan-100 text-cyan-800",
            intense: "bg-rose-100 text-rose-800",
            peaceful: "bg-teal-100 text-teal-800",
        };
        return colors[feel as keyof typeof colors] || "bg-gray-100 text-gray-800";
    };

    const getStrengthColor = (strength: number) => {
        if (strength >= 8) return "text-red-600";
        if (strength >= 6) return "text-orange-600";
        if (strength >= 4) return "text-yellow-600";
        return "text-gray-600";
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Transcription Metadata Analyzer
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!transcriptionSentences && (
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                Enter sentences to analyze (one per line or separated by periods):
                            </label>
                            <Textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Enter your sentences here...&#10;Example:&#10;I love the way you smile&#10;When the sun goes down&#10;We dance in the moonlight"
                                rows={6}
                                className="w-full"
                            />
                        </div>
                    )}

                    {transcriptionSentences && (
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                Analyzing {transcriptionSentences.length} sentences from transcription
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || (!inputText.trim() && !transcriptionSentences)}
                        className="w-full"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Brain className="h-4 w-4 mr-2" />
                                Analyze Metadata
                            </>
                        )}
                    </Button>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {analysisResult && (
                <div className="space-y-6">
                    {/* Summary Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Analysis Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {analysisResult.totalSentences}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Total Sentences</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {analysisResult.splitRecommendations}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Recommended Splits</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {analysisResult.averageStrength.toFixed(1)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Avg Strength</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {getDominantFeel(analysisResult)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Dominant Feel</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Overall Analysis */}
                    {analysisResult.overallAnalysis && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Overall Analysis</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">Mood & Theme</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {analysisResult.overallAnalysis.overallMood}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2">Recommended Structure</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {analysisResult.overallAnalysis.recommendedStructure}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2">Key Themes</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisResult.overallAnalysis.keyThemes.map((theme, index) => (
                                            <Badge key={index} variant="secondary">
                                                {theme}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2">Emotional Arc</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {analysisResult.overallAnalysis.emotionalArc}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Sentence Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Scissors className="h-5 w-5" />
                                Sentence Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                <div className="space-y-4">
                                    {analysisResult.sentences.map((sentence, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "p-4 border rounded-lg",
                                                sentence.metadata.shouldSplit
                                                    ? "border-green-200 bg-green-50"
                                                    : "border-gray-200 bg-gray-50"
                                            )}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm mb-1">
                                                        Sentence {sentence.sentenceIndex + 1}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        "{sentence.originalText}"
                                                    </p>
                                                </div>
                                                {sentence.metadata.shouldSplit && (
                                                    <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-2">
                                                <Badge className={getFeelColor(sentence.metadata.feel)}>
                                                    {sentence.metadata.feel}
                                                </Badge>
                                                <Badge variant="outline">
                                                    <Zap className="h-3 w-3 mr-1" />
                                                    <span className={getStrengthColor(sentence.metadata.strength)}>
                                                        {sentence.metadata.strength}/10
                                                    </span>
                                                </Badge>
                                                <Badge variant="outline">
                                                    Keyword: {sentence.metadata.keyword}
                                                </Badge>
                                            </div>

                                            <div className="text-xs text-muted-foreground">
                                                <p>
                                                    <strong>Split Reason:</strong> {sentence.metadata.splitReason.replace('_', ' ')}
                                                </p>
                                                <p>
                                                    <strong>Confidence:</strong> {(sentence.metadata.confidence * 100).toFixed(0)}%
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
