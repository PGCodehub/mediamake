"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Upload,
    Search,
    FileVideo,
    FileAudio,
    Image,
    ExternalLink,
    Download,
    Trash2,
    Edit,
    Plus,
    Filter,
    FileText,
    SortAsc,
    SortDesc,
    X,
    Grid3X3,
    List,
    Check,
    X as XIcon
} from "lucide-react";
import { MediaFile, Tag } from "@/app/types/media";
import { UploadTrigger } from "@/components/ui/upload-trigger";
import { UrlIndexingTrigger } from "@/components/ui/url-indexing-trigger";
import { MediaGrid, MediaOptionsDropdown } from "./media-ui";
import useSWR from "swr";
import { MediaSidebar } from "./media-sidebar";
import { useMedia } from "./media-context";

// Pagination component
interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) {
        return null;
    }

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const getPageNumbers = () => {
        const pageNumbers: (number | string)[] = [];
        const maxPagesToShow = 5;
        const halfPagesToShow = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            if (currentPage <= halfPagesToShow + 1) {
                for (let i = 1; i <= maxPagesToShow; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            } else if (currentPage >= totalPages - halfPagesToShow) {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = totalPages - maxPagesToShow + 1; i <= totalPages; i++) {
                    pageNumbers.push(i);
                }
            } else {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = currentPage - halfPagesToShow; i <= currentPage + halfPagesToShow; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            }
        }
        return pageNumbers;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex items-center justify-between mt-4 p-2 border-t">
            <span className="text-sm text-muted-foreground">
                Total results: {totalItems}
            </span>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentPage === 1}>
                    Previous
                </Button>
                {pageNumbers.map((page, index) =>
                    typeof page === 'number' ? (
                        <Button
                            key={index}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </Button>
                    ) : (
                        <span key={index} className="px-2 py-1 text-sm">
                            {page}
                        </span>
                    )
                )}
                <Button variant="outline" size="sm" onClick={handleNext} disabled={currentPage === totalPages}>
                    Next
                </Button>
            </div>
        </div>
    );
}

interface MediaPickerProps {
    pickerMode?: boolean;
    singular?: boolean;
    onSelect?: (files: MediaFile | MediaFile[]) => void;
    onClose?: () => void;
    selectedTag?: string | null;
    selectedFile?: MediaFile | null;
    onSelectFile?: (file: MediaFile | null) => void;
    tagToAddToHashtags?: string | null | "CLEAR_ALL";
    onTagAddedToHashtags?: () => void;
    hashtagFilters?: string[];
    onHashtagFiltersChange?: (filters: string[]) => void;
    showSidebar?: boolean;
}

// Content source options for filtering
const CONTENT_SOURCES = {
    pinterest: "Pinterest",
    midjourney: "Midjourney",
    youtube: "YouTube",
    upload: "Upload",
    web: "Web",
    instagram: "Instagram",
    tiktok: "TikTok"
} as const;

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

