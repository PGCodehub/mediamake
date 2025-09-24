"use client";

import React, { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';

interface AudioPlayerContextType {
    audioRef: React.RefObject<HTMLAudioElement>;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    audioUrl: string | null;
    setAudioUrl: (url: string | null) => void;
    play: () => void;
    pause: () => void;
    togglePlayPause: () => void;
    seekTo: (time: number) => void;
    setVolume: (volume: number) => void;
    formatTime: (time: number) => string;
    isAudioLoaded: boolean;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

interface AudioPlayerProviderProps {
    children: ReactNode;
}

export function AudioPlayerProvider({ children }: AudioPlayerProviderProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(1);
    const [audioUrl, setAudioUrlState] = useState<string | null>(null);
    const [isAudioLoaded, setIsAudioLoaded] = useState(false);

    const setAudioUrl = useCallback((url: string | null) => {
        setAudioUrlState(url);
        setIsAudioLoaded(false);
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
    }, []);

    const play = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
        }
    }, []);

    const pause = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, []);

    const togglePlayPause = useCallback(() => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    }, [isPlaying, play, pause]);

    const seekTo = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const setVolume = useCallback((newVolume: number) => {
        setVolumeState(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    }, []);

    const formatTime = useCallback((time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    const handleLoadedMetadata = useCallback(() => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
            setIsAudioLoaded(true);
        }
    }, []);

    const handleTimeUpdate = useCallback(() => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    }, []);

    const handleEnded = useCallback(() => {
        setIsPlaying(false);
    }, []);

    const handleVolumeChange = useCallback(() => {
        if (audioRef.current) {
            setVolumeState(audioRef.current.volume);
        }
    }, []);

    const contextValue: AudioPlayerContextType = {
        audioRef,
        isPlaying,
        currentTime,
        duration,
        volume,
        audioUrl,
        setAudioUrl,
        play,
        pause,
        togglePlayPause,
        seekTo,
        setVolume,
        formatTime,
        isAudioLoaded
    };

    return (
        <AudioPlayerContext.Provider value={contextValue}>
            {children}
            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                    onVolumeChange={handleVolumeChange}
                    className="hidden"
                />
            )}
        </AudioPlayerContext.Provider>
    );
}

export function useAudioPlayer() {
    const context = useContext(AudioPlayerContext);
    if (context === undefined) {
        throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
    }
    return context;
}
