"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { UrlIndexingDialog } from "./url-indexing-dialog";
import { cn } from "@/lib/utils";
import { RagImageMetadata } from "@/app/types/media";

interface UrlIndexingTriggerProps {
    onIndexingComplete?: (mediaFiles: any[]) => void;
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg";
    className?: string;
    children?: React.ReactNode;
    uiType?: "button" | "dropzone";
    dropzoneClassName?: string;
    preselectedTags?: string[];
}

export function UrlIndexingTrigger({
    onIndexingComplete,
    variant = "default",
    size = "default",
    className,
    children,
    uiType = "button",
    dropzoneClassName,
    preselectedTags = []
}: UrlIndexingTriggerProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isIndexing, setIsIndexing] = useState(false);
    const [indexingStatus, setIndexingStatus] = useState<string>("");
    const [indexingProgress, setIndexingProgress] = useState<number>(0);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const dropzoneRef = useRef<HTMLDivElement>(null);

    const handleIndexingComplete = (mediaFiles: any[]) => {
        onIndexingComplete?.(mediaFiles);
        setIsDialogOpen(false);
    };

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, []);

    // Poll indexing progress - simple and clean
    const pollIndexingProgress = async (id: string) => {
        // Clear any existing polling
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        const checkProgress = async () => {
            try {
                const response = await fetch(`/api/ai-analysis/check?indexingId=${id}&topK=10`);

                if (!response.ok) {
                    throw new Error('Failed to check indexing progress');
                }

                const data = await response.json();

                if (data.success && data.data?.indexing) {
                    const progressData = data.data.indexing;
                    const progress = Math.min(progressData.progress || 0, 100);

                    setIndexingProgress(progress);
                    setIndexingStatus(`Indexing progress: ${Math.round(progress)}%`);

                    // If indexing is complete, process results and stop polling
                    if (progressData.isFullyIndexed) {
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }

                        setIndexingProgress(100);
                        setIndexingStatus("Indexing completed! Processing results...");

                        // Process results - backend handles deduplication
                        await processIndexingResults(data.data);
                    }
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (error) {
                console.error('Error polling indexing progress:', error);
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                setIsIndexing(false);
                setIndexingStatus("Indexing failed");
            }
        };

        // Run immediately first
        await checkProgress();

        // Then start interval polling
        const pollInterval = setInterval(checkProgress, 10000);
        pollingIntervalRef.current = pollInterval;
    };

    const processIndexingResults = async (data: any) => {
        try {
            console.log('Processing indexing results:', data);
            const results: {
                id: string;
                data: string;
                metadata: RagImageMetadata;
                score: number;
            }[] = data.results || [];

            console.log(`Found ${results.length} results to process`, results.map(result => result.metadata.src));

            // Create media file entries for all results in parallel
            const mediaFilePromises = results.map(async (result) => {
                const metadata = result.metadata;
                const mediaUrl = metadata.src;

                if (mediaUrl) {
                    const mediaFileData = {
                        tags: preselectedTags,
                        contentType: metadata.mediaType || 'image',
                        contentMimeType: metadata.mimeType || 'image/jpeg',
                        contentSubType: 'indexed',
                        contentSource: metadata.platform || 'web',
                        contentSourceUrl: metadata.pagePermalink || metadata.platformUrl || mediaUrl,
                        fileName: result.id || `indexed-${Date.now()}`,
                        fileSize: 0,
                        filePath: mediaUrl,
                        metadata: metadata,
                    };

                    try {
                        const response = await fetch('/api/media-files', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(mediaFileData),
                        });

                        if (response.ok) {
                            const mediaFile = await response.json();
                            console.log('Successfully created media file:', mediaFile);
                            return mediaFile;
                        } else {
                            console.log('Media file already exists or failed to create');
                            return null;
                        }
                    } catch (error) {
                        console.error('Error creating media file:', error);
                        return null;
                    }
                }
                return null;
            });

            // Wait for all media files to be created in parallel
            const createdMediaFiles = await Promise.all(mediaFilePromises);
            const validMediaFiles = createdMediaFiles.filter(file => file !== null);

            setIndexingStatus("Indexing completed!");
            onIndexingComplete?.(validMediaFiles);

            // Reset after 2 seconds
            setTimeout(() => {
                setIsIndexing(false);
                setIndexingStatus("");
                setIndexingProgress(0);
            }, 2000);

        } catch (error) {
            console.error('Error processing indexing results:', error);
            setIndexingStatus("Failed to process results");
            setIsIndexing(false);
        }
    };

    // Handle clipboard paste for URLs
    const handlePaste = async (e: ClipboardEvent) => {
        e.preventDefault();

        const items = e.clipboardData?.items;
        if (!items) return;

        const urls: string[] = [];

        // Process all items first
        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (item.kind === 'string' && item.type === 'text/plain') {
                // Use a promise to handle the async getAsString
                const text = await new Promise<string>((resolve) => {
                    item.getAsString((text) => resolve(text));
                });

                // Check if it's a URL
                try {
                    const url = new URL(text);
                    if (url.protocol === 'http:' || url.protocol === 'https:') {
                        console.log('Valid URL detected:', text);
                        urls.push(text);
                    }
                } catch (error) {
                    console.log('Invalid URL:', text, error);
                }
            }
        }

        // Handle URLs from clipboard
        if (urls.length > 0) {
            console.log('Processing URLs for indexing:', urls);
            setIsIndexing(true);
            setIndexingStatus(`Starting indexing for ${urls.length} URL${urls.length > 1 ? 's' : ''}...`);

            // Open dialog with URLs pre-filled
            setIsDialogOpen(true);
            setIsIndexing(false);
            setIndexingStatus("");
        }
    };

    // Handle paste only when dropzone is focused
    const handleDropzonePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        await handlePaste(e.nativeEvent);
    };

    if (uiType === "dropzone") {
        return (
            <>
                <div className="relative">
                    <div
                        ref={dropzoneRef}
                        className={cn(
                            "border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            dropzoneClassName
                        )}
                        onClick={() => setIsDialogOpen(true)}
                        onPaste={handleDropzonePaste}
                        tabIndex={0}
                    >
                        <Link className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm font-medium mb-2">Index from Websites</p>
                        <p className="text-xs text-muted-foreground">
                            Click & Paste your URLs
                        </p>
                    </div>

                    {/* Indexing Progress Overlay */}
                    {isIndexing && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm border-2 border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center z-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                            <p className="text-sm text-muted-foreground text-center px-4">
                                {indexingStatus}
                            </p>
                            {indexingProgress > 0 && (
                                <div className="w-32 mt-2">
                                    <div className="w-full bg-secondary rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                                            style={{ width: `${indexingProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <UrlIndexingDialog
                    isOpen={isDialogOpen}
                    onClose={() => {
                        setIsDialogOpen(false);
                    }}
                    onIndexingStart={(indexingId) => {
                        setIsIndexing(true);
                        setIndexingStatus("Starting indexing...");
                        setIndexingProgress(0);
                        setIsDialogOpen(false); // Close dialog immediately
                        pollIndexingProgress(indexingId);
                    }}
                    preselectedTags={preselectedTags}
                />
            </>
        );
    }

    return (
        <>
            <Button
                variant={variant}
                size={size}
                className={className}
                onClick={() => setIsDialogOpen(true)}
            >
                {children || (
                    <>
                        <Link className="h-4 w-4 mr-2" />
                        Paste URL
                    </>
                )}
            </Button>

            <UrlIndexingDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onIndexingStart={(indexingId) => {
                    setIsIndexing(true);
                    setIndexingStatus("Starting indexing...");
                    setIndexingProgress(0);
                    setIsDialogOpen(false); // Close dialog immediately
                    pollIndexingProgress(indexingId);
                }}
                preselectedTags={preselectedTags}
            />
        </>
    );
}
