"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Plus, Trash2, Settings, Image, Code } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ReferenceItem, DefaultPresetData } from "./types";
import { createBaseDataFromReferences } from "./preset-data-mutation";
import { MediaPicker } from "../media/media-picker";
import { MediaFile } from "@/app/types/media";
import { TranscriptionPicker } from "../../transcriber/picker/transcription-picker";
import { Transcription } from "@/app/types/transcription";
import { JsonEditor } from "../player/json-editor";

interface DefaultCardProps {
    defaultData: DefaultPresetData;
    onDefaultDataChange: (defaultData: DefaultPresetData) => void;
    isExpanded?: boolean;
    onToggleExpansion?: () => void;
}

export function DefaultCard({
    defaultData,
    onDefaultDataChange,
    isExpanded = false,
    onToggleExpansion
}: DefaultCardProps) {
    const [localExpanded, setLocalExpanded] = useState(isExpanded);

    const handleToggleExpansion = () => {
        if (onToggleExpansion) {
            onToggleExpansion();
        } else {
            setLocalExpanded(!localExpanded);
        }
    };

    const addReference = () => {
        const newReference: ReferenceItem = {
            key: '',
            type: 'string',
            value: ''
        };

        onDefaultDataChange({
            ...defaultData,
            references: [...defaultData.references, newReference]
        });
    };

    const updateReference = (index: number, field: keyof ReferenceItem, value: any) => {
        const updatedReferences = [...defaultData.references];
        updatedReferences[index] = {
            ...updatedReferences[index],
            [field]: value
        };

        onDefaultDataChange({
            ...defaultData,
            references: updatedReferences
        });
    };

    const removeReference = (index: number) => {
        const updatedReferences = defaultData.references.filter((_, i) => i !== index);
        onDefaultDataChange({
            ...defaultData,
            references: updatedReferences
        });
    };

    const referenceTypes = [
        { value: 'string', label: 'String' },
        { value: 'number', label: 'Number' },
        { value: 'boolean', label: 'Boolean' },
        { value: 'object', label: 'Object' },
        { value: 'objects', label: 'Objects (Array)' },
        { value: 'media', label: 'Media' },
        { value: 'medias', label: 'Medias (Array)' },
        { value: 'captions', label: 'Captions (Array)' }
    ];

    // Media picker component for media type references
    const MediaPickerButton = ({
        onSelect,
        singular = true
    }: {
        onSelect: (media: MediaFile | MediaFile[]) => void;
        singular?: boolean;
    }) => {
        const [showPicker, setShowPicker] = useState(false);

        const handleSelect = (files: MediaFile | MediaFile[]) => {
            onSelect(files);
            setShowPicker(false);
        };

        return (
            <>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPicker(true)}
                    className="px-3"
                >
                    <Image className="h-4 w-4" />
                </Button>
                {showPicker && (
                    <MediaPicker
                        pickerMode={true}
                        singular={singular}
                        onSelect={handleSelect}
                        onClose={() => setShowPicker(false)}
                    />
                )}
            </>
        );
    };

    // Transcription picker component for caption type references
    const TranscriptionPickerButton = ({ onSelect }: { onSelect: (captions: any[]) => void }) => {
        const [showPicker, setShowPicker] = useState(false);

        const handleSelect = (transcription: Transcription) => {
            onSelect(transcription.captions);
            setShowPicker(false);
        };

        return (
            <>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPicker(true)}
                    className="px-3"
                >
                    <Settings className="h-4 w-4" />
                </Button>
                {showPicker && (
                    <TranscriptionPicker
                        open={showPicker}
                        onSelect={handleSelect}
                        onClose={() => setShowPicker(false)}
                    />
                )}
            </>
        );
    };

    const getValueInput = (reference: ReferenceItem, index: number) => {
        switch (reference.type) {
            case 'boolean':
                return (
                    <Select
                        value={reference.value?.toString() || 'false'}
                        onValueChange={(val) => updateReference(index, 'value', val === 'true')}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                    </Select>
                );
            case 'number':
                return (
                    <Input
                        type="number"
                        value={reference.value || ''}
                        onChange={(e) => updateReference(index, 'value', parseFloat(e.target.value) || 0)}
                        placeholder="Enter number value"
                    />
                );
            case 'media':
            case 'medias':
            case 'captions':
            case 'object':
            case 'objects':
                return (
                    <div className="space-y-2">
                        <Collapsible defaultOpen={false}>
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <Code className="h-4 w-4" />
                                        <span>JSON Editor</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 data-[state=open]:rotate-90 transition-transform" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                                <JsonEditor
                                    value={reference.value || (reference.type === 'object' ? {} : [])}
                                    onChange={(val) => updateReference(index, 'value', val)}
                                    height="200px"
                                    className="border rounded-md w-full"
                                />
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                );
            default:
                return (
                    <Input
                        value={reference.value || ''}
                        onChange={(e) => updateReference(index, 'value', e.target.value)}
                        placeholder="Enter value"
                    />
                );
        }
    };

    const expanded = onToggleExpansion ? isExpanded : localExpanded;

    return (
        <Card className="p-0 w-full border-2 border-dashed border-primary/20 bg-primary/5">
            <CardHeader className="pb-2 px-3 py-2">
                <Collapsible open={expanded} onOpenChange={handleToggleExpansion}>
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-between p-0 h-auto"
                        >
                            <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm font-medium text-primary">
                                    Default References
                                </CardTitle>
                                <Badge variant="outline" className="text-xs">
                                    {defaultData.references.length} references
                                </Badge>
                            </div>
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2">
                        <div className="border-l-2 border-primary/20 ml-4 pl-4 space-y-4">
                            {defaultData.references.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        No references defined yet
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={addReference}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Reference
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {defaultData.references.map((reference, index) => (
                                        <div key={index} className="p-3 border rounded-md bg-background">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="flex-1 grid grid-cols-3 items-end gap-2">
                                                    <div>
                                                        <Label htmlFor={`key-${index}`} className="text-xs">
                                                            Key
                                                        </Label>
                                                        <Input
                                                            id={`key-${index}`}
                                                            value={reference.key}
                                                            onChange={(e) => updateReference(index, 'key', e.target.value)}
                                                            placeholder="Reference key"
                                                            className="text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor={`type-${index}`} className="text-xs">
                                                            Type
                                                        </Label>
                                                        <Select
                                                            value={reference.type}
                                                            onValueChange={(val) => updateReference(index, 'type', val as ReferenceItem['type'])}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {referenceTypes.map((type) => (
                                                                    <SelectItem key={type.value} value={type.value}>
                                                                        {type.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex gap-2 mb-2">
                                                        {(reference.type === 'media' || reference.type === 'medias') && (
                                                            <MediaPickerButton
                                                                onSelect={(media) => {
                                                                    if (reference.type === 'media') {
                                                                        updateReference(index, 'value', media);
                                                                    } else {
                                                                        const currentValue = Array.isArray(reference.value) ? reference.value : [];
                                                                        updateReference(index, 'value', [...currentValue, ...(Array.isArray(media) ? media : [media])]);
                                                                    }
                                                                }}
                                                                singular={reference.type === 'media'}
                                                            />
                                                        )}
                                                        {reference.type === 'captions' && (
                                                            <TranscriptionPickerButton
                                                                onSelect={(captions) => {
                                                                    updateReference(index, 'value', captions);
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeReference(index)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div>
                                                <Label htmlFor={`value-${index}`} className="text-xs">
                                                    Value
                                                </Label>
                                                {getValueInput(reference, index)}
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={addReference}
                                        className="w-full flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Reference
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CardHeader>
        </Card>
    );
}
