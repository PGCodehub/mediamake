"use client";

import { useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";

interface DropzoneProps {
    onDrop: (files: File[]) => void;
    onPaste?: (e: ClipboardEvent) => void;
    accept?: Record<string, string[]>;
    maxFiles?: number;
    className?: string;
    disabled?: boolean;
    children?: React.ReactNode;
    showUploadLink?: boolean;
    uploadLinkText?: string;
    description?: string;
    hint?: string;
}

export function Dropzone({
    onDrop,
    onPaste,
    accept = {
        "video/*": [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm"],
        "audio/*": [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"],
        "image/*": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"],
    },
    maxFiles = 10,
    className,
    disabled = false,
    children,
    showUploadLink = true,
    uploadLinkText = "click to upload",
    description = "Drop your files here or",
    hint = "Copy/Paste Image / URLs",
}: DropzoneProps) {
    const dropzoneRef = useRef<HTMLDivElement>(null);

    const handleDrop = useCallback((acceptedFiles: File[]) => {
        onDrop(acceptedFiles);
    }, [onDrop]);

    // Handle paste events
    const handlePaste = useCallback((e: ClipboardEvent) => {
        if (onPaste) {
            onPaste(e);
        }
    }, [onPaste]);

    // Add paste event listener when dropzone is focused
    useEffect(() => {
        const dropzone = dropzoneRef.current;
        if (!dropzone) return;

        dropzone.addEventListener('paste', handlePaste);
        return () => dropzone.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop: handleDrop,
        accept,
        maxFiles,
        disabled,
        // noClick: true, // Disable click on dropzone area
    });


    return (
        <div
            {...getRootProps()}
            ref={dropzoneRef}
            tabIndex={0}
            className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors min-h-[200px] flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer",
                isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50",
                className
            )}
        >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />

            {children || (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        {isDragActive ? "Drop files here..." : description}
                    </p>
                    {showUploadLink && (
                        <button
                            type="button"
                            onClick={open}
                            className="text-primary hover:text-primary/80 underline font-medium text-sm transition-colors"
                        >
                            {uploadLinkText}
                        </button>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                        {hint}
                    </p>
                </div>
            )}
        </div>
    );
}