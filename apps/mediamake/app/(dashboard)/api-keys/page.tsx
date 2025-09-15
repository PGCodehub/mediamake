"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { ApiKeysSidebar } from "@/components/editor/api-keys-sidebar";
import { ApiKeysContent } from "@/components/editor/api-keys-content";
import { useState } from "react";

export default function ApiKeysPage() {
    const [selectedApiKey, setSelectedApiKey] = useState<string | null>(null);

    if (process.env.NODE_ENV != "development") {
        return <div>API Key Management are only available in development mode</div>;
    }

    return (
        <SidebarInset>
            <SiteHeader title="API Keys Management" />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <div className="flex h-[calc(100vh-8rem)]">
                            <ApiKeysSidebar
                                selectedApiKey={selectedApiKey}
                                onSelectApiKey={setSelectedApiKey}
                            />
                            <ApiKeysContent selectedApiKey={selectedApiKey} />
                        </div>
                    </div>
                </div>
            </div>
        </SidebarInset>
    );
}
