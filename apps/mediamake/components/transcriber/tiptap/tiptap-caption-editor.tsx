"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
    Play,
    Pause,
    Square,
    Volume2,
    VolumeX,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Quote,
    Code,
    Link,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Type,
    Timer,
    CheckCircle,
    Loader2,
    ArrowLeft,
    Check,
    Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import CodeBlock from '@tiptap/extension-code-block';
import { Node, Mark } from '@tiptap/core';
import Paragraph from '@tiptap/extension-paragraph';
import { Caption, CaptionWord, Transcription } from '@/app/types/transcription';
import './tiptap-editor.css';
import { HighlightExtension, updateHighlightTime } from './highlight-extension';
import { ClickAndSeekExtension } from './click-seek-extension';
import { OverviewPanel } from '../overview-panel';
import { SentenceTimeline } from '../sentence-timeline';
import { toast } from "sonner";
import { diffArrays } from 'diff';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { useAudioPlayer } from '../audio-player-context';
import { SentenceParagraph } from './sentence-paragraph-extension';
import { WordMark } from './word-mark-extension';
import { CaptionSyncExtension } from './caption-sync-extension';
import { generateId } from "@microfox/datamotion";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

const CustomParagraph = Paragraph.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            'data-sentence-id': {
                default: null,
            },
        };
    },
});

// Add these constants
const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

interface TiptapCaptionEditorProps {
    transcriptionData: Transcription;
    onStepChange: (step: 1 | 2 | 3) => void;
    onTranscriptionDataUpdate?: (updatedData: any) => Promise<void>;
}

