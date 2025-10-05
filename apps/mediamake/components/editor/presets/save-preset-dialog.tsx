"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface SavePresetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (name: string, overwriteId?: string) => Promise<void>;
    isLoading?: boolean;
    currentLoadedPreset?: string | null;
    currentLoadedPresetName?: string;
}

export function SavePresetDialog({
    open,
    onOpenChange,
    onSave,
    isLoading = false,
    currentLoadedPreset = null,
    currentLoadedPresetName = ""
}: SavePresetDialogProps) {
    const [presetName, setPresetName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveMode, setSaveMode] = useState<'new' | 'overwrite'>('new');

    const handleSave = async () => {
        if (!presetName.trim()) {
            toast.error("Please enter a preset name");
            return;
        }

        try {
            setIsSaving(true);
            const overwriteId = saveMode === 'overwrite' ? (currentLoadedPreset || undefined) : undefined;
            await onSave(presetName.trim(), overwriteId);
            setPresetName("");
            setSaveMode('new');
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save preset:", error);
            toast.error("Failed to save preset");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setPresetName("");
        setSaveMode('new');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Save className="h-5 w-5" />
                        Save Preset
                    </DialogTitle>
                    <DialogDescription>
                        Save your current preset configuration with a custom name.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Save Mode Selection - Only show if there's a loaded preset */}
                    {currentLoadedPreset && (
                        <div className="grid gap-3">
                            <Label className="text-sm font-medium">Save Options</Label>
                            <RadioGroup
                                value={saveMode}
                                onValueChange={(value) => setSaveMode(value as 'new' | 'overwrite')}
                                disabled={isSaving}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="new" id="new" />
                                    <Label htmlFor="new" className="text-sm">
                                        Save as new preset
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="overwrite" id="overwrite" />
                                    <Label htmlFor="overwrite" className="text-sm">
                                        Overwrite "{currentLoadedPresetName}"
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="preset-name">
                            {saveMode === 'overwrite' ? 'Confirm preset name' : 'Preset Name'}
                        </Label>
                        <Input
                            id="preset-name"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            placeholder={
                                saveMode === 'overwrite'
                                    ? `Enter "${currentLoadedPresetName}" to confirm overwrite`
                                    : "Enter preset name..."
                            }
                            disabled={isSaving}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !isSaving) {
                                    handleSave();
                                }
                            }}
                        />
                        {saveMode === 'overwrite' && (
                            <p className="text-xs text-muted-foreground">
                                Type the exact name "{currentLoadedPresetName}" to confirm you want to overwrite this preset.
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={
                            isSaving ||
                            !presetName.trim() ||
                            (saveMode === 'overwrite' && presetName.trim() !== currentLoadedPresetName)
                        }
                        className="flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {saveMode === 'overwrite' ? 'Overwriting...' : 'Saving...'}
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                {saveMode === 'overwrite' ? 'Overwrite Preset' : 'Save Preset'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
