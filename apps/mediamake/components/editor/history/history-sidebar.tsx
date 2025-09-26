"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Clock,
    CheckCircle,
    XCircle,
    Download,
    AlertCircle,
    Play,
    Key,
    RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { type RenderRequest } from "@/lib/render-history";
import useLocalState from "@/components/studio/context/hooks/useLocalState";
import { toast } from "sonner";

interface HistorySidebarProps {
    selectedRender: string | null;
    onSelectRender: (renderId: string, renderRequest?: RenderRequest) => void;
    onRefreshApiRequest?: (renderId: string, updatedRequest: RenderRequest) => void;
}

export function HistorySidebar({ selectedRender, onSelectRender, onRefreshApiRequest }: HistorySidebarProps) {
    const [renderRequests, setRenderRequests] = useState<RenderRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiKey, setApiKey] = useLocalState("apiKey", "");
    const [isApiLoading, setIsApiLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Fetch render history from API
    const fetchApiHistory = async (key: string) => {
        setIsApiLoading(true);
        setApiError(null);


        try {
            const response = await fetch('/api/remotion/history', {
                headers: {
                    "Authorization": `Bearer ${key}`,
                },
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            setRenderRequests(data);
        } catch (error) {
            console.error('Failed to fetch API history:', error);
            setApiError(error instanceof Error ? error.message : 'Failed to fetch history');
        } finally {
            setIsApiLoading(false);
        }
    };

    // Refresh a single API request
    const refreshApiRequest = async (renderId: string): Promise<RenderRequest | null> => {
        if (!apiKey.trim()) return null;

        try {
            const response = await fetch('/api/remotion/history', {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                },
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const updatedRequest = data.find((req: RenderRequest) => req.id === renderId);

            if (updatedRequest) {
                // Update the request in the current list
                setRenderRequests(prev =>
                    prev.map(req => req.id === renderId ? updatedRequest : req)
                );

                // Notify parent component of the updated request
                if (onRefreshApiRequest) {
                    onRefreshApiRequest(renderId, updatedRequest);
                }
            }

            return updatedRequest || null;
        } catch (error) {
            console.error('Failed to refresh API request:', error);
            return null;
        }
    };

    // Load render history from API
    useEffect(() => {
        if (apiKey.trim().length > 0) {
            fetchApiHistory(apiKey);
        } else {
            toast.error("Please enter an API key");
            setIsLoading(false);
        }
    }, [apiKey]);


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

    if (isApiLoading) {
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

    return (
        <div className="w-80 border-r bg-background">
            <div className="p-4 border-b space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Render History</h2>
                    <p className="text-sm text-muted-foreground">
                        {renderRequests?.length || 0} render requests
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="api-key" className="text-xs font-medium">
                        API Key (optional)
                    </Label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Key className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                                id="api-key"
                                type="password"
                                placeholder="Enter your API key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="pl-8 text-xs"
                            />
                        </div>
                        {apiKey && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchApiHistory(apiKey)}
                                disabled={isApiLoading}
                                className="px-2"
                            >
                                <RefreshCw className={cn("h-3 w-3", isApiLoading && "animate-spin")} />
                            </Button>
                        )}
                    </div>
                    {apiError && (
                        <p className="text-xs text-destructive">{apiError}</p>
                    )}
                </div>
            </div>

            <ScrollArea className="h-[calc(100vh-12rem)] overflow-y-auto">
                <div className="p-4 space-y-3">
                    {renderRequests?.map((request) => (
                        <Card
                            key={request.id}
                            className={cn(
                                "cursor-pointer transition-colors hover:bg-muted/50",
                                selectedRender === request.id && "ring-2 ring-primary"
                            )}
                            onClick={() => onSelectRender(request.id, request)}
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
                                    {request.status === "rendering" && request.progress !== undefined && (
                                        <span className="text-xs text-muted-foreground">
                                            {Math.round(request.progress * 100)}%
                                        </span>
                                    )}
                                </div>
                            </CardHeader>

                            {selectedRender === request.id && <CardContent className="pt-0">
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

                                {request.status === "rendering" && request.progress !== undefined && (
                                    <div className="mt-2">
                                        <div className="w-full bg-secondary rounded-full h-1.5">
                                            <div
                                                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                                style={{ width: `${request.progress * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>}
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
