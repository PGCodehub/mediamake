"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    X,
    Plus,
    Search,
    Loader2,
    Tag,
    RefreshCw,
    Check
} from 'lucide-react';
import { useTagManagement } from '@/hooks/use-tag-management';
import { toast } from 'sonner';

interface BulkEditToolbarProps {
    selectedFiles: Set<string>;
    onClearSelection: () => void;
    onBulkUpdate: (fileIds: string[], operation: 'add' | 'remove' | 'replace', tags: string[]) => Promise<void>;
    isUpdating?: boolean;
}

export function BulkEditToolbar({
    selectedFiles,
    onClearSelection,
    onBulkUpdate,
    isUpdating = false
}: BulkEditToolbarProps) {
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const [operation, setOperation] = useState<'add' | 'remove' | 'replace'>('add');
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

    const selectedCount = selectedFiles.size;

    const handleBulkUpdate = async () => {
        if (selectedCount === 0 || selectedTags.length === 0) return;

        try {
            await onBulkUpdate(Array.from(selectedFiles), operation, selectedTags);
            setShowBulkDialog(false);
            clearSelectedTags();
            setNewTagInput('');
            setShowNewTagInput(false);
            toast.success(`Updated ${selectedCount} file${selectedCount > 1 ? 's' : ''}`);
        } catch (error) {
            console.error('Error in bulk update:', error);
            toast.error('Failed to update files');
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

    const getOperationDescription = () => {
        switch (operation) {
            case 'add':
                return 'Add tags to selected files';
            case 'remove':
                return 'Remove tags from selected files';
            case 'replace':
                return 'Replace all tags on selected files';
            default:
                return '';
        }
    };

    if (selectedCount === 0) return null;

    return (
        <>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                                {selectedCount} file{selectedCount > 1 ? 's' : ''} selected
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowBulkDialog(true)}
                            disabled={isUpdating}
                        >
                            <Tag className="h-4 w-4 mr-2" />
                            Edit Tags
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearSelection}
                            disabled={isUpdating}
                        >
                            Clear Selection
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Bulk Edit Tags</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Operation Selection */}
                        <div className="space-y-2">
                            <Label>Operation</Label>
                            <Select value={operation} onValueChange={(value: 'add' | 'remove' | 'replace') => setOperation(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="add">
                                        <div className="flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add Tags
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="remove">
                                        <div className="flex items-center gap-2">
                                            <X className="h-4 w-4" />
                                            Remove Tags
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="replace">
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="h-4 w-4" />
                                            Replace All Tags
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">{getOperationDescription()}</p>
                        </div>

                        <Separator />

                        {/* Tags Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Tags to {operation === 'add' ? 'Add' : operation === 'remove' ? 'Remove' : 'Set'}</Label>
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
                                    <Label className="text-sm text-muted-foreground">Selected Tags</Label>
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

                        {/* Preview */}
                        <div className="bg-muted/50 rounded-lg p-4">
                            <Label className="text-sm font-medium">Preview</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                                {operation === 'add' && 'Will add the selected tags to all selected files'}
                                {operation === 'remove' && 'Will remove the selected tags from all selected files'}
                                {operation === 'replace' && 'Will replace all tags on selected files with the selected tags'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Affecting {selectedCount} file{selectedCount > 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBulkUpdate}
                            disabled={selectedTags.length === 0 || isUpdating}
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Updating...
                                </>
                            ) : (
                                `Update ${selectedCount} File${selectedCount > 1 ? 's' : ''}`
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
