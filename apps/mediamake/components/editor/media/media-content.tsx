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
    List
} from "lucide-react";
import { MediaFile, Tag } from "@/app/types/media";
import { UploadTrigger } from "@/components/ui/upload-trigger";
import { UrlIndexingTrigger } from "@/components/ui/url-indexing-trigger";
import { MediaGrid, MediaOptionsDropdown } from "./media-ui";
import useSWR from "swr";
import useLocalState from "@/components/studio/context/hooks/useLocalState";

interface MediaContentProps {
    selectedTag: string | null;
    selectedFile: MediaFile | null;
    onSelectFile: (file: MediaFile | null) => void;
    tagToAddToHashtags?: string | null | "CLEAR_ALL";
    onTagAddedToHashtags?: () => void;
    hashtagFilters: string[];
    onHashtagFiltersChange: (filters: string[]) => void;
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

export function MediaContent({ selectedTag, selectedFile, onSelectFile, tagToAddToHashtags, onTagAddedToHashtags, hashtagFilters, onHashtagFiltersChange }: MediaContentProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
    // Remove local hashtagFilters state - using props instead
    const [hashtagInput, setHashtagInput] = useState("");
    const [contentSourceFilter, setContentSourceFilter] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Build API URL with filters
    const buildApiUrl = useMemo(() => {
        const params = new URLSearchParams();
        if (selectedTag) params.append('tag', selectedTag);
        if (contentTypeFilter !== 'all') params.append('contentType', contentTypeFilter);
        if (contentSourceFilter !== 'all') params.append('contentSource', contentSourceFilter);
        if (hashtagFilters.length > 0) {
            params.append('tags', hashtagFilters.join(','));
        }
        params.append('sort', 'createdAt');
        params.append('order', sortOrder === 'latest' ? 'desc' : 'asc');
        return `/api/media-files?${params}`;
    }, [selectedTag, contentTypeFilter, contentSourceFilter, hashtagFilters, sortOrder]);

    // Use SWR for data fetching
    const { data: filesData, error: filesError, mutate: mutateFiles } = useSWR(buildApiUrl, fetcher);
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
            onHashtagFiltersChange([...hashtagFilters, tag.trim()]);
        }
    };

    const removeHashtagFilter = (tag: string) => {
        onHashtagFiltersChange(hashtagFilters.filter(t => t !== tag));
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

    // Handle tag selection from sidebar - replace all hashtag filters
    useEffect(() => {
        if (tagToAddToHashtags === "CLEAR_ALL") {
            // "All Files" selected - clear all hashtag filters
            onHashtagFiltersChange([]);
            onTagAddedToHashtags?.();
        } else if (tagToAddToHashtags) {
            onHashtagFiltersChange([tagToAddToHashtags]); // Replace all filters with just this tag
            onTagAddedToHashtags?.();
        }
    }, [tagToAddToHashtags, onTagAddedToHashtags, onHashtagFiltersChange]);

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
        // TODO: Implement edit details functionality
        console.log('Edit details for:', file);
    };

    const handleDeleteMedia = async (file: MediaFile) => {
        if (confirm('Are you sure you want to delete this media file?')) {
            try {
                const response = await fetch(`/api/media-files/${file._id}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    mutateFiles(); // Refresh the list using SWR
                }
            } catch (error) {
                console.error('Error deleting media:', error);
            }
        }
    };

    const filteredFiles = files.filter((file: MediaFile) =>
        file.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.contentSourceUrl?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 bg-background">
            <div className="flex flex-col h-full">
                {/* Enhanced Header */}
                <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">
                            {selectedTag ? `Files tagged with "${getTagDisplayName(selectedTag)}"` : 'All Files'}
                        </h2>
                        <UploadTrigger
                            autoUpload={true}
                            onUploadComplete={() => {
                                mutateFiles();
                            }}
                            preselectedTags={hashtagFilters}
                        />
                    </div>

                    {/* Single Header Banner with Tags on Left, Filters on Right */}
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
                                <SelectTrigger className="w-32">
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
                                <SelectTrigger className="w-36">
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
                                <SelectTrigger className="w-32">
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
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    <div className="p-4 h-full overflow-auto">
                        <div>
                            {/* Always show upload boxes */}
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
                                    />
                                </div>
                            </div>

                            {/* Show loading state or files */}
                            {isLoading ? (
                                <div className="text-center text-muted-foreground py-8">
                                    Loading files...
                                </div>
                            ) : filteredFiles.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    No files found. Upload some files to get started!
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
                                        />
                                    ) : (
                                        <div className="space-y-2">
                                            {filteredFiles.map((file: MediaFile) => (
                                                <Card
                                                    key={file._id?.toString()}
                                                    className={`cursor-pointer transition-colors ${selectedFile?._id === file._id ? 'ring-2 ring-primary' : ''
                                                        }`}
                                                    onClick={() => onSelectFile(file)}
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
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
                                                                                    // TODO: Filter by tag
                                                                                    console.log('Filter by tag:', tagId);
                                                                                }}
                                                                            >
                                                                                #{getTagDisplayName(tagId)}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <MediaOptionsDropdown
                                                                mediaFile={file}
                                                                onEditDetails={handleEditDetails}
                                                                onCopyUrl={handleCopyUrl}
                                                                onCopyId={handleCopyId}
                                                                onDeleteMedia={handleDeleteMedia}
                                                            />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
