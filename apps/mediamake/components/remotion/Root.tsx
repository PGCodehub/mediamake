
import { DataMotion, ExampleDataMotion } from './DataMotion';
import { Ripple } from './Ripple';



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
        </>
    )
}