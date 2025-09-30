import React from 'react';
import { AbsoluteFill, Composition as RemotionComposition, useVideoConfig, useCurrentFrame, CalculateMetadataFunction } from 'remotion';
import { BaseRenderableData, RenderableComponentData } from '../core/types';
import { ComponentRenderer } from './base/ComponentRenderer';
import { CompositionProvider } from '../core/context/CompositionContext';
import { Input, ALL_FORMATS, UrlSource, BlobSource, FilePathSource } from 'mediabunny';
import { calculateDuration, findMatchingComponents, setDurationsInContext } from '../core/context/timing';
import { parseMedia } from '@remotion/media-parser';
import { nodeReader } from '@remotion/media-parser/node';
import z from 'zod';


interface CompositionProps extends BaseRenderableData {
    id: string;
    style?: React.CSSProperties;
    config: {
        width: number;
        height: number;
        fps: number;
        duration: number;
        fitDurationTo?: string | string[];
    }
}


export type InputCompositionProps = {
    childrenData?: RenderableComponentData[],
    style?: React.CSSProperties,
    config?: {
        width?: number;
        height?: number;
        fps?: number;
        duration?: number;
        fitDurationTo?: string;
    }
}


export const CompositionLayout = ({ childrenData, style, config }: InputCompositionProps) => {

    return (
        <CompositionProvider
            value={{
                root: childrenData,
                duration: config.duration,
            }}
        >
            <AbsoluteFill style={style}>
                {childrenData?.map((component) => (
                    <ComponentRenderer
                        key={component.id}
                        {...component}
                    />
                ))}
            </AbsoluteFill>
        </CompositionProvider>
    );
};

export const calculateCompositionLayoutMetadata: CalculateMetadataFunction<InputCompositionProps> = async ({ props, defaultProps, abortSignal, isRendering }) => {

    const updatedProps = await setDurationsInContext(props);
    let calculatedDuration: number | undefined = undefined;

    if (props.config?.fitDurationTo?.length > 0) {
        calculatedDuration = await calculateDuration(updatedProps.childrenData, {
            fitDurationTo: updatedProps.config.fitDurationTo,
        });
    }

    const duration = calculatedDuration ?? props.config.duration ?? defaultProps.config.duration;
    const fps = props.config.fps ?? defaultProps.config.fps;
    const durationInFrames = Math.round(duration * fps);

    console.log('durationInFrames', durationInFrames, updatedProps);


    return {
        // Change the metadata
        durationInFrames: durationInFrames,
        // or transform some props
        props: updatedProps,
        //   // or add per-composition default codec
        //   defaultCodec: 'h264',
        //   // or add per-composition default video image format
        //   defaultVideoImageFormat: 'png',
        //   // or add per-composition default pixel format
        //   defaultPixelFormat: 'yuv420p',
        width: props.config?.width || defaultProps.config.width,
        height: props.config?.height || defaultProps.config.height,
        fps,
        duration,
    };
};

export const Composition = ({
    id,
    childrenData,
    config,
    style
}: CompositionProps) => {



    return <RemotionComposition
        id={id}
        component={CompositionLayout}
        durationInFrames={Math.round(config.duration * config.fps)}
        fps={config.fps}
        defaultProps={{ childrenData, style, config: config }}
        calculateMetadata={calculateCompositionLayoutMetadata}
        schema={z.object({}).loose()}
    />
}
