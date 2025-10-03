"use client";

import { UploadTrigger } from "./upload-trigger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FolderOpen, Plus } from "lucide-react";

/**
 * Example usage of the enhanced upload system
 * Now supports both button and dropzone modes
 */

// Example 1: Button mode (default)
export function ButtonUploadExample() {
    return (
        <UploadTrigger
            onUploadComplete={(mediaFiles) => {
                console.log('Button upload completed:', mediaFiles);
            }}
        />
    );
}

// Example 2: Dropzone mode - automatically opens dialog when files are dropped
export function DropzoneUploadExample() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Dropzone Upload</CardTitle>
            </CardHeader>
            <CardContent>
                <UploadTrigger
                    uiType="dropzone"
                    onUploadComplete={(mediaFiles) => {
                        console.log('Dropzone upload completed:', mediaFiles);
                    }}
                    dropzoneClassName="min-h-[200px]"
                />
            </CardContent>
        </Card>
    );
}

// Example 3: Custom styled dropzone
export function CustomDropzoneExample() {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Custom Dropzone</h3>
            <UploadTrigger
                uiType="dropzone"
                onUploadComplete={(mediaFiles) => {
                    console.log('Custom dropzone upload completed:', mediaFiles);
                }}
                dropzoneClassName="min-h-[300px] bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300"
                maxFiles={5}
            />
        </div>
    );
}

// Example 4: Mixed usage - button and dropzone
export function MixedUploadExample() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Button Upload</CardTitle>
                </CardHeader>
                <CardContent>
                    <UploadTrigger
                        variant="outline"
                        onUploadComplete={(mediaFiles) => {
                            console.log('Button upload completed:', mediaFiles);
                        }}
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Click to Upload
                    </UploadTrigger>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Dropzone Upload</CardTitle>
                </CardHeader>
                <CardContent>
                    <UploadTrigger
                        uiType="dropzone"
                        onUploadComplete={(mediaFiles) => {
                            console.log('Dropzone upload completed:', mediaFiles);
                        }}
                        dropzoneClassName="min-h-[150px]"
                    />
                </CardContent>
            </Card>
        </div>
    );
}

// Example 5: Empty state with dropzone (like in media library)
export function EmptyStateExample() {
    return (
        <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">No files yet</h2>
            <p className="text-muted-foreground mb-6">
                Get started by uploading your first media files
            </p>
            <UploadTrigger
                uiType="dropzone"
                onUploadComplete={(mediaFiles) => {
                    console.log('Empty state upload completed:', mediaFiles);
                }}
                dropzoneClassName="min-h-[250px] max-w-md mx-auto"
            />
        </div>
    );
}
