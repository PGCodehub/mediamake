"use client";

import { useTranscriber } from "../contexts/transcriber-context";
import { useEffect, useMemo, useState } from "react";
import { aiRouterRegistry } from "@/app/ai";
import { callAgent } from "@/components/agents/agent-helper";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Play, Brain } from "lucide-react";
import { TiptapCaptionEditor } from "../tiptap/tiptap-caption-editor";
import { AudioPlayerProvider, useAudioPlayer } from "../audio-player-context";
import { AudioPlayer } from "../audio-player";
import { MetaDataList } from "@/components/transcriber/metadata/meta-data-list";
import { toast } from "sonner";

function MetadataUIInner() {

    const {
        transcriptionData,
        setTranscriptionData,
        refreshTranscription,
        isLoading,
        setIsLoading,
        isRefreshing,
        error,
        setError
    } = useTranscriber();

    const { currentTime, setAudioUrl } = useAudioPlayer();

    const [selectedAgentPath, setSelectedAgentPath] = useState<string>("");
    const [userRequest, setUserRequest] = useState<string>("");
    const [isRunning, setIsRunning] = useState(false);
    const [metadataResult, setMetadataResult] = useState<any | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [agentFormData, setAgentFormData] = useState<Record<string, any>>({});

    // Derive current sentence index from audio time and captions
    const currentSentenceIndex = useMemo(() => {
        if (!transcriptionData?.captions || transcriptionData.captions.length === 0) return -1;
        const idx = transcriptionData.captions.findIndex(c => {
            const start = c.absoluteStart ?? 0;
            const end = c.absoluteEnd ?? 0;
            return currentTime >= start && currentTime < end;
        });
        return idx;
    }, [currentTime, transcriptionData?.captions]);

    // Set audio URL when transcription data changes
    useEffect(() => {
        if (transcriptionData?.audioUrl) {
            setAudioUrl(transcriptionData.audioUrl);
        }
    }, [transcriptionData?.audioUrl, setAudioUrl]);

    // Build list of metadata agents from aiRouterRegistry
    const availableAgents = useMemo(() => {
        const list: { name: string; path: string }[] = [];
        for (const [path, value] of Object.entries(aiRouterRegistry.map)) {
            for (const agent of value.agents) {
                const meta = agent.actAsTool?.metadata as any;
                const hasMetadataTag = Array.isArray(meta?.tags) && meta.tags.includes('sentence-metadata');
                const hidden = meta?.hideUI === true; // align with app sidebar logic
                if (agent.actAsTool && hasMetadataTag && !hidden) {
                    list.push({ name: agent.actAsTool.name, path });
                    break; // one entry per route path
                }
            }
        }
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    useEffect(() => {
        if (!selectedAgentPath && availableAgents.length > 0) {
            setSelectedAgentPath(availableAgents[0].path);
        }
    }, [availableAgents, selectedAgentPath]);

    const runSelectedAgent = async () => {
        if (!transcriptionData) return;
        if (!selectedAgentPath) return;
        try {
            setIsRunning(true);
            setError(null);
            const hasTranscriptionId = Boolean(transcriptionData._id);
            const params: Record<string, any> = {
                // Include form data from the agent parameters
                ...agentFormData,
            };
            if (userRequest.trim()) params.userRequest = userRequest.trim();
            if (hasTranscriptionId) {
                params.transcriptionId = transcriptionData._id;
            } else if (Array.isArray(transcriptionData.captions)) {
                params.sentences = transcriptionData.captions.map(c => c.text);
            }
            const output = await callAgent(selectedAgentPath, params);
            //setMetadataResult(output);
            if (refreshTranscription && typeof refreshTranscription === 'function') {
                await refreshTranscription();
            }
            toast.success('Metadata agent ran successfully');
        } catch (e: any) {
            console.error('Failed to run metadata agent', e);
            setError(e?.message || 'Failed to run metadata agent');
            toast.error(e?.message || 'Failed to run metadata agent');
        } finally {
            setIsRunning(false);
        }
    };

    const handleSaveSentenceMetadata = async (sentenceIndex: number, updated: any) => {
        if (!transcriptionData) return;
        try {
            setIsSaving(true);
            let next = transcriptionData?.captions
            next[sentenceIndex].metadata = updated;

            // persist to DB (captions + processingData.step4.metadata)
            const response = await fetch(`/api/transcriptions/${transcriptionData._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    captions: next,
                    processingData: {
                        ...transcriptionData.processingData,
                        step4: {
                            ...transcriptionData.processingData?.step4,
                            metadata: {
                                ...transcriptionData.processingData?.step4?.metadata,
                                sentences: next.map(c => c.metadata),
                            },
                            updatedAt: new Date().toISOString(),
                        }
                    }
                })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setTranscriptionData(data.transcription);
                    // ensure UI reflects latest DB state
                    // await refreshTranscription();
                }
                else {
                    toast.error('Failed to save');
                }
            }
        } catch (e) {
            toast.error("Failed to save")
            console.error('Failed to save sentence metadata', e);
        } finally {
            setIsSaving(false);
        }
    };

    const metadataShape = useMemo(() => {
        return {
            sentences: transcriptionData?.captions?.map((c: any, index: number) => {
                return {
                    sentenceIndex: index,
                    originalText: c.text,
                    metadata: c.metadata,
                };
            }),
        };
    }, [transcriptionData?.captions]);

    return (
        <div className="flex-1 flex flex-col h-full w-full">
            {/* Header removed; controls moved into MetaDataList */}

            {/* Content: Left Editor, Right Metadata */}
            <div className="flex-1 flex min-h-0">
                {/* Left - Caption Editor */}
                <div className="flex-1 flex flex-col border-r border-border min-w-0">
                    {/* Audio Player */}
                    {transcriptionData?.audioUrl && (
                        <div className="p-4 border-b border-border">
                            <div className="mb-2 text-sm text-muted-foreground">
                                Audio Player (URL: {transcriptionData.audioUrl})
                            </div>
                            <AudioPlayer />
                        </div>
                    )}
                    <div className="flex-1 p-4 min-h-0 relative">
                        {transcriptionData && (
                            <TiptapCaptionEditor
                                key={transcriptionData?._id + '-' + (transcriptionData?.updatedAt || '')}
                                transcriptionData={transcriptionData}
                                onTranscriptionDataUpdate={async () => { }}
                                onStepChange={() => { }}
                                onRefreshTranscription={refreshTranscription}
                                defaultTimelineVisibility={false}
                            />
                        )}
                    </div>
                </div>

                {/* Right - Metadata JSON List */}
                <div className="w-[64%] max-w-[720px] min-w-[380px] flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        <MetaDataList
                            metadata={metadataShape}
                            currentSentenceIndex={currentSentenceIndex}
                            availableAgents={availableAgents}
                            selectedAgentPath={selectedAgentPath}
                            onSelectAgent={setSelectedAgentPath}
                            userRequest={userRequest}
                            onChangeRequest={setUserRequest}
                            isRunning={isRunning}
                            isRefreshing={!!isRefreshing}
                            onRefresh={refreshTranscription}
                            onRun={runSelectedAgent}
                            onSaveSentence={handleSaveSentenceMetadata}
                            isSaving={isSaving}
                            onAgentFormDataChange={setAgentFormData}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function MetadataUI() {
    return (
        <AudioPlayerProvider>
            <MetadataUIInner />
        </AudioPlayerProvider>
    );
}


