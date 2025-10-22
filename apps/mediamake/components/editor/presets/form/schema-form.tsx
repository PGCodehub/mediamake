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
import { JsonEditor } from "../../player/json-editor";
import { Eye, Code, HelpCircle, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, RotateCcw, Image, FileAudio, FormInputIcon, ImageIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PresetMetadata } from "../types";
import { toJSONSchema } from "zod";
import { MediaPicker } from "../../media/media-picker";
import { MediaFile } from "@/app/types/media";
import { getAvailableFonts } from "@remotion/google-fonts";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TranscriptionPicker } from "../../../transcriber/picker/transcription-picker";
import { Transcription } from "@/app/types/transcription";
import { FlexibleObjectField } from "../flexible-object-field";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    availableReferences?: string[]; // Available reference keys for data-referrable fields
    baseData?: Record<string, any>; // Base data for flexible object fields
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
    availableReferences?: string[];
    baseData?: Record<string, any>;
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

// Helper function to detect if a field is data-referrable
function isDataReferrableField(field: FormField): boolean {
    return field.description?.includes('data-referrable') || false;
}

// Helper function to detect if an object field should use flexible object field
function isFlexibleObjectField(field: FormField, availableReferences: string[]): boolean {
    return field.type === 'object' &&
        (field.description?.includes('data-referrable') || false) &&
        availableReferences.length > 0;
}

// Helper function to detect if a URL ends with image MIME types
function isImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.svg', '.ico', '.tiff', '.tif'];
    const urlLower = url.toLowerCase().trim();

    // Check if URL ends with image extension
    return imageExtensions.some(ext => urlLower.endsWith(ext));
}

// Helper function to detect if a URL is a video
function isVideoUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp', '.flv', '.wmv'];
    const urlLower = url.toLowerCase().trim();

    return videoExtensions.some(ext => urlLower.endsWith(ext));
}

// Helper function to detect if a URL is an audio file
function isAudioUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    const audioExtensions = ['.mp3', '.wav', '.aac', '.ogg', '.m4a', '.flac', '.wma'];
    const urlLower = url.toLowerCase().trim();

    return audioExtensions.some(ext => urlLower.endsWith(ext));
}

// Helper function to detect media arrays in data
function detectMediaArrays(data: any): Array<{ key: string, items: any[], title: string }> {
    const mediaArrays: Array<{ key: string, items: any[], title: string }> = [];

    if (!data || typeof data !== 'object') return mediaArrays;

    Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
            // Check if this array contains objects with 'src' field
            const hasSrcField = value.some(item =>
                typeof item === 'object' &&
                item !== null &&
                'src' in item &&
                typeof item.src === 'string' &&
                item.src.trim() !== ''
            );

            if (hasSrcField) {
                mediaArrays.push({
                    key,
                    items: value,
                    title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
                });
            }
        }
    });

    return mediaArrays;
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
            />
        </div>
    );
}

