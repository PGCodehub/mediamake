"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { HistorySidebar } from "@/components/editor/history-sidebar";
import { HistoryContent } from "@/components/editor/history-content";
import { useState } from "react";

export default function HistoryPage() {
    const [selectedRender, setSelectedRender] = useState<string | null>(null);

    return (

        <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <div className="flex h-[calc(100vh-8rem)]">
                            <HistorySidebar
                                selectedRender={selectedRender}
                                onSelectRender={setSelectedRender}
                            />
                            <HistoryContent selectedRender={selectedRender} />
                        </div>
                    </div>
                </div>
            </div>
        </SidebarInset>
    );
}
