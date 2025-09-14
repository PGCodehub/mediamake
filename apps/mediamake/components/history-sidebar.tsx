"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Clock,
    CheckCircle,
    XCircle,
    Download,
    AlertCircle,
    Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import useSWR from "swr";

interface RenderRequest {
    id: string;
    fileName: string;
    codec: string;
    composition: string;
    status: "pending" | "rendering" | "completed" | "failed";
    createdAt: string;
    progress?: number;
    error?: string;
    downloadUrl?: string;
    fileSize?: number;
}

interface HistorySidebarProps {
    selectedRender: string | null;
    onSelectRender: (renderId: string) => void;
}

// Mock data fetcher - replace with actual API call
const fetcher = async (url: string): Promise<RenderRequest[]> => {
    // This would be replaced with actual API call
    return [
        {
            id: "1",
            fileName: "video-1.mp4",
            codec: "h264",
            composition: "CompositionLayout",
            status: "completed",
            createdAt: "2024-01-15T10:30:00Z",
            downloadUrl: "https://example.com/video-1.mp4",
            fileSize: 15728640
        },
        {
            id: "2",
            fileName: "video-2.mp4",
            codec: "h265",
            composition: "CompositionLayout",
            status: "rendering",
            createdAt: "2024-01-15T11:00:00Z",
            progress: 65
        },
        {
            id: "3",
            fileName: "video-3.mp4",
            codec: "h264",
            composition: "CompositionLayout",
            status: "failed",
            createdAt: "2024-01-15T11:30:00Z",
            error: "Invalid input props provided"
        },
        {
            id: "4",
            fileName: "video-4.mp4",
            codec: "h264",
            composition: "CompositionLayout",
            status: "pending",
            createdAt: "2024-01-15T12:00:00Z"
        }
    ];
};

export function HistorySidebar({ selectedRender, onSelectRender }: HistorySidebarProps) {
    const { data: renderRequests, error, isLoading } = useSWR<RenderRequest[]>(
        "/api/remotion/history",
        fetcher,
        {
            refreshInterval: 5000, // Refresh every 5 seconds for progress updates
        }
    );

    const getStatusIcon = (status: RenderRequest["status"]) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "rendering":
                return <Play className="h-4 w-4 text-blue-500" />;
            case "failed":
                return <XCircle className="h-4 w-4 text-red-500" />;
            case "pending":
                return <Clock className="h-4 w-4 text-yellow-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: RenderRequest["status"]) => {
        const variants = {
            completed: "default",
            rendering: "secondary",
            failed: "destructive",
            pending: "outline"
        } as const;

        return (
            <Badge variant={variants[status]} className="text-xs">
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return "";
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    if (isLoading) {
        return (
            <div className="w-80 border-r bg-background p-4">
                <h2 className="text-lg font-semibold mb-4">Render History</h2>
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-80 border-r bg-background p-4">
                <h2 className="text-lg font-semibold mb-4">Render History</h2>
                <div className="text-center text-muted-foreground">
                    Failed to load render history
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 border-r bg-background">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Render History</h2>
                <p className="text-sm text-muted-foreground">
                    {renderRequests?.length || 0} render requests
                </p>
            </div>

            <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="p-4 space-y-3">
                    {renderRequests?.map((request) => (
                        <Card
                            key={request.id}
                            className={cn(
                                "cursor-pointer transition-colors hover:bg-muted/50",
                                selectedRender === request.id && "ring-2 ring-primary"
                            )}
                            onClick={() => onSelectRender(request.id)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium truncate">
                                        {request.fileName}
                                    </CardTitle>
                                    {getStatusIcon(request.status)}
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(request.status)}
                                    {request.status === "rendering" && request.progress && (
                                        <span className="text-xs text-muted-foreground">
                                            {Math.round(request.progress * 100)}%
                                        </span>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="pt-0">
                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>Codec:</span>
                                        <span className="font-mono">{request.codec}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Composition:</span>
                                        <span className="font-mono truncate ml-2">
                                            {request.composition}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Created:</span>
                                        <span>{formatDate(request.createdAt)}</span>
                                    </div>
                                    {request.fileSize && (
                                        <div className="flex justify-between">
                                            <span>Size:</span>
                                            <span>{formatFileSize(request.fileSize)}</span>
                                        </div>
                                    )}
                                </div>

                                {request.status === "rendering" && request.progress && (
                                    <div className="mt-2">
                                        <div className="w-full bg-secondary rounded-full h-1.5">
                                            <div
                                                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                                style={{ width: `${request.progress * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {(!renderRequests || renderRequests.length === 0) && (
                        <div className="text-center text-muted-foreground py-8">
                            <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No render requests yet</p>
                            <p className="text-xs">Start rendering to see your history here</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