// MediaPreview component for different media types
function MediaPreview({
    item,
    onClick,
    onDelete
}: {
    item: any;
    onClick?: () => void;
    onDelete?: () => void;
}) {
    const src = item.src || '';
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

    const getMediaType = () => {
        if (isImageUrl(src)) return 'image';
        if (isVideoUrl(src)) return 'video';
        if (isAudioUrl(src)) return 'audio';
        return 'unknown';
    };

    const mediaType = getMediaType();

    const renderPreview = () => {
        if (imageError) {
            return (
                <div className="w-full h-24 border border-dashed border-muted-foreground rounded-md flex items-center justify-center">
                    <Image className="h-6 w-6 text-muted-foreground" />
                </div>
            );
        }

        switch (mediaType) {
            case 'image':
                return (
                    <div className="relative w-full h-24 border rounded-md overflow-hidden">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                        <img
                            src={src}
                            alt={item.alt || 'Media preview'}
                            className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />
                    </div>
                );
            case 'video':
                return (
                    <div className="w-full h-24 border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-8 h-8 mx-auto mb-2 bg-primary/20 rounded-full flex items-center justify-center">
                                <span className="text-xs">▶</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Video</p>
                        </div>
                    </div>
                );
            case 'audio':
                return (
                    <div className="w-full h-24 border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        <div className="text-center">
                            <FileAudio className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Audio</p>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="w-full h-24 border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        <div className="text-center">
                            <Image className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Media</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="relative group">
            <div
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={onClick}
            >
                {renderPreview()}
                <div className="mt-2">
                    <p className="text-xs font-medium truncate">{item.title || item.alt || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground truncate">{src.split('/').pop()}</p>
                </div>
            </div>

            {/* Delete button - appears on hover */}
            {onDelete && (
                <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            )}
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

// SortableMediaItem component for individual media items
function SortableMediaItem({
    item,
    index,
    arrayKey,
    onMediaClick,
    onDelete
}: {
    item: any;
    index: number;
    arrayKey: string;
    onMediaClick?: (mediaItem: any, arrayKey: string, index: number) => void;
    onDelete?: (arrayKey: string, index: number) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `${arrayKey}-${index}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="w-full">
            <div className="relative">
                {/* Drag handle - only this area should be draggable */}
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-1 left-1 z-10 cursor-grab active:cursor-grabbing p-1 bg-background/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                </div>
                <MediaPreview
                    item={item}
                    onClick={() => onMediaClick?.(item, arrayKey, index)}
                    onDelete={() => onDelete?.(arrayKey, index)}
                />
            </div>
        </div>
    );
}

// MediaTab component for displaying and managing media arrays
function MediaTab({
    data,
    onChange,
    onMediaClick
}: {
    data: any;
    onChange: (data: any) => void;
    onMediaClick?: (mediaItem: any, arrayKey: string, index: number) => void;
}) {
    const mediaArrays = detectMediaArrays(data);
    const [activeArrayKey, setActiveArrayKey] = useState<string | null>(
        mediaArrays.length > 0 ? mediaArrays[0].key : null
    );

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!activeArrayKey || !over || active.id === over.id) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeIndex = parseInt(activeId.split('-').pop() || '0');
        const overIndex = parseInt(overId.split('-').pop() || '0');

        if (activeIndex === overIndex) return;

        const newData = { ...data };
        const array = [...newData[activeArrayKey]];
        const newArray = arrayMove(array, activeIndex, overIndex);
        newData[activeArrayKey] = newArray;
        onChange(newData);
    };

    const handleDeleteItem = (arrayKey: string, index: number) => {
        const newData = { ...data };
        const array = [...newData[arrayKey]];
        array.splice(index, 1);
        newData[arrayKey] = array;
        onChange(newData);
    };

    if (mediaArrays.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                    <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No Media Found</p>
                    <p className="text-sm">No arrays with media items detected in the current data.</p>
                </div>
            </div>
        );
    }

    const currentArray = mediaArrays.find(arr => arr.key === activeArrayKey);

    return (
        <div className="space-y-4">
            {mediaArrays.length > 1 && (
                <div className="flex gap-2">
                    {mediaArrays.map((array) => (
                        <Button
                            key={array.key}
                            variant={activeArrayKey === array.key ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveArrayKey(array.key)}
                        >
                            {array.title} ({array.items.length})
                        </Button>
                    ))}
                </div>
            )}

            {currentArray && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">
                            {currentArray.title} ({currentArray.items.length} items)
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Drag and drop to reorder • Click to expand
                        </p>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={currentArray.items.map((_, index) => `${activeArrayKey!}-${index}`)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {currentArray.items.map((item, index) => (
                                    <SortableMediaItem
                                        key={`${activeArrayKey}-${index}`}
                                        item={item}
                                        index={index}
                                        arrayKey={activeArrayKey!}
                                        onMediaClick={onMediaClick}
                                        onDelete={handleDeleteItem}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}
        </div>
    );
}

// DataReferrableDropdown component for data-referrable fields with range support
function DataReferrableDropdown({
    value,
    onChange,
    availableReferences,
    fieldKey
}: {
    value: string;
    onChange: (value: string) => void;
    availableReferences: string[];
    fieldKey?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [rangeInput, setRangeInput] = useState('');

    // Parse the current value to extract key and range
    const parseValue = (val: string) => {
        const match = val.match(/^data:\[([^\]]+)\](?:\[([^\]]+)\])?$/);
        if (match) {
            return { key: match[1], range: match[2] || '' };
        }
        return { key: val.replace(/^data:\[|\]$/g, ''), range: '' };
    };

    const { key: currentKey, range: currentRange } = parseValue(value);

    const handleSelect = (selectedValue: string) => {
        const finalValue = rangeInput ? `data:[${selectedValue}][${rangeInput}]` : `data:[${selectedValue}]`;
        onChange(finalValue);
        setRangeInput('');
        setIsOpen(false);
    };

    const handleRangeChange = (newRange: string) => {
        setRangeInput(newRange);
        if (currentKey) {
            const finalValue = newRange ? `data:[${currentKey}][${newRange}]` : `data:[${currentKey}]`;
            onChange(finalValue);
        }
    };

    return (
        <div className="space-y-2">
            {fieldKey && (
                <Label className="text-sm font-medium text-muted-foreground">
                    Reference for: {fieldKey}
                </Label>
            )}
            <div className="space-y-2">
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Input
                            value={currentKey}
                            onChange={(e) => {
                                const inputValue = e.target.value;
                                const finalValue = currentRange ? `data:[${inputValue}][${currentRange}]` : `data:[${inputValue}]`;
                                onChange(finalValue);
                            }}
                            placeholder="Select or type reference key"
                            className="w-full"
                            onFocus={() => setIsOpen(true)}
                        />
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search references..." />
                            <CommandList>
                                <CommandEmpty>No references found.</CommandEmpty>
                                <CommandGroup>
                                    {availableReferences.map((ref) => (
                                        <CommandItem
                                            key={ref}
                                            value={ref}
                                            onSelect={() => handleSelect(ref)}
                                            className="cursor-pointer"
                                        >
                                            <span className="font-medium">{ref}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Range input */}
                <div className="flex gap-2">
                    <Input
                        value={currentRange}
                        onChange={(e) => handleRangeChange(e.target.value)}
                        placeholder="Range (e.g., 2-33 or 1:04-2:03)"
                        className="flex-1 text-sm"
                    />
                    <div className="text-xs text-muted-foreground flex items-center">
                        <span>Index: 2-33</span>
                        <span className="mx-1">|</span>
                        <span>Time: 1:04-2:03</span>
                    </div>
                </div>
            </div>
        </div>
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
    parentSchema?: any,
    availableReferences?: string[],
    baseData?: Record<string, any>
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
                const isDataReferrable = isDataReferrableField(field);

                if (isDataReferrable) {
                    return (
                        <DataReferrableDropdown
                            value={typeof fieldValue === 'string' ? fieldValue : ""}
                            onChange={(val) => handleChange(fieldKey, val)}
                            availableReferences={availableReferences || []}
                            fieldKey={fieldKey}
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
                    // Check if this should use flexible object field
                    if (isFlexibleObjectField(field, availableReferences || [])) {
                        return (
                            <FlexibleObjectField
                                value={fieldValue || {}}
                                onChange={(val) => handleChange(fieldKey, val)}
                                availableReferences={availableReferences || []}
                                baseData={baseData || {}}
                                fieldKey={fieldKey}
                                field={field}
                            />
                        );
                    }

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
                                            availableReferences={availableReferences}
                                            baseData={baseData}
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
                            availableReferences={availableReferences}
                            baseData={baseData}
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
                    const isDataReferrable = isDataReferrableField(field);
                    const isUrlArray = isUrlField(fieldKey, field) ||
                        (field.items.type === 'string' && isUrlField('item', { ...field.items, title: field.items.title || '' }));

                    const isCaptionsArray = fieldKey.toLowerCase().includes('captions') || fieldKey.toLowerCase().includes('inputcaptions');

                    if (isDataReferrable) {
                        return (
                            <DataReferrableDropdown
                                value={Array.isArray(fieldValue) ? fieldValue.join(', ') : (typeof fieldValue === 'string' ? fieldValue : "")}
                                onChange={(val) => {
                                    // Handle both string and array values
                                    if (val.startsWith('data:[')) {
                                        handleChange(fieldKey, val);
                                    } else {
                                        // Convert comma-separated string to array
                                        const arrayValue = val.split(',').map(item => item.trim()).filter(Boolean);
                                        handleChange(fieldKey, arrayValue);
                                    }
                                }}
                                availableReferences={availableReferences || []}
                                fieldKey={fieldKey}
                            />
                        );
                    }

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
                                            availableReferences={availableReferences}
                                            baseData={baseData}
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
                                            availableReferences={availableReferences}
                                            baseData={baseData}
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
                            availableReferences={availableReferences}
                            baseData={baseData}
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
function NestedForm({ schema, value, onChange, fieldKey, depth = 0, parentSchema, availableReferences = [], baseData = {} }: NestedFormProps & { parentSchema?: any }) {
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
                                    {renderField(field, field.key, fieldValue, handleFieldChange, depth + 1, schema, availableReferences, baseData)}
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
function ArrayManager({ schema, value, onChange, fieldKey, parentSchema, availableReferences = [], baseData = {} }: { schema: any; value: any[]; onChange: (value: any[]) => void; fieldKey: string; parentSchema?: any; availableReferences?: string[]; baseData?: Record<string, any> }) {
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
                                            availableReferences={availableReferences}
                                            baseData={baseData}
                                        />
                                    ) : (
                                        <div className="space-y-2">
                                            {renderField(
                                                { key: `item-${index}`, type: itemSchema?.type || "string", ...itemSchema },
                                                `item-${index}`,
                                                item,
                                                (key: string, newValue: any) => updateItem(index, newValue),
                                                1,
                                                itemSchema,
                                                availableReferences,
                                                baseData
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
    description,
    availableReferences = [],
    baseData = {}
}: SchemaFormProps) {
    const [formData, setFormData] = useState(value || {});
    const [activeTab, setActiveTab] = useState<"form" | "json" | "media">("form");
    const [expandedMedia, setExpandedMedia] = useState<{
        item: any;
        arrayKey: string;
        index: number;
    } | null>(null);

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

    const handleMediaClick = (mediaItem: any, arrayKey: string, index: number) => {
        setExpandedMedia({ item: mediaItem, arrayKey, index });
        setActiveTab("form");
    };

    const handleMediaDataChange = (newData: any) => {
        setFormData(newData);
        onChange(newData);
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
                    <h3 className="text-md font-semibold">{title}</h3>
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
                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "form" | "json" | "media")}>
                            <TabsList>
                                <TabsTrigger value="form" className="flex items-center gap-2">
                                    <FormInputIcon className="h-4 w-4" />
                                    Form
                                </TabsTrigger>
                                <TabsTrigger value="json" className="flex items-center gap-2">
                                    <Code className="h-4 w-4" />
                                    Json
                                </TabsTrigger>
                                <TabsTrigger value="media" className="flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" />
                                    Media
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}
                </div>
            </div>
            <div>
                {showTabs ? (
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "form" | "json" | "media")}>
                        <TabsContent value="form" className="space-y-4">
                            {expandedMedia && (
                                <Card className="mb-4 border-primary/20">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm">
                                                Expanded Media Item
                                            </CardTitle>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setExpandedMedia(null)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs font-medium">Array:</Label>
                                                <Badge variant="outline">{expandedMedia.arrayKey}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs font-medium">Index:</Label>
                                                <Badge variant="outline">{expandedMedia.index}</Badge>
                                            </div>
                                            <div className="mt-3">
                                                <JsonEditor
                                                    value={expandedMedia.item}
                                                    onChange={(newItem) => {
                                                        const newData = { ...formData };
                                                        newData[expandedMedia.arrayKey][expandedMedia.index] = newItem;
                                                        handleMediaDataChange(newData);
                                                        setExpandedMedia({ ...expandedMedia, item: newItem });
                                                    }}
                                                    height="200px"
                                                    className="border rounded-md"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {fields.length > 0 ? (
                                <div className="space-y-4">
                                    {fields.map((field) => {
                                        const fieldValue = formData[field.key];
                                        return renderField(field, field.key, fieldValue, handleFieldChange, 0, schema, availableReferences, baseData);
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

                        <TabsContent value="media">
                            <MediaTab
                                data={formData}
                                onChange={handleMediaDataChange}
                                onMediaClick={handleMediaClick}
                            />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="space-y-4">
                        {fields.length > 0 ? (
                            <div className="space-y-4">
                                {fields.map((field) => {
                                    const fieldValue = formData[field.key];
                                    return <div key={field.key}>{renderField(field, field.key, fieldValue, handleFieldChange, 0, schema, availableReferences, baseData)}</div>;
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
