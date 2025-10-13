"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toJSONSchema } from "zod";
import {
    Eye, Code, HelpCircle, Plus, Trash2, GripVertical, ChevronUp, ChevronDown,
    RotateCcw, Image, FileAudio, Loader2, Play, History, Clock, CheckCircle,
    MoreVertical, Download, Trash2 as TrashIcon
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AgentInterfaceProps {
    inputSchema: any;
    onRunAgent: (params: Record<string, any>) => Promise<any>;
    isLoading: boolean;
    agentPath: string;
    onOutputChange?: (output: any) => void;
}

interface FormField {
    key: string;
    type: string;
    title?: string;
    description?: string;
    enum?: string[];
    default?: any;
    required: boolean;
    properties?: any;
    items?: any;
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
    Object.entries(schema.properties).forEach(([key, field]: [string, any]) => {
        if (field.default !== undefined) {
            defaults[key] = field.default;
        } else if (field.type === 'array') {
            defaults[key] = [];
        } else if (field.type === 'object') {
            defaults[key] = {};
        } else if (field.type === 'boolean') {
            defaults[key] = false;
        } else {
            defaults[key] = '';
        }
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

    const handleFieldChange = useCallback((key: string, fieldValue: any) => {
        setFormData(prev => ({ ...prev, [key]: fieldValue }));
    }, []);

    const handleJsonChange = useCallback((newData: any) => {
        setFormData(newData);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
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

    const fields = Object.entries(jsonSchema.properties).map(([key, field]: [string, any]) => ({
        key,
        type: field.type || "string",
        title: field.title,
        description: field.description,
        enum: field.enum,
        default: field.default,
        required: Array.isArray(jsonSchema.required) && jsonSchema.required.includes(key),
        properties: field.properties,
        items: field.items
    }));

    return (
        <div className="h-full flex flex-col">
            {/* Tabs above the form */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "current" | "history")} className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="current" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Current
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        History ({savedEntries.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="flex-1">
                    <Card className="h-[80vh] overflow-y-auto flex flex-col">
                        <CardHeader className="pb-4 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold">Agent Parameters</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                onClick={handleReset}
                                                variant="outline"
                                                size="sm"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Reset to default values</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {fields.length > 0 ? (
                                        <div className="space-y-4">
                                            {fields.map((field) => {
                                                const fieldValue = formData[field.key];
                                                const isDescription = field.key.toLowerCase().includes('description') ||
                                                    field.key.toLowerCase().includes('prompt') ||
                                                    field.key.toLowerCase().includes('content') ||
                                                    field.key.toLowerCase().includes('request');

                                                return (
                                                    <div key={field.key} className="space-y-2">
                                                        <Label htmlFor={field.key} className="text-sm font-medium">
                                                            {field.title || field.key}
                                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                                        </Label>
                                                        {field.description && (
                                                            <p className="text-xs text-muted-foreground">{field.description}</p>
                                                        )}

                                                        {field.type === 'string' && (
                                                            isDescription ? (
                                                                <Textarea
                                                                    id={field.key}
                                                                    value={fieldValue || ''}
                                                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                                                    placeholder={field.title || field.key}
                                                                    rows={6}
                                                                    className="resize-none"
                                                                />
                                                            ) : (
                                                                <Input
                                                                    id={field.key}
                                                                    value={fieldValue || ''}
                                                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                                                    placeholder={field.title || field.key}
                                                                />
                                                            )
                                                        )}

                                                        {field.type === 'boolean' && (
                                                            <Checkbox
                                                                id={field.key}
                                                                checked={fieldValue || false}
                                                                onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
                                                            />
                                                        )}

                                                        {field.enum && (
                                                            <Select
                                                                value={fieldValue || ''}
                                                                onValueChange={(value) => handleFieldChange(field.key, value)}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={`Select ${field.title || field.key}`} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {field.enum.map((option: string) => (
                                                                        <SelectItem key={option} value={option}>
                                                                            {option}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            No input parameters defined for this agent
                                        </p>
                                    )}
                                </form>
                            </div>

                            <div className="flex-shrink-0 pt-4 border-t">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                    onClick={handleSubmit}
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
