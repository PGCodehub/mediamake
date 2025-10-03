
import { Ripple } from './Ripple';
import { Waveform } from './Waveform';
import { DataMotion, ExampleDataMotion } from './DataMotion';
import { Composition } from '@microfox/remotion';



export const Root: React.FC = () => {
    // if (process.env.NODE_ENV === 'development') {
    //     return (
    //         <>
    //             <Ripple />
    //             <Waveform />
    //             <DataMotion />
    //         </>
    //     )
    // }
    return (
        <>
            <Ripple />
            <DataMotion />
            <ExampleDataMotion />
            <Waveform />
        </>
    )
}