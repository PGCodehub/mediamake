"use client";

import { Transcription } from "@/app/types/transcription";
import { TiptapCaptionEditor } from "./tiptap/tiptap-caption-editor";


interface Step3CaptionEditorProps {
    transcriptionData: Transcription;
    onStepChange: (step: 1 | 2 | 3) => void;
    onTranscriptionDataUpdate?: (updatedData: any) => Promise<void>;
}

export function Step3CaptionEditor({ transcriptionData, onTranscriptionDataUpdate, onStepChange }: Step3CaptionEditorProps) {
    return (
        <TiptapCaptionEditor
            transcriptionData={transcriptionData}
            onTranscriptionDataUpdate={onTranscriptionDataUpdate}
            onStepChange={onStepChange}
        />
    );
}
