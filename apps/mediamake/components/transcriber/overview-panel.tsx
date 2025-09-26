"use client";

import { cn } from "@/lib/utils";
import { Caption, Sequence } from "@/app/types/transcription";
import { useMemo, useState, useEffect } from "react";
import { SequenceTimeline } from "./sequence-timeline";

interface OverviewPanelProps {
    sentences: Caption[];
    currentSentenceIndex: number;
    onSentenceClick: (time: number, id: string) => void;
    formatTime: (time: number) => string;
}

export function OverviewPanel({
    sentences,
    currentSentenceIndex,
    onSentenceClick,
    formatTime,
}: OverviewPanelProps) {

    const initialSequences = useMemo(() => {
        return sentences.reduce((acc, sentence, index) => {
            const prevSentence = index > 0 ? sentences[index - 1] : null;

            if (prevSentence) {
                const gap = sentence.absoluteStart - prevSentence.absoluteEnd;
                if (gap > 0.01) {
                    acc.push({
                        id: `gap-${index}`,
                        absoluteStart: prevSentence.absoluteEnd,
                        absoluteEnd: sentence.absoluteStart,
                        duration: gap,
                        isEmpty: true,
                        metadata: {},
                    });
                }
            }
            if (index === 0) {
                if (sentence.absoluteStart > 0) {
                    acc.push({
                        id: `gap-${index}`,
                        absoluteStart: 0,
                        absoluteEnd: sentence.absoluteStart,
                        duration: sentence.absoluteStart,
                        isEmpty: true,
                        metadata: {},
                    });
                }
            }
            acc.push({
                id: sentence.id,
                text: sentence.text,
                absoluteStart: sentence.absoluteStart,
                absoluteEnd: sentence.absoluteEnd,
                duration: sentence.duration,
                metadata: {},
            });
            // if (index === sentences.length - 1) {
            //     if (sentence.absoluteEnd < totalDuration) {
            //         acc.push({
            //             id: `gap-${index}`,
            //             absoluteStart: sentence.absoluteEnd,
            //             absoluteEnd: totalDuration,
            //             duration: totalDuration - sentence.absoluteEnd,
            //             isEmpty: true,
            //             metadata: {},
            //         });
            //     }
            // }
            return acc;
        }, [] as Sequence[]);
    }, [sentences]);

    const [sequences, setSequences] = useState<Sequence[]>(initialSequences);

    useEffect(() => {
        setSequences(initialSequences);
    }, [initialSequences]);

    const totalDuration = useMemo(() => {
        if (sequences.length === 0) {
            return 0;
        }
        return sequences[sequences.length - 1].absoluteEnd;
    }, [sequences]);

    return (
        <div className="max-w-full mx-auto">
            <div className="sticky top-0 bg-white py-4 z-10">
                <div className="relative">
                    <SequenceTimeline sequences={sequences} setSequences={setSequences} totalDuration={totalDuration} />
                </div>
            </div>
            <div className="px-6 py-8 max-w-4xl mx-auto flex flex-col gap-4 max-h-[calc(100vh-100px)] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">All Sequences</h3>
                <div className="space-y-3">
                    {sequences.map((sequence, index) => (
                        <div
                            key={index}
                            className={cn(
                                "p-4 rounded-lg border cursor-pointer transition-all duration-200",
                                index === currentSentenceIndex
                                    ? "bg-blue-50 border-blue-200 shadow-sm"
                                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                            )}
                            onClick={() => onSentenceClick(sequence.absoluteStart, sequence.id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 flex-row justify-between">
                                    <div className="font-medium text-gray-900 mb-1">
                                        {sequence.isEmpty ? "Gap" : sequence.text}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {formatTime(sequence.absoluteStart)} - {formatTime(sequence.absoluteEnd)}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                    {index + 1}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
