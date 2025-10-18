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
import { Eye, Code, HelpCircle, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, RotateCcw, Image, FileAudio } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PresetMetadata } from "./types";
import { toJSONSchema } from "zod";
import { MediaPicker } from "../media/media-picker";
import { MediaFile } from "@/app/types/media";
import { getAvailableFonts } from "@remotion/google-fonts";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TranscriptionPicker } from "../../transcriber/picker/transcription-picker";
import { Transcription } from "@/app/types/transcription";

const availableFonts = getAvailableFonts();

interface SchemaFormProps {
    metadata?: PresetMetadata;
    schema: any;
    value: any;
    onChange: (value: any) => void;
    className?: string;
    showTabs?: boolean;
    showResetButton?: boolean;
    resetButtonText?: string;
    onReset?: () => void;
    customActions?: React.ReactNode;
    title?: string;
    description?: string;
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

// Helper function to detect if a field should use a large textarea
function isLargeTextField(fieldKey: string, field: FormField): boolean {
    const textKeywords = ['description', 'content', 'prompt'];
    const keyLower = fieldKey.toLowerCase();
    const titleLower = (field.title || '').toLowerCase();
    const descLower = (field.description || '').toLowerCase();

    return textKeywords.some(keyword =>
        keyLower.includes(keyword) ||
        titleLower.includes(keyword) ||
        descLower.includes(keyword)
    );
}

// Helper function to detect if a URL ends with image MIME types
function isImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.svg', '.ico', '.tiff', '.tif'];
    const urlLower = url.toLowerCase().trim();

    // Check if URL ends with image extension
    return imageExtensions.some(ext => urlLower.endsWith(ext));
}

// Helper function to map MediaFile to field value based on field type and structure
function mapMediaFileToFieldValue(mediaFiles: MediaFile | MediaFile[], field: FormField, currentValue: any): any {
    const files = Array.isArray(mediaFiles) ? mediaFiles : [mediaFiles];

    if (field.type === 'string') {
        // For string fields, use filePath
        return files[0]?.filePath || '';
    }

    if (field.type === 'array') {
        if (field.items?.type === 'string') {
            // Array of strings - return filePaths
            return files.map(file => file.filePath).filter(Boolean);
        } else if (field.items?.type === 'object') {
            // Array of objects - map each file to object structure
            return files.map(file => mapMediaFileToObject(file, field.items?.properties || {}));
        }
        // Default array handling
        return files.map(file => file.filePath).filter(Boolean);
    }

    if (field.type === 'object') {
        // For object fields, map file to object structure
        return mapMediaFileToObject(files[0], field.properties || {});
    }

    return files[0]?.filePath || '';
}

