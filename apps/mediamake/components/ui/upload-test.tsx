"use client";

import { UploadTrigger } from "./upload-trigger";

export function UploadTest() {
    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold">Upload Test</h1>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Button Mode</h2>
                <UploadTrigger
                    onUploadComplete={(mediaFiles) => {
                        console.log('Button upload completed:', mediaFiles);
                    }}
                />
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Dropzone Mode</h2>
                <UploadTrigger
                    uiType="dropzone"
                    onUploadComplete={(mediaFiles) => {
                        console.log('Dropzone upload completed:', mediaFiles);
                    }}
                    dropzoneClassName="min-h-[200px]"
                />
            </div>
        </div>
    );
}
