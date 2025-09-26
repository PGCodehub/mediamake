"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { HistorySidebar } from "@/components/editor/history/history-sidebar";
import { HistoryContent } from "@/components/editor/history/history-content";
import { useState } from "react";
import { RenderRequest } from "@/lib/render-history";

export default function HistoryPage() {
    const [selectedRender, setSelectedRender] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<RenderRequest | null>(null);

    return (
        <SidebarInset>
            <SiteHeader title="Render History" />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <div className="flex h-[calc(100vh-8rem)]">
                            <HistorySidebar
                                selectedRender={selectedRender}
                                onSelectRender={(renderId, renderRequest) => {
                                    setSelectedRender(renderId);
                                    setSelectedRequest(renderRequest || null);
                                }}
                                onRefreshApiRequest={(renderId, updatedRequest) => {
                                    if (selectedRender === renderId) {
                                        setSelectedRequest(updatedRequest);
                                    }
                                }}
                            />
                            <HistoryContent
                                selectedRender={selectedRender}
                                selectedRequest={selectedRequest}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </SidebarInset>
    );
}