export function TiptapCaptionEditor({ transcriptionData, onTranscriptionDataUpdate, onStepChange }: TiptapCaptionEditorProps) {
    const { audioRef, isPlaying, currentTime, duration, seekTo, togglePlayPause, setVolume: setVolumeContext, formatTime, volume } = useAudioPlayer();
    const [showBubbleMenu, setShowBubbleMenu] = useState(false);
    const [bubbleMenuPosition, setBubbleMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState('');
    const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: number; end: number } | null>(null);
    const [hasChanges, setHasChanges] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const bubbleMenuRef = useRef<HTMLDivElement>(null);
    const [localCaptions, setLocalCaptions] = useState<Caption[]>([]);
    const captionsRef = useRef(localCaptions);

    useEffect(() => {
        captionsRef.current = localCaptions;
    }, [localCaptions]);

    useEffect(() => {
        setLocalCaptions(transcriptionData.captions);
    }, [transcriptionData.captions]);

    const handleCaptionsChange = (newCaptions: Caption[]) => {
        console.log("handleCaptionsChange called with:", newCaptions);
        setLocalCaptions(newCaptions);
        setHasChanges(true); // Mark that we have changes to be saved
    };

    const timeStateRef = useRef({
        currentTime: 0,
        currentSentenceIndex: 0,
        highlightedWordIndex: -1,
        lastHighlightedSentence: -1,
        lastHighlightedWord: -1,
    });

    // Use refs to store stable function references
    const handleSentenceClickRef = useRef<(time: number, id: string) => void>(() => { });

    // Update refs when dependencies change
    handleSentenceClickRef.current = (time: number, id: string) => {
        timeStateRef.current.currentSentenceIndex = transcriptionData.captions.findIndex(sentence => sentence.id === id);
        seekTo(time);
    };

    // Stable wrapper functions
    const handleSentenceClick = useCallback((time: number, id: string) => {
        handleSentenceClickRef.current?.(time, id);
    }, []);

    // Initialize Tiptap editor only once
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
                paragraph: false, // We are using our custom paragraph
            }),
            CustomParagraph,
            LinkExtension.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-500 underline cursor-pointer',
                },
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            CodeBlock,
            //SentenceParagraph,
            WordMark,
            HighlightExtension,
            ClickAndSeekExtension.configure({
                onSeek: seekTo,
            }),
            // CaptionSyncExtension.configure({
            //     initialCaptions: transcriptionData.captions,
            // })
            // WordSelectionExtension - disabled for now, using CSS approach instead
        ],
        editable: true,
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4 border rounded-lg',
            },
        },
        immediatelyRender: false,
        onUpdate: ({ editor, transaction }) => {
            console.log("Tiptap onUpdate triggered.");

            if (!transaction.docChanged) {
                console.log("No document changes, skipping.");
                return;
            }

            const newCaptions: Caption[] = [];

            editor.state.doc.forEach(p_node => {
                const newCaptionWords: CaptionWord[] = [];

                p_node.content.forEach(childNode => {
                    if (childNode.isText) {
                        const wordMark = childNode.marks.find(mark => mark.type.name === 'word');
                        const text = childNode.text?.trim();
                        if (wordMark && text) {
                            const absoluteStart = parseFloat(wordMark.attrs['data-absolute-start']);
                            const absoluteEnd = parseFloat(wordMark.attrs['data-absolute-end']);

                            if (!isNaN(absoluteStart) && !isNaN(absoluteEnd)) {
                                newCaptionWords.push({
                                    id: generateId(),
                                    text: text,
                                    absoluteStart,
                                    absoluteEnd,
                                    start: 0, // Will be recalculated below
                                    end: 0,   // Will be recalculated below
                                    duration: absoluteEnd - absoluteStart,
                                    confidence: wordMark.attrs['data-confidence'] || 1.0,
                                });
                            }
                        }
                    }
                });

                if (newCaptionWords.length > 0) {
                    const sentenceStart = newCaptionWords[0].absoluteStart;
                    const sentenceEnd = newCaptionWords[newCaptionWords.length - 1].absoluteEnd;

                    // Adjust relative timings for all words in the new sentence.
                    newCaptionWords.forEach(w => {
                        w.start = w.absoluteStart - sentenceStart;
                        w.end = w.absoluteEnd - sentenceStart;
                    });

                    newCaptions.push({
                        id: p_node.attrs['data-sentence-id'] || `sentence-${generateId()}`,
                        text: p_node.textContent.trim(),
                        start: sentenceStart,
                        end: sentenceEnd,
                        duration: sentenceEnd - sentenceStart,
                        absoluteStart: sentenceStart,
                        absoluteEnd: sentenceEnd,
                        words: newCaptionWords,
                    });
                }
            });

            const hasStructuralChanges = JSON.stringify(captionsRef.current) !== JSON.stringify(newCaptions);

            console.log("Has structural changes:", hasStructuralChanges);

            if (hasStructuralChanges) {
                console.log("Calling handleCaptionsChange with updated captions.");
                handleCaptionsChange(newCaptions);
            } else {
                console.log("No structural changes detected, not updating state.");
            }
        },
        onSelectionUpdate: ({ editor }) => {
            // Handle selection updates for bubble menu
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to, ' ');

            if (selectedText.trim().length > 0) {
                let startTime: number | null = null;
                let endTime: number | null = null;

                editor.state.doc.nodesBetween(from, to, (node) => {
                    if (node.isText) {
                        const wordMark = node.marks.find(mark => mark.type.name === 'word');
                        if (wordMark) {
                            const wordStart = parseFloat(wordMark.attrs['data-absolute-start']);
                            const wordEnd = parseFloat(wordMark.attrs['data-absolute-end']);

                            if (!isNaN(wordStart) && (startTime === null || wordStart < startTime)) {
                                startTime = wordStart;
                            }
                            if (!isNaN(wordEnd) && (endTime === null || wordEnd > endTime)) {
                                endTime = wordEnd;
                            }
                        }
                    }
                });

                setSelectedText(selectedText.trim());
                setSelectedTimeRange(startTime !== null && endTime !== null ? { start: startTime, end: endTime } : null);
                setShowBubbleMenu(true);

                // Get selection position for bubble menu
                const { view } = editor;
                const { state } = view;
                const { selection } = state;
                const { $from } = selection;
                const coords = view.coordsAtPos($from.pos);

                setBubbleMenuPosition({
                    x: coords.left,
                    y: coords.top - 60
                });
            } else {
                setShowBubbleMenu(false);
                setSelectedText('');
                setSelectedTimeRange(null);
            }
        },
    });

    const lastSyncedCaptions = useRef<string | null>(null);

    // This effect is responsible for syncing the state of the captions (from the timeline)
    // into the Tiptap editor's view.
    useEffect(() => {
        if (!editor || !localCaptions) return;

        const captionsJson = JSON.stringify(localCaptions);

        console.log("Syncing captions to Tiptap editor. Has content changed?", captionsJson !== lastSyncedCaptions.current);

        // We do a deep comparison to ensure we only update the editor when the data has actually changed.
        // This is a crucial step to prevent infinite rendering loops.
        if (captionsJson !== lastSyncedCaptions.current) {
            console.log("Content has changed, updating editor view.");
            lastSyncedCaptions.current = captionsJson;

            const content = {
                type: 'doc',
                content: localCaptions.map((sentence: Caption) => {
                    const wordNodes = sentence.words.flatMap((word, index) => {
                        const wordNode = {
                            type: 'text',
                            marks: [{
                                type: 'word',
                                attrs: {
                                    'data-absolute-start': word.absoluteStart,
                                    'data-absolute-end': word.absoluteEnd,
                                    'data-confidence': word.confidence,
                                    class: 'word-highlight'
                                }
                            }],
                            text: word.text,
                        };

                        if (index < sentence.words.length - 1) {
                            return [wordNode, { type: 'text', text: ' ' }];
                        }

                        return [wordNode];
                    });

                    // Add a trailing space to prevent words from merging when sentences are merged
                    const paragraphContent = wordNodes.length > 0 ? [...wordNodes, { type: 'text', text: ' ' }] : [];

                    return {
                        type: 'paragraph',
                        attrs: {
                            'data-sentence-id': sentence.id,
                        },
                        content: paragraphContent
                    };
                })
            };

            // Preserve the user's cursor position during the update.
            const { from, to } = editor.state.selection;
            editor.commands.setContent(content, { emitUpdate: false }); // `emitUpdate: false` prevents an `onUpdate` loop

            // Ensure the previous cursor position is valid within the new content length.
            if (from <= editor.state.doc.content.size && to <= editor.state.doc.content.size) {
                editor.commands.setTextSelection({ from, to });
            }
        }
    }, [localCaptions, editor]);

    // Handle click outside to hide bubble menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bubbleMenuRef.current && !bubbleMenuRef.current.contains(event.target as HTMLElement)) {
                setShowBubbleMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Sync with audio player context
    useEffect(() => {
        if (editor) {
            updateHighlightTime(currentTime, editor.view);
        }
    }, [currentTime, editor]);

    // Editor toolbar functions
    const toggleBold = () => editor?.chain().focus().toggleBold().run();
    const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
    const toggleStrike = () => editor?.chain().focus().toggleStrike().run();


    const handleSaveChanges = async () => {
        if (!editor || !transcriptionData._id) {
            toast.error("Editor not ready or transcription ID is missing.");
            return;
        }

        // We use localCaptions as the source of truth for saving.
        // We could also parse the editor state again as a final check, but this assumes timeline is the master.
        const finalCaptions = localCaptions;

        if (!finalCaptions || finalCaptions.length === 0) {
            console.log("No changes to save or transcription ID is missing.");
            toast.error("No changes to save or transcription ID is missing.");
            return;
        }

        setIsSaving(true);

        await onTranscriptionDataUpdate?.({
            captions: finalCaptions,
            processingData: {
                ...transcriptionData.processingData,
                step3: {
                    ...transcriptionData.processingData?.step3,
                    processedCaptions: finalCaptions
                }
            }
        });

        setIsSaving(false);
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* Main Content with Resizable Panels */}
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    {/* Editor Panel */}
                    <ResizablePanel defaultSize={70} minSize={40} className="flex flex-col">
                        <div className="flex-1 overflow-auto">
                            <div className="relative">
                                {/* Bubble Menu */}
                                {showBubbleMenu && (
                                    <div
                                        ref={bubbleMenuRef}
                                        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex items-center gap-1"
                                        style={{
                                            left: bubbleMenuPosition.x,
                                            top: bubbleMenuPosition.y,
                                        }}
                                    >
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={toggleBold}
                                            className={cn(
                                                "h-8 w-8 p-0",
                                                editor?.isActive('bold') && "bg-gray-100"
                                            )}
                                        >
                                            <Bold className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={toggleItalic}
                                            className={cn(
                                                "h-8 w-8 p-0",
                                                editor?.isActive('italic') && "bg-gray-100"
                                            )}
                                        >
                                            <Italic className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={toggleStrike}
                                            className={cn(
                                                "h-8 w-8 p-0",
                                                editor?.isActive('strike') && "bg-gray-100"
                                            )}
                                        >
                                            <Underline className="h-4 w-4" />
                                        </Button>
                                        <div className="w-px h-6 bg-gray-200 mx-1" />
                                        {showBubbleMenu && selectedTimeRange && (
                                            <p className="text-gray-600 text-sm">
                                                {formatTime(selectedTimeRange.start)} - {formatTime(selectedTimeRange.end)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Editor Content */}
                                <div className="prose prose-lg max-w-none">
                                    <EditorContent
                                        editor={editor}
                                        className="max-h-[500px] focus:outline-none p-4 overflow-auto"
                                    />
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>

                    {/* Resizable Handle */}
                    <ResizableHandle withHandle />

                    {/* Timeline Panel */}
                    <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                        <SentenceTimeline
                            captions={localCaptions}
                            currentTime={currentTime}
                            duration={duration}
                            isPlaying={isPlaying}
                            onSeek={seekTo}
                            onTogglePlayPause={togglePlayPause}
                            onCaptionsChange={handleCaptionsChange}
                            formatTime={formatTime}
                            className="h-full"
                        />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            {hasChanges && (
                <div className="fixed bottom-6 right-6 z-50">
                    <Button
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="rounded-full w-14 h-14 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                    >
                        {isSaving ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <Check className="h-6 w-6" />
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
