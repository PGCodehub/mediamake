import React, { useMemo } from 'react';
import { BaseRenderableProps } from '../../core/types/renderable.types';
import { UniversalEffectData, useUniversalAnimation, UniversalEffectContext } from './UniversalEffect';

// Blur effect data interface
export interface BlurEffectData extends UniversalEffectData {
    intensity?: number; // Blur intensity (default: 10)
    direction?: 'in' | 'out'; // Blur direction (default: 'in')
}

// Blur Effect Component using the new hook
export const BlurEffect: React.FC<BaseRenderableProps> = ({
    id,
    componentId,
    type,
    data,
    children,
    context
}) => {
    // 1. Use the core animation hook
    const { progress, mode, targetIds, effectData } = useUniversalAnimation(data, context);
    const { intensity = 10, direction = 'in' } = effectData as BlurEffectData;

    // 2. Implement custom animation logic
    const animatedStyles = useMemo(() => {
        if (progress <= 0 || progress >= 1) {
            return {};
        }
        const blurValue = direction === 'in'
            ? intensity * (1 - progress)
            : intensity * progress;
        return { filter: `blur(${blurValue}px)` };
    }, [progress, intensity, direction]);

    // 3. Handle provider/wrapper logic
    const contextValue = useMemo(() => ({
        animatedStyles,
        targetIds,
        effectType: 'blur',
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
    displayName: 'blur',
    description: 'Blur effect with configurable intensity and direction',
    isInnerSequence: false,
    props: {
        intensity: {
            type: 'number',
            default: 10,
            description: 'Blur intensity in pixels'
        },
        direction: {
            type: 'enum',
            values: ['in', 'out'],
            default: 'in',
            description: 'Blur direction (in = start blurred, out = end blurred)'
        }
    },
};