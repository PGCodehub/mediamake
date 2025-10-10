"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Save, X } from "lucide-react";

interface SaveDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string, description?: string) => void;
    isLoading?: boolean;
}

export function SaveDialog({ isOpen, onClose, onSave, isLoading = false }: SaveDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const handleSave = () => {
        if (title.trim()) {
            onSave(title.trim(), description.trim() || undefined);
            setTitle("");
            setDescription("");
        }
    };

    const handleClose = () => {
        setTitle("");
        setDescription("");
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Save className="h-5 w-5" />
                        Save Form Data
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter a name for this form data..."
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description to help identify this save..."
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!title.trim() || isLoading}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
