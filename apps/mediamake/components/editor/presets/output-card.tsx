"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Code, RefreshCw } from "lucide-react";
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

    if (!generatedOutput && !editableOutput) {
        return null;
    }

    return (
        <Card className={`w-full ${className}`}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 h-6 w-6"
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>
                        <div>
                            <h4 className="font-medium flex items-center gap-2">
                                <Code className="h-4 w-4" />
                                Final Output
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                    Editable
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    Composition Data
                                </Badge>
                                {isUserEditing && (
                                    <Button variant="outline" color="green" className="bg-green-500 text-white hover:bg-green-600" size="sm" onClick={() => {
                                        setIsUserEditing(false);
                                        setEditableOutput(jsonEditorValue);
                                        setGeneratedOutput(jsonEditorValue);
                                    }}>
                                        Save
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {editableOutput && generatedOutput &&
                            JSON.stringify(editableOutput) !== JSON.stringify(generatedOutput) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetToGenerated}
                                    className="text-blue-500 hover:text-blue-700"
                                    title="Reset to generated output"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            )}
                    </div>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent className="pt-0">
                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            Edit the final composition output. Changes will be reflected in the preview player.
                        </div>
                        <div className="h-96">
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
