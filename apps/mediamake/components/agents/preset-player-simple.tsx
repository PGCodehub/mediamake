"use client";

import { calculateCompositionLayoutMetadata, InputCompositionProps } from "@microfox/remotion";
import { Player } from "@microfox/remotion";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSimplePresetContext } from "./preset-provider-simple";

export function SimplePresetPlayer() {
    const { generatedOutput, isGenerating } = useSimplePresetContext();
    const [calculatedMetadata, setCalculatedMetadata] = useState<Awaited<ReturnType<typeof calculateCompositionLayoutMetadata>> | null>(null);

    // Calculate metadata when generated output changes
    useEffect(() => {
        const calculateMetadata = async () => {
            if (!generatedOutput) return;
            if (!generatedOutput.childrenData) return;
            if (generatedOutput.childrenData.length === 0) return;

            try {
                const metadata = await calculateCompositionLayoutMetadata({
                    defaultProps: {},
                    props: generatedOutput,
                    abortSignal: new AbortController().signal,
                    compositionId: 'DataMotion',
                    isRendering: false,
                });
                console.log("Generated metadata", metadata);
                setCalculatedMetadata(metadata);
            } catch (error) {
                console.error("Error calculating metadata:", error);
            }
        };
        calculateMetadata();
    }, [generatedOutput]);

    const player: React.CSSProperties = {
        backgroundColor: "#00000030",
        maxHeight: "80vh",
        position: "relative",
        borderRadius: "24px",
        overflow: "hidden",
    };

    if (isGenerating) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Generating preview...</p>
                </div>
            </div>
        );
    }

    if (!calculatedMetadata) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Calculating metadata...</p>
                </div>
            </div>
        );
    }

    const aspectRatio = calculatedMetadata.width ?? 1920 / (calculatedMetadata.height ?? 1080);

    return (
        <div className="relative flex flex-row items-stretch w-full h-full flex items-center justify-center">
            <Player
                inputProps={calculatedMetadata.props}
                durationInFrames={calculatedMetadata?.durationInFrames && calculatedMetadata?.durationInFrames > 0 ? calculatedMetadata?.durationInFrames : 20}
                fps={calculatedMetadata?.fps ?? 30}
                compositionHeight={calculatedMetadata?.height ?? 1920}
                compositionWidth={calculatedMetadata?.width ?? 1920}
                style={{
                    ...player,
                    height: "400px",
                    width: `400px`
                }}
                className=""
                controls
                loop
            />
        </div>
    );
}