// Helper function to map MediaFile to object structure
function mapMediaFileToObject(mediaFile: MediaFile, properties: Record<string, any>): any {
    const result: any = {};

    // Map common properties
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

    // Handle each property in the schema
    Object.keys(properties).forEach(propKey => {
        const propSchema = properties[propKey];
        const mappedKey = propertyMap[propKey];

        if (mappedKey && mediaFile[mappedKey as keyof MediaFile] !== undefined) {
            result[propKey] = mediaFile[mappedKey as keyof MediaFile];
        } else if (mediaFile.metadata && typeof mediaFile.metadata === 'object') {
            // Try to get from metadata using dynamic property access
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

// ImagePreview component
function ImagePreview({ src, alt = "Preview" }: { src: string; alt?: string }) {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleImageLoad = () => {
        setIsLoading(false);
        setImageError(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setImageError(true);
    };

    if (imageError) {
        return (
            <div className="w-12 h-12 border border-dashed border-muted-foreground rounded-md flex items-center justify-center">
                <Image className="h-4 w-4 text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="relative w-12 h-12 border rounded-md overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                crossOrigin="anonymous"
            />
        </div>
    );
}

// MediaPickerButton component
function MediaPickerButton({ onSelect, singular = true, currentValue }: { onSelect: (files: MediaFile | MediaFile[]) => void; singular?: boolean; currentValue?: string }) {
    const [showPicker, setShowPicker] = useState(false);

    const handleSelect = (files: MediaFile | MediaFile[]) => {
        onSelect(files);
        setShowPicker(false);
    };

    const showImagePreview = currentValue && isImageUrl(currentValue);

    return (
        <>
            <div className="flex items-center gap-2">
                {showImagePreview && (
                    <ImagePreview src={currentValue} alt="Image preview" />
                )}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPicker(true)}
                    className="px-3"
                >
                    <Image className="h-4 w-4" />
                </Button>
            </div>
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
}

// TranscriptionPickerButton component
function TranscriptionPickerButton({ onSelect }: { onSelect: (transcription: Transcription) => void }) {
    const [showPicker, setShowPicker] = useState(false);

    const handleSelect = (transcription: Transcription) => {
        onSelect(transcription);
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
                <FileAudio className="h-4 w-4" />
            </Button>
            {showPicker && (
                <TranscriptionPicker
                    open={showPicker}
                    onClose={() => setShowPicker(false)}
                    onSelect={handleSelect}
                />
            )}
        </>
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

    // Filter fonts based on input
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
                const isLargeText = isLargeTextField(fieldKey, field);

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
                                currentValue={typeof fieldValue === 'string' ? fieldValue : ""}
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

                if (isLargeText) {
                    return (
                        <Textarea
                            value={typeof fieldValue === 'string' ? fieldValue : ""}
                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                            placeholder={field.description || `Enter ${field.title || fieldKey}`}
                            rows={8}
                            className="resize-none overflow-y-auto"
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
                                        currentValue={typeof fieldValue === 'string' ? fieldValue : ""}
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
                                        currentValue={typeof fieldValue === 'string' ? fieldValue : ""}
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
        return <div key={fieldKey}>{renderInput()}</div>;
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
    const [isOpen, setIsOpen] = useState(false); // Collapse all objects by default
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
    const [isOpen, setIsOpen] = useState(false); // Collapse all arrays by default
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

export function SchemaForm({
    schema,
    value,
    onChange,
    className = "",
    metadata,
    showTabs = true,
    showResetButton = true,
    resetButtonText = "Reset to default values",
    onReset,
    customActions,
    title = "Input Parameters",
    description
}: SchemaFormProps) {
    const [formData, setFormData] = useState(value || {});
    const [activeTab, setActiveTab] = useState<"form" | "json">("form");

    // Convert zod schema to JSON schema
    const jsonSchema = schema && typeof schema === 'object' && schema._def ? toJSONSchema(schema) : schema;

    useEffect(() => {
        setFormData(value || {});
    }, [value]);

    // Sync formData with value when it changes externally
    useEffect(() => {
        const currentValue = value || {};
        const currentFormData = formData || {};

        // Only update if the values are actually different to prevent infinite loops
        if (JSON.stringify(currentFormData) !== JSON.stringify(currentValue)) {
            setFormData(currentValue);
        }
    }, [value]);

    const handleFieldChange = (key: string, fieldValue: any) => {
        const newData = { ...formData, [key]: fieldValue };
        setFormData(newData);
        onChange(newData);
    };

    const handleJsonChange = (newData: any) => {
        setFormData(newData);
        onChange(newData);
    };

    const handleReset = () => {
        if (onReset) {
            onReset();
        } else if (metadata?.defaultInputParams) {
            setFormData(metadata.defaultInputParams);
            onChange(metadata.defaultInputParams);
        } else {
            const defaultValues = getDefaultValues(jsonSchema);
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

    const fields = getFieldsFromSchema(jsonSchema);

    if (!jsonSchema || !jsonSchema.properties) {
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
                <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {customActions}
                    {showResetButton && (
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
                                <p>{resetButtonText}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                    {showTabs && (
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
                    )}
                </div>
            </div>
            <div>
                {showTabs ? (
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
                                onChange={handleJsonChange}
                                height="400px"
                                className="border rounded-md"
                            />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="space-y-4">
                        {fields.length > 0 ? (
                            <div className="space-y-4">
                                {fields.map((field) => {
                                    const fieldValue = formData[field.key];
                                    return <div key={field.key}>{renderField(field, field.key, fieldValue, handleFieldChange, 0, schema)}</div>;
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No input parameters defined for this preset
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