export function MediaPicker({
    pickerMode = false,
    singular = false,
    onSelect,
    onClose,
    selectedTag: propSelectedTag,
    selectedFile: propSelectedFile,
    onSelectFile: propOnSelectFile,
    tagToAddToHashtags: propTagToAddToHashtags,
    onTagAddedToHashtags: propOnTagAddedToHashtags,
    hashtagFilters: propHashtagFilters,
    onHashtagFiltersChange: propOnHashtagFiltersChange,
    showSidebar = true
}: MediaPickerProps) {
    const {
        selectedTag: contextSelectedTag,
        setSelectedTag: setContextSelectedTag,
        hashtagFilters: contextHashtagFilters,
        setHashtagFilters: setContextHashtagFilters,
        addHashtagFilter: contextAddHashtagFilter,
        removeHashtagFilter: contextRemoveHashtagFilter,
        selectedFile: contextSelectedFile,
        setSelectedFile: setContextSelectedFile,
        selectedFiles: contextSelectedFiles,
        setSelectedFiles: setContextSelectedFiles
    } = useMedia();

    // Use context values or fallback to props
    const selectedTag = propSelectedTag || contextSelectedTag;
    const selectedFile = propSelectedFile || contextSelectedFile;
    const hashtagFilters = propHashtagFilters || contextHashtagFilters;
    const selectedFiles = contextSelectedFiles;

    // Picker-specific state
    const [tagToAddToHashtags, setTagToAddToHashtags] = useState<string | null | "CLEAR_ALL">(propTagToAddToHashtags || null);
    const [searchQuery, setSearchQuery] = useState("");
    const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
    const [hashtagInput, setHashtagInput] = useState("");
    const [contentSourceFilter, setContentSourceFilter] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(30);

    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, contentTypeFilter, sortOrder, hashtagFilters, contentSourceFilter, selectedTag]);

    // Focus management for picker mode
    useEffect(() => {
        if (pickerMode) {
            // Focus the dialog container to capture keyboard events
            const dialogElement = document.querySelector('[data-media-picker-dialog]') as HTMLElement;
            if (dialogElement) {
                dialogElement.focus();
            }
        }
    }, [pickerMode]);

    // Build API URL with filters
    const buildApiUrl = () => {
        const params = new URLSearchParams();
        if (selectedTag) params.append('tag', selectedTag);
        if (contentTypeFilter !== 'all') params.append('contentType', contentTypeFilter);
        if (contentSourceFilter !== 'all') params.append('contentSource', contentSourceFilter);
        if (hashtagFilters.length > 0) {
            params.append('tags', hashtagFilters.join(','));
        }
        params.append('sort', 'createdAt');
        params.append('order', sortOrder === 'latest' ? 'desc' : 'asc');
        params.append('page', currentPage.toString());
        params.append('limit', itemsPerPage.toString());
        return `/api/media-files?${params}`;
    };

    // Use SWR for data fetching
    const { data: filesData, error: filesError, mutate: mutateFiles } = useSWR(buildApiUrl(), fetcher);
    const { data: tagsData, error: tagsError } = useSWR('/api/tags', fetcher);

    const files = filesData?.files || [];
    const totalCount = filesData?.total || 0;
    const hasMore = filesData?.hasMore || false;
    const tags = tagsData || [];
    const isLoading = !filesData && !filesError;


    const getTagDisplayName = (tagId: string) => {
        const tag = tags.find((t: Tag) => t.id === tagId);
        return tag ? tag.displayName : tagId;
    };

    // Hashtag filter functions
    const addHashtagFilter = (tag: string) => {
        if (tag.trim() && !hashtagFilters.includes(tag.trim())) {
            const newFilters = [...hashtagFilters, tag.trim()];
            setContextHashtagFilters(newFilters);
            propOnHashtagFiltersChange?.(newFilters);
        }
    };

    const removeHashtagFilter = (tag: string) => {
        const newFilters = hashtagFilters.filter(t => t !== tag);
        setContextHashtagFilters(newFilters);
        propOnHashtagFiltersChange?.(newFilters);
    };

    const handleHashtagInputKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addHashtagFilter(hashtagInput);
            setHashtagInput("");
        }
    };

    const handleHashtagInputBlur = () => {
        if (hashtagInput.trim()) {
            addHashtagFilter(hashtagInput);
            setHashtagInput("");
        }
    };

    const handleTagSelection = (tagId: string | null) => {
        if (tagId) {
            setTagToAddToHashtags(tagId);
            setContextSelectedTag(tagId);
            setContextHashtagFilters([tagId]);
        } else {
            setTagToAddToHashtags("CLEAR_ALL");
            setContextSelectedTag(null);
            setContextHashtagFilters([]);
        }
        setContextSelectedFile(null);
    };

    const handleHashtagFiltersChange = (filters: string[]) => {
        setContextHashtagFilters(filters);
        propOnHashtagFiltersChange?.(filters);
    };

    // Handle tag selection from sidebar - replace all hashtag filters
    useEffect(() => {
        if (tagToAddToHashtags === "CLEAR_ALL") {
            setContextHashtagFilters([]);
            propOnTagAddedToHashtags?.();
        } else if (tagToAddToHashtags) {
            setContextHashtagFilters([tagToAddToHashtags]);
            propOnTagAddedToHashtags?.();
        }
    }, [tagToAddToHashtags, propOnTagAddedToHashtags]);

    const getContentTypeIcon = (contentType: string) => {
        switch (contentType) {
            case 'video':
                return <FileVideo className="h-5 w-5" />;
            case 'audio':
                return <FileAudio className="h-5 w-5" />;
            case 'image':
                return <Image className="h-5 w-5" />;
            case 'document':
                return <FileText className="h-5 w-5" />;
            default:
                return <FileVideo className="h-5 w-5" />;
        }
    };

    const handleCopyUrl = (file: MediaFile) => {
        if (file.filePath) {
            navigator.clipboard.writeText(file.filePath);
        }
    };

    const handleCopyId = (file: MediaFile) => {
        if (file._id) {
            navigator.clipboard.writeText(file._id.toString());
        }
    };

    const handleEditDetails = (file: MediaFile) => {
        console.log('Edit details for:', file);
    };

    const handleDeleteMedia = async (file: MediaFile) => {
        if (confirm('Are you sure you want to delete this media file?')) {
            try {
                const response = await fetch(`/api/media-files/${file._id}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    mutateFiles();
                }
            } catch (error) {
                console.error('Error deleting media:', error);
            }
        }
    };

    // Picker-specific functions
    const handleFileSelection = (file: MediaFile) => {
        if (!pickerMode) {
            setContextSelectedFile(file);
            propOnSelectFile?.(file);
            return;
        }

        const fileId = file._id?.toString();
        if (!fileId) return;

        if (singular) {
            // Singular mode - select and close immediately
            onSelect?.(file);
            onClose?.();
            return;
        }

        // Multi-select mode
        const newSelectedFiles = new Set(selectedFiles);
        if (newSelectedFiles.has(fileId)) {
            newSelectedFiles.delete(fileId);
        } else {
            newSelectedFiles.add(fileId);
        }
        setContextSelectedFiles(newSelectedFiles);
    };

    const handlePickItems = () => {
        if (selectedFiles.size === 0) return;

        const selectedFilesArray = files.filter((file: MediaFile) =>
            file._id && selectedFiles.has(file._id.toString())
        );

        onSelect?.(selectedFilesArray);
        onClose?.();
    };

    const clearSelection = () => {
        setContextSelectedFiles(new Set());
    };

    const filteredFiles = useMemo(() =>
        files.filter((file: MediaFile) =>
            file.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            file.contentSourceUrl?.toLowerCase().includes(searchQuery.toLowerCase())
        ), [files, searchQuery]);


    const visibleFileIds = useMemo(() =>
        filteredFiles
            .map((file: MediaFile) => file._id?.toString())
            .filter((id: string | undefined): id is string => !!id),
        [filteredFiles]
    );

    const allVisibleSelected = useMemo(() =>
        visibleFileIds.length > 0 && visibleFileIds.every((id: string) => selectedFiles.has(id)),
        [visibleFileIds, selectedFiles]
    );

    const selectAllVisible = () => {
        if (!pickerMode) return;

        const newSelectedFiles = new Set(selectedFiles);
        if (allVisibleSelected) {
            // Deselect all visible
            visibleFileIds.forEach((id: string) => newSelectedFiles.delete(id));
        } else {
            // Select all visible
            visibleFileIds.forEach((id: string) => newSelectedFiles.add(id));
        }
        setContextSelectedFiles(newSelectedFiles);
    };

    const containerClasses = pickerMode
        ? "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        : "flex-1 bg-background";

    const contentClasses = pickerMode
        ? "fixed right-0 top-0 h-full w-[80vw] md:w-[80vw] bg-background border-l shadow-lg"
        : "flex-1 bg-background";

    return (
        <div className={containerClasses}>
            {pickerMode && (
                <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            )}
            <div
                className={contentClasses}
                data-media-picker-dialog
                tabIndex={-1}
                onKeyDown={(e) => {
                    // Handle escape key to close
                    if (e.key === 'Escape' && pickerMode) {
                        onClose?.();
                    }
                }}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b bg-muted/30">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">
                                {pickerMode ? "Select Media" : (selectedTag ? `Files tagged with "${getTagDisplayName(selectedTag)}"` : 'All Files')}
                            </h2>
                            <div className="flex items-center gap-2">
                                <UploadTrigger
                                    autoUpload={true}
                                    onUploadComplete={() => {
                                        mutateFiles();
                                    }}
                                    preselectedTags={hashtagFilters}
                                    pickerMode={pickerMode}
                                />
                                {pickerMode && (
                                    <Button variant="ghost" size="sm" onClick={onClose}>
                                        <XIcon className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center justify-between gap-4">
                            {/* Left Side - Hashtag Filters */}
                            <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm font-medium text-muted-foreground">Tags:</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {hashtagFilters.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 transition-colors"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                removeHashtagFilter(tag);
                                            }}
                                        >
                                            #{tag}
                                            <X className="h-3 w-3 hover:text-destructive" />
                                        </Badge>
                                    ))}
                                    <Input
                                        placeholder="Add hashtag..."
                                        value={hashtagInput}
                                        onChange={(e) => setHashtagInput(e.target.value)}
                                        onKeyPress={handleHashtagInputKeyPress}
                                        onBlur={handleHashtagInputBlur}
                                        className="w-32 h-8 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Right Side - Other Filters */}
                            <div className="flex items-center gap-3">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search files..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 w-48"
                                    />
                                </div>

                                {/* Content Type Filter */}
                                <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                                    <SelectTrigger className="w-24">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="audio">Audio</SelectItem>
                                        <SelectItem value="image">Image</SelectItem>
                                        <SelectItem value="document">Document</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Content Source Filter */}
                                <Select value={contentSourceFilter} onValueChange={setContentSourceFilter}>
                                    <SelectTrigger className="w-24">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sources</SelectItem>
                                        {Object.entries(CONTENT_SOURCES).map(([key, value]) => (
                                            <SelectItem key={key} value={key}>{value}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Sort Order */}
                                <Select value={sortOrder} onValueChange={(value: "latest" | "oldest") => setSortOrder(value)}>
                                    <SelectTrigger className="w-24">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="latest">
                                            <div className="flex items-center gap-2">
                                                <SortDesc className="h-4 w-4" />
                                                Latest
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="oldest">
                                            <div className="flex items-center gap-2">
                                                <SortAsc className="h-4 w-4" />
                                                Oldest
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* View Mode Toggle */}
                                <div className="flex items-center border rounded-md">
                                    <Button
                                        variant={viewMode === "grid" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setViewMode("grid")}
                                        className="rounded-r-none border-r"
                                    >
                                        <Grid3X3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === "list" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setViewMode("list")}
                                        className="rounded-l-none"
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* All Tags Horizontal List */}
                        {tags.length > 0 && (
                            <div className="mt-4 flex flex-col">
                                <div className="overflow-x-auto pb-2 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {tags.map((tag: Tag) => (
                                            <Badge
                                                key={tag.id}
                                                variant={hashtagFilters.includes(tag.id) ? "default" : "outline"}
                                                className="flex items-center gap-1 cursor-pointer hover:bg-primary/10 transition-colors whitespace-nowrap"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (hashtagFilters.includes(tag.id)) {
                                                        removeHashtagFilter(tag.id);
                                                    } else {
                                                        addHashtagFilter(tag.id);
                                                    }
                                                }}
                                            >
                                                #{tag.displayName}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 overflow-hidden">
                        {!pickerMode && showSidebar && (
                            <MediaSidebar
                                selectedTag={selectedTag}
                                onSelectTag={handleTagSelection}
                                hashtagFilters={hashtagFilters}
                                onHashtagFiltersChange={handleHashtagFiltersChange}
                            />
                        )}
                        <div className="flex-1 overflow-hidden">
                            <div className="p-4 h-full overflow-auto">

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="col-span-1">
                                        <UrlIndexingTrigger
                                            uiType="dropzone"
                                            onIndexingComplete={() => {
                                                mutateFiles();
                                            }}
                                            dropzoneClassName="min-h-[200px]"
                                            preselectedTags={hashtagFilters}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <UploadTrigger
                                            autoUpload={true}
                                            uiType="dropzone"
                                            onUploadComplete={() => {
                                                mutateFiles();
                                            }}
                                            dropzoneClassName="min-h-[200px]"
                                            preselectedTags={hashtagFilters}
                                            pickerMode={pickerMode}
                                        />
                                    </div>
                                </div>
                                {isLoading ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        Loading files...
                                    </div>
                                ) : filteredFiles.length === 0 ? (
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                    </div>
                                ) : (
                                    <div>
                                        {viewMode === "grid" ? (
                                            <MediaGrid
                                                mediaFiles={filteredFiles}
                                                onEditDetails={handleEditDetails}
                                                onCopyUrl={handleCopyUrl}
                                                onCopyId={handleCopyId}
                                                onDeleteMedia={handleDeleteMedia}
                                                pickerMode={pickerMode}
                                                selectedFiles={selectedFiles}
                                                onFileSelect={handleFileSelection}
                                            />
                                        ) : (
                                            <div className="space-y-2">
                                                {filteredFiles.map((file: MediaFile) => {
                                                    const fileId = file._id?.toString();
                                                    const isSelected = pickerMode ? selectedFiles.has(fileId || '') : selectedFile?._id === file._id;
                                                    const isPickerSelected = pickerMode && selectedFiles.has(fileId || '');

                                                    return (
                                                        <Card
                                                            key={file._id?.toString()}
                                                            className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary' : ''
                                                                } ${isPickerSelected ? 'bg-primary/10' : ''}`}
                                                            onClick={() => handleFileSelection(file)}
                                                        >
                                                            <CardContent className="p-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-4">
                                                                        {pickerMode && (
                                                                            <div className="flex items-center justify-center w-6 h-6">
                                                                                {isPickerSelected && (
                                                                                    <Check className="h-5 w-5 text-primary" />
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        {getContentTypeIcon(file.contentType)}
                                                                        <div className="flex-1">
                                                                            <h3 className="font-medium">{file.fileName || 'Untitled'}</h3>
                                                                            <p className="text-sm text-muted-foreground">
                                                                                {file.contentType} • {new Date(file.createdAt).toLocaleDateString()}
                                                                            </p>
                                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                                {file.tags.map((tagId: string) => (
                                                                                    <span
                                                                                        key={tagId}
                                                                                        className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            console.log('Filter by tag:', tagId);
                                                                                        }}
                                                                                    >
                                                                                        #{getTagDisplayName(tagId)}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {!pickerMode && (
                                                                        <MediaOptionsDropdown
                                                                            mediaFile={file}
                                                                            onEditDetails={handleEditDetails}
                                                                            onCopyUrl={handleCopyUrl}
                                                                            onCopyId={handleCopyId}
                                                                            onDeleteMedia={handleDeleteMedia}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {totalCount > 0 && (
                                    <Pagination
                                        currentPage={currentPage}
                                        totalItems={totalCount}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={setCurrentPage}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Picker Bottom Bar */}
                    {pickerMode && !singular && (
                        <div className="border-t bg-muted/30 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground">
                                        {selectedFiles.size} item{selectedFiles.size !== 1 ? 's' : ''} selected
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={selectAllVisible}>
                                            {allVisibleSelected ? 'Deselect All Visible' : 'Select All Visible'}
                                        </Button>
                                        {selectedFiles.size > 0 && (
                                            <Button variant="ghost" size="sm" onClick={clearSelection}>
                                                Clear Selection
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handlePickItems}
                                        disabled={selectedFiles.size === 0}
                                    >
                                        Pick Items ({selectedFiles.size})
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
