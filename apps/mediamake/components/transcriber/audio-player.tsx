"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useAudioPlayer } from "./audio-player-context";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
    className?: string;
    showVolumeControl?: boolean;
    showTimeDisplay?: boolean;
    showProgressBar?: boolean;
    compact?: boolean;
}

export function AudioPlayer({
    className,
    showVolumeControl = true,
    showTimeDisplay = true,
    showProgressBar = true,
    compact = false
}: AudioPlayerProps) {
    const {
        isPlaying,
        currentTime,
        duration,
        volume,
        togglePlayPause,
        seekTo,
        setVolume,
        formatTime,
        isAudioLoaded
    } = useAudioPlayer();

    const handleSeek = (value: number[]) => {
        const newTime = (value[0] / 100) * duration;
        seekTo(newTime);
    };

    const handleVolumeChange = (value: number[]) => {
        setVolume(value[0] / 100);
    };

    if (compact) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={togglePlayPause}
                    disabled={!isAudioLoaded}
                    className="h-8 w-8"
                >
                    {isPlaying ? (
                        <Pause className="h-3 w-3" />
                    ) : (
                        <Play className="h-3 w-3" />
                    )}
                </Button>
                {showTimeDisplay && (
                    <span className="text-xs text-muted-foreground min-w-[60px]">
                        {formatTime(isAudioLoaded ? currentTime : 0)} / {formatTime(isAudioLoaded ? duration : 0)}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-4 p-4 bg-muted rounded-lg", className)}>
            <Button
                variant="outline"
                size="icon"
                onClick={togglePlayPause}
                disabled={!isAudioLoaded}
            >
                {isPlaying ? (
                    <Pause className="h-4 w-4" />
                ) : (
                    <Play className="h-4 w-4" />
                )}
            </Button>

            <div className="flex-1 space-y-2">
                {showProgressBar && (
                    <div className="w-full">
                        <Slider
                            value={[isAudioLoaded && duration ? (currentTime / duration) * 100 : 0]}
                            onValueChange={handleSeek}
                            max={100}
                            step={0.1}
                            className="w-full"
                            disabled={!isAudioLoaded}
                        />
                    </div>
                )}

                {showTimeDisplay && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{formatTime(isAudioLoaded ? currentTime : 0)}</span>
                        <span>{formatTime(isAudioLoaded ? duration : 0)}</span>
                    </div>
                )}
            </div>

            {showVolumeControl && (
                <div className="flex items-center gap-2">
                    {volume === 0 ? (
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Slider
                        value={[volume * 100]}
                        onValueChange={handleVolumeChange}
                        max={100}
                        step={1}
                        className="w-20"
                        disabled={!isAudioLoaded}
                    />
                </div>
            )}
        </div>
    );
}
