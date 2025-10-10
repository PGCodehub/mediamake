"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Hash, Calendar, Globe, FileAudio } from "lucide-react";
import { useTranscriber } from "../contexts/transcriber-context";

export function SettingsUI() {
    const { transcriptionData } = useTranscriber();

    if (!transcriptionData) {
        return (
            <div className="flex-1 flex flex-col h-full">
                <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        <h1 className="text-xl font-bold">Settings</h1>
                    </div>
                </div>
                <div className="flex-1 p-4">
                    <Card>
                        <CardContent className="flex items-center justify-center h-[400px]">
                            <div className="text-center">
                                <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-semibold mb-2">No Transcription Selected</h3>
                                <p className="text-muted-foreground">
                                    Select a transcription to view its settings and details.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    <h1 className="text-xl font-bold">Settings</h1>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    Transcription settings and details
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Hash className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Transcription ID</label>
                                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded mt-1">
                                        {transcriptionData._id?.toString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Assembly ID</label>
                                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded mt-1">
                                        {transcriptionData.assemblyId}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <Badge variant="outline" className="mt-1">
                                        {transcriptionData.status}
                                    </Badge>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Language</label>
                                    <p className="text-sm mt-1">{transcriptionData.language || 'Auto-detect'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timestamps */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Timestamps
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                                    <p className="text-sm mt-1">{new Date(transcriptionData.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                                    <p className="text-sm mt-1">{new Date(transcriptionData.updatedAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Audio Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileAudio className="h-5 w-5" />
                                Audio Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Audio URL</label>
                                <p className="text-sm break-all bg-muted px-2 py-1 rounded mt-1">
                                    {transcriptionData.audioUrl}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tags and Keywords */}
                    {(transcriptionData.tags?.length || transcriptionData.keywords?.length) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5" />
                                    Tags & Keywords
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {transcriptionData.tags?.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Tags</label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {transcriptionData.tags.map((tag, index) => (
                                                <Badge key={index} variant="secondary">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {transcriptionData.keywords && transcriptionData.keywords.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Keywords</label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {transcriptionData.keywords.map((keyword, index) => (
                                                <Badge key={index} variant="outline">
                                                    {keyword}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
