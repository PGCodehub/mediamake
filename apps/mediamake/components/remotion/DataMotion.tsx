'use client';
import { Composition } from "@microfox/remotion";


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