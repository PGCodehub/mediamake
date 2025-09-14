"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Download,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    Play,
    FileVideo,
    Calendar,
    Code,
    Settings
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
    inputProps?: any;
}

interface HistoryContentProps {
    selectedRender: string | null;
}

// Mock data fetcher - replace with actual API call
const fetcher = async (url: string): Promise<RenderRequest[]> => {
    return [
        {
            id: "1",
            fileName: "video-1.mp4",
            codec: "h264",
            composition: "CompositionLayout",
            status: "completed",
            createdAt: "2024-01-15T10:30:00Z",
            downloadUrl: "https://example.com/video-1.mp4",
            fileSize: 15728640,
            inputProps: {
                childrenData: [],
                duration: 400,
                style: { backgroundColor: "black" }
            }
        },
        {
            id: "2",
            fileName: "video-2.mp4",
            codec: "h265",
            composition: "CompositionLayout",
            status: "rendering",
            createdAt: "2024-01-15T11:00:00Z",
            progress: 0.65,
            inputProps: {
                childrenData: [],
                duration: 300,
                style: { backgroundColor: "blue" }
            }
        },
        {
            id: "3",
            fileName: "video-3.mp4",
            codec: "h264",
            composition: "CompositionLayout",
            status: "failed",
            createdAt: "2024-01-15T11:30:00Z",
            error: "Invalid input props provided",
            inputProps: {
                childrenData: [],
                duration: 200,
                style: { backgroundColor: "red" }
            }
        },
        {
            id: "4",
            fileName: "video-4.mp4",
            codec: "h264",
            composition: "CompositionLayout",
            status: "pending",
            createdAt: "2024-01-15T12:00:00Z",
            inputProps: {
                childrenData: [],
                duration: 500,
                style: { backgroundColor: "green" }
            }
        }
    ];
};

export function HistoryContent({ selectedRender }: HistoryContentProps) {
    const { data: renderRequests, error, isLoading, mutate } = useSWR<RenderRequest[]>(
        "/api/remotion/history",
        fetcher,
        {
            refreshInterval: 5000, // Refresh every 5 seconds for progress updates
        }
    );

    const selectedRequest = renderRequests?.find(req => req.id === selectedRender);

    const getStatusIcon = (status: RenderRequest["status"]) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case "rendering":
                return <Play className="h-5 w-5 text-blue-500" />;
            case "failed":
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case "pending":
                return <Clock className="h-5 w-5 text-yellow-500" />;
            default:
                return <AlertCircle className="h-5 w-5 text-gray-500" />;
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
            <Badge variant={variants[status]} className="text-sm">
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return "Unknown";
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const handleDownload = (url: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRefresh = () => {
        mutate();
    };

    if (!selectedRender) {
        return (
            <div className="flex-1 flex items-center justify-center bg-muted/20">
                <div className="text-center">
                    <FileVideo className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Select a Render Request</h3>
                    <p className="text-muted-foreground">
                        Choose a render request from the sidebar to view its details
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex-1 p-6">
                <div className="space-y-4">
                    <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
                    <div className="h-32 bg-muted animate-pulse rounded" />
                    <div className="h-24 bg-muted animate-pulse rounded" />
                </div>
            </div>
        );
    }

    if (error || !selectedRequest) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <h3 className="text-lg font-semibold mb-2">Error Loading Request</h3>
                    <p className="text-muted-foreground mb-4">
                        Failed to load render request details
                    </p>
                    <Button onClick={handleRefresh} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {getStatusIcon(selectedRequest.status)}
                    <div>
                        <h1 className="text-2xl font-bold">{selectedRequest.fileName}</h1>
                        <p className="text-muted-foreground">
                            Created {formatDate(selectedRequest.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {getStatusBadge(selectedRequest.status)}
                    <Button onClick={handleRefresh} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Separator />

            {/* Progress Section */}
            {selectedRequest.status === "rendering" && selectedRequest.progress !== undefined && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Play className="h-5 w-5" />
                            Rendering Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{Math.round(selectedRequest.progress * 100)}%</span>
                            </div>
                            <Progress value={selectedRequest.progress * 100} className="w-full" />
                            <p className="text-sm text-muted-foreground">
                                Your video is being rendered. This may take several minutes depending on the complexity.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Section */}
            {selectedRequest.status === "failed" && selectedRequest.error && (
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            Render Failed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800 font-medium">Error Details:</p>
                            <p className="text-red-700 mt-1">{selectedRequest.error}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Download Section */}
            {selectedRequest.status === "completed" && selectedRequest.downloadUrl && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            Render Complete
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Your video is ready!</p>
                                    <p className="text-sm text-muted-foreground">
                                        File size: {formatFileSize(selectedRequest.fileSize)}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => handleDownload(selectedRequest.downloadUrl!, selectedRequest.fileName)}
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Download
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Render Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Render Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">File Name:</span>
                                <span className="text-sm font-mono">{selectedRequest.fileName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Codec:</span>
                                <span className="text-sm font-mono">{selectedRequest.codec}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Composition:</span>
                                <span className="text-sm font-mono">{selectedRequest.composition}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Status:</span>
                                {getStatusBadge(selectedRequest.status)}
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Created:</span>
                                <span className="text-sm">{formatDate(selectedRequest.createdAt)}</span>
                            </div>
                            {selectedRequest.fileSize && (
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">File Size:</span>
                                    <span className="text-sm">{formatFileSize(selectedRequest.fileSize)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Input Props */}
            {selectedRequest.inputProps && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code className="h-5 w-5" />
                            Input Properties
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            {JSON.stringify(selectedRequest.inputProps, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
