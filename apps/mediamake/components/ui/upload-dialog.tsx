"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dropzone } from "./dropzone";
import { cn } from "@/lib/utils";
import {
    Upload,
    X,
    FileVideo,
    FileAudio,
    Image,
    Link,
    Youtube,
    Check,
    AlertCircle
} from "lucide-react";
import { Tag } from "@/app/types/media";

interface UploadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete: (mediaFiles: any[]) => void;
    initialFiles?: File[];
    autoUpload?: boolean;
    preselectedTags?: string[];
}

interface UploadProgress {
    file: File;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    progress: number;
    mediaUrl?: string;
    error?: string;
}

export function UploadDialog({
    isOpen,
    onClose,
    onUploadComplete,
    initialFiles = [],
    autoUpload = false,
    preselectedTags = []
}: UploadDialogProps) {
    const [files, setFiles] = useState<File[]>(initialFiles);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [uploadedMedia, setUploadedMedia] = useState<any[]>([]);
    const [isCreatingEntries, setIsCreatingEntries] = useState(false);
    const [entryCreationProgress, setEntryCreationProgress] = useState<number>(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadStatus, setDownloadStatus] = useState<string>("");

    // File parameters
    const [contentSubType, setContentSubType] = useState<string>('full');
    const [contentSource, setContentSource] = useState<string>('upload');
    const [selectedTags, setSelectedTags] = useState<string[]>(preselectedTags);

    // Tag management
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [newTagName, setNewTagName] = useState("");

    // Abort controller for upload cancellation
    const abortControllerRef = useRef<AbortController | null>(null);
    const uploadInProgressRef = useRef<boolean>(false);

    // Fetch available tags
    useEffect(() => {
        if (isOpen) {
            fetchTags();
        }
    }, [isOpen]);

    // Update files when initialFiles prop changes
    useEffect(() => {
        if (initialFiles.length > 0) {
            setFiles(initialFiles);
        }
    }, [initialFiles]);

    // Initialize upload progress when files change
    useEffect(() => {
        if (files.length > 0) {
            const progress = files.map(file => ({
                file,
                status: 'pending' as const,
                progress: 0,
            }));
            setUploadProgress(progress);
        }
    }, [files]);

    // Auto-upload effect (only uploads to S3, doesn't create database entries)
    useEffect(() => {
        if (autoUpload && files.length > 0 && !uploadInProgressRef.current) {
            // Start countdown
            setCountdown(0.5);
            const countdownInterval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 0.1) {
                        clearInterval(countdownInterval);
                        uploadFilesToS3(); // Only upload to S3, don't create database entries
                        return 0;
                    }
                    return prev - 0.1;
                });
            }, 100);

            return () => clearInterval(countdownInterval);
        }
    }, [files.length, autoUpload]); // Only depend on files.length and autoUpload

    const fetchTags = async () => {
        try {
            const response = await fetch('/api/tags');
            if (response.ok) {
                const data = await response.json();
                setAvailableTags(data);
            }
        } catch (error) {
            console.error('Error fetching tags:', error);
        }
    };

    const handleTagToggle = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const createAndAddTag = async () => {
        if (!newTagName.trim()) return;

        const generatedId = generateTagId(newTagName.trim());

        try {
            const response = await fetch('/api/tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: generatedId,
                    displayName: newTagName.trim(),
                }),
            });

            if (response.ok) {
                const newTag = await response.json();
                setAvailableTags(prev => [...prev, newTag]);
                setSelectedTags(prev => [...prev, newTag.id]);
                setNewTagName("");
            }
        } catch (error) {
            console.error('Error creating tag:', error);
        }
    };

    const uploadFilesToS3 = async () => {
        if (files.length === 0 || uploadInProgressRef.current) return;

        // Cancel any existing upload
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();
        uploadInProgressRef.current = true;
        setIsUploading(true);

        // Start with uploading status
        setUploadProgress(prev =>
            prev.map(item => ({
                ...item,
                status: 'uploading' as const,
                progress: 0,
            }))
        );

        try {
            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setUploadProgress(prev =>
                    prev.map(item => {
                        if (item.status === 'uploading' && item.progress < 90) {
                            return {
                                ...item,
                                progress: Math.min(item.progress + Math.random() * 20, 90),
                            };
                        }
                        return item;
                    })
                );
            }, 200);

            // Upload files to S3
            const formData = new FormData();
            files.forEach(file => {
                formData.append('file', file);
            });
            //formData.append('folderName', 'mediamake/media');

            const uploadResponse = await fetch('/api/db/files', {
                method: 'POST',
                body: formData,
                signal: abortControllerRef.current.signal,
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload files');
            }

            const uploadData = await uploadResponse.json();
            const uploadedMedia = uploadData.media;

            clearInterval(progressInterval);

            // Update progress to show completion
            setUploadProgress(prev =>
                prev.map((item, index) => ({
                    ...item,
                    status: 'completed' as const,
                    progress: 100,
                    mediaUrl: uploadedMedia[index]?.mediaUrl,
                }))
            );

            // Store uploaded media for later use
            setUploadedMedia(uploadedMedia);
            return uploadedMedia;

        } catch (error) {
            // Don't show error if upload was aborted
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Upload cancelled');
                return;
            }

            console.error('Error uploading files:', error);
            setUploadProgress(prev =>
                prev.map(item => ({
                    ...item,
                    status: 'error' as const,
                    error: error instanceof Error ? error.message : 'Upload failed',
                }))
            );
            throw error;
        } finally {
            setIsUploading(false);
            uploadInProgressRef.current = false;
            abortControllerRef.current = null;
        }
    };

    const createMediaFileEntries = async (uploadedMedia: any[]) => {
        if (uploadedMedia.length === 0 || selectedTags.length === 0) return;

        try {
            setIsCreatingEntries(true);
            setEntryCreationProgress(0);

            // Create media file entries in database with progress tracking
            const mediaFilePromises = uploadedMedia.map(async (media: any, index: number) => {
                const file = files[index];
                const detectedContentType = detectContentType(file);

                const mediaFileData = {
                    tags: selectedTags,
                    contentType: detectedContentType,
                    contentMimeType: media.mediaType || file.type || "application/octet-stream",
                    contentSubType,
                    contentSource,
                    contentSourceUrl: contentSource !== 'upload' ? media.mediaUrl : "upload",
                    fileName: media.mediaName,
                    fileSize: file.size,
                    filePath: media.mediaUrl,
                };

                const response = await fetch('/api/media-files', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(mediaFileData),
                });

                if (!response.ok) {
                    throw new Error(`Failed to create media file entry for ${media.mediaName}`);
                }

                const result = await response.json();

                // Update progress
                setEntryCreationProgress(prev => {
                    const newProgress = ((index + 1) / uploadedMedia.length) * 100;
                    return Math.round(newProgress);
                });

                return result;
            });

            const createdMediaFiles = await Promise.all(mediaFilePromises);
            setUploadComplete(true);
            setIsCreatingEntries(false);
            onUploadComplete(createdMediaFiles);

            // Auto-close after 2 seconds
            setTimeout(() => {
                handleClose();
            }, 2000);

        } catch (error) {
            console.error('Error creating media file entries:', error);
            setIsCreatingEntries(false);
            setEntryCreationProgress(0);
            throw error;
        }
    };

    const uploadFiles = async () => {
        if (files.length === 0 || selectedTags.length === 0 || uploadInProgressRef.current) return;

        try {
            let mediaToUse = uploadedMedia;

            // If files haven't been uploaded to S3 yet, upload them first
            if (uploadedMedia.length === 0) {
                mediaToUse = await uploadFilesToS3();
            }

            // Then create database entries
            await createMediaFileEntries(mediaToUse);

        } catch (error) {
            console.error('Error in upload process:', error);
        }
    };

    const handleClose = () => {
        // Cancel any ongoing uploads
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        setFiles([]);
        setUploadProgress([]);
        setIsUploading(false);
        setUploadComplete(false);
        setSelectedTags([]);
        setNewTagName("");
        setUploadedMedia([]);
        setCountdown(0);
        uploadInProgressRef.current = false;
        abortControllerRef.current = null;
        onClose();
    };

    // Reset files when dialog closes (but not when it opens)
    useEffect(() => {
        if (!isOpen) {
            setFiles([]);
            setUploadProgress([]);
        }
    }, [isOpen]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Handle clipboard paste in dialog
    const handleDialogPaste = async (e: ClipboardEvent) => {
        if (!isOpen) return;

        e.preventDefault();

        const items = e.clipboardData?.items;
        if (!items) return;

        const files: File[] = [];
        const urls: string[] = [];

        // Process all items first
        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    files.push(file);
                }
            } else if (item.kind === 'string' && item.type === 'text/plain') {
                // Use a promise to handle the async getAsString
                const text = await new Promise<string>((resolve) => {
                    item.getAsString((text) => resolve(text));
                });

                // Check if it's a URL
                try {
                    const url = new URL(text);
                    if (url.protocol === 'http:' || url.protocol === 'https:') {
                        urls.push(text);
                    }
                } catch {
                    // Not a valid URL, ignore
                }
            }
        }

        // Handle files from clipboard
        if (files.length > 0) {
            setDownloadStatus("Processing pasted files...");
            setFiles(prev => [...prev, ...files]);
            setDownloadStatus("");
        }

        // Handle URLs from clipboard
        if (urls.length > 0) {
            setIsDownloading(true);
            setDownloadStatus(`Downloading from ${urls.length} URL${urls.length > 1 ? 's' : ''}...`);

            // Download and convert URLs to files
            const urlFiles = await Promise.all(
                urls.map(async (url) => {
                    try {
                        setDownloadStatus(`Downloading: ${url.length > 50 ? url.substring(0, 50) + '...' : url}`);

                        const response = await fetch('/api/download-media', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url })
                        });

                        if (response.ok) {
                            const blob = await response.blob();
                            const fileName = url.split('/').pop() || 'downloaded-file';
                            const file = new (File as any)([blob], fileName, { type: blob.type });
                            return file as File;
                        }
                    } catch (error) {
                        console.error('Error downloading from URL:', error);
                    }
                    return null;
                })
            );

            const validFiles = urlFiles.filter((file): file is File => file !== null);
            if (validFiles.length > 0) {
                setDownloadStatus("Adding files to upload...");
                setFiles(prev => [...prev, ...validFiles]);
            }

            setIsDownloading(false);
            setDownloadStatus("");
        }
    };


    const getContentTypeIcon = (contentType: string) => {
        switch (contentType) {
            case 'video':
                return <FileVideo className="h-4 w-4" />;
            case 'audio':
                return <FileAudio className="h-4 w-4" />;
            case 'image':
                return <Image className="h-4 w-4" />;
            default:
                return <FileVideo className="h-4 w-4" />;
        }
    };

    const canUpload = files.length > 0 && !isUploading && !uploadInProgressRef.current;
    const canCreateEntries = files.length > 0 && selectedTags.length > 0 && !isUploading && !uploadInProgressRef.current && !isCreatingEntries;

    // Function to detect content type from file
    const detectContentType = (file: File): 'video' | 'audio' | 'image' | 'document' | 'unknown' => {
        const mimeType = file.type.toLowerCase();

        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text/')) return 'document';

        return 'unknown';
    };

    // Function to generate tag ID from display name
    const generateTagId = (displayName: string): string => {
        return displayName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, '') // Remove spaces
            .trim();
    };

    // Internal dropzone functionality
    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
    }, []);


    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {getContentTypeIcon('video')}
                        Upload Media Files
                        {autoUpload && (
                            <Badge variant="secondary" className="ml-2">
                                Auto-Upload
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {autoUpload
                            ? "Files will upload to S3 automatically when dropped. Configure parameters and click 'CREATE ENTRIES' to save to database."
                            : "Upload files to S3, then configure parameters and click 'ADD' to create database entries."
                        }
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="files" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
                        <TabsTrigger value="parameters">Parameters</TabsTrigger>
                    </TabsList>

                    <TabsContent value="files" className="space-y-4">
                        {/* File List */}
                        {files.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Selected Files ({files.length})</Label>
                                    {autoUpload && countdown > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="animate-pulse">
                                                Auto-upload in {countdown < 1 ? `${Math.round(countdown * 1000)}ms` : `${countdown}s`}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setCountdown(0);
                                                }}
                                                className="h-6 px-2 text-xs"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                    {uploadProgress.map((item, index) => {
                                        const isImage = item.file.type.startsWith('image/');
                                        const isVideo = item.file.type.startsWith('video/');
                                        const isAudio = item.file.type.startsWith('audio/');

                                        return (
                                            <Card key={`${item.file.name}-${index}`} className="relative overflow-hidden p-0 m-0">
                                                <CardContent className="p-0">
                                                    {/* Media Preview */}
                                                    <div className="relative aspect-video bg-muted flex items-center justify-center">
                                                        {isImage ? (
                                                            <img
                                                                src={URL.createObjectURL(item.file)}
                                                                alt={item.file.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : isVideo ? (
                                                            <video
                                                                src={URL.createObjectURL(item.file)}
                                                                className="w-full h-full object-cover"
                                                                muted
                                                            />
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center p-4">
                                                                {getContentTypeIcon(item.file.type.split('/')[0] as any)}
                                                                <span className="text-xs text-muted-foreground mt-2">
                                                                    {item.file.type.split('/')[0]}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Upload Status Overlay */}
                                                        {item.status === 'uploading' && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                <div className="animate-pulse bg-white/20 rounded-full p-4">
                                                                    <Upload className="h-6 w-6 text-white" />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {item.status === 'completed' && (
                                                            <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                                                                <Check className="h-4 w-4 text-white" />
                                                            </div>
                                                        )}

                                                        {item.status === 'error' && (
                                                            <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                                                                <AlertCircle className="h-4 w-4 text-white" />
                                                            </div>
                                                        )}

                                                        {/* Remove Button */}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                const newFiles = files.filter((_, i) => i !== index);
                                                                setFiles(newFiles);
                                                            }}
                                                            className="absolute top-2 left-2 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>

                                                    {/* File Info */}
                                                    <div className="p-3 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium truncate" title={item.file.name}>
                                                                {item.file.name}
                                                            </span>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {(item.file.size / 1024 / 1024).toFixed(2)} MB
                                                            </Badge>
                                                            <Badge variant="outline" className="text-xs text-blue-600">
                                                                {detectContentType(item.file).toUpperCase()}
                                                            </Badge>
                                                        </div>

                                                        {item.status === 'uploading' && (
                                                            <div className="space-y-1">
                                                                <Progress value={item.progress} className="h-2" />
                                                                <p className="text-xs text-muted-foreground">
                                                                    Uploading... {item.progress}%
                                                                </p>
                                                            </div>
                                                        )}

                                                        {item.status === 'error' && (
                                                            <p className="text-xs text-red-500">{item.error}</p>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Dropzone */}
                        <div className="space-y-2">
                            <Label>Add Files</Label>
                            <div className="relative">
                                <Dropzone
                                    onDrop={onDrop}
                                    onPaste={handleDialogPaste}
                                    maxFiles={10}
                                    uploadLinkText="click to select"
                                    description="Drag & drop files here or"
                                    hint="Copy/Paste Image / URLs"
                                />

                                {/* Download Progress Overlay */}
                                {isDownloading && (
                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                        <p className="text-sm text-muted-foreground text-center px-4">
                                            {downloadStatus}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="parameters" className="space-y-4">
                        {/* Status Message */}
                        {uploadedMedia.length > 0 && selectedTags.length === 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <p className="text-sm text-blue-700">
                                        Files uploaded to S3 successfully! Please select tags and configure parameters to create database entries.
                                    </p>
                                </div>
                            </div>
                        )}


                        {/* Content Sub Type */}
                        <div className="space-y-2">
                            <Label>Content Sub Type</Label>
                            <Input
                                value={contentSubType}
                                onChange={(e) => setContentSubType(e.target.value)}
                                placeholder="e.g., clip, full, preview, etc."
                            />
                        </div>

                        {/* Content Source */}
                        <div className="space-y-2">
                            <Label>Content Source</Label>
                            <Input
                                value={contentSource}
                                onChange={(e) => setContentSource(e.target.value)}
                                placeholder="e.g., upload, web, youtube, pinterest, etc."
                            />
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <Label>Tags {selectedTags.length === 0 && uploadedMedia.length > 0 && (
                                <span className="text-red-500 text-sm">(Required to create entries)</span>
                            )}</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {availableTags.map((tag) => (
                                    <div key={tag._id?.toString()} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={tag.id}
                                            checked={selectedTags.includes(tag.id)}
                                            onCheckedChange={() => handleTagToggle(tag.id)}
                                        />
                                        <Label htmlFor={tag.id} className="text-sm">
                                            {tag.displayName}
                                        </Label>
                                    </div>
                                ))}
                            </div>

                            {/* Create New Tag */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Tag Name (ID will be auto-generated)"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    className="flex-1"
                                />
                                <Button size="sm" onClick={createAndAddTag}>
                                    Add Tag
                                </Button>
                            </div>
                        </div>

                    </TabsContent>
                </Tabs>

                <DialogFooter className="flex flex-col gap-3">
                    {/* Entry Creation Progress Bar */}
                    {isCreatingEntries && (
                        <div className="w-full space-y-2">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Creating database entries...</span>
                                <span>{entryCreationProgress}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${entryCreationProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={uploadFiles}
                            disabled={uploadedMedia.length > 0 ? !canCreateEntries : !canUpload || (autoUpload && countdown > 0)}
                            className="min-w-[120px]"
                        >
                            {isCreatingEntries ? 'Creating Entries...' : isUploading || uploadInProgressRef.current ? 'Uploading...' : uploadComplete ? 'Complete!' : autoUpload && countdown > 0 ? `Auto-upload in ${countdown < 1 ? `${Math.round(countdown * 1000)}ms` : `${countdown}s`}` : uploadedMedia.length > 0 ? `+ CREATE ENTRIES (${files.length})` : `+ ADD (${files.length})`}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
