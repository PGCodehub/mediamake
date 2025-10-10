"use client";

import { TranscriberProvider } from "./contexts/transcriber-context";
import { ExplorerSidebar } from "./sidebars/explorer-sidebar";
import { TranscriptionNavigationSidebar } from "./sidebars/transcription-sidebar";
import { TranscriberContent } from "./content/transcriber-content";
import { useTranscriber } from "./contexts/transcriber-context";

// Internal component that uses the transcriber context
function TranscriptionContentInner() {
    const { selectedTranscription: contextSelected } = useTranscriber();

    console.log('TranscriptionContent rendering, contextSelected:', contextSelected);

    return (
        <div className="flex h-full w-full">
            {/* Sidebar */}
            {contextSelected ? (
                <TranscriptionNavigationSidebar />
            ) : (
                <ExplorerSidebar />
            )}

            {/* Main Content */}
            <TranscriberContent />
        </div>
    );
}

// Main component that provides the transcriber context
export function TranscriptionContent() {
    return (
        <TranscriberProvider>
            <TranscriptionContentInner />
        </TranscriberProvider>
    );
}
