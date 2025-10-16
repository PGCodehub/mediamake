"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SchemaForm } from "../editor/presets/schema-form";
import { toJSONSchema } from "zod";
import {
    RotateCcw, Loader2, Play, History, Clock, CheckCircle,
    MoreVertical, Trash2 as TrashIcon
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AgentInterfaceProps {
    inputSchema: any;
    onRunAgent: (params: Record<string, any>) => Promise<any>;
    isLoading: boolean;
    agentPath: string;
    onOutputChange?: (output: any) => void;
}

// Helper function to generate smart title from form data
const generateSmartTitle = (formData: Record<string, any>): string => {
    // Find the first non-empty string value
    for (const [key, value] of Object.entries(formData)) {
        if (typeof value === 'string' && value.trim() !== '') {
            const truncated = value.length > 30 ? value.substring(0, 30) + '...' : value;
            const date = new Date().toLocaleDateString();
            return `${truncated} (${date})`;
        }
    }

    // Fallback to timestamp
    const date = new Date().toLocaleDateString();
    return `Form Data (${date})`;
};

// Helper function to get default values from schema
const getDefaultValues = (schema: any): Record<string, any> => {
    if (!schema || !schema.properties) return {};

    const defaults: Record<string, any> = {};
    const requiredFields = schema.required || [];

    Object.entries(schema.properties).forEach(([key, field]: [string, any]) => {
        // Only set default values for:
        // 1. Fields with explicit default values
        // 2. Required fields that need a default value
        if (field.default !== undefined) {
            defaults[key] = field.default;
        } else if (requiredFields.includes(key)) {
            // Only set defaults for required fields
            if (field.type === 'array') {
                defaults[key] = [];
            } else if (field.type === 'object') {
                defaults[key] = {};
            } else if (field.type === 'boolean') {
                defaults[key] = false;
            } else {
                defaults[key] = '';
            }
        }
        // For non-required fields without explicit defaults, leave them undefined
    });
    return defaults;
};

export function AgentInterface({ inputSchema, onRunAgent, isLoading, agentPath, onOutputChange }: AgentInterfaceProps) {
    const [activeTab, setActiveTab] = useState<"current" | "history">("current");
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [currentOutput, setCurrentOutput] = useState<any>(null);

    // Convert zod schema to JSON schema
    const jsonSchema = useMemo(() => {
        return inputSchema && typeof inputSchema === 'object' && inputSchema._def ? toJSONSchema(inputSchema) : inputSchema;
    }, [inputSchema]);

    // Get default values
    const defaultValues = useMemo(() => {
        if (jsonSchema) {
            return getDefaultValues(jsonSchema);
        }
        return {};
    }, [jsonSchema]);

    // Initialize form data
    useEffect(() => {
        setFormData(defaultValues);
    }, [defaultValues]);

    // Use form persistence hook for history management
    const {
        savedEntries,
        saveFormData,
        loadEntry,
        deleteEntry,
        clearAllData
    } = useFormPersistence({
        agentPath,
        initialFormData: defaultValues,
        onFormDataChange: (data) => {
            setFormData(data);
            setActiveTab("current");
        },
        onOutputChange: (output) => {
            setCurrentOutput(output);
            onOutputChange?.(output);
        }
    });

    const handleFormChange = useCallback((newData: any) => {
        setFormData(newData);
    }, []);

    const handleSubmit = useCallback(async () => {
        try {
            const result = await onRunAgent(formData);
            setCurrentOutput(result);

            // Auto-save to history with smart title
            const title = generateSmartTitle(formData);
            await saveFormData(title, formData, result);
        } catch (error) {
            console.error("Error running agent:", error);
        }
    }, [formData, onRunAgent, saveFormData]);

    const handleReset = useCallback(() => {
        setFormData(defaultValues);
        setCurrentOutput(null);
    }, [defaultValues]);

    const handleLoadHistory = useCallback(async (entryId: string) => {
        await loadEntry(entryId);
    }, [loadEntry]);

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    if (!jsonSchema || !jsonSchema.properties) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-sm">No Schema Available</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No schema information available for this agent
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Tabs above the form */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "current" | "history")} className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="current" className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Current
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        History ({savedEntries.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="flex-1">
                    <Card className="h-[80vh] overflow-y-auto flex flex-col">
                        <CardContent className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto">
                                <SchemaForm
                                    schema={jsonSchema}
                                    value={formData}
                                    onChange={handleFormChange}
                                    onReset={handleReset}
                                    title="Agent Parameters"
                                    showTabs={true}
                                    showResetButton={true}
                                />
                            </div>
                            <div className="mt-4 pt-4 border-t">
                                <Button
                                    onClick={handleSubmit}
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Running Agent...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            Run Agent
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="flex-1">
                    <Card className="h-[80vh] overflow-y-auto flex flex-col">
                        <CardContent className="flex-1 overflow-hidden p-0">
                            {savedEntries.length > 0 ? (
                                <div className="h-full overflow-y-auto">
                                    {savedEntries.map((entry) => (
                                        <div
                                            key={entry.id}
                                            onClick={() => handleLoadHistory(entry.id)}
                                            className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-sm truncate">{entry.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatTimestamp(entry.timestamp)}
                                                        </span>
                                                        {entry.output && (
                                                            <Badge variant="outline" className="gap-1 text-xs">
                                                                <CheckCircle className="h-3 w-3" />
                                                                Has Output
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteEntry(entry.id);
                                                            }}
                                                            className="text-destructive"
                                                        >
                                                            <TrashIcon className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center py-8">
                                        <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-sm text-muted-foreground">
                                            No history yet. Run the agent to create your first entry.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
