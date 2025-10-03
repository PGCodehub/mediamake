"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MediaPicker } from "./media-picker";
import { MediaFile } from "@/app/types/media";

interface MediaPickerExampleProps {
    onSelect?: (files: MediaFile | MediaFile[]) => void;
    singular?: boolean;
}

export function MediaPickerExample({ onSelect, singular = false }: MediaPickerExampleProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);

    const handleFileSelection = (files: MediaFile | MediaFile[]) => {
        const filesArray = Array.isArray(files) ? files : [files];
        setSelectedFiles(filesArray);
        onSelect?.(files);
        setShowPicker(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Button onClick={() => setShowPicker(true)}>
                    {singular ? "Select Media" : "Select Multiple Media"}
                </Button>
                {selectedFiles.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                        {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                    </div>
                )}
            </div>

            {selectedFiles.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Selected Files:</h3>
                    <div className="space-y-1">
                        {selectedFiles.map((file, index) => (
                            <div key={file._id?.toString() || index} className="text-sm text-muted-foreground">
                                {file.fileName || 'Untitled'} ({file.contentType})
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showPicker && (
                <MediaPicker
                    pickerMode={true}
                    singular={singular}
                    onSelect={handleFileSelection}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}
