import { RenderableComponentData } from "@microfox/datamotion";
import { InputCompositionProps, PanEffectData, TextAtomData, WaveformConfig, WaveformHistogramRangedDataProps, ZoomEffectData } from "@microfox/remotion";
import z from "zod"
import { PresetMetadata } from "../types";
import { cleanFunctionString } from "../preset-helpers";

const presetParams = z.object({
    audio: z.object({
        src: z.string(),
        volume: z.number().optional().describe("0-1"),
    }),
    image: z.object({
        src: z.string(),
        effect: z.enum(["pan-loop", "zoom-loop"]).optional(),
    }),
    middleText: z.object({
        text: z.string(),
        fontSize: z.number().optional().describe("in pixels"),
        marginBottom: z.number().optional().describe("in pixels"),
    }),
    titleText: z.object({
        text: z.string(),
        fontChoice: z.enum(["ProtestRevolution", "StoryScript", "BebasNeue", "Caveat"]).or(z.string()).optional(),
        fontSize: z.number().optional().describe("in pixels"),
        marginBottom: z.number().optional().describe("in pixels"),
    }),
    bottomText: z.object({
        text: z.string(),
        fontChoice: z.enum(["ProtestRevolution", "StoryScript", "BebasNeue", "Caveat"]).or(z.string()).optional(),
        fontSize: z.number().optional().describe("in pixels"),
        marginBottom: z.number().optional().describe("in pixels"),
    }),
    primaryColor: z.string(),
    secondaryColor: z.string(),
    textColor: z.string().optional(),
    waveformType: z.enum(["fixed", "waves"]),

});
//src: https://cdn1.suno.ai/6aded313-9bd5-4c8b-bb6f-fd5f158642e3.m4a
const presetExecution = (params: z.infer<typeof presetParams>): Partial<InputCompositionProps> => {

    const histogramWaves = {
        componentId: "WaveformHistogram",
        type: "atom" as const,
        data: {
            config: {
                audioSrc: params.audio.src,
                numberOfSamples: 32,
                windowInSeconds: 1,
                amplitude: 2,
                width: 1920,
                height: 200,
                dataOffsetInSeconds: - 0.1,
                useFrequencyData: false,
            } as WaveformConfig,
            barColor: '#A41117',
            barSpacing: 8,
            barBorderRadius: 4,
            barWidth: 4,
            multiplier: 1,
            horizontalSymmetry: true,
            verticalMirror: true,
            histogramStyle: 'full-width',
            amplitude: 3.5,
            gradientStartColor: params.primaryColor ?? '#FFF',
            gradientEndColor: params.secondaryColor ?? '#FDCE99',
            gradientDirection: 'vertical',
            gradientStyle: 'mirrored',
            className: 'rounded-lg absolute bottom-0',
            waveDirection: 'right-to-left',
        } as WaveformHistogramRangedDataProps
    }

    const histogramStatic = {
        componentId: "WaveformHistogramRanged",
        type: "atom" as const,
        data: {
            config: {
                audioSrc: params.audio.src,
                numberOfSamples: 64,
                windowInSeconds: 1 / 30,
                amplitude: 1,
                width: 1920,
                height: 300,
                dataOffsetInSeconds: 0,
                useFrequencyData: true,
            } as WaveformConfig,
            barColor: '#A41117',
            barSpacing: 10,
            barBorderRadius: 8,
            barWidth: 4,
            multiplier: 1,
            horizontalSymmetry: false,
            verticalMirror: true,
            histogramStyle: 'full-width',
            amplitude: 0.75,
            gradientStartColor: params.primaryColor ?? '#FFF',
            gradientEndColor: params.secondaryColor ?? '#FDCE99',
            gradientDirection: 'vertical',
            gradientStyle: 'mirrored',
            className: 'rounded-lg absolute bottom-0',
            waveDirection: 'right-to-left',
        } as WaveformHistogramRangedDataProps
    }

    const imageEffect = params.image.effect === "pan-loop" ? {
        componentId: "pan",
        id: "pan-xyz",
        data: {
            panDirection: "up",
            panDistance: 400,
            loopTimes: 3,
        } as PanEffectData
    } : {
        componentId: "zoom",
        id: "zoom-xyz",
        data: {
            zoomDirection: "in",
            zoomDepth: 1.25,
            loopTimes: 3,
        } as ZoomEffectData
    };

    return {
        childrenData: [{
            id: "AudioScene",
            componentId: "BaseLayout",
            type: "layout",
            data: {
                containerProps: {
                    className: 'flex items-center justify-center bg-black',
                },
                childrenProps: [
                    {
                        className: '',
                    },
                    {
                        className: 'inset-0 absolute',
                    },
                    {
                        className: 'absolute -bottom-1',
                        style: {
                            background: `linear-gradient(to bottom, transparent 0%,  #000000 100%)`,
                        },
                    },
                    {
                        className: `absolute bottom-0`
                    },
                    {
                        className: 'absolute bottom-0',
                    },
                    {
                        className: 'absolute top-10 bottom-0 flex items-center justify-center'
                    },
                ]
            },
            context: {
                timing: { start: 0, duration: 20, fitDurationTo: 'Audio-xyz' },
            },
            childrenData: [
                {
                    id: 'Audio-xyz',
                    componentId: "AudioAtom",
                    type: 'atom',
                    data: {
                        src: params.audio.src,
                        volume: params.audio.volume,
                    }
                },
                {
                    id: 'Image-xyz',
                    componentId: "ImageAtom",
                    type: 'atom',
                    effects: [
                        imageEffect,
                    ],
                    data: {
                        className: 'w-full h-auto object-contain',
                        src: params.image.src,
                    }
                },
                {
                    id: 'WaveformLine-xyz',
                    ...(params.waveformType === "fixed" ? histogramStatic : histogramWaves),
                },
                {
                    id: 'text-xyz',
                    componentId: "TextAtom",
                    type: 'atom',
                    data: {
                        text: params.titleText.text,
                        className: `rounded-xl `,
                        style: {
                            fontSize: params.titleText.fontSize ?? 250,
                            color: params.textColor ?? '#FFF',
                            borderRadius: 40,
                            letterSpacing: 10,
                            fontWeight: 100,
                            marginBottom: params.titleText.marginBottom ?? 130,
                        },
                        font: {
                            family: params.titleText.fontChoice ?? 'ProtestRevolution',
                        }
                    } as TextAtomData
                },
                {
                    id: 'text-xyz-boxed',
                    componentId: "TextAtom",
                    type: 'atom',
                    data: {
                        text: params.bottomText.text,
                        className: `bg-black/30 px-12 py-4 rounded-xl backdrop-blur-sm `,
                        style: {
                            fontSize: params.bottomText.fontSize ?? 20,
                            color: "#FFF",
                            textTransform: 'uppercase',
                            letterSpacing: 10,
                            fontWeight: 700,
                            borderRadius: 40,
                            marginBottom: params.bottomText.marginBottom ?? 50,
                        },
                        font: {
                            family: 'Inter',
                            weights: ['100', '400', '700'],
                        }
                    } as TextAtomData
                },
                {
                    id: 'text-xyz-3',
                    componentId: "TextAtom",
                    type: 'atom',
                    data: {
                        text: params.middleText.text,
                        className: ' px-0 py-4 text-center',
                        style: {
                            fontSize: params.middleText.fontSize ?? 25,
                            color: params.textColor ?? '#FFF',
                            textTransform: 'uppercase',
                            letterSpacing: 60,
                            fontWeight: 700,
                            borderRadius: 40,
                            marginLeft: 80,
                            marginBottom: params.middleText.marginBottom ?? 0,
                        },
                        font: {
                            family: 'Inter',
                            weights: ['100', '400', '700'],
                        }
                    } as TextAtomData
                }
            ],
        }],
        config: {
            fitDurationTo: 'Audio-xyz',
        }
    }
};

