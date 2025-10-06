import React, { useMemo } from 'react';
import { spring } from 'remotion';
import { BaseRenderableProps } from '../../core/types/renderable.types';
import { UniversalEffectData, useUniversalAnimation, UniversalEffectContext } from './UniversalEffect';

// Stretch effect data interface
export interface StretchEffectData extends UniversalEffectData {
    stretchFrom?: number; // Initial horizontal scale (e.g., 0.8 for 80%)
    stretchTo?: number;   // Final horizontal scale (e.g., 1.0 for 100%)
    springConfig?: {
        stiffness?: number;
        damping?: number;
        mass?: number;
    };
}

// Stretch Effect Component
export const StretchEffect: React.FC<BaseRenderableProps> = ({
    id,
    componentId,
    type,
    data,
    children,
    context
}) => {
    // 1. Use the core animation hook to get all the animation parameters
    const { fps, frame, mode, targetIds, effectData, start, duration } = useUniversalAnimation(data, context);
    const { stretchFrom = 0.8, stretchTo = 1, springConfig } = effectData as StretchEffectData;

    // 2. Use Remotion's spring function to create a natural, bouncy animation
    const springProgress = spring({
        fps,
        frame: frame - start,
        config: {
            stiffness: 100,
            damping: 10,
            mass: 1,
            ...springConfig,
        },
        durationInFrames: duration,
    });

    // 3. Implement the custom animation logic
    const animatedStyles = useMemo(() => {
        // Interpolate the horizontal scale based on the spring's progress
        const scaleX = springProgress * (stretchTo - stretchFrom) + stretchFrom;
        // Add a subtle vertical squish for a more dynamic feel
        const scaleY = 1 + (1 - scaleX) * 0.1;

        return {
            transform: `scaleX(${scaleX}) scaleY(${scaleY})`,
            transformOrigin: 'center',
        };
    }, [springProgress, stretchFrom, stretchTo]);

    // 4. Handle the provider/wrapper logic
    const contextValue = useMemo(() => ({
        animatedStyles,
        targetIds,
        effectType: 'stretch',
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
    displayName: 'stretch',
    description: 'Stretches a component with a spring motion, ideal for subtitles.',
    isInnerSequence: false,
    props: {
        stretchFrom: {
            type: 'number',
            default: 0.8,
            description: 'The initial horizontal scale of the component.'
        },
        stretchTo: {
            type: 'number',
            default: 1.0,
            description: 'The final horizontal scale of the component.'
        },
    },
};
