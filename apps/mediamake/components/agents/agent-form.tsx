"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { SavedEntries } from "./saved-entries";
import { SaveDialog } from "./save-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Code, HelpCircle, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, RotateCcw, Image, FileAudio, Loader2, Play, Save } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toJSONSchema } from "zod";
import { MediaFile } from "@/app/types/media";
import { getAvailableFonts } from "@remotion/google-fonts";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Transcription } from "@/app/types/transcription";

const availableFonts = getAvailableFonts();

interface AgentFormProps {
    inputSchema: any;
    onRunAgent: (params: Record<string, any>) => Promise<any>;
    isLoading: boolean;
    agentPath: string;
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

// Helper function to detect if a field is URL/src related
function isUrlField(fieldKey: string, field: FormField): boolean {
    const urlKeywords = ['url', 'src', 'source', 'image', 'video', 'audio', 'media', 'file', 'path', 'link'];
    const keyLower = fieldKey.toLowerCase();
    const titleLower = (field.title || '').toLowerCase();
    const descLower = (field.description || '').toLowerCase();

    return urlKeywords.some(keyword =>
        keyLower.includes(keyword) ||
        titleLower.includes(keyword) ||
        descLower.includes(keyword)
    );
}

// Helper function to detect if a field is font related
function isFontField(fieldKey: string, field: FormField): boolean {
    const fontKeywords = ['font', 'fontfamily', 'font-family', 'typeface', 'textstyle'];
    const keyLower = fieldKey.toLowerCase();
    const titleLower = (field.title || '').toLowerCase();
    const descLower = (field.description || '').toLowerCase();

    return fontKeywords.some(keyword =>
        keyLower.includes(keyword) ||
        titleLower.includes(keyword) ||
        descLower.includes(keyword)
    );
}

// Helper function to map MediaFile to field value based on field type and structure
function mapMediaFileToFieldValue(mediaFiles: MediaFile | MediaFile[], field: FormField, currentValue: any): any {
    const files = Array.isArray(mediaFiles) ? mediaFiles : [mediaFiles];

    if (field.type === 'string') {
        return files[0]?.filePath || '';
    }

    if (field.type === 'array') {
        if (field.items?.type === 'string') {
            return files.map(file => file.filePath).filter(Boolean);
        } else if (field.items?.type === 'object') {
            return files.map(file => mapMediaFileToObject(file, field.items?.properties || {}));
        }
        return files.map(file => file.filePath).filter(Boolean);
    }

    if (field.type === 'object') {
        return mapMediaFileToObject(files[0], field.properties || {});
    }

    return files[0]?.filePath || '';
}

// Helper function to map MediaFile to object structure
function mapMediaFileToObject(mediaFile: MediaFile, properties: Record<string, any>): any {
    const result: any = {};

    const propertyMap: Record<string, string> = {
        'src': 'filePath',
        'url': 'filePath',
        'path': 'filePath',
        'fileName': 'fileName',
        'contentType': 'contentType',
        'fileSize': 'fileSize',
        'createdAt': 'createdAt',
        'updatedAt': 'updatedAt'
    };

    Object.keys(properties).forEach(propKey => {
        const propSchema = properties[propKey];
        const mappedKey = propertyMap[propKey];

        if (mappedKey && mediaFile[mappedKey as keyof MediaFile] !== undefined) {
            result[propKey] = mediaFile[mappedKey as keyof MediaFile];
        } else if (mediaFile.metadata && typeof mediaFile.metadata === 'object') {
            const metadataValue = getNestedProperty(mediaFile.metadata, propKey);
            if (metadataValue !== undefined) {
                result[propKey] = metadataValue;
            }
        }
    });

    return result;
}

// Helper function to get nested properties from metadata
function getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
}

