"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { TranscriptionSidebar } from "@/components/transcriber/transcription-sidebar";
import { TranscriptionContent } from "@/components/transcriber/transcription-content";
import { NewTranscriptionModal } from "@/components/transcriber/new-transcription-modal";
import { useState } from "react";
import { Transcription } from "@/app/types/transcription";

export default function TranscriberPage() {
    const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [transcriptionData, setTranscriptionData] = useState<Transcription | null>(null);
    const [isNewTranscriptionModalOpen, setIsNewTranscriptionModalOpen] = useState(false);
    const [modalAudioUrl, setModalAudioUrl] = useState<string>("");
    const [modalLanguage, setModalLanguage] = useState<string>("");

    const handleNewTranscription = () => {
        setIsNewTranscriptionModalOpen(true);
    };

    const handleStartTranscription = async (audioUrl: string, language?: string) => {
        try {
            // Call the transcription API
            const response = await fetch('/api/transcribe/assembly', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audioUrl: audioUrl.trim(),
                    language: language?.trim() || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Transcription failed');
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Transcription failed');
            }

            // Save to MongoDB via our API
            const saveResponse = await fetch('/api/transcriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    assemblyId: result.id,
                    audioUrl: audioUrl.trim(),
                    language: result.language_code,
                    status: 'completed',
                    captions: result.captions,
                    processingData: {
                        step1: {
                            rawText: result.captions.map((caption: any) => caption.text).join(' ')
                        }
                    }
                }),
            });

            if (!saveResponse.ok) {
                const errorData = await saveResponse.json();
                throw new Error(errorData.error || 'Failed to save transcription');
            }

            const savedTranscription = await saveResponse.json();

            // Set the transcription data and navigate to it
            setTranscriptionData(savedTranscription.transcription);
            setSelectedTranscription(savedTranscription.transcription._id);
            setCurrentStep(2); // Go directly to step 2 since transcription is complete
            setIsNewTranscriptionModalOpen(false);

        } catch (error) {
            console.error('Transcription error:', error);
            throw error; // Re-throw to let the modal handle the error
        }
    };

    return (
        <SidebarInset>
            <SiteHeader title="Transcriber" />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <div className="flex h-[calc(100vh-8rem)] w-full">
                            <TranscriptionSidebar
                                selectedTranscription={selectedTranscription}
                                onSelectTranscription={setSelectedTranscription}
                                onNewTranscription={handleNewTranscription}
                            />
                            <TranscriptionContent
                                selectedTranscription={selectedTranscription}
                                currentStep={currentStep}
                                setCurrentStep={setCurrentStep}
                                transcriptionData={transcriptionData}
                                setTranscriptionData={setTranscriptionData}
                                onNewTranscription={handleNewTranscription}
                                modalAudioUrl={modalAudioUrl}
                                modalLanguage={modalLanguage}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <NewTranscriptionModal
                isOpen={isNewTranscriptionModalOpen}
                onClose={() => setIsNewTranscriptionModalOpen(false)}
                onStartTranscription={handleStartTranscription}
            />
        </SidebarInset>
    );
}
