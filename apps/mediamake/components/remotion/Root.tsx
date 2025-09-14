
import { Ripple } from './Ripple';
import { Waveform } from './Waveform';
import { DataMotion } from './DataMotion';



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
            <Waveform />
        </>
    )
}