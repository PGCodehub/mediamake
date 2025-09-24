'use client';
import { Composition } from "@microfox/remotion";
import TestJson from './test.json';
import TestingLyricalsJson from './testing-lyricals.json';
import { RenderableComponentData } from "@microfox/datamotion";


export const DataMotion: React.FC = () => {
    return (
        <Composition
            id="DataMotion"
            componentId="DataMotion"
            type="scene"
            childrenData={[]}
            config={{
                fps: 30,
                width: 1920,
                height: 1080,
                duration: 20,// 20 seconds
            }}
            style={{
                backgroundColor: "black",
            }}
        />
    );
};

export const ExampleDataMotion: React.FC = () => {
    return (
        <Composition
            id="ExampleDataMotion"
            componentId="DataMotion"
            type="scene"
            childrenData={TestJson.childrenData as RenderableComponentData[]}
            config={TestJson.config}
            style={{
                backgroundColor: "black",
            }}
        />
    );
};