"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Code, RefreshCw, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { InputCompositionProps } from "@microfox/remotion";
import { JsonEditor } from "../player/json-editor";
import { usePresetContext } from "./preset-provider";

interface OutputCardProps {
    className?: string;
}

export function OutputCard({ className }: OutputCardProps) {
    const {
        generatedOutput,
        editableOutput,
        setEditableOutput,
        setGeneratedOutput
    } = usePresetContext();

    const [isExpanded, setIsExpanded] = useState(false);
    const [isUserEditing, setIsUserEditing] = useState(false);
    const [jsonEditorValue, setJsonEditorValue] = useState<InputCompositionProps | null>(generatedOutput);

    useEffect(() => {
        setJsonEditorValue(generatedOutput);
    }, [generatedOutput]);


    const handleOutputChange = (newOutput: InputCompositionProps) => {
        setIsUserEditing(true);
        setJsonEditorValue(newOutput);
    };

    const resetToGenerated = () => {
        if (generatedOutput) {
            setIsUserEditing(false);
            setJsonEditorValue(generatedOutput);
        }
    };

    const copyToClipboard = async () => {
        try {
            const outputToCopy = jsonEditorValue || generatedOutput;
            if (outputToCopy) {
                await navigator.clipboard.writeText(JSON.stringify(outputToCopy, null, 2));
                // You could add a toast notification here if you have a toast system
                console.log('Output copied to clipboard');
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    if (!generatedOutput && !editableOutput) {
        return null;
    }

    return (
        <Card className={`w-full ${className}`}>
            <CardHeader className="pb-2 px-3 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 h-5 w-5"
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                            ) : (
                                <ChevronRight className="h-3 w-3" />
                            )}
                        </Button>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm flex items-center gap-1">
                                <Code className="h-3 w-3" />
                                Final Output
                            </h4>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                    Editable
                                </Badge>
                                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                    JSON
                                </Badge>
                                {isUserEditing && (
                                    <Button
                                        variant="outline"
                                        className="bg-green-500 text-white hover:bg-green-600 h-5 px-2 text-xs"
                                        onClick={() => {
                                            setIsUserEditing(false);
                                            setEditableOutput(jsonEditorValue);
                                            setGeneratedOutput(jsonEditorValue);
                                        }}
                                    >
                                        Save
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={copyToClipboard}
                            className="text-green-500 hover:text-green-700 p-1 h-6 w-6"
                            title="Copy JSON to clipboard"
                        >
                            <Copy className="h-3 w-3" />
                        </Button>
                        {editableOutput && generatedOutput &&
                            JSON.stringify(editableOutput) !== JSON.stringify(generatedOutput) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetToGenerated}
                                    className="text-blue-500 hover:text-blue-700 p-1 h-6 w-6"
                                    title="Reset to generated output"
                                >
                                    <RefreshCw className="h-3 w-3" />
                                </Button>
                            )}
                    </div>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent className="pt-0 px-3 pb-3">
                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                            Edit the final composition output. Changes will be reflected in the preview player.
                        </div>
                        <div className="h-64">
                            <JsonEditor
                                value={jsonEditorValue || {}}
                                onChange={handleOutputChange}
                                height="100%"
                                className="h-full"
                            />
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
