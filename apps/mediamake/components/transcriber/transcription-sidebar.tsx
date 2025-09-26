"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Clock,
    CheckCircle,
    XCircle,
    Download,
    AlertCircle,
    Play,
    FileAudio,
    Calendar,
    Hash,
    Plus,
    RefreshCw,
    Database,
    Cloud
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Transcription } from "@/app/types/transcription";

interface AssemblyTranscription {
    id: string;
    status: string;
    created: string;
    audio_url?: string;
    language_code?: string;
    text?: string;
    confidence?: number;
    audio_duration?: number;
}

interface TranscriptionSidebarProps {
    selectedTranscription: string | null;
    onSelectTranscription: (transcriptionId: string) => void;
    onNewTranscription: () => void;
}

export function TranscriptionSidebar({ selectedTranscription, onSelectTranscription, onNewTranscription }: TranscriptionSidebarProps) {
    const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
    const [assemblyTranscriptions, setAssemblyTranscriptions] = useState<AssemblyTranscription[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshingAssembly, setIsRefreshingAssembly] = useState(false);

    // Load transcriptions from MongoDB
    useEffect(() => {
        const loadTranscriptions = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/transcriptions');
                if (response.ok) {
                    const data = await response.json();
                    setTranscriptions(data.transcriptions || []);
                }
            } catch (error) {
                console.error('Error loading transcriptions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadTranscriptions();
    }, []);

    const getStatusIcon = (status: Transcription["status"]) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "processing":
                return <Play className="h-4 w-4 text-blue-500" />;
            case "failed":
                return <XCircle className="h-4 w-4 text-red-500" />;
            case "step1":
            case "step2":
            case "step3":
                return <Clock className="h-4 w-4 text-yellow-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: Transcription["status"]) => {
        const variants = {
            completed: "default",
            processing: "secondary",
            failed: "destructive",
            step1: "outline",
            step2: "outline",
            step3: "outline",
            step4: "outline"
        } as const;

        return (
            <Badge variant={variants[status]} className="text-xs">
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleString();
    };

    const getAudioFileName = (audioUrl: string) => {
        try {
            const url = new URL(audioUrl);
            const pathname = url.pathname;
            const filename = pathname.split('/').pop() || 'Unknown';
            return filename.length > 20 ? filename.substring(0, 20) + '...' : filename;
        } catch {
            return 'Unknown';
        }
    };

    const fetchAssemblyTranscriptions = async () => {
        setIsRefreshingAssembly(true);
        try {
            const response = await fetch('/api/transcribe/assembly');
            if (!response.ok) {
                throw new Error('Failed to fetch Assembly transcriptions');
            }
            const data = await response.json();
            setAssemblyTranscriptions(data.transcripts.transcripts || []);
        } catch (error) {
            console.error('Error fetching Assembly transcriptions:', error);
        } finally {
            setIsRefreshingAssembly(false);
        }
    };

    const handleAssemblyTranscriptionSelect = async (transcriptionId: string) => {
        try {
            const response = await fetch(`/api/transcribe/assembly?id=${transcriptionId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch transcription details');
            }
            const result = await response.json();

            console.log('Result:', result);

            if (!result.success) {
                throw new Error(result.error || 'Failed to load transcription');
            }

            // Save to MongoDB via our API
            const saveResponse = await fetch('/api/transcriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    assemblyId: result.id,
                    audioUrl: result.audio_url || "",
                    language: result.language_code,
                    status: 'completed',
                    captions: result.captions,
                    processingData: {
                        step1: {
                            rawText: result.captions.map((caption: any) => caption.text).join(' ')
                        }
                    }
                }),
            });

            if (saveResponse.ok) {
                const savedTranscription = await saveResponse.json();
                // Refresh the local transcriptions list
                const refreshResponse = await fetch('/api/transcriptions');
                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    setTranscriptions(refreshData.transcriptions || []);
                }
                onSelectTranscription(savedTranscription.transcription._id);
            }
        } catch (error) {
            console.error('Error loading Assembly transcription:', error);
        }
    };

    const handleTranscriptionSelect = (transcriptionId: string) => {
        onSelectTranscription(transcriptionId);
    };

    if (isLoading) {
        return (
            <div className="w-80 border-r bg-background p-4">
                <h2 className="text-lg font-semibold mb-4">Transcription History</h2>
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-w-90 border-r bg-background overflow-hidden">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold">Transcription History</h2>
                    <Button
                        onClick={onNewTranscription}
                        size="sm"
                        className="h-8 px-3"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        New
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="local" className="w-full mx-2">
                <TabsList className="grid grid-cols-2 px-4 mt-4">
                    <TabsTrigger value="local" className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Saved to DB
                    </TabsTrigger>
                    <TabsTrigger value="assembly" className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        Assembly
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="local" className="mt-0">
                    <div className="p-4 border-b">
                        <p className="text-sm text-muted-foreground">
                            {transcriptions?.length || 0} local transcriptions
                        </p>
                    </div>

                    <ScrollArea className="h-[calc(100vh-12rem)] overflow-y-auto">
                        <div className="space-y-3 py-8">
                            {transcriptions?.map((transcription) => (
                                <div
                                    key={transcription._id?.toString()}
                                    className={cn(
                                        "w-full cursor-pointer transition-all hover:shadow-md py-2 rounded-md p-2",
                                        selectedTranscription === transcription._id?.toString() && ""
                                    )}
                                    onClick={() => handleTranscriptionSelect(transcription._id?.toString() || '')}
                                >
                                    <div className="flex items-start justify-between p-2">
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                            {getStatusIcon(transcription.status)}
                                            {transcription.processingData.step1?.rawText?.slice(0, 20)}...
                                        </h4>
                                        {getStatusBadge(transcription.status)}
                                    </div>
                                    <div className="py-0 px-2">
                                        <div className="space-y-0">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(transcription.createdAt)}
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Hash className="h-3 w-3" />
                                                {getAudioFileName(transcription.audioUrl)}
                                            </div>
                                            {transcription.tags && transcription.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {transcription.tags.slice(0, 2).map((tag, index) => (
                                                        <Badge key={index} variant="outline" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {transcription.tags.length > 2 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{transcription.tags.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                            {transcription.error && (
                                                <div className="text-xs text-red-500">
                                                    {transcription.error}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {transcriptions?.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FileAudio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-sm">No transcriptions found</p>
                                    <p className="text-xs">Start a new transcription to get started</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="assembly" className="mt-0">
                    <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {assemblyTranscriptions?.length || 0} Assembly transcriptions
                            </p>
                            <Button
                                onClick={fetchAssemblyTranscriptions}
                                size="sm"
                                variant="outline"
                                disabled={isRefreshingAssembly}
                                className="h-8 px-3"
                            >
                                <RefreshCw className={cn("h-4 w-4 mr-1", isRefreshingAssembly && "animate-spin")} />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="h-[calc(100vh-12rem)] overflow-y-auto">
                        <div className="p-4 space-y-3">
                            {assemblyTranscriptions?.map((transcription) => (
                                <Card
                                    key={transcription.id}
                                    className="cursor-pointer transition-all hover:shadow-md"
                                    onClick={() => handleAssemblyTranscriptionSelect(transcription.id)}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                <Cloud className="h-4 w-4 text-blue-500" />
                                                Assembly ID: {transcription.id.slice(0, 8)}...
                                            </CardTitle>
                                            <Badge variant="outline" className="text-xs">
                                                {transcription.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(transcription.created)}
                                            </div>
                                            {transcription.language_code && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Hash className="h-3 w-3" />
                                                    {transcription.language_code}
                                                </div>
                                            )}
                                            {transcription.audio_duration && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {Math.round(transcription.audio_duration)}s
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {assemblyTranscriptions?.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Cloud className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-sm">No Assembly transcriptions found</p>
                                    <p className="text-xs">Click refresh to load from AssemblyAI</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}