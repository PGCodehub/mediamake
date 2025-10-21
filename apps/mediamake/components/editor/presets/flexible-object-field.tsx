"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Plus, Trash2, Settings } from "lucide-react";
import { JsonEditor } from "../player/json-editor";

interface FlexibleObjectFieldProps {
    value: any;
    onChange: (value: any) => void;
    availableReferences: string[];
    baseData: Record<string, any>;
    fieldKey: string;
    field: any;
}

export function FlexibleObjectField({
    value,
    onChange,
    availableReferences,
    baseData,
    fieldKey,
    field
}: FlexibleObjectFieldProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedReference, setSelectedReference] = useState<string>('');
    const [additionalFields, setAdditionalFields] = useState<Record<string, any>>({});
    const [useReference, setUseReference] = useState(false);

    // Initialize state from current value
    useEffect(() => {
        if (value && typeof value === 'object') {
            // Check if this looks like a reference-based object
            const hasReferencePattern = JSON.stringify(value).includes('data:[');
            if (hasReferencePattern) {
                setUseReference(true);
                // Extract reference key if it exists
                const refMatch = JSON.stringify(value).match(/data:\[([^\]]+)\]/);
                if (refMatch) {
                    setSelectedReference(refMatch[1]);
                }
            } else {
                setUseReference(false);
                setAdditionalFields(value);
            }
        }
    }, [value]);

    const handleReferenceChange = (refKey: string) => {
        setSelectedReference(refKey);
        if (refKey && baseData[refKey]) {
            // Merge reference data with additional fields
            const mergedValue = {
                ...baseData[refKey],
                ...additionalFields
            };
            onChange(mergedValue);
        }
    };

    const handleAdditionalFieldChange = (key: string, fieldValue: any) => {
        const newAdditionalFields = {
            ...additionalFields,
            [key]: fieldValue
        };
        setAdditionalFields(newAdditionalFields);

        if (useReference && selectedReference && baseData[selectedReference]) {
            // Merge reference with additional fields
            const mergedValue = {
                ...baseData[selectedReference],
                ...newAdditionalFields
            };
            onChange(mergedValue);
        } else {
            // Just use additional fields
            onChange(newAdditionalFields);
        }
    };

    const handleModeToggle = (useRef: boolean) => {
        setUseReference(useRef);
        if (useRef && selectedReference && baseData[selectedReference]) {
            const mergedValue = {
                ...baseData[selectedReference],
                ...additionalFields
            };
            onChange(mergedValue);
        } else {
            onChange(additionalFields);
        }
    };

    const addField = () => {
        const newKey = `field_${Date.now()}`;
        handleAdditionalFieldChange(newKey, '');
    };

    const removeField = (key: string) => {
        const newFields = { ...additionalFields };
        delete newFields[key];
        setAdditionalFields(newFields);
        handleAdditionalFieldChange(key, undefined);
    };

    const getReferenceValue = () => {
        if (selectedReference && baseData[selectedReference]) {
            return baseData[selectedReference];
        }
        return null;
    };

    const referenceValue = getReferenceValue();

    return (
        <Card className="w-full">
            <CardHeader className="pb-2 px-3 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <CardTitle className="text-sm font-medium">
                            {field.title || fieldKey}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                            {useReference ? 'Reference + Fields' : 'Manual Fields'}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModeToggle(!useReference)}
                        >
                            {useReference ? 'Manual Mode' : 'Reference Mode'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleContent>
                    <CardContent className="pt-0 px-3 pb-3 space-y-4">
                        {useReference && (
                            <div className="space-y-2">
                                <Label>Reference</Label>
                                <Select value={selectedReference} onValueChange={handleReferenceChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a reference" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableReferences.map((ref) => (
                                            <SelectItem key={ref} value={ref}>
                                                {ref}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {referenceValue && (
                                    <div className="p-3 bg-muted rounded-md">
                                        <Label className="text-sm font-medium">Reference Data:</Label>
                                        <pre className="text-xs mt-1 overflow-auto max-h-32">
                                            {JSON.stringify(referenceValue, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Additional Fields</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addField}
                                    className="flex items-center gap-1"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Field
                                </Button>
                            </div>

                            {Object.entries(additionalFields).map(([key, fieldValue]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <Input
                                        value={key}
                                        onChange={(e) => {
                                            const newFields = { ...additionalFields };
                                            delete newFields[key];
                                            newFields[e.target.value] = fieldValue;
                                            setAdditionalFields(newFields);
                                        }}
                                        placeholder="Field name"
                                        className="flex-1"
                                    />
                                    <Input
                                        value={typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue)}
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                handleAdditionalFieldChange(key, parsed);
                                            } catch {
                                                handleAdditionalFieldChange(key, e.target.value);
                                            }
                                        }}
                                        placeholder="Field value"
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeField(key)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <Label>JSON Editor</Label>
                            <JsonEditor
                                value={useReference && referenceValue ? {
                                    ...referenceValue,
                                    ...additionalFields
                                } : additionalFields}
                                onChange={(val) => {
                                    if (useReference && referenceValue) {
                                        const merged = {
                                            ...referenceValue,
                                            ...val
                                        };
                                        onChange(merged);
                                    } else {
                                        onChange(val);
                                    }
                                }}
                                height="200px"
                                className="border rounded-md"
                            />
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
