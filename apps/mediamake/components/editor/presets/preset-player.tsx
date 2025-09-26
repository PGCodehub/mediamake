"use client";

import { calculateCompositionLayoutMetadata, CompositionLayout, InputCompositionProps } from "@microfox/remotion";
import { Player } from "@remotion/player";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Check, Loader2, Settings, Code, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { Preset, DatabasePreset, PresetConfiguration, AppliedPreset } from "./types";
import { JsonEditor } from "../player/json-editor";
import { RenderButton } from "../player/render-button";
import { usePresetContext } from "./preset-provider";

interface PresetPlayerProps {
    // No props needed - everything comes from context
}

export function PresetPlayer({ }: PresetPlayerProps) {
    const {
        configuration,
        setConfiguration,
        generatedOutput,
        isGenerating
    } = usePresetContext();
    const [calculatedMetadata, setCalculatedMetadata] = useState<Awaited<ReturnType<typeof calculateCompositionLayoutMetadata>> | null>(null);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'config' | 'output' | 'preview'>('preview');

    // Calculate metadata when generated output changes
    useEffect(() => {
        const calculateMetadata = async () => {
            if (!generatedOutput) return;
            if (!generatedOutput.childrenData) return;
            if (generatedOutput.childrenData.length === 0) return;

            console.log('generatedOutput', generatedOutput);

            const metadata = await calculateCompositionLayoutMetadata({
                defaultProps: {},
                props: generatedOutput,
                abortSignal: new AbortController().signal,
                compositionId: 'DataMotion',
                isRendering: false,
            });
            setCalculatedMetadata(metadata);
        };
        calculateMetadata();
    }, [generatedOutput]);

    const copyOutput = async () => {
        if (!generatedOutput) return;

        try {
            await navigator.clipboard.writeText(JSON.stringify(generatedOutput, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy output:', err);
        }
    };

    const player: React.CSSProperties = {
        backgroundColor: "#00000030",
        maxHeight: "80vh",
        position: "relative",
    };

    return (
        <Tabs className="w-full" value={activeTab} onValueChange={(value) => setActiveTab(value as 'config' | 'output' | 'preview')}>
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="config" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configuration
                </TabsTrigger>
                <TabsTrigger value="output" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Output
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                </TabsTrigger>
            </TabsList>
            <TabsContent value="config" className="h-full mt-0 flex-1">
                <div className="h-full flex flex-col">
                    <div className="p-4 border-b">
                        <h3 className="text-lg font-semibold mb-2">Configuration</h3>
                        <p className="text-sm text-muted-foreground">
                            Edit style and config properties
                        </p>
                    </div>
                    <div className="flex-1 p-4">
                        <JsonEditor
                            value={configuration}
                            onChange={setConfiguration}
                            height="calc(100vh - 300px)"
                            className="h-full"
                        />
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="output" className="h-full mt-0 flex-1">
                <div className="h-full flex flex-col">
                    <div className="p-4 border-b flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Generated Output</h3>
                            <p className="text-sm text-muted-foreground">
                                Final composition data ready for use
                            </p>
                        </div>
                        {generatedOutput && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={copyOutput}
                                        variant="outline"
                                        size="sm"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-3 h-3 text-green-600" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3 h-3" />
                                                Copy
                                            </>
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Copy output to clipboard</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                    <div className="flex-1 p-4">
                        <JsonEditor
                            value={generatedOutput || {}}
                            onChange={() => { }} // Read-only
                            height="calc(100vh - 300px)"
                            className="h-full"
                        />
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="preview" className="h-full mt-0 flex-1">
                <div className="relative flex flex-row items-stretch w-full h-full p-4 flex items-center justify-center">
                    {calculatedMetadata ? (
                        <Player
                            component={CompositionLayout}
                            inputProps={calculatedMetadata.props}
                            durationInFrames={calculatedMetadata?.durationInFrames ?? 20}
                            fps={calculatedMetadata?.fps ?? 30}
                            compositionHeight={calculatedMetadata?.height ?? 1920}
                            compositionWidth={calculatedMetadata?.width ?? 1920}
                            style={player}
                            className="w-fit h-full"
                            controls
                            loop
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                <p className="text-muted-foreground">Generating preview...</p>
                            </div>
                        </div>
                    )}
                </div>
                {process.env.NODE_ENV === "development" && (
                    <div className="absolute bottom-4 right-4">
                        <RenderButton />
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
}