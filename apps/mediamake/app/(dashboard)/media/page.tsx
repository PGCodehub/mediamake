"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { MediaPicker } from "@/components/editor/media/media-picker";
import { useState } from "react";
import { MediaFile, Tag } from "@/app/types/media";

export default function MediaPage() {
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
    const [tagToAddToHashtags, setTagToAddToHashtags] = useState<string | null | "CLEAR_ALL">(null);
    const [hashtagFilters, setHashtagFilters] = useState<string[]>([]);

    const handleTagSelection = (tagId: string | null) => {
        // Only allow single tag selection - clear previous selection when new tag is selected
        if (tagId) {
            // Replace all hashtag filters with this single tag
            setTagToAddToHashtags(tagId);
            setSelectedTag(tagId); // Set the selected tag to show it as selected in sidebar
            setHashtagFilters([tagId]); // Reset hashtag filters to just this tag
        } else {
            // "All Files" selected - clear all filters
            setTagToAddToHashtags("CLEAR_ALL");
            setSelectedTag(null);
            setHashtagFilters([]); // Clear all hashtag filters
        }
        setSelectedFile(null); // Clear selected file when changing tags
    };

    const handleHashtagFiltersChange = (filters: string[]) => {
        setHashtagFilters(filters);
    };

    return (
        <SidebarInset>
            <SiteHeader title="Media Library" />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 md:gap-6 ">
                        <div className="flex h-[calc(100vh-8rem)]">
                            <MediaPicker
                                pickerMode={false}
                                selectedTag={selectedTag}
                                selectedFile={selectedFile}
                                onSelectFile={(file) => setSelectedFile(file)}
                                tagToAddToHashtags={tagToAddToHashtags}
                                onTagAddedToHashtags={() => setTagToAddToHashtags(null)}
                                hashtagFilters={hashtagFilters}
                                onHashtagFiltersChange={handleHashtagFiltersChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </SidebarInset>
    );
}
