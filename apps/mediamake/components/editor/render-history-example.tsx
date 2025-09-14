"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    getRenderHistory,
    addRenderRequest,
    updateRenderRequest,
    clearRenderHistory,
    type RenderRequest
} from "@/lib/render-history";
import { useState, useEffect } from "react";
import { RefreshCw, Trash2, Plus } from "lucide-react";

/**
 * Example component demonstrating how to use the localStorage render history functionality
 * This component shows how to:
 * 1. Load render history from localStorage
 * 2. Add new render requests
 * 3. Update existing render requests
 * 4. Clear the entire history
 */
export function RenderHistoryExample() {
    const [history, setHistory] = useState<RenderRequest[]>([]);

    // Load history from localStorage
    const loadHistory = () => {
        const renderHistory = getRenderHistory();
        setHistory(renderHistory);
    };

    useEffect(() => {
        loadHistory();
    }, []);

    // Add a sample render request
    const addSampleRequest = () => {
        const sampleRequest: RenderRequest = {
            id: `sample-${Date.now()}`,
            fileName: `sample-video-${Date.now()}.mp4`,
            codec: "h264",
            composition: "SampleComposition",
            status: "pending",
            createdAt: new Date().toISOString(),
            inputProps: {
                childrenData: [],
                duration: 300,
                style: { backgroundColor: "blue" }
            }
        };

        addRenderRequest(sampleRequest);
        loadHistory();
    };

    // Update a render request status
    const updateRequestStatus = (id: string, status: RenderRequest["status"]) => {
        updateRenderRequest(id, { status });
        loadHistory();
    };

    // Clear all history
    const clearHistory = () => {
        clearRenderHistory();
        setHistory([]);
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

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Render History Example
                        <div className="flex gap-2">
                            <Button onClick={addSampleRequest} size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Sample
                            </Button>
                            <Button onClick={loadHistory} size="sm" variant="outline">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Button onClick={clearHistory} size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear All
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {history.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                No render requests in history. Click "Add Sample" to create one.
                            </p>
                        ) : (
                            history.map((request) => (
                                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">{request.fileName}</span>
                                            {getStatusBadge(request.status)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {request.composition} • {request.codec} • {new Date(request.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => updateRequestStatus(request.id, "rendering")}
                                            disabled={request.status === "rendering"}
                                        >
                                            Start
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => updateRequestStatus(request.id, "completed")}
                                            disabled={request.status === "completed"}
                                        >
                                            Complete
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => updateRequestStatus(request.id, "failed")}
                                            disabled={request.status === "failed"}
                                        >
                                            Fail
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Usage Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>1. Add Sample Request:</strong> Creates a new render request and saves it to localStorage</p>
                    <p><strong>2. Update Status:</strong> Demonstrates how to update render request status</p>
                    <p><strong>3. Refresh:</strong> Reloads the history from localStorage</p>
                    <p><strong>4. Clear All:</strong> Removes all render requests from localStorage</p>
                    <p className="text-muted-foreground mt-4">
                        The render history is automatically saved to localStorage and persists across browser sessions.
                        The history sidebar and content components will automatically load and display this data.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
