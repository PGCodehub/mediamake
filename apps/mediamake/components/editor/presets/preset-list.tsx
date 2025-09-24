"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Trash2, Play, Loader2 } from "lucide-react";
import { useState } from "react";
import { Preset, DatabasePreset, PresetInputData, AppliedPresetsState, AppliedPreset } from "./types";
import { SchemaForm } from "./schema-form";
import { usePresetContext } from "./preset-provider";
import { OutputCard } from "./output-card";

// Types for applied presets


interface PresetListProps {
    onGenerateOutput: () => void;
}

// Helper function to get default values from schema
function getDefaultValues(schema: any): any {
    if (!schema.properties) return {};

    const defaults: any = {};
    Object.entries(schema.properties).forEach(([key, field]: [string, any]) => {
        if (field.default !== undefined) {
            defaults[key] = field.default;
        } else if (field.type === 'object' && field.properties) {
            defaults[key] = getDefaultValues(field);
        } else if (field.type === 'array') {
            defaults[key] = [];
        } else if (field.type === 'string') {
            defaults[key] = field.enum ? (field.enum[0] || '') : '';
        } else if (field.type === 'number') {
            defaults[key] = 0;
        } else if (field.type === 'boolean') {
            defaults[key] = false;
        } else {
            defaults[key] = '';
        }
    });
    return defaults;
}

export function PresetList({
    onGenerateOutput
}: PresetListProps) {
    const {
        appliedPresets,
        togglePresetExpansion,
        updatePresetInputData,
        removePreset,
        isGenerating
    } = usePresetContext();
    if (appliedPresets.presets.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <h3 className="text-lg font-semibold">No Presets Applied</h3>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground">
                            Select presets from the sidebar to add them to your composition
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Applied Presets</h3>
                        <p className="text-sm text-muted-foreground">
                            Configure your applied presets
                        </p>
                    </div>
                    <Button
                        onClick={onGenerateOutput}
                        disabled={isGenerating}
                        className="flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        {isGenerating ? 'Generating...' : 'Generate Output'}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                    {appliedPresets.presets.map((appliedPreset) => (
                        <Card key={appliedPreset.id} className="w-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => togglePresetExpansion(appliedPreset.id)}
                                            className="p-1 h-6 w-6"
                                        >
                                            {appliedPreset.isExpanded ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <div>
                                            <h4 className="font-medium">{appliedPreset.preset.metadata.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    {appliedPreset.preset.metadata.presetType}
                                                </Badge>
                                                {appliedPreset.preset.metadata.tags?.map((tag) => (
                                                    <Badge key={tag} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removePreset(appliedPreset.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            {appliedPreset.isExpanded && (
                                <CardContent className="pt-0">
                                    <SchemaForm
                                        metadata={appliedPreset.preset.metadata}
                                        schema={appliedPreset.preset.presetParams}
                                        value={appliedPreset.inputData}
                                        onChange={(inputData) => updatePresetInputData(appliedPreset.id, inputData)}
                                        className=""
                                    />
                                </CardContent>
                            )}
                        </Card>
                    ))}

                    {/* Output Card - appears at the end of the list */}
                    <OutputCard />
                </div>
            </div>
        </div>
    );
}

// Helper function to create a new applied preset with default values
export function createAppliedPreset(preset: Preset | DatabasePreset): AppliedPreset {
    const presetId = `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get default input data - prioritize metadata defaultInputParams, fallback to schema defaults
    let defaultInputData = {};
    if (preset.metadata.defaultInputParams) {
        defaultInputData = preset.metadata.defaultInputParams;
    } else {
        defaultInputData = getDefaultValues(preset.presetParams);
    }

    return {
        id: presetId,
        preset,
        inputData: defaultInputData,
        isExpanded: true
    };
}
