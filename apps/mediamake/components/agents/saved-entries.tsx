"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    History,
    MoreVertical,
    Trash2,
    Download,
    Upload,
    Clock,
    CheckCircle,
    AlertCircle
} from "lucide-react";
import { AgentFormData } from "@/lib/indexeddb";

interface SavedEntriesProps {
    savedEntries: AgentFormData[];
    onLoadEntry: (entryId: string) => void;
    onDeleteEntry: (entryId: string) => void;
    onClearAll: () => void;
}

export function SavedEntries({
    savedEntries,
    onLoadEntry,
    onDeleteEntry,
    onClearAll
}: SavedEntriesProps) {
    const [isOpen, setIsOpen] = useState(false);

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const exportEntry = (entry: AgentFormData) => {
        const dataStr = JSON.stringify({
            formData: entry.formData,
            output: entry.output,
            timestamp: entry.timestamp
        }, null, 2);

        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `agent-form-${entry.agentPath}-${entry.timestamp}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const importEntry = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target?.result as string);
                        // You could implement import logic here
                        console.log('Imported data:', data);
                    } catch (error) {
                        console.error('Error importing file:', error);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    if (savedEntries.length === 0) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <History className="h-4 w-4" />
                    Saved ({savedEntries.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Saved Form Data
                        <Badge variant="secondary">{savedEntries.length} entries</Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={importEntry}
                            className="gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            Import
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={onClearAll}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Clear All
                        </Button>
                    </div>

                    <div className="grid gap-3">
                        {savedEntries.map((entry) => (
                            <Card key={entry.id} className="relative">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h4 className="font-medium text-sm">{entry.title}</h4>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">
                                                    {formatTimestamp(entry.timestamp)}
                                                </span>
                                                {entry.output && (
                                                    <Badge variant="outline" className="gap-1">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Has Output
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onLoadEntry(entry.id)}>
                                                    Load Entry
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => exportEntry(entry)}>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Export
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onDeleteEntry(entry.id)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-2">
                                        <div className="text-sm">
                                            <strong>Form Data:</strong>
                                            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                                {JSON.stringify(entry.formData, null, 2)}
                                            </pre>
                                        </div>
                                        {entry.output && (
                                            <div className="text-sm">
                                                <strong>Output:</strong>
                                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                                    {JSON.stringify(entry.output, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
