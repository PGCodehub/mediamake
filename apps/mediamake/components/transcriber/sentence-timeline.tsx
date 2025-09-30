"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, ZoomIn, ZoomOut, Scissors, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Caption, CaptionWord } from '@/app/types/transcription';
import { useGesture, FullGestureState } from '@use-gesture/react';
import { toast } from 'sonner';
import { generateId } from '@microfox/datamotion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const MIN_PX_PER_SEC = 20;
const MAX_PX_PER_SEC = 800;

interface WordLevelTimelineProps {
    captions: Caption[];
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    onSeek: (time: number) => void;
    onTogglePlayPause: () => void;
    onCaptionsChange: (newCaptions: Caption[]) => void;
    formatTime: (time: number) => string;
    className?: string;
}

const TimelineRuler = React.memo(({ pixelsPerSecond, duration, timelineWidth }: { pixelsPerSecond: number, duration: number, timelineWidth: number }) => {
    const ticks = useMemo(() => {
        const tickList = [];
        const interval = (pixelsPerSecond > 100) ? 1 : (pixelsPerSecond > 50) ? 2 : 5;
        for (let i = 0; i <= duration; i += interval) {
            tickList.push({
                time: i,
                position: i * pixelsPerSecond,
            });
        }
        return tickList;
    }, [pixelsPerSecond, duration]);

    return (
        <div className="sticky top-0 h-8 bg-background border-b z-50 shadow-sm" style={{ width: timelineWidth }}>
            <div className="relative h-full">
                {ticks.map(({ time, position }) => (
                    <div key={time} className="absolute h-full" style={{ left: position }}>
                        <div className="w-px h-2 bg-muted-foreground" />
                        <span className="text-xs text-muted-foreground absolute top-2 left-1">{time}s</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

TimelineRuler.displayName = "TimelineRuler";

const WordBlock = ({ word, sentence, pixelsPerSecond, onWordUpdate, prevSentenceEnd, nextSentenceStart }: {
    word: CaptionWord,
    sentence: Caption,
    pixelsPerSecond: number,
    onWordUpdate: (updatedWord: CaptionWord) => void,
    prevSentenceEnd: number,
    nextSentenceStart: number
}) => {
    // Local state for the word being dragged. This is for visual feedback during the drag.
    const [localWord, setLocalWord] = useState(word);

    // When the canonical `word` prop changes from the parent, reset our local state.
    // This is important for when an external change happens (like another word being edited).
    useEffect(() => {
        setLocalWord(word);
    }, [word]);

    const bind = useGesture({
        onDrag: ({ down, movement: [mx], args: [handle], memo, first, event }) => {
            event.stopPropagation();
            // `memo` is a persistent object for the gesture's state.
            // We initialize it on the first drag event.
            if (first) {
                const wordIndex = sentence.words.findIndex(w => w.id === word.id);
                const prevWordEndBoundary = wordIndex > 0 ? sentence.words[wordIndex - 1].absoluteEnd : prevSentenceEnd;
                const nextWordStartBoundary = wordIndex < sentence.words.length - 1 ? sentence.words[wordIndex + 1].absoluteStart : nextSentenceStart;
                memo = { originalStart: word.absoluteStart, originalEnd: word.absoluteEnd, prevWordEnd: prevWordEndBoundary, nextWordStart: nextWordStartBoundary };
            }

            const timeDelta = mx / pixelsPerSecond;
            let newStart = memo.originalStart;
            let newEnd = memo.originalEnd;

            if (handle === 'left') {
                newStart = Math.max(memo.prevWordEnd, memo.originalStart + timeDelta);
                if (newStart >= newEnd) newStart = newEnd - 0.01; // Prevent inversion
            } else { // 'right'
                newEnd = Math.min(memo.nextWordStart, memo.originalEnd + timeDelta);
                if (newEnd <= newStart) newEnd = newStart + 0.01; // Prevent inversion
            }

            // Update the local state for immediate visual feedback.
            // This does NOT trigger a re-render of the parent component.
            setLocalWord(prev => ({ ...prev, absoluteStart: newStart, absoluteEnd: newEnd }));

            // When the drag is released (`down` is false), we call the expensive parent update function.
            if (!down) {
                const finalWord = {
                    ...word, // Start with original props
                    absoluteStart: newStart,
                    absoluteEnd: newEnd,
                    start: newStart - sentence.absoluteStart,
                    end: newEnd - sentence.absoluteStart,
                    duration: newEnd - newStart,
                };
                onWordUpdate(finalWord);
            }
            return memo;
        },
    });

    const width = (localWord.absoluteEnd - localWord.absoluteStart) * pixelsPerSecond;
    const left = localWord.absoluteStart * pixelsPerSecond;

    return (
        <div
            className="absolute h-full top-0 flex items-center bg-primary/20 border border-primary/50 rounded-sm"
            style={{ left, width, minWidth: '1px' }}
        >
            <div
                {...bind('left')}
                className="absolute left-0 top-0 h-full w-2 cursor-ew-resize bg-primary/50 rounded-l-sm touch-none"
            />
            <span className="px-3 text-xs text-primary-foreground truncate select-none">{word.text}</span>
            <div
                {...bind('right')}
                className="absolute right-0 top-0 h-full w-2 cursor-ew-resize bg-primary/50 rounded-r-sm touch-none"
            />
        </div>
    );
};

// Create a more specific props interface for clarity
interface SentenceTrackProps {
    sentence: Caption;
    pixelsPerSecond: number;
    onWordUpdate: (word: CaptionWord, sentenceId: string) => void;
    onWordSplit: (word: CaptionWord, sentenceId: string, time: number) => void;
    prevSentenceEnd: number;
    nextSentenceStart: number;
}

const SentenceTrack = React.forwardRef<HTMLDivElement, SentenceTrackProps>(
    ({ sentence, pixelsPerSecond, onWordUpdate, prevSentenceEnd, nextSentenceStart }, ref) => {
        return (
            <div ref={ref} className="h-12 border-b relative my-1">
                {sentence.words.map(word => (
                    <WordBlock
                        key={word.id}
                        word={word}
                        sentence={sentence}
                        pixelsPerSecond={pixelsPerSecond}
                        onWordUpdate={(updatedWord) => onWordUpdate(updatedWord, sentence.id)}
                        prevSentenceEnd={prevSentenceEnd}
                        nextSentenceStart={nextSentenceStart}
                    />
                ))}
            </div>
        );
    });
SentenceTrack.displayName = 'SentenceTrack';

export function SentenceTimeline({
    captions,
    currentTime,
    duration,
    isPlaying,
    onSeek,
    onTogglePlayPause,
    onCaptionsChange,
    formatTime,
    className
}: WordLevelTimelineProps) {
    const [pixelsPerSecond, setPixelsPerSecond] = useState(100);
    const [sentenceGapLimit, setSentenceGapLimit] = useState(5);
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const sentenceTrackRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // When the captions array changes, re-initialize the refs object for the sentence tracks.
    useEffect(() => {
        sentenceTrackRefs.current = captions.reduce((acc, sentence) => {
            acc[sentence.id] = null;
            return acc;
        }, {} as Record<string, HTMLDivElement | null>);
    }, [captions]);

    const timelineWidth = useMemo(() => duration * pixelsPerSecond, [duration, pixelsPerSecond]);

    const activeSentence = useMemo(() => {
        // Find the sentence that contains the current time
        const sentence = captions.find(s => currentTime >= s.absoluteStart && currentTime <= s.absoluteEnd);
        if (sentence) return sentence;

        // If the playhead is in a gap between sentences, find the upcoming sentence
        // and show the one just before it to maintain context.
        for (let i = 0; i < captions.length; i++) {
            if (currentTime < captions[i].absoluteStart) {
                return captions[i - 1] || captions[i];
            }
        }
        // If time is after the last sentence, keep the last sentence active.
        return captions.length > 0 ? captions[captions.length - 1] : null;
    }, [captions, currentTime]);

    const lastScrolledSentenceId = useRef<string | null>(null);

    // This effect handles all the auto-scrolling logic for the timeline.
    useEffect(() => {
        const container = timelineContainerRef.current;
        if (!container) return;

        const playheadPosition = currentTime * pixelsPerSecond;
        const containerWidth = container.clientWidth;

        // --- Auto-scroll on Seek or Active Sentence Change ---
        // If the active sentence has changed, we jump the view to it.
        if (activeSentence && activeSentence.id !== lastScrolledSentenceId.current) {
            const sentenceEl = sentenceTrackRefs.current[activeSentence.id];
            if (sentenceEl) {
                // Calculate the position of the sentence within the timeline container
                const sentenceRect = sentenceEl.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                // Calculate the relative position of the sentence within the container
                const sentenceTop = sentenceEl.offsetTop;
                const sentenceHeight = sentenceEl.offsetHeight;
                const containerHeight = container.clientHeight;

                // Center the sentence vertically within the timeline container only
                const targetScrollTop = sentenceTop - (containerHeight / 2) + (sentenceHeight / 2);
                container.scrollTop = Math.max(0, targetScrollTop);

                // Horizontally center the playhead instantly.
                container.scrollLeft = playheadPosition - containerWidth / 2;
                lastScrolledSentenceId.current = activeSentence.id;
            }
        }

        // --- Auto-scroll during continuous playback ---
        if (isPlaying) {
            const scrollLeft = container.scrollLeft;
            const rightBoundary = scrollLeft + containerWidth;
            // Establish a "safe zone" in the middle of the timeline.
            // If the playhead leaves this zone, we scroll.
            const buffer = containerWidth * 0.3;

            if (playheadPosition > rightBoundary - buffer) {
                // If playhead nears the right edge, scroll smoothly to re-center it.
                container.scrollTo({ left: playheadPosition - containerWidth / 2, behavior: 'smooth' });
            } else if (playheadPosition < scrollLeft + buffer) {
                // If playhead nears the left edge, scroll smoothly to re-center it.
                container.scrollTo({ left: Math.max(0, playheadPosition - containerWidth / 2), behavior: 'smooth' });
            }
        }

    }, [currentTime, isPlaying, pixelsPerSecond, activeSentence]);


    const wordAtCurrentTime = useMemo(() => {
        for (const sentence of captions) {
            for (const word of sentence.words) {
                if (currentTime >= word.absoluteStart && currentTime < word.absoluteEnd) {
                    return { sentence, word };
                }
            }
        }
        return null;
    }, [captions, currentTime]);

    const handleZoomIn = () => setPixelsPerSecond(pps => Math.min(MAX_PX_PER_SEC, pps * 1.5));
    const handleZoomOut = () => setPixelsPerSecond(pps => Math.max(MIN_PX_PER_SEC, pps / 1.5));

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (timelineContainerRef.current) {
            const rect = timelineContainerRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const scrollLeft = timelineContainerRef.current.scrollLeft;
            const seekTime = (clickX + scrollLeft) / pixelsPerSecond;
            onSeek(seekTime);
        }
    };

    const handleWordUpdate = useCallback((updatedWord: CaptionWord, sentenceId: string) => {
        const newCaptions = captions.map(sentence => {
            if (sentence.id === sentenceId) {
                const newWords = sentence.words.map(word => word.id === updatedWord.id ? updatedWord : word);
                const newSentenceStart = newWords[0]?.absoluteStart ?? sentence.absoluteStart;
                const newSentenceEnd = newWords[newWords.length - 1]?.absoluteEnd ?? sentence.absoluteEnd;
                return {
                    ...sentence,
                    words: newWords,
                    absoluteStart: newSentenceStart,
                    absoluteEnd: newSentenceEnd,
                    start: newSentenceStart,
                    end: newSentenceEnd,
                    duration: newSentenceEnd - newSentenceStart,
                    text: newWords.map(w => w.text).join(' '),
                };
            }
            return sentence;
        });
        onCaptionsChange(newCaptions);
    }, [captions, onCaptionsChange]);


    const handleWordSplit = useCallback(() => {
        if (!wordAtCurrentTime) {
            toast.error("Playhead is not over a word to split.");
            return;
        }

        const { sentence, word } = wordAtCurrentTime;

        const splitTime = currentTime;
        if (splitTime <= word.absoluteStart + 0.05 || splitTime >= word.absoluteEnd - 0.05) {
            toast.error("Split point is too close to the word boundary.");
            return;
        }

        const splitIndex = Math.round((splitTime - word.absoluteStart) / (word.absoluteEnd - word.absoluteStart) * word.text.length);
        const text1 = word.text.slice(0, splitIndex);
        const text2 = word.text.slice(splitIndex);

        if (!text1 || !text2) {
            toast.error("Cannot split word into empty parts.");
            return;
        }

        const word1: CaptionWord = {
            ...word,
            id: generateId(),
            text: text1,
            absoluteEnd: splitTime,
            end: splitTime - sentence.absoluteStart,
        };
        const word2: CaptionWord = {
            ...word,
            id: generateId(),
            text: text2,
            absoluteStart: splitTime,
            start: splitTime - sentence.absoluteStart,
        };

        const newCaptions = captions.map(s => {
            if (s.id === sentence.id) {
                const wordIndex = s.words.findIndex(w => w.id === word.id);
                const newWords = [...s.words];
                newWords.splice(wordIndex, 1, word1, word2);
                return {
                    ...s,
                    words: newWords,
                    text: newWords.map(w => w.text).join(' '),
                };
            }
            return s;
        });

        onCaptionsChange(newCaptions);
        toast.success(`Word "${word.text}" split into "${text1}" and "${text2}".`);
    }, [wordAtCurrentTime, captions, onCaptionsChange, currentTime]);


    const handleFillWordGaps = useCallback(() => {
        const newCaptions = JSON.parse(JSON.stringify(captions));

        newCaptions.forEach((sentence: Caption) => {
            for (let i = 0; i < sentence.words.length - 1; i++) {
                const currentWord = sentence.words[i];
                const nextWord = sentence.words[i + 1];

                const gap = nextWord.absoluteStart - currentWord.absoluteEnd;

                if (gap > 0.01) { // Only adjust if gap is meaningful
                    const currentWordDuration = currentWord.absoluteEnd - currentWord.absoluteStart;
                    const nextWordDuration = nextWord.absoluteEnd - nextWord.absoluteStart;

                    if (currentWordDuration < nextWordDuration) {
                        // Extend the left (current) word
                        currentWord.absoluteEnd = nextWord.absoluteStart;
                        currentWord.end = currentWord.absoluteEnd - sentence.absoluteStart;
                    } else {
                        // Extend the right (next) word by moving its start time
                        nextWord.absoluteStart = currentWord.absoluteEnd;
                        nextWord.start = nextWord.absoluteStart - sentence.absoluteStart;
                    }
                }
            }
        });

        onCaptionsChange(newCaptions);
        toast.success("Filled gaps between words.");
    }, [captions, onCaptionsChange]);

    const fillSentenceGaps = useCallback((isForced: boolean) => {
        const newCaptions = JSON.parse(JSON.stringify(captions));

        for (let i = 0; i < newCaptions.length - 1; i++) {
            const currentSentence = newCaptions[i];
            const nextSentence = newCaptions[i + 1];

            const gap = nextSentence.absoluteStart - currentSentence.absoluteEnd;

            if (gap > 0.01) {
                const fillAmount = isForced ? gap : Math.min(gap, sentenceGapLimit);

                // Extend the last word of the current sentence
                const lastWord = currentSentence.words[currentSentence.words.length - 1];
                if (lastWord) {
                    lastWord.absoluteEnd += fillAmount;
                    lastWord.end += fillAmount;
                }

                // Update the sentence's end time
                currentSentence.absoluteEnd += fillAmount;
                currentSentence.end += fillAmount;
            }
        }
        onCaptionsChange(newCaptions);
        toast.success(`Filled gaps between sentences ${isForced ? '(Forced)' : ''}.`);

    }, [captions, onCaptionsChange, sentenceGapLimit]);


    return (
        <div className={cn("h-full flex flex-col bg-background border-l", className)}>
            <div className="p-2 border-b flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onTogglePlayPause}>
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[120px]">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
                    <Slider
                        min={MIN_PX_PER_SEC}
                        max={MAX_PX_PER_SEC}
                        value={[pixelsPerSecond]}
                        onValueChange={(val) => setPixelsPerSecond(val[0])}
                        className="w-32"
                    />
                    <Button variant="outline" size="icon" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
                </div>
                <div>
                    <Button variant="outline" size="sm" onClick={handleWordSplit} disabled={!wordAtCurrentTime}>
                        <Scissors className="h-4 w-4 mr-2" />
                        Split
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Wand2 className="h-4 w-4 mr-2" />
                                Auto-Adjust
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Auto-Adjust Timings</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically fill gaps between words or sentences.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Button variant="outline" size="sm" onClick={handleFillWordGaps}>
                                        Fill word gaps
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => fillSentenceGaps(false)}>
                                        Fill sentence gaps
                                    </Button>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="width">Max Gap (s)</Label>
                                        <Input
                                            id="width"
                                            type="number"
                                            value={sentenceGapLimit}
                                            onChange={(e) => setSentenceGapLimit(Number(e.target.value))}
                                            className="col-span-2 h-8"
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => fillSentenceGaps(true)}>
                                        Force fill sentence gaps
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="relative flex-1">
                <div
                    ref={timelineContainerRef}
                    className="absolute inset-0 overflow-auto"
                    onClick={handleTimelineClick}
                >
                    <div style={{ width: timelineWidth, position: 'relative' }}>
                        <TimelineRuler pixelsPerSecond={pixelsPerSecond} duration={duration} timelineWidth={timelineWidth} />

                        <div>
                            {captions.map((sentence, index) => {
                                const prevSentenceEnd = index > 0 ? captions[index - 1].absoluteEnd : 0;
                                const nextSentenceStart = index < captions.length - 1 ? captions[index + 1].absoluteStart : duration;
                                return (
                                    <SentenceTrack
                                        ref={(el) => {
                                            if (sentence.id) {
                                                sentenceTrackRefs.current[sentence.id] = el;
                                            }
                                        }}
                                        key={sentence.id}
                                        sentence={sentence}
                                        pixelsPerSecond={pixelsPerSecond}
                                        onWordUpdate={handleWordUpdate}
                                        onWordSplit={handleWordSplit}
                                        prevSentenceEnd={prevSentenceEnd}
                                        nextSentenceStart={nextSentenceStart}
                                    />
                                );
                            })}
                        </div>

                        <div
                            className="absolute top-0 w-0.5 bg-red-500 z-30 pointer-events-none"
                            style={{
                                left: currentTime * pixelsPerSecond,
                                height: '100%'
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
