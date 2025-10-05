"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Upload, Search, Calendar, Layers } from "lucide-react";
import { toast } from "sonner";

interface SavedPresetData {
    id: string;
    name: string;
    createdAt: string;
    presetData: {
        presets: Array<{
            presetId: string;
            presetType: string;
            presetInputData: any;
        }>;
    };
}

interface LoadPresetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLoad: (preset: SavedPresetData) => Promise<void>;
}

export function LoadPresetDialog({
    open,
    onOpenChange,
    onLoad
}: LoadPresetDialogProps) {
    const [savedPresets, setSavedPresets] = useState<SavedPresetData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingPreset, setIsLoadingPreset] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Load saved presets when dialog opens
    useEffect(() => {
        if (open) {
            loadSavedPresets();
        }
    }, [open]);

    const loadSavedPresets = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/preset-data');
            if (response.ok) {
                const data = await response.json();
                setSavedPresets(data);
            } else {
                throw new Error('Failed to load saved presets');
            }
        } catch (error) {
            console.error('Failed to load saved presets:', error);
            toast.error('Failed to load saved presets');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadPreset = async (preset: SavedPresetData) => {
        try {
            setIsLoadingPreset(preset.id);
            await onLoad(preset);
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to load preset:', error);
            toast.error('Failed to load preset');
        } finally {
            setIsLoadingPreset(null);
        }
    };

    const filteredPresets = savedPresets.filter(preset =>
        preset.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Load Preset
                    </DialogTitle>
                    <DialogDescription>
                        Select a saved preset to load into your composition.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search presets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Presets List */}
                    <ScrollArea className="h-[300px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="ml-2">Loading presets...</span>
                            </div>
                        ) : filteredPresets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <Layers className="h-8 w-8 mb-2" />
                                <p className="text-sm">
                                    {searchQuery ? 'No presets found matching your search' : 'No saved presets available'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredPresets.map((preset) => (
                                    <div
                                        key={preset.id}
                                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                                        onClick={() => !isLoadingPreset && handleLoadPreset(preset)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm truncate group-hover:text-primary">
                                                    {preset.name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {preset.presetData.presets.length} preset{preset.presetData.presets.length !== 1 ? 's' : ''}
                                                    </Badge>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(preset.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {preset.presetData.presets.slice(0, 3).map((p, index) => (
                                                        <Badge key={index} variant="outline" className="text-xs">
                                                            {p.presetType}
                                                        </Badge>
                                                    ))}
                                                    {preset.presetData.presets.length > 3 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{preset.presetData.presets.length - 3} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {isLoadingPreset === preset.id && (
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoadingPreset !== null}
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
