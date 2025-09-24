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

// Add these constants
const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

interface TiptapCaptionEditorProps {
    transcriptionData: Transcription;
    onStepChange: (step: 1 | 2 | 3) => void;
    onTranscriptionDataUpdate?: (updatedData: any) => Promise<void>;
}

/**
 * @deprecated Not in use.
 */
const parseJsonToCaptions = (jsonData: any): Caption[] => {
    return [];
};

const parseEditorStateToCaptions = (doc: ProseMirrorNode): Caption[] => {
    const captions: Caption[] = [];

    doc.content.forEach((paragraphNode, offset, index) => {
        if (paragraphNode.type.name === 'paragraph') {
            const sentenceAttrs = paragraphNode.attrs;
            const words: CaptionWord[] = [];

            let textContent = ``;
            let start = 0;
            let end = 0;
            paragraphNode.content.forEach((textNode, index) => {
                if (textNode.isText) {
                    textNode.marks.forEach(mark => {
                        if (mark.type.name === 'word') {
                            const wordAttrs = mark.attrs;
                            textContent += `${textNode.text!.trim()} `;
                            if (index === 0) {
                                start = wordAttrs['data-absolute-start'];
                            }
                            end = wordAttrs['data-absolute-end'];
                            let wordStart = wordAttrs['data-absolute-start'];
                            let wordEnd = wordAttrs['data-absolute-end'];
                            let wordDuration = wordEnd - wordStart;
                            words.push({
                                id: generateId(),
                                text: textNode.text!.trim(),
                                start: wordStart - start,
                                end: wordEnd - start,
                                absoluteStart: wordStart,
                                absoluteEnd: wordEnd,
                                confidence: wordAttrs['data-confidence'] || 0.8,
                                duration: wordDuration,
                            });
                        }
                    });
                }
            });

            if (words.length > 0) {
                captions.push({
                    id: `sentence-${generateId()}`,
                    text: textContent.trim(),
                    start: start,
                    end: end,
                    absoluteStart: start,
                    absoluteEnd: end,
                    duration: end - start,
                    words: words
                });
            }
        }
    });
    return captions;
};


export function TiptapCaptionEditor({ transcriptionData, onTranscriptionDataUpdate, onStepChange }: TiptapCaptionEditorProps) {
    const { audioRef, isPlaying, currentTime, duration, seekTo, togglePlayPause, setVolume: setVolumeContext, formatTime, volume } = useAudioPlayer();
    const [showBubbleMenu, setShowBubbleMenu] = useState(false);
    const [bubbleMenuPosition, setBubbleMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState('');
    const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: number; end: number } | null>(null);
    const [hasChanges, setHasChanges] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const bubbleMenuRef = useRef<HTMLDivElement>(null);

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
                paragraph: false, // Disable default paragraph
            }),
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
            SentenceParagraph,
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
        onUpdate: ({ editor }) => {
            // Handle content updates

            // // Parse the editor state to get the latest captions
            // const newCaptions = parseEditorStateToCaptions(editor.state.doc);

            // // Only update state if the content has meaningfully changed to prevent infinite loops
            // if (JSON.stringify(newCaptions) !== JSON.stringify(transcriptionData.captions)) {
            //     console.log('🔄 Editor content updated, syncing React state...');
            //     console.log('🔄 Sentences updated:', newCaptions);
            //     setHasChanges(true);
            // }
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

    // Initialize sentences from transcription data
    useEffect(() => {
        if (transcriptionData.captions && editor) {
            const processedSentences: Caption[] = transcriptionData.captions;
            console.log('🔄 Setting sentences from transcription data:', processedSentences.length, 'sentences');

            if (processedSentences.length > 0) {
                const content = {
                    type: 'doc',
                    content: processedSentences.map((sentence) => ({
                        type: 'paragraph',
                        attrs: {
                            class: 'sentence-item'
                        },
                        content: sentence.words.map((word) => ({
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
                        }))
                    }))
                };
                editor.commands.setContent(content);
            }
        }
    }, [transcriptionData, editor]);

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

        const finalCaptions = parseEditorStateToCaptions(editor.state.doc);

        if (!finalCaptions) {
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
        <div className="w-full h-screen flex flex-col">

            {/* Main Content with Tabs */}
            <div className="flex-1 overflow-hidden">
                {/* <Tabs defaultValue="editor" className="h-full flex flex-col">
                    <div className=" px-0 ">
                        <TabsList className="bg-transparent h-auto p-0 sticky top-0 bg-white">
                            <TabsTrigger value="editor" className="px-4 py-3 text-sm font-medium">
                                <Type className="h-4 w-4 mr-2" />
                                Editor
                            </TabsTrigger>
                            <TabsTrigger value="timeline" className="px-4 py-3 text-sm font-medium">
                                Timeline
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="editor" className="flex-1 overflow-hidden"> */}
                <div className="h-full flex flex-col">
                    {/* Medium-style Editor */}
                    <div className="flex-1 overflow-auto">
                        <div className=" mx-auto ">
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
                                        className="min-h-[500px] focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
                {/* </TabsContent>

                    <TabsContent value="timeline" className="flex-1 overflow-hidden">
                        <OverviewPanel
                            sentences={transcriptionData.captions}
                            currentSentenceIndex={timeStateRef.current.currentSentenceIndex}
                            onSentenceClick={handleSentenceClick}
                            formatTime={formatTime}
                        />
                    </TabsContent>
                </Tabs> */}
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
