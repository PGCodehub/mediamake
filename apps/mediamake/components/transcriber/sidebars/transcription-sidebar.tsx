"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Edit3,
    Settings,
    ArrowLeft,
    Info,
    Video,
    BrainIcon,
    Bot
} from "lucide-react";
import { useTranscriber } from "../contexts/transcriber-context";

const navigationItems = [
    { id: 'editor', label: 'Editor', icon: Edit3 },
    { id: 'autofix', label: 'AI AutoFix', icon: Bot },
    { id: 'metadata', label: 'Metadata', icon: BrainIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'info', label: 'Info', icon: Info },
    { id: 'video', label: 'Video', icon: Video },
] as const;

export function TranscriptionNavigationSidebar() {
    const { currentView, setCurrentView, setSelectedTranscription } = useTranscriber();
    console.log('TranscriptionNavigationSidebar rendered, currentView:', currentView);

    const handleBackToExplorer = () => {
        setSelectedTranscription(null);
        setCurrentView('explorer');
    };

    return (
        <div className="w-48 h-full bg-background border-r border-border flex flex-col">
            {/* Back Button */}
            <div className="h-12 flex items-center justify-center border-b border-border">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-10 flex flex-row items-center justify-center gap-1 p-0"
                    onClick={handleBackToExplorer}
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-xs font-medium">Back</span>
                </Button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 py-2 space-y-1 p-4">
                {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Button
                            key={item.id}
                            variant={currentView === item.id ? "default" : "ghost"}
                            size="sm"
                            className={cn(
                                "w-full h-10 flex flex-row items-center justify-start text-left gap-1 p-0 gap-4",
                                currentView === item.id && "bg-neutral-200 text-primary-background hover:bg-neutral-100"
                            )}
                            onClick={() => setCurrentView(item.id as any)}
                        >
                            <Icon className="h-4 w-4 ml-4" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
