"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Search,
    Filter,
    Calendar,
    Clock,
    FileAudio,
    Tag,
    Loader2,
    Copy
} from "lucide-react";
import { useTranscriber } from "../contexts/transcriber-context";
import { Transcription } from "@/app/types/transcription";
import { toast } from "sonner";

export function ExplorerUI() {
    const { setSelectedTranscription, setCurrentView } = useTranscriber();
    const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
    const [filteredTranscriptions, setFilteredTranscriptions] = useState<Transcription[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [availableTags, setAvailableTags] = useState<string[]>([]);

    // Fetch transcriptions
    useEffect(() => {
        fetchTranscriptions();
    }, []);

    // Filter transcriptions based on search and tags
    useEffect(() => {
        let filtered = transcriptions;

        if (searchQuery) {
            filtered = filtered.filter(transcription =>
                transcription.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                transcription.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                transcription.audioUrl?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                transcription.language?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                transcription.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                transcription.keywords?.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        if (selectedTags.length > 0) {
            filtered = filtered.filter(transcription =>
                transcription.tags?.some(tag => selectedTags.includes(tag))
            );
        }

        setFilteredTranscriptions(filtered);
    }, [transcriptions, searchQuery, selectedTags]);

    const fetchTranscriptions = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/transcriptions');
            if (response.ok) {
                const data = await response.json();
                setTranscriptions(data.transcriptions || []);

                // Extract unique tags
                const tags = new Set<string>();
                data.transcriptions?.forEach((t: Transcription) => {
                    t.tags?.forEach(tag => tags.add(tag));
                });
                setAvailableTags(Array.from(tags));
            }
        } catch (error) {
            console.error('Error fetching transcriptions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTranscriptionSelect = (transcription: Transcription) => {
        setSelectedTranscription(transcription._id?.toString() || '');
        setCurrentView('editor');
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getDuration = (transcription: Transcription) => {
        if (transcription.captions && transcription.captions.length > 0) {
            const lastCaption = transcription.captions[transcription.captions.length - 1];
            return `${Math.round(lastCaption.absoluteEnd || 0)}s`;
        }
        return 'Unknown';
    };

    const copyAudioUrl = (e: React.MouseEvent, audioUrl: string | undefined) => {
        e.stopPropagation(); // Prevent card click
        
        if (!audioUrl) {
            toast.error('No audio URL available');
            return;
        }

        navigator.clipboard.writeText(audioUrl);
        toast.success('Audio URL copied to clipboard');
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading transcriptions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search transcriptions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>

                {/* Tags Filter */}
                {availableTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                            <Badge
                                key={tag}
                                variant={selectedTags.includes(tag) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => toggleTag(tag)}
                            >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Transcriptions Grid */}
            <ScrollArea className="flex-1">
                <div className="p-4">
                    {filteredTranscriptions.length === 0 ? (
                        <div className="text-center py-12">
                            <FileAudio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">No transcriptions found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery || selectedTags.length > 0
                                    ? "Try adjusting your search or filters"
                                    : "Start by creating your first transcription"
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredTranscriptions.map((transcription) => (
                                <div
                                    key={transcription._id?.toString()}
                                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleTranscriptionSelect(transcription)}
                                >
                                    {/* Title */}
                                    <div className="flex items-start gap-2 mb-2">
                                        <FileAudio className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <h3 className="font-medium text-sm line-clamp-2 flex-1">
                                            {transcription.title || 'Untitled Transcription'}
                                        </h3>
                                        <Badge variant="outline" className="text-xs flex-shrink-0">
                                            {transcription.language || 'auto'}
                                        </Badge>
                                    </div>

                                    {/* Description */}
                                    {transcription.description && (
                                        <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                            {transcription.description}
                                        </div>
                                    )}

                                    {/* Keywords and Tags in one row */}
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {/* Keywords */}
                                        {transcription.keywords && transcription.keywords.length > 0 && (
                                            <>
                                                {transcription.keywords.slice(0, 2).map((keyword, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                                                        {keyword}
                                                    </Badge>
                                                ))}
                                                {transcription.keywords.length > 2 && (
                                                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                                        +{transcription.keywords.length - 2}
                                                    </Badge>
                                                )}
                                            </>
                                        )}

                                        {/* Tags */}
                                        {transcription.tags && transcription.tags.length > 0 && (
                                            <>
                                                {transcription.tags.slice(0, 2).map((tag, index) => (
                                                    <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {transcription.tags.length > 2 && (
                                                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                                        +{transcription.tags.length - 2}
                                                    </Badge>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Metadata */}
                                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {getDuration(transcription)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(transcription.createdAt?.toString() || new Date().toISOString())}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => copyAudioUrl(e, transcription.audioUrl)}
                                            disabled={!transcription.audioUrl}
                                            className="h-6 px-2 text-xs"
                                        >
                                            <Copy className="h-3 w-3 mr-1" />
                                            Audio URL
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
