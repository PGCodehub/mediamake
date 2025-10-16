"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Search, Loader2 } from 'lucide-react';
import { MediaFile } from '@/app/types/media';
import { useTagManagement } from '@/hooks/use-tag-management';
import { toast } from 'sonner';

interface MediaEditDialogProps {
    isOpen: boolean;
    onClose: () => void;
    mediaFile: MediaFile | null;
    onSave: (fileId: string, updates: { tags: string[]; fileName?: string }) => Promise<void>;
}

export function MediaEditDialog({ isOpen, onClose, mediaFile, onSave }: MediaEditDialogProps) {
    const [fileName, setFileName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [newTagInput, setNewTagInput] = useState('');
    const [showNewTagInput, setShowNewTagInput] = useState(false);

    const {
        tags,
        filteredTags,
        selectedTags,
        selectedTagsWithInfo,
        tagSearchQuery,
        isCreatingTag,
        isLoading: tagsLoading,
        addTag,
        removeTag,
        clearSelectedTags,
        setSelectedTagsList,
        setTagSearchQuery,
        createTag,
        findOrCreateTag,
        getTagDisplayName
    } = useTagManagement();

    // Initialize form when dialog opens
    useEffect(() => {
        if (isOpen && mediaFile) {
            setFileName(mediaFile.fileName || '');
            setSelectedTagsList(mediaFile.tags || []);
            setNewTagInput('');
            setShowNewTagInput(false);
        }
    }, [isOpen, mediaFile, setSelectedTagsList]);

    const handleSave = async () => {
        if (!mediaFile?._id) return;

        try {
            setIsSaving(true);
            await onSave(mediaFile._id.toString(), {
                tags: selectedTags,
                fileName: fileName.trim() || undefined
            });
            onClose();
            toast.success('Media file updated successfully');
        } catch (error) {
            console.error('Error saving media file:', error);
            toast.error('Failed to update media file');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTag = async (tagId: string) => {
        if (!selectedTags.includes(tagId)) {
            addTag(tagId);
        }
    };

    const handleCreateNewTag = async () => {
        if (!newTagInput.trim()) return;

        try {
            const tag = await findOrCreateTag(newTagInput.trim());
            if (tag) {
                addTag(tag.id);
                setNewTagInput('');
                setShowNewTagInput(false);
                toast.success(`Tag "${tag.displayName}" created and added`);
            }
        } catch (error) {
            console.error('Error creating tag:', error);
            toast.error('Failed to create tag');
        }
    };

    const handleRemoveTag = (tagId: string) => {
        removeTag(tagId);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (showNewTagInput) {
                handleCreateNewTag();
            } else {
                setShowNewTagInput(true);
            }
        }
    };

    if (!mediaFile) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Media Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* File Name */}
                    <div className="space-y-2">
                        <Label htmlFor="fileName">File Name</Label>
                        <Input
                            id="fileName"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder="Enter file name"
                        />
                    </div>

                    <Separator />

                    {/* Tags Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Tags</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowNewTagInput(!showNewTagInput)}
                                className="h-8"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Tag
                            </Button>
                        </div>

                        {/* Selected Tags */}
                        {selectedTagsWithInfo.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Current Tags</Label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTagsWithInfo.map((tag) => (
                                        <Badge
                                            key={tag.id}
                                            variant="secondary"
                                            className="flex items-center gap-1 pr-1"
                                        >
                                            {tag.displayName}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-4 w-4 p-0 hover:bg-destructive/20"
                                                onClick={() => handleRemoveTag(tag.id)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearSelectedTags}
                                    className="text-destructive hover:text-destructive"
                                >
                                    Clear All Tags
                                </Button>
                            </div>
                        )}

                        {/* New Tag Input */}
                        {showNewTagInput && (
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Create New Tag</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newTagInput}
                                        onChange={(e) => setNewTagInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Enter tag name"
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleCreateNewTag}
                                        disabled={!newTagInput.trim() || isCreatingTag}
                                        size="sm"
                                    >
                                        {isCreatingTag ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Plus className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowNewTagInput(false);
                                            setNewTagInput('');
                                        }}
                                        size="sm"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Tag Search and Selection */}
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Add Existing Tags</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search tags..."
                                    value={tagSearchQuery}
                                    onChange={(e) => setTagSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Available Tags */}
                            {tagSearchQuery && (
                                <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                                    {tagsLoading ? (
                                        <div className="flex items-center justify-center py-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                    ) : filteredTags.length > 0 ? (
                                        filteredTags.map((tag) => (
                                            <div
                                                key={tag.id}
                                                className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                                                onClick={() => handleAddTag(tag.id)}
                                            >
                                                <span className="text-sm">{tag.displayName}</span>
                                                {selectedTags.includes(tag.id) && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Added
                                                    </Badge>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-muted-foreground text-center py-2">
                                            No tags found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
