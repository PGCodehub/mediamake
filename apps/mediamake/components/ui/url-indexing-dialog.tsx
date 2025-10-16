"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { TagsSelector } from "./tags-selector";
import { cn } from "@/lib/utils";
import {
    Link,
    X,
    Check,
    AlertCircle,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useMedia } from "@/components/editor/media/media-context";
import { encrypt } from "@/lib/jwt";

interface UrlIndexingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onIndexingStart: (indexingId: string, indexingLimit: number, tags: string[]) => void;
    preselectedTags?: string[];
}

interface IndexingProgress {
    indexingId: string;
    status: 'pending' | 'indexing' | 'completed' | 'error';
    progress: number;
    error?: string;
}

export function UrlIndexingDialog({
    isOpen,
    onClose,
    onIndexingStart,
    preselectedTags = []
}: UrlIndexingDialogProps) {
    const { hashtagFilters } = useMedia();
    const [url, setUrl] = useState("");
    const [indexingLimit, setIndexingLimit] = useState(10);
    const [crawlVideos, setCrawlVideos] = useState(true);
    const [selectedTags, setSelectedTags] = useState<string[]>(preselectedTags);
    const [isIndexing, setIsIndexing] = useState(false);

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (isOpen) {
            setUrl("");
            setIndexingLimit(10);
            setCrawlVideos(true);
            // Use context tags if available, otherwise use preselected tags
            const tagsToUse = hashtagFilters.length > 0 ? hashtagFilters : preselectedTags;
            setSelectedTags(tagsToUse);
            setIsIndexing(false);
        }
    }, [isOpen, preselectedTags, hashtagFilters]);

    const startIndexing = async () => {
        if (!url.trim() || selectedTags.length === 0) return;

        try {
            setIsIndexing(true);
            console.log('Starting indexing with tags:', selectedTags);

            const response = await fetch('/api/ai-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    siteLinks: [url.trim()],
                    indexingLimit,
                    tags: selectedTags,
                    crawlVideos,
                    dbFolder: `mediamake/scraped/${process.env.NEXT_PUBLIC_DEV_CLIENT_ID || 'default'}`,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to start indexing');
            }

            const data = await response.json();
            const indexingId = data.indexingId;

            if (!indexingId) {
                throw new Error('No indexing ID returned');
            }

            // Call the callback to start progress tracking
            onIndexingStart(indexingId, indexingLimit, selectedTags);

        } catch (error) {
            console.error('Error starting indexing:', error);
            toast.error('Failed to start indexing');
            setIsIndexing(false);
        }
    };

    const handleClose = () => {
        setUrl("");
        setIndexingLimit(10);
        setCrawlVideos(true);
        setSelectedTags([]);
        setIsIndexing(false);
        onClose();
    };

    const canStartIndexing = url.trim().length > 0 && selectedTags.length > 0 && !isIndexing;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link className="h-5 w-5" />
                        URL Indexing
                    </DialogTitle>
                    <DialogDescription>
                        Index content from a URL and create media files from the results.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* URL Input */}
                    <div className="space-y-2">
                        <Label htmlFor="url">URL</Label>
                        <Input
                            id="url"
                            type="url"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>

                    {/* Indexing Limit */}
                    <div className="space-y-2">
                        <Label htmlFor="indexingLimit">Indexing Limit</Label>
                        <Input
                            id="indexingLimit"
                            type="number"
                            min="1"
                            max="100"
                            value={indexingLimit}
                            onChange={(e) => setIndexingLimit(parseInt(e.target.value) || 10)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Maximum number of items to index from the URL
                        </p>
                    </div>

                    {/* Crawl Videos Checkbox */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="crawlVideos"
                            checked={crawlVideos}
                            onCheckedChange={(checked) => setCrawlVideos(checked as boolean)}
                        />
                        <Label htmlFor="crawlVideos">Crawl Videos</Label>
                    </div>

                    {/* Tags Selector */}
                    <TagsSelector
                        selectedTags={selectedTags}
                        onTagsChange={setSelectedTags}
                        label="Tags"
                        required={true}
                    />

                </div>

                <DialogFooter className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={startIndexing}
                            disabled={!canStartIndexing}
                            className="min-w-[120px]"
                        >
                            {isIndexing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Starting...
                                </>
                            ) : (
                                'Start Indexing'
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
