import React, { useState, useMemo } from 'react';
import { Sequence } from '@/app/types/transcription';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlusIcon } from 'lucide-react';


interface SequenceTimelineProps {
    sequences: Sequence[];
    setSequences: (sequences: Sequence[]) => void;
    totalDuration: number;
}

const TimeMarkers: React.FC<{ duration: number; scale: number }> = ({ duration, scale }) => {
    const markers = useMemo(() => {
        const result = [];
        const interval = Math.max(1, Math.floor(50 / scale)); // Adjust interval based on scale
        for (let i = 0; i <= duration; i += interval) {
            result.push(i);
        }
        return result;
    }, [duration, scale]);

    return (
        <div className="absolute top-0 left-0 h-full" style={{ width: `${duration * scale}px` }}>
            {markers.map((time) => (
                <div
                    key={time}
                    className="absolute top-0 h-full"
                    style={{ left: `${time * scale}px` }}
                >
                    <span className="absolute top-0 left-1 text-xs text-black">{time}s</span>
                </div>
            ))}
        </div>
    );
};

const DraggableSequence: React.FC<{ sequence: Sequence; scale: number }> = ({ sequence, scale }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: sequence.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        left: `${sequence.absoluteStart * scale}px`,
        width: `${sequence.duration * scale}px`,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`absolute h-1/2 top-1/4 rounded-lg flex items-center justify-center text-white text-xs cursor-grab ${sequence.isEmpty ? 'bg-blue-400' : 'bg-purple-600'
                }`}
        >
            <span>{sequence.duration.toFixed(2)}s</span>
        </div>
    );
};


export const SequenceTimeline: React.FC<SequenceTimelineProps> = ({ sequences, setSequences, totalDuration }) => {
    const [zoom, setZoom] = useState(50); // Initial zoom level (pixels per second)
    const sensors = useSensors(useSensor(PointerSensor));

    function handleDragEnd(event: any) {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = sequences.findIndex((s) => s.id === active.id);
            const newIndex = sequences.findIndex((s) => s.id === over.id);
            const newSequences = arrayMove(sequences, oldIndex, newIndex);

            // Recalculate timestamps
            let currentTime = 0;
            const updatedSequences = newSequences.map(seq => {
                const updatedSeq = {
                    ...seq,
                    absoluteStart: currentTime,
                    absoluteEnd: currentTime + seq.duration,
                };
                currentTime += seq.duration;
                return updatedSeq;
            });

            setSequences(updatedSequences);
        }
    }

    function handleMerge(index: number) {
        const newSequences = [...sequences];
        if (index < 0 || index >= newSequences.length - 1) return;

        const firstSequence = newSequences[index];
        const secondSequence = newSequences[index + 1];

        const mergedSequence: Sequence = {
            id: firstSequence.id, // Keep the ID of the first sequence
            text: [firstSequence.text, secondSequence.text].filter(Boolean).join(' '),
            absoluteStart: firstSequence.absoluteStart,
            absoluteEnd: secondSequence.absoluteEnd,
            duration: firstSequence.duration + secondSequence.duration,
            isEmpty: firstSequence.isEmpty && secondSequence.isEmpty,
            metadata: { ...firstSequence.metadata, ...secondSequence.metadata },
        };

        newSequences.splice(index, 2, mergedSequence);
        setSequences(newSequences);
    }


    return (
        <div className='w-full relative flex flex-col justify-center items-center'>
            <div className="relative w-[55vw] h-32 overflow-x-auto">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sequences.map(s => s.id)} strategy={horizontalListSortingStrategy}>
                        <div className="relative h-full" style={{ width: `${totalDuration * zoom}px` }}>
                            <TimeMarkers duration={totalDuration} scale={zoom} />
                            {sequences.map((sequence, index) => (
                                <React.Fragment key={sequence.id}>
                                    <DraggableSequence sequence={sequence} scale={zoom} />
                                    {index < sequences.length - 1 && (
                                        <div className="absolute top-1/2 -translate-y-1/2 h-6 w-6 bg-white rounded-full border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200"
                                            style={{ left: `${sequence.absoluteEnd * zoom - 12}px`, zIndex: 10 }}
                                            onClick={() => handleMerge(index)}
                                        >
                                            <PlusIcon className="h-4 w-4 text-gray-500" />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
            <div className="flex items-center justify-center p-2">
                <label htmlFor="zoom" className="mr-2 text-sm font-medium text-gray-700">Zoom:</label>
                <input
                    type="range"
                    id="zoom"
                    min="5"
                    max="100"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-48"
                />
            </div>
        </div>
    );
};
