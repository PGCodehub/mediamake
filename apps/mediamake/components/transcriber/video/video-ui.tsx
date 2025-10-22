"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, AlertCircle } from "lucide-react";
import { useTranscriber } from "../contexts/transcriber-context";
import { HeyGenUI } from "./heygen-ui";

export function VideoUI() {
  const { transcriptionData } = useTranscriber();
  const [activeProvider, setActiveProvider] = useState<'heygen' | 'd-id' | 'synthesia'>('heygen');

  // Show empty state if no transcription is selected
  if (!transcriptionData) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            <h1 className="text-xl font-bold">Video Generation</h1>
          </div>
        </div>
        <div className="flex-1 p-4">
          <Card>
            <CardContent className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Transcription Selected</h3>
                <p className="text-muted-foreground">
                  Select a transcription to generate videos with AI avatars.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          <h1 className="text-xl font-bold">Video Generation</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Generate AI avatar videos using your transcription audio
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeProvider} onValueChange={(value) => setActiveProvider(value as any)} className="w-full">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="heygen">HeyGen</TabsTrigger>
              <TabsTrigger value="d-id" disabled>
                D-ID
                <span className="ml-2 text-xs">(Coming Soon)</span>
              </TabsTrigger>
              <TabsTrigger value="synthesia" disabled>
                Synthesia
                <span className="ml-2 text-xs">(Coming Soon)</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="heygen" className="mt-0">
            <HeyGenUI />
          </TabsContent>

          <TabsContent value="d-id" className="mt-0">
            <div className="p-4">
              <Card>
                <CardContent className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">D-ID Integration Coming Soon</h3>
                    <p className="text-muted-foreground">
                      D-ID video generation will be available in a future update.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="synthesia" className="mt-0">
            <div className="p-4">
              <Card>
                <CardContent className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Synthesia Integration Coming Soon</h3>
                    <p className="text-muted-foreground">
                      Synthesia video generation will be available in a future update.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

