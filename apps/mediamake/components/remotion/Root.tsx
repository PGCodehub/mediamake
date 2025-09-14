
import { Ripple } from './Ripple';
import { Waveform } from './Waveform';



export const Root: React.FC = () => {
    if (process.env.NODE_ENV === 'development') {
        return (
            <>
                <Ripple />
                <Waveform />
            </>
        )
    }
    return (
        <>
            {/* <Composition
            id="Waveform"
            componentId="Waveform"
            type="scene"
            childrenData={[AudioScene as RenderableComponentData]}
            fps={30}
            width={1920}
            height={1080}
            duration={audioMetadata.duration}
            style={{
                backgroundColor: "black",
            }}
        /> */}
        </>
    )
}