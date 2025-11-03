"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPredefinedPresetById } from "../registry/presets-registry";
import { PresetMetadata } from "../types";

interface FormField {
    key: string;
    type: string;
    title?: string;
    description?: string;
    enum?: any[];
    default?: any;
    required?: boolean;
    properties?: Record<string, any>;
    items?: any;
}

interface PresetSelectorFieldProps {
    field: FormField;
    fieldKey: string;
    value: any;
    onChange: (key: string, value: any) => void;
    metadata: PresetMetadata;
    onChildFieldChange: (key: string, value: any) => void;
    childFieldValues: Record<string, any>;
    parentSchema?: any;
    availableReferences?: string[];
    baseData?: Record<string, any>;
    showReferencesDropdown?: boolean;
    renderField: (
        field: FormField,
        fieldKey: string,
        currentValue?: any,
        onChangeHandler?: (key: string, value: any) => void,
        depth?: number,
        parentSchema?: any,
        availableReferences?: string[],
        baseData?: Record<string, any>,
        showReferencesDropdown?: boolean
    ) => React.ReactNode;
}

export function PresetSelectorField({
    field,
    fieldKey,
    value,
    onChange,
    metadata,
    onChildFieldChange,
    childFieldValues,
    parentSchema,
    availableReferences,
    baseData,
    showReferencesDropdown,
    renderField
}: PresetSelectorFieldProps) {
    const [childFields, setChildFields] = useState<FormField[]>([]);
    const [childPresetMetadata, setChildPresetMetadata] = useState<PresetMetadata | null>(null);
    const [isChildFieldsOpen, setIsChildFieldsOpen] = useState(true);
    const initializedForValue = useRef<string>("");

    useEffect(() => {
        if (value && metadata.presetSelector) {
            const presetId = metadata.presetSelector.mapping[value];
            if (presetId) {
                const childPreset = getPredefinedPresetById(presetId);
                if (childPreset) {
                    setChildPresetMetadata(childPreset.metadata);
                    
                    // Extract unique fields from child preset that aren't in parent
                    const parentKeys = Object.keys(parentSchema?.properties || {});
                    const childSchema = childPreset.presetParams;
                    const childProperties = childSchema?.properties || {};
                    
                    const uniqueFields = Object.entries(childProperties)
                        .filter(([key]) => !parentKeys.includes(key))
                        .map(([key, fieldDef]: [string, any]) => ({
                            key,
                            type: fieldDef.type || "string",
                            title: fieldDef.title,
                            description: fieldDef.description,
                            enum: fieldDef.enum,
                            default: fieldDef.default,
                            required: Array.isArray(childSchema.required) && childSchema.required.includes(key),
                            properties: fieldDef.properties,
                            items: fieldDef.items
                        }));
                    
                    setChildFields(uniqueFields);
                    
                    // Initialize default values for child fields that aren't set yet
                    // Only do this once per preset selection to avoid infinite loops
                    if (initializedForValue.current !== value) {
                        initializedForValue.current = value;
                        uniqueFields.forEach((field) => {
                            if (field.default !== undefined && childFieldValues[field.key] === undefined) {
                                // Set the default value for this field
                                onChildFieldChange(field.key, field.default);
                            }
                        });
                    }
                } else {
                    setChildFields([]);
                    setChildPresetMetadata(null);
                }
            }
        } else {
            setChildFields([]);
            setChildPresetMetadata(null);
        }
    }, [value, metadata.presetSelector, parentSchema, childFieldValues, onChildFieldChange]);

    const isRequired = parentSchema && Array.isArray(parentSchema.required) && parentSchema.required.includes(fieldKey);

    return (
        <div className="space-y-4">
            {/* Main selector field */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Label htmlFor={fieldKey} className="text-sm font-medium">
                        {field.title || fieldKey}
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {field.description && (
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">{field.description}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
                
                <Select value={value || ""} onValueChange={(val) => onChange(fieldKey, val)}>
                    <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.title || fieldKey}`} />
                    </SelectTrigger>
                    <SelectContent>
                        {field.enum?.map((option: any) => (
                            <SelectItem key={option} value={option}>
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                
                {field.enum && (
                    <div className="flex flex-wrap gap-1">
                        {field.enum.map((option: any) => (
                            <Badge key={option} variant="outline" className="text-xs">
                                {option}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Dynamic child fields */}
            {childFields.length > 0 && childPresetMetadata && (
                <Collapsible open={isChildFieldsOpen} onOpenChange={setIsChildFieldsOpen}>
                    <div className="ml-4 border-l-2 border-primary/30 pl-4">
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-between p-2 h-auto hover:bg-accent/50"
                            >
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                        {childPresetMetadata.title}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {childFields.length} additional {childFields.length === 1 ? 'parameter' : 'parameters'}
                                    </span>
                                </div>
                                {isChildFieldsOpen ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="space-y-4 mt-4">
                            {childFields.map((childField) => {
                                const childFieldValue = childFieldValues[childField.key];
                                const isChildRequired = childField.required;

                                return (
                                    <div key={childField.key} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor={childField.key} className="text-sm font-medium">
                                                {childField.title || childField.key}
                                                {isChildRequired && <span className="text-red-500 ml-1">*</span>}
                                            </Label>
                                            {childField.description && (
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="max-w-xs">{childField.description}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                        {renderField(
                                            childField,
                                            childField.key,
                                            childFieldValue,
                                            onChildFieldChange,
                                            1, // depth
                                            null, // No parent schema for child fields
                                            availableReferences,
                                            baseData,
                                            showReferencesDropdown
                                        )}
                                    </div>
                                );
                            })}
                        </CollapsibleContent>
                    </div>
                </Collapsible>
            )}
        </div>
    );
}

