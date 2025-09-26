"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JsonEditor } from "../player/json-editor";
import { Eye, Code, HelpCircle, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PresetMetadata } from "./types";

interface SchemaFormProps {
    metadata: PresetMetadata;
    schema: any;
    value: any;
    onChange: (value: any) => void;
    className?: string;
}

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

interface NestedFormProps {
    schema: any;
    value: any;
    onChange: (value: any) => void;
    fieldKey: string;
    depth?: number;
}

// Global renderField function that can be used by nested components
function renderField(
    field: FormField,
    fieldKey: string,
    currentValue?: any,
    onChangeHandler?: (key: string, value: any) => void,
    depth: number = 0,
    parentSchema?: any
) {
    const fieldValue = currentValue;
    const handleChange = onChangeHandler || (() => { });

    const renderInput = () => {
        switch (field.type) {
            case "string":
                if (field.enum) {
                    return (
                        <Select value={fieldValue || ""} onValueChange={(val) => handleChange(fieldKey, val)}>
                            <SelectTrigger>
                                <SelectValue placeholder={`Select ${field.title || fieldKey}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.enum.map((option: any) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    );
                }
                return (
                    <Input
                        value={typeof fieldValue === 'string' ? fieldValue : ""}
                        onChange={(e) => handleChange(fieldKey, e.target.value)}
                        placeholder={field.description || `Enter ${field.title || fieldKey}`}
                    />
                );

            case "number":
                return (
                    <Input
                        type="number"
                        value={typeof fieldValue === 'number' ? fieldValue : ""}
                        onChange={(e) => handleChange(fieldKey, parseFloat(e.target.value) || 0)}
                        placeholder={field.description || `Enter ${field.title || fieldKey}`}
                    />
                );

            case "boolean":
                return (
                    <Select value={fieldValue?.toString() || "false"} onValueChange={(val) => handleChange(fieldKey, val === "true")}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                    </Select>
                );

            case "object":
                if (field.properties) {
                    return (
                        <NestedForm
                            schema={field}
                            value={fieldValue || {}}
                            onChange={(val) => handleChange(fieldKey, val)}
                            fieldKey={fieldKey}
                            depth={depth}
                            parentSchema={parentSchema}
                        />
                    );
                }
                return (
                    <div className="space-y-2">
                        <JsonEditor
                            value={fieldValue || {}}
                            onChange={(val) => handleChange(fieldKey, val)}
                            height="200px"
                            className="border rounded-md"
                        />
                    </div>
                );

            case "array":
                if (field.items) {
                    return (
                        <ArrayManager
                            schema={field}
                            value={fieldValue || []}
                            onChange={(val) => handleChange(fieldKey, val)}
                            fieldKey={fieldKey}
                            parentSchema={parentSchema}
                        />
                    );
                }
                return (
                    <div className="space-y-2">
                        <JsonEditor
                            value={fieldValue || []}
                            onChange={(val) => handleChange(fieldKey, val)}
                            height="200px"
                            className="border rounded-md"
                        />
                    </div>
                );

            default:
                return (
                    <Textarea
                        value={typeof fieldValue === 'string' ? fieldValue : ""}
                        onChange={(e) => handleChange(fieldKey, e.target.value)}
                        placeholder={field.description || `Enter ${field.title || fieldKey}`}
                        rows={3}
                    />
                );
        }
    };

    // For nested fields (depth > 0), just return the input without label wrapper
    if (depth > 0) {
        return renderInput();
    }

    // For object and array types with properties/items, don't show labels here as they're handled by their components
    if ((field.type === 'object' && field.properties) || (field.type === 'array' && field.items)) {
        return renderInput();
    }

    const isRequired = parentSchema && Array.isArray(parentSchema.required) && parentSchema.required.includes(fieldKey);

    return (
        <div key={fieldKey} className="space-y-2">
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
            {renderInput()}
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
    );
}

// Nested form component for objects
function NestedForm({ schema, value, onChange, fieldKey, depth = 0, parentSchema }: NestedFormProps & { parentSchema?: any }) {
    const [isOpen, setIsOpen] = useState(depth < 2); // Auto-open first 2 levels
    const isRequired = parentSchema && Array.isArray(parentSchema.required) && parentSchema.required.includes(fieldKey);

    const getFieldsFromSchema = (schema: any): FormField[] => {
        if (!schema.properties) return [];

        return Object.entries(schema.properties).map(([key, field]: [string, any]) => ({
            key,
            type: field.type || "string",
            title: field.title,
            description: field.description,
            enum: field.enum,
            default: field.default,
            required: Array.isArray(schema.required) && schema.required.includes(key),
            properties: field.properties,
            items: field.items
        }));
    };

    const handleFieldChange = (key: string, fieldValue: any) => {
        const newData = { ...value, [key]: fieldValue };
        onChange(newData);
    };

    const fields = getFieldsFromSchema(schema);
    const hasFields = fields.length > 0;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full justify-between p-2 h-auto"
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                >
                    <span className="text-sm font-medium">
                        {fieldKey}
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </span>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            {Object.keys(value || {}).length} fields
                        </Badge>
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
                <div className="border-l-2 border-muted ml-4 pl-4 space-y-4">
                    {hasFields ? (
                        fields.map((field) => {
                            const fieldValue = value?.[field.key];
                            const isRequired = Array.isArray(schema.required) && schema.required.includes(field.key);

                            return (
                                <div key={field.key} className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={field.key} className="text-sm font-medium">
                                            {field.title || field.key}
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
                                    {renderField(field, field.key, fieldValue, handleFieldChange, depth + 1, schema)}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-muted-foreground">No properties defined</p>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

// Array management component
function ArrayManager({ schema, value, onChange, fieldKey, parentSchema }: { schema: any; value: any[]; onChange: (value: any[]) => void; fieldKey: string; parentSchema?: any }) {
    const [isOpen, setIsOpen] = useState(true);
    const isRequired = parentSchema && Array.isArray(parentSchema.required) && parentSchema.required.includes(fieldKey);

    const addItem = () => {
        const itemSchema = schema.items;
        let newItem: any;

        if (itemSchema) {
            switch (itemSchema.type) {
                case "string":
                    newItem = itemSchema.enum ? itemSchema.enum[0] || "" : "";
                    break;
                case "number":
                    newItem = 0;
                    break;
                case "boolean":
                    newItem = false;
                    break;
                case "object":
                    newItem = {};
                    break;
                case "array":
                    newItem = [];
                    break;
                default:
                    newItem = "";
            }
        } else {
            newItem = "";
        }

        onChange([...(value || []), newItem]);
    };

    const removeItem = (index: number) => {
        const newArray = [...(value || [])];
        newArray.splice(index, 1);
        onChange(newArray);
    };

    const moveItem = (fromIndex: number, toIndex: number) => {
        const newArray = [...(value || [])];
        const [movedItem] = newArray.splice(fromIndex, 1);
        newArray.splice(toIndex, 0, movedItem);
        onChange(newArray);
    };

    const updateItem = (index: number, newValue: any) => {
        const newArray = [...(value || [])];
        newArray[index] = newValue;
        onChange(newArray);
    };

    const arrayValue = value || [];
    const itemSchema = schema.items;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full justify-between p-2 h-auto"
                >
                    <span className="text-sm font-medium">
                        {fieldKey}
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </span>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            {arrayValue.length} items
                        </Badge>
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
                <div className="space-y-2">
                    {arrayValue.map((item, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 border rounded-md">
                            <div className="flex flex-col gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveItem(index, Math.max(0, index - 1))}
                                    disabled={index === 0}
                                >
                                    <ChevronUp className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveItem(index, Math.min(arrayValue.length - 1, index + 1))}
                                    disabled={index === arrayValue.length - 1}
                                >
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </div>
                            <div className="flex-1">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={`item-${index}`} className="text-sm font-medium">
                                            Item {index + 1}
                                        </Label>
                                        {itemSchema?.description && (
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="max-w-xs">{itemSchema.description}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                    {renderField(
                                        { key: `item-${index}`, type: itemSchema?.type || "string", ...itemSchema },
                                        `item-${index}`,
                                        item,
                                        (newValue: any) => updateItem(index, newValue),
                                        1,
                                        itemSchema
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={addItem}
                        className="w-full"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                    </Button>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
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

export function SchemaForm({ schema, value, onChange, className = "", metadata }: SchemaFormProps) {
    const [formData, setFormData] = useState(value || {});
    const [activeTab, setActiveTab] = useState<"form" | "json">("form");

    useEffect(() => {
        setFormData(value || {});
    }, [value]);

    const handleFieldChange = (key: string, fieldValue: any) => {
        const newData = { ...formData, [key]: fieldValue };
        setFormData(newData);
        onChange(newData);
    };

    const handleReset = () => {
        if (metadata.defaultInputParams) {
            setFormData(metadata.defaultInputParams);
            onChange(metadata.defaultInputParams);
        } else {
            const defaultValues = getDefaultValues(schema);
            setFormData(defaultValues);
            onChange(defaultValues);
        }
    };


    const getFieldsFromSchema = (schema: any): FormField[] => {
        if (!schema.properties) return [];

        return Object.entries(schema.properties).map(([key, field]: [string, any]) => ({
            key,
            type: field.type || "string",
            title: field.title,
            description: field.description,
            enum: field.enum,
            default: field.default,
            required: Array.isArray(schema.required) && schema.required.includes(key),
            properties: field.properties,
            items: field.items
        }));
    };

    const fields = getFieldsFromSchema(schema);

    if (!schema || !schema.properties) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="text-sm">No Schema Available</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No schema information available for this preset
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Input Parameters</h3>
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
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "form" | "json")}>
                        <TabsList>
                            <TabsTrigger value="form" className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Form
                            </TabsTrigger>
                            <TabsTrigger value="json" className="flex items-center gap-2">
                                <Code className="h-4 w-4" />
                                JSON
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>
            <div>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "form" | "json")}>
                    <TabsContent value="form" className="space-y-4">
                        {fields.length > 0 ? (
                            <div className="space-y-4">
                                {fields.map((field) => {
                                    const fieldValue = formData[field.key];
                                    return renderField(field, field.key, fieldValue, handleFieldChange, 0, schema);
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No input parameters defined for this preset
                            </p>
                        )}
                    </TabsContent>

                    <TabsContent value="json">
                        <JsonEditor
                            value={formData}
                            onChange={onChange}
                            height="400px"
                            className="border rounded-md"
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
