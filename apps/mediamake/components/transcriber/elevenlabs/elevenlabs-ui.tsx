"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic } from "lucide-react";

export function ElevenLabsUI() {
    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    <h1 className="text-xl font-bold">ElevenLabs</h1>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    ElevenLabs integration coming soon
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
                <Card>
                    <CardContent className="flex items-center justify-center h-[400px]">
                        <div className="text-center">
                            <Mic className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">ElevenLabs Integration</h3>
                            <p className="text-muted-foreground">
                                This feature is coming soon. ElevenLabs integration will allow you to generate high-quality voice synthesis from your transcriptions.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
