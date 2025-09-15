"use client"

import { calculateCompositionLayoutMetadata, CompositionLayout, InputCompositionProps, RenderableComponentData } from "@microfox/remotion";
import { Player } from "@remotion/player";
import { Loader2, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { AudioScene } from "../remotion/Waveform";
import { RenderButton } from "./render-button";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const container: React.CSSProperties = {
    margin: "auto",
    marginBottom: 20,
    width: "100%",
};

const outer: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    maxHeight: "80vh",
    maxWidth: "70vw",
};

const player: React.CSSProperties = {
    backgroundColor: "#00000030",
    maxHeight: "80vh",
    position: "relative",
};

export const MediaMakePlayer: React.FC = () => {

    const [inputProps, setInputProps] = useState<InputCompositionProps>({
        childrenData: [AudioScene] as RenderableComponentData[],
        config: {
            duration: 400,
            fps: 30,
            width: 1920,
            height: 1080,
            fitDurationTo: 'Audio-xyz',
        },
        style: { backgroundColor: "black", }
    });
    const [calculatedMetadata, setCalculatedMetadata] = useState<Awaited<ReturnType<typeof calculateCompositionLayoutMetadata>> | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const calculateMetadata = async () => {
            const metadata = await calculateCompositionLayoutMetadata({
                defaultProps: {},
                props: inputProps,
                abortSignal: new AbortController().signal,
                compositionId: 'DataMotion',
                isRendering: false,
            });
            setCalculatedMetadata(metadata);
        };
        calculateMetadata();
    }, [inputProps]);

    const copyProps = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(inputProps, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy props:', err);
        }
    };

    if (!calculatedMetadata) {
        return <div className="flex justify-center items-center w-full h-full">
            <Loader2 className="w-full h-6 animate-spin" />
        </div>;
    }

    return (
        <div className="relative flex flex-row justify-center items-stretch w-full h-full gap-10">
            <div className="min-w-1/3 h-full bg-white rounded-lg border border-neutral-200 ml-10 overflow-hidden relative">
                <div className="rounded-lg ">
                    <h1 className="p-4 text-xl font-bold">Input Properties</h1>
                    <div className="relative">
                        <pre className="text-xs h-[80vh] overflow-y-auto bg-neutral-100 rounded-lg p-4">
                            {JSON.stringify(inputProps, null, 2)}
                        </pre>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={copyProps}
                                    variant="outline"
                                    size="sm"
                                    className="absolute top-2 right-2"
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
                                <p>Copy props to clipboard</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
            <Player
                component={CompositionLayout}
                inputProps={inputProps}
                durationInFrames={calculatedMetadata?.durationInFrames ?? 20}
                fps={calculatedMetadata?.fps ?? 30}
                compositionHeight={calculatedMetadata?.height ?? 1920}
                compositionWidth={calculatedMetadata?.width ?? 1920}
                style={player}
                className="w-fit h-full"
                controls
                loop
            />
            {process.env.NODE_ENV === "development" && (
                <div className="absolute top-4 right-4">
                    <RenderButton />
                </div>
            )}
        </div>
    )
}