const waveformPresetMetadata: PresetMetadata = {
    id: 'waveform-audio-scene',
    title: 'Waveform Audio Scene',
    description:
        'A dynamic audio visualization with waveform, image effects, and customizable text overlays',
    type: 'predefined',
    presetType: 'full',
    tags: ['audio', 'waveform', 'visualization', 'text'],
    defaultInputParams: {
        audio: {
            src: 'https://cdn1.suno.ai/6aded313-9bd5-4c8b-bb6f-fd5f158642e3.m4a',
            volume: 1.5,
        },
        image: {
            src: 'https://cdn.midjourney.com/cffd1fdb-3a43-47f7-b7d3-c0e795094d78/0_1.png',
        },
        middleText: {
            text: 'small middle text',
            fontSize: 25,
        },
        titleText: {
            text: 'Revolution',
            fontSize: 250,
            offset: 'mb-[130px]',
            fontChoice: 'ProtestRevolution',
        },
        bottomText: {
            text: 'bottom text',
            fontSize: 20,
            offset: 'mb-[50px]',
        },
        primaryColor: '#FFF',
        secondaryColor: '#FDCE99',
        textColor: '#FFF',
        waveformType: 'waves',
    },
}

const waveformPresetFunction = cleanFunctionString(presetExecution);
const waveformPresetParams = z.toJSONSchema(presetParams);

const waveformPreset = {
    metadata: waveformPresetMetadata,
    presetFunction: waveformPresetFunction,
    presetParams: waveformPresetParams,
}

export { waveformPresetFunction, waveformPresetParams, waveformPresetMetadata, waveformPreset }