// MediaPickerButton component
function MediaPickerButton({ onSelect, singular = true }: { onSelect: (files: MediaFile | MediaFile[]) => void; singular?: boolean }) {
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const mediaFiles: MediaFile[] = Array.from(files).map(file => ({
                _id: Math.random().toString() as any,
                fileName: file.name,
                filePath: URL.createObjectURL(file),
                contentType: file.type.startsWith('image/') ? 'image' :
                    file.type.startsWith('video/') ? 'video' :
                        file.type.startsWith('audio/') ? 'audio' : 'document' as 'image' | 'video' | 'audio' | 'document' | 'unknown',
                fileSize: file.size,
                createdAt: new Date(),
                updatedAt: new Date(),
                tags: [],
                metadata: {},
                clientId: Math.random().toString(),
                contentMimeType: file.type,
                contentSubType: file.type.split('/')[1] || '',
                contentSource: 'upload'
            }));
            onSelect(singular ? mediaFiles[0] : mediaFiles);
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            className="px-3"
            asChild
        >
            <label>
                <Image className="h-4 w-4" />
                <input
                    type="file"
                    multiple={!singular}
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </label>
        </Button>
    );
}

// TranscriptionPickerButton component
function TranscriptionPickerButton({ onSelect }: { onSelect: (transcription: Transcription) => void }) {
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            const transcription: Transcription = {
                _id: Math.random().toString() as any,
                assemblyId: Math.random().toString(),
                audioUrl: URL.createObjectURL(file),
                status: 'completed' as const,
                tags: [],
                captions: [],
                processingData: {},
                createdAt: new Date(),
                updatedAt: new Date()
            };
            onSelect(transcription);
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            className="px-3"
            asChild
        >
            <label>
                <FileAudio className="h-4 w-4" />
                <input
                    type="file"
                    accept=".srt,.vtt,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </label>
        </Button>
    );
}

