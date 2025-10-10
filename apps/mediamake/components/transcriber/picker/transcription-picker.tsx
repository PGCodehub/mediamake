"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X as XIcon, Check } from "lucide-react";
import { Transcription } from "@/app/types/transcription";
import { TranscriberProvider, useTranscriber } from "../contexts/transcriber-context";
import { TranscriberContent } from "../content/transcriber-content";

interface TranscriptionPickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (transcription: Transcription) => void;
    initialSelectedId?: string | null;
}

// Inner component that uses the transcriber context
function TranscriptionPickerInner({ onSelect }: { onSelect: (transcription: Transcription) => void }) {
    const { transcriptionData } = useTranscriber();

    const handleConfirm = () => {
        if (transcriptionData) onSelect(transcriptionData);
    };

    return (
        <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0">
                <TranscriberContent />
            </div>
            {/* Footer actions */}
            <div className="p-3 border-t flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                <Button onClick={handleConfirm} disabled={!transcriptionData}>
                    <Check className="h-4 w-4 mr-2" /> Confirm Transcription
                </Button>
            </div>
        </div>
    );
}

export function TranscriptionPicker({ open, onClose, onSelect, initialSelectedId = null }: TranscriptionPickerProps) {
    const [isPanelVisible, setIsPanelVisible] = useState(open);

    useEffect(() => {
        setIsPanelVisible(open);
    }, [open]);

    if (!isPanelVisible) return null;

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-[90vw] md:w-[80vw] lg:w-[70vw] bg-background border-l shadow-lg flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Pick a Transcription</h2>
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <XIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content - Use existing transcriber component */}
                <TranscriberProvider>
                    <TranscriptionPickerInner onSelect={onSelect} />
                </TranscriberProvider>
            </div>
        </div>
    );
}


