"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Tag } from '@/app/types/media';

interface MediaContextType {
    // Tag management
    selectedTag: string | null;
    setSelectedTag: (tag: string | null) => void;
    hashtagFilters: string[];
    setHashtagFilters: (filters: string[]) => void;
    addHashtagFilter: (tag: string) => void;
    removeHashtagFilter: (tag: string) => void;
    clearHashtagFilters: () => void;

    // Media selection
    selectedFile: any | null;
    setSelectedFile: (file: any | null) => void;
    selectedFiles: Set<string>;
    setSelectedFiles: (files: Set<string>) => void;

    // Indexing state
    indexingLimit: number;
    setIndexingLimit: (limit: number) => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export function MediaProvider({ children }: { children: ReactNode }) {
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [hashtagFilters, setHashtagFilters] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<any | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [indexingLimit, setIndexingLimit] = useState<number>(10);

    const addHashtagFilter = (tag: string) => {
        if (tag.trim() && !hashtagFilters.includes(tag.trim())) {
            setHashtagFilters(prev => [...prev, tag.trim()]);
        }
    };

    const removeHashtagFilter = (tag: string) => {
        setHashtagFilters(prev => prev.filter(t => t !== tag));
    };

    const clearHashtagFilters = () => {
        setHashtagFilters([]);
    };

    const contextValue: MediaContextType = {
        selectedTag,
        setSelectedTag,
        hashtagFilters,
        setHashtagFilters,
        addHashtagFilter,
        removeHashtagFilter,
        clearHashtagFilters,
        selectedFile,
        setSelectedFile,
        selectedFiles,
        setSelectedFiles,
        indexingLimit,
        setIndexingLimit,
    };

    return (
        <MediaContext.Provider value={contextValue}>
            {children}
        </MediaContext.Provider>
    );
}

export function useMedia() {
    const context = useContext(MediaContext);
    if (context === undefined) {
        throw new Error('useMedia must be used within a MediaProvider');
    }
    return context;
}
