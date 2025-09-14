"use client"

import { Player } from "@remotion/player"
import { RenderButton } from "../render-button"
import { calculateCompositionLayoutMetadata, CompositionLayout, InputCompositionProps, RenderableComponentData } from "@microfox/remotion";
import { AudioScene } from "../remotion/Waveform";
import { useEffect, useState } from "react";
import { CalculateMetadataFunction } from "remotion";

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
            width: 1080,
            height: 1920,
            fitDurationTo: 'Audio-xyz',
        },
        style: { backgroundColor: "black", }
    });
    const [calculatedMetadata, setCalculatedMetadata] = useState<Awaited<ReturnType<typeof calculateCompositionLayoutMetadata>> | null>(null);

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

    if (!calculatedMetadata) {
        return <div>Loading...</div>;
    }

    return (
        <div className="relative flex flex-row justify-center items-stretch w-full h-full gap-10">
            <div className="w-1/3 h-full bg-white rounded-lg border border-neutral-200 ml-10 overflow-hidden">
                <div className="rounded-lg ">
                    <h1 className="p-4 text-xl font-bold">Input Properties</h1>
                    <pre className="text-xs h-[80vh] overflow-y-auto bg-neutral-100 rounded-lg p-4">
                        {JSON.stringify(inputProps, null, 2)}
                    </pre>
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
            <div className="absolute top-4 right-4">
                <RenderButton />
            </div>
        </div>
    )
}