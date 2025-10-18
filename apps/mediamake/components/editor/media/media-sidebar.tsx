"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Tag as TagIcon, Folder, ChevronRight, ChevronDown, Hash } from "lucide-react";
import { Tag } from "@/app/types/media";
import { getClientId } from "@/lib/auth-utils";

interface MediaSidebarProps {
    selectedTag: string | null;
    onSelectTag: (tagId: string | null) => void;
    hashtagFilters: string[];
    onHashtagFiltersChange: (filters: string[]) => void;
}

interface TagWithCount extends Tag {
    fileCount: number;
}

export function MediaSidebar({ selectedTag, onSelectTag, hashtagFilters, onHashtagFiltersChange }: MediaSidebarProps) {
    const [tags, setTags] = useState<TagWithCount[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateTag, setShowCreateTag] = useState(false);
    const [newTagId, setNewTagId] = useState("");
    const [newTagName, setNewTagName] = useState("");
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Fetch tags on component mount
    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/tags');
            if (response.ok) {
                const data = await response.json();
                setTags(data);
            }
        } catch (error) {
            console.error('Error fetching tags:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createTag = async () => {
        if (!newTagId.trim() || !newTagName.trim()) return;

        try {
            const response = await fetch('/api/tags', {
                method: 'POST',
                body: JSON.stringify({
                    id: newTagId.trim().toLowerCase(),
                    displayName: newTagName.trim(),
                }),
            });

            if (response.ok) {
                const newTag = await response.json();
                // Add fileCount property to the new tag
                const newTagWithCount = { ...newTag, fileCount: 0 };
                setTags(prev => [...prev, newTagWithCount]);
                setNewTagId("");
                setNewTagName("");
                setShowCreateTag(false);
            } else {
                const error = await response.json();
                console.error('Error creating tag:', error);
            }
        } catch (error) {
            console.error('Error creating tag:', error);
        }
    };

    const filteredTags = tags.filter(tag =>
        tag.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleFolder = (tagId: string) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tagId)) {
                newSet.delete(tagId);
            } else {
                newSet.add(tagId);
            }
            return newSet;
        });
    };

    const removeHashtagFilter = (hashtag: string) => {
        const newFilters = hashtagFilters.filter(tag => tag !== hashtag);
        onHashtagFiltersChange(newFilters);
    };

    // Auto-expand the selected tag folder
    useEffect(() => {
        if (selectedTag && hashtagFilters.length > 0) {
            setExpandedFolders(prev => new Set([...prev, selectedTag]));
        }
    }, [selectedTag, hashtagFilters]);

    return (
        <div className="w-64 border-r bg-background">
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <TagIcon className="h-5 w-5" />
                            Tags
                        </h2>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowCreateTag(!showCreateTag)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Tag
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Create Tag Form */}
                {showCreateTag && (
                    <div className="p-4 border-b bg-muted/50">
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Tag ID</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">#</span>
                                    <Input
                                        placeholder="e.g., music, video, audio"
                                        value={newTagId}
                                        onChange={(e) => setNewTagId(e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Display Name</label>
                                <Input
                                    placeholder="e.g., Music, Video Content, Audio Files"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={createTag}>
                                    Create
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setShowCreateTag(false);
                                        setNewTagId("");
                                        setNewTagName("");
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tags List */}
                <div className="flex-1 overflow-hidden">
                    <div className="p-4">
                        {/* All Files Option */}
                        <Button
                            variant={selectedTag === null ? "default" : "ghost"}
                            className="w-full justify-start mb-2"
                            onClick={() => onSelectTag(null)}
                        >
                            All Files
                        </Button>

                        {/* Tags */}
                        {isLoading ? (
                            <div className="text-center text-muted-foreground py-4">
                                Loading tags...
                            </div>
                        ) : filteredTags.length === 0 ? (
                            <div className="text-center text-muted-foreground py-4">
                                {searchQuery ? 'No tags found' : 'No tags created yet'}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredTags.map((tag) => {
                                    const isExpanded = expandedFolders.has(tag.id);
                                    const isSelected = selectedTag === tag.id;
                                    const hasNestedItems = isSelected && hashtagFilters.length > 0;

                                    return (
                                        <div key={tag._id?.toString() || tag.id} className="space-y-1">
                                            {/* Main Tag Button */}
                                            <div className="flex items-center">
                                                <Button
                                                    variant={isSelected ? "default" : "ghost"}
                                                    className="flex-1 justify-between"
                                                    onClick={() => onSelectTag(tag.id)}
                                                >
                                                    <div className="flex items-center">
                                                        <Folder className="h-4 w-4 mr-2" />
                                                        {tag.displayName || tag.id}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {tag.fileCount}
                                                    </span>
                                                    <span onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFolder(tag.id);
                                                    }}>
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </span>
                                                </Button>
                                            </div>

                                            {/* Nested Hashtags */}
                                            {isSelected && isExpanded && hashtagFilters.length > 0 && (
                                                <div className="ml-4 space-y-1">
                                                    {hashtagFilters.filter(hashtag => hashtag !== tag.id).map((hashtag) => (
                                                        <div
                                                            key={hashtag}
                                                            className="flex items-center justify-between bg-muted/50 rounded-md px-2 py-1 text-sm"
                                                        >
                                                            <div className="flex items-center">
                                                                <Hash className="h-3 w-3 mr-1 text-muted-foreground" />
                                                                {hashtag}
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0 hover:bg-destructive/10"
                                                                onClick={() => removeHashtagFilter(hashtag)}
                                                            >
                                                                ×
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