// FontDropdown component for font selection with editable text
function FontDropdown({
    value,
    onChange,
    placeholder = "Select or type font name"
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const [inputValue, setInputValue] = useState(value || "");
    const [isOpen, setIsOpen] = useState(false);

    const filteredFonts = availableFonts.filter(font =>
        font.fontFamily.toLowerCase().includes(inputValue.toLowerCase()) ||
        font.importName.toLowerCase().includes(inputValue.toLowerCase())
    );

    const handleInputChange = (newValue: string) => {
        setInputValue(newValue);
        onChange(newValue);
    };

    const handleSelect = (selectedValue: string) => {
        setInputValue(selectedValue);
        onChange(selectedValue);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Input
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full"
                    onFocus={() => setIsOpen(true)}
                />
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search fonts..."
                        value={inputValue}
                        onValueChange={handleInputChange}
                    />
                    <CommandList>
                        <CommandEmpty>No fonts found.</CommandEmpty>
                        <CommandGroup>
                            {filteredFonts.map((font) => (
                                <CommandItem
                                    key={font.importName}
                                    value={font.importName}
                                    onSelect={() => handleSelect(font.importName)}
                                    className="cursor-pointer"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{font.fontFamily}</span>
                                        <span className="text-xs text-muted-foreground">{font.importName}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
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

                const isUrl = isUrlField(fieldKey, field);
                const isFont = isFontField(fieldKey, field);
                const isDescription = fieldKey.toLowerCase().includes('description');

                if (isDescription) {
                    return (
                        <Textarea
                            value={typeof fieldValue === 'string' ? fieldValue : ""}
                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                            placeholder={field.description || `Enter ${field.title || fieldKey}`}
                            rows={8}
                            className="resize-none"
                        />
                    );
                }

                if (isUrl) {
                    return (
                        <div className="flex gap-2">
                            <Input
                                value={typeof fieldValue === 'string' ? fieldValue : ""}
                                onChange={(e) => handleChange(fieldKey, e.target.value)}
                                placeholder={field.description || `Enter ${field.title || fieldKey}`}
                                className="flex-1"
                            />
                            <MediaPickerButton
                                onSelect={(files) => {
                                    const newValue = mapMediaFileToFieldValue(files, field, fieldValue);
                                    handleChange(fieldKey, newValue);
                                }}
                                singular={true}
                            />
                        </div>
                    );
                }

                if (isFont) {
                    return (
                        <FontDropdown
                            value={typeof fieldValue === 'string' ? fieldValue : ""}
                            onChange={(val) => handleChange(fieldKey, val)}
                            placeholder={field.description || `Select or type font name`}
                        />
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
                    const hasUrlProperties = Object.keys(field.properties || {}).some(propKey =>
                        isUrlField(propKey, { ...(field.properties?.[propKey] || {}), title: field.properties?.[propKey]?.title || '' })
                    );

                    if (hasUrlProperties) {
                        return (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <NestedForm
                                            schema={field}
                                            value={fieldValue || {}}
                                            onChange={(val) => handleChange(fieldKey, val)}
                                            fieldKey={fieldKey}
                                            depth={depth}
                                            parentSchema={parentSchema}
                                        />
                                    </div>
                                    <MediaPickerButton
                                        onSelect={(files) => {
                                            const newValue = mapMediaFileToFieldValue(files, field, fieldValue);
                                            handleChange(fieldKey, newValue);
                                        }}
                                        singular={true}
                                    />
                                </div>
                            </div>
                        );
                    }

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
                        <Textarea
                            value={JSON.stringify(fieldValue || {}, null, 2)}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    handleChange(fieldKey, parsed);
                                } catch (error) {
                                    // Invalid JSON, keep the text but don't update the value
                                }
                            }}
                            rows={8}
                            className="font-mono text-sm"
                            placeholder="Enter JSON object"
                        />
                    </div>
                );

            case "array":
                if (field.items) {
                    const isUrlArray = isUrlField(fieldKey, field) ||
                        (field.items.type === 'string' && isUrlField('item', { ...field.items, title: field.items.title || '' }));

                    const isCaptionsArray = fieldKey.toLowerCase().includes('captions') || fieldKey.toLowerCase().includes('inputcaptions');

                    if (isUrlArray) {
                        return (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <ArrayManager
                                            schema={field}
                                            value={fieldValue || []}
                                            onChange={(val) => handleChange(fieldKey, val)}
                                            fieldKey={fieldKey}
                                            parentSchema={parentSchema}
                                        />
                                    </div>
                                    <MediaPickerButton
                                        onSelect={(files) => {
                                            const newValue = mapMediaFileToFieldValue(files, field, fieldValue);
                                            handleChange(fieldKey, newValue);
                                        }}
                                        singular={false}
                                    />
                                </div>
                            </div>
                        );
                    }

                    if (isCaptionsArray) {
                        return (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <ArrayManager
                                            schema={field}
                                            value={fieldValue || []}
                                            onChange={(val) => handleChange(fieldKey, val)}
                                            fieldKey={fieldKey}
                                            parentSchema={parentSchema}
                                        />
                                    </div>
                                    <TranscriptionPickerButton
                                        onSelect={(transcription) => {
                                            if (transcription.captions) {
                                                handleChange(fieldKey, transcription.captions);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    }

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
                        <Textarea
                            value={JSON.stringify(fieldValue || [], null, 2)}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    handleChange(fieldKey, parsed);
                                } catch (error) {
                                    // Invalid JSON, keep the text but don't update the value
                                }
                            }}
                            rows={8}
                            className="font-mono text-sm"
                            placeholder="Enter JSON array"
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
    const [isOpen, setIsOpen] = useState(false);
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
    const [isOpen, setIsOpen] = useState(false);
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
                                    {itemSchema?.type === 'object' && itemSchema?.properties ? (
                                        <NestedForm
                                            schema={itemSchema}
                                            value={item || {}}
                                            onChange={(val) => updateItem(index, val)}
                                            fieldKey={`item-${index}`}
                                            depth={1}
                                            parentSchema={itemSchema}
                                        />
                                    ) : (
                                        <div className="space-y-2">
                                            {renderField(
                                                { key: `item-${index}`, type: itemSchema?.type || "string", ...itemSchema },
                                                `item-${index}`,
                                                item,
                                                (key: string, newValue: any) => updateItem(index, newValue),
                                                1,
                                                itemSchema
                                            )}
                                        </div>
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

export function AgentForm({ inputSchema, onRunAgent, isLoading, agentPath }: AgentFormProps) {
    const [activeTab, setActiveTab] = useState<"form" | "json">("form");
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [currentOutput, setCurrentOutput] = useState<any>(null);

    // Convert zod schema to JSON schema - memoized to prevent infinite re-renders
    const jsonSchema = useMemo(() => {
        return inputSchema && typeof inputSchema === 'object' && inputSchema._def ? toJSONSchema(inputSchema) : inputSchema;
    }, [inputSchema]);

    // Get default values for initial form data
    const defaultValues = useMemo(() => {
        if (jsonSchema) {
            return getDefaultValues(jsonSchema);
        }
        return {};
    }, [jsonSchema]);

    // Local form state
    const [formData, setFormData] = useState<Record<string, any>>(defaultValues);

    // Initialize form data when defaultValues change
    useEffect(() => {
        setFormData(defaultValues);
    }, [defaultValues]);

    // Use form persistence hook for saved entries management
    const {
        isLoading: isPersistenceLoading,
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
        },
        onOutputChange: (output) => {
            setCurrentOutput(output);
        }
    });

    const handleFieldChange = useCallback((key: string, fieldValue: any) => {
        // No auto-save, just update local state
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
        } catch (error) {
            console.error("Error running agent:", error);
        }
    }, [formData, onRunAgent]);

    const handleReset = useCallback(() => {
        setFormData(defaultValues);
        setCurrentOutput(null);
    }, [defaultValues]);

    const handleSave = useCallback((title: string, description?: string) => {
        saveFormData(title, formData, currentOutput);
        setIsSaveDialogOpen(false);
    }, [formData, currentOutput, saveFormData]);

    const getFieldsFromSchema = useCallback((schema: any): FormField[] => {
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
    }, []);

    const fields = useMemo(() => getFieldsFromSchema(jsonSchema), [jsonSchema, getFieldsFromSchema]);

    // Don't show loading state for persistence - it's just loading saved entries
    // The form should be available immediately

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
        <Card className="h-full">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Agent Parameters</CardTitle>
                    <div className="flex items-center gap-2">
                        <SavedEntries
                            savedEntries={savedEntries}
                            onLoadEntry={loadEntry}
                            onDeleteEntry={deleteEntry}
                            onClearAll={clearAllData}
                        />
                        <Button
                            onClick={() => setIsSaveDialogOpen(true)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Save
                        </Button>
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
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "form" | "json")}>
                        <TabsContent value="form" className="space-y-4">
                            {fields.length > 0 ? (
                                <div className="space-y-4">
                                    {fields.map((field) => {
                                        const fieldValue = formData[field.key];
                                        return renderField(field, field.key, fieldValue, handleFieldChange, 0, jsonSchema);
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No input parameters defined for this agent
                                </p>
                            )}
                        </TabsContent>

                        <TabsContent value="json">
                            <Textarea
                                value={JSON.stringify(formData, null, 2)}
                                onChange={(e) => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        handleJsonChange(parsed);
                                    } catch (error) {
                                        // Invalid JSON, keep the text but don't update the value
                                    }
                                }}
                                rows={16}
                                className="font-mono text-sm border rounded-md"
                                placeholder="Enter JSON object"
                            />
                        </TabsContent>
                    </Tabs>

                    <Button
                        type="submit"
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
                </form>
            </CardContent>

            <SaveDialog
                isOpen={isSaveDialogOpen}
                onClose={() => setIsSaveDialogOpen(false)}
                onSave={handleSave}
            />
        </Card>
    );
}
