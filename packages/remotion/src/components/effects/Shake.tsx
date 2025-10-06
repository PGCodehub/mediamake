import React, { useMemo } from 'react';
import { BaseRenderableProps } from '../../core/types/renderable.types';
import { UniversalEffectData, useUniversalAnimation, UniversalEffectContext } from './UniversalEffect';

// Shake effect data interface
export interface ShakeEffectData extends UniversalEffectData {
    amplitude?: number; // Shake intensity (default: 10)
    frequency?: number; // Shake frequency (default: 0.1)
    decay?: boolean; // Whether shake should decay over time (default: true)
    axis?: 'x' | 'y' | 'both'; // Which axis to shake (default: 'both')
}

// Shake Effect Component using the new hook for maximum flexibility
export const ShakeEffect: React.FC<BaseRenderableProps> = ({
    id,
    componentId,
    type,
    data,
    children,
    context
}) => {
    // 1. Use the core animation hook to get progress, frame, etc.
    const { progress, frame, mode, targetIds, effectData } = useUniversalAnimation(data, context);
    const { amplitude = 10, frequency = 0.1, decay = true, axis = 'both' } = effectData as ShakeEffectData;

    // 2. Implement custom animation logic directly in the component
    const animatedStyles = useMemo(() => {
        if (progress <= 0 || progress >= 1) {
            return {};
        }
        const decayFactor = decay ? (1 - progress) : 1;
        const currentAmplitude = amplitude * decayFactor;
        const time = frame * frequency;
        const shakeX = axis === 'x' || axis === 'both' ? Math.sin(time) * currentAmplitude : 0;
        const shakeY = axis === 'y' || axis === 'both' ? Math.cos(time * 1.3) * currentAmplitude : 0;

        const styles: React.CSSProperties = {};
        if (axis === 'x' || axis === 'both') {
            styles.transform = `translateX(${shakeX}px)`;
        }
        if (axis === 'y' || axis === 'both') {
            styles.transform = `${styles.transform || ''} translateY(${shakeY}px)`.trim();
        }
        return styles;
    }, [progress, frame, amplitude, frequency, decay, axis]);

    // 3. Handle provider/wrapper logic
    const contextValue = useMemo(() => ({
        animatedStyles,
        targetIds,
        effectType: 'shake',
    }), [animatedStyles, targetIds]);

    if (mode === 'provider') {
        return (
            <UniversalEffectContext.Provider value={contextValue}>
                {children}
            </UniversalEffectContext.Provider>
        );
    }

    return (
        <div {...effectData.props} style={animatedStyles}>
            {children}
        </div>
    );
};

export const config = {
    displayName: 'shake',
    description: 'Shake effect with configurable amplitude, frequency, and decay',
    isInnerSequence: false,
    props: {
        amplitude: {
            type: 'number',
            default: 10,
            description: 'Shake intensity in pixels'
        },
        frequency: {
            type: 'number',
            default: 0.1,
            description: 'Shake frequency (higher = faster shake)'
        },
        decay: {
            type: 'boolean',
            default: true,
            description: 'Whether shake should decay over time'
        },
        axis: {
            type: 'enum',
            values: ['x', 'y', 'both'],
            default: 'both',
            description: 'Which axis to shake'
        }
    },
};
