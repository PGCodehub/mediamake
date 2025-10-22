"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { WebRecorderDialog } from "./web-recorder-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WebRecorderTriggerProps {
    onRecordingComplete?: () => void;
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg";
    className?: string;
    children?: React.ReactNode;
    uiType?: "button" | "dropzone";
    dropzoneClassName?: string;
    preselectedTags?: string[];
}

export function WebRecorderTrigger({
    onRecordingComplete,
    variant = "default",
    size = "default",
    className,
    children,
    uiType = "button",
    dropzoneClassName,
    preselectedTags = []
}: WebRecorderTriggerProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [initialJsonContent, setInitialJsonContent] = useState<string>("");
    const [initialMode, setInitialMode] = useState<'simple' | 'advanced'>('simple');
    const [isDragging, setIsDragging] = useState(false);

    const handleRecordingComplete = () => {
        onRecordingComplete?.();
        setIsDialogOpen(false);
        setInitialJsonContent("");
        setInitialMode('simple');
    };

    const handleFileDrop = async (files: File[]) => {
        if (files.length === 0) return;

        const file = files[0];
        
        // Check if it's a JSON file
        if (!file.name.endsWith('.json') && file.type !== 'application/json') {
            toast.error("Please upload a JSON file for Web Recorder configuration");
            return;
        }

        try {
            const content = await file.text();
            
            // Validate it's valid JSON
            JSON.parse(content);
            
            // Set the JSON content and open dialog in advanced mode
            setInitialJsonContent(content);
            setInitialMode('advanced');
            setIsDialogOpen(true);
            
            toast.success("JSON configuration loaded successfully");
        } catch (error) {
            toast.error("Invalid JSON file. Please check the file format.");
            console.error("Error reading JSON file:", error);
        }
    };

    const handleClick = () => {
        // Open dialog normally (simple mode)
        setInitialJsonContent("");
        setInitialMode('simple');
        setIsDialogOpen(true);
    };

    if (uiType === "dropzone") {
        return (
            <>
                <div
                    onClick={handleClick}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center transition-colors min-h-[200px] flex flex-col items-center justify-center cursor-pointer",
                        isDragging 
                            ? "border-primary bg-primary/5" 
                            : "border-muted-foreground/25 hover:border-muted-foreground/50",
                        dropzoneClassName
                    )}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                        const files = Array.from(e.dataTransfer.files);
                        handleFileDrop(files);
                    }}
                >
                    <Video className="h-10 w-10 text-muted-foreground mb-2" />
                    <div>
                        <p className="text-sm font-medium">Web Recorder</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isDragging 
                                ? "Drop JSON file here" 
                                : "Click to record or drop JSON config"
                            }
                        </p>
                    </div>
                </div>

                <WebRecorderDialog
                    isOpen={isDialogOpen}
                    onClose={() => {
                        setIsDialogOpen(false);
                        setInitialJsonContent("");
                        setInitialMode('simple');
                    }}
                    onRecordingComplete={handleRecordingComplete}
                    preselectedTags={preselectedTags}
                    initialJsonContent={initialJsonContent}
                    initialMode={initialMode}
                />
            </>
        );
    }

    return (
        <>
            <Button
                variant={variant}
                size={size}
                className={className}
                onClick={() => setIsDialogOpen(true)}
            >
                {children || (
                    <>
                        <Video className="h-4 w-4 mr-2" />
                        Web Recorder
                    </>
                )}
            </Button>

            <WebRecorderDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onRecordingComplete={handleRecordingComplete}
                preselectedTags={preselectedTags}
            />
        </>
    );
}

