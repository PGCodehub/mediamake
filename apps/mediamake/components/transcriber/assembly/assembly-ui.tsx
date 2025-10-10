"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Clock, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";

interface AssemblyItem {
    id: string;
    status: string;
    created_at: string;
    audio_url: string;
    language?: string;
}

export function AssemblyUI() {
    const [assemblies, setAssemblies] = useState<AssemblyItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAssemblies();
    }, []);

    const fetchAssemblies = async () => {
        try {
            setIsLoading(true);
            // This would be a real API call to fetch assembly data
            // For now, we'll show a placeholder
            setAssemblies([]);
        } catch (error) {
            console.error('Error fetching assemblies:', error);
            setError('Failed to load assemblies');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'processing':
                return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'error':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading assemblies...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            <h1 className="text-xl font-bold">Assembly</h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            View and manage your assembly transcriptions
                        </p>
                    </div>
                    <Button
                        onClick={fetchAssemblies}
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
                {error ? (
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                        <h3 className="text-lg font-semibold mb-2">Error Loading Assemblies</h3>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <Button onClick={fetchAssemblies} variant="outline">
                            Retry
                        </Button>
                    </div>
                ) : assemblies.length === 0 ? (
                    <div className="text-center py-12">
                        <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No Assemblies Found</h3>
                        <p className="text-muted-foreground">
                            Assembly data will appear here when available.
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-full">
                        <div className="space-y-4">
                            {assemblies.map((assembly) => (
                                <Card key={assembly.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Database className="h-4 w-4" />
                                                Assembly {assembly.id.slice(0, 8)}...
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(assembly.status)}
                                                <Badge className={getStatusColor(assembly.status)}>
                                                    {assembly.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="text-sm text-muted-foreground">
                                            {assembly.audio_url}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(assembly.created_at).toLocaleDateString()}
                                            </div>
                                            {assembly.language && (
                                                <Badge variant="outline" className="text-xs">
                                                    {assembly.language}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    );
}
