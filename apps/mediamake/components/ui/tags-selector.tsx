"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag } from "@/app/types/media";

interface TagsSelectorProps {
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
    label?: string;
    required?: boolean;
    showCreateNew?: boolean;
}

export function TagsSelector({
    selectedTags,
    onTagsChange,
    label = "Tags",
    required = false,
    showCreateNew = true
}: TagsSelectorProps) {
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [newTagName, setNewTagName] = useState("");

    // Fetch available tags
    useEffect(() => {
        fetchTags();
    }, []);

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
        onTagsChange(
            selectedTags.includes(tagId)
                ? selectedTags.filter(id => id !== tagId)
                : [...selectedTags, tagId]
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
                onTagsChange([...selectedTags, newTag.id]);
                setNewTagName("");
            }
        } catch (error) {
            console.error('Error creating tag:', error);
        }
    };

    // Function to generate tag ID from display name
    const generateTagId = (displayName: string): string => {
        return displayName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, '') // Remove spaces
            .trim();
    };

    return (
        <div className="space-y-2">
            <Label>
                {label}
                {required && selectedTags.length === 0 && (
                    <span className="text-red-500 text-sm ml-2">(Required)</span>
                )}
            </Label>
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

            {showCreateNew && (
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
            )}
        </div>
    );
}
