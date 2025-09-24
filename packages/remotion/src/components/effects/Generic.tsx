import React, { useMemo, createContext, useContext, ReactNode } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import { BaseRenderableProps } from '../../core/types/renderable.types';
import { z } from 'zod';

// Animation range type for keyframe animations
export interface AnimationRange {
    key: string; // CSS property key (e.g., 'transform', 'opacity', 'scale')
    val: any; // Value for this keyframe
    prog: number; // Progress (0-1) when this keyframe should be active
}

// Generic effect data interface
export interface GenericEffectData {
    start?: number; // Start frame
    duration?: number; // Duration in frames
    type?: 'spring' | 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
    ranges?: AnimationRange[]; // Animation keyframes
    targetIds?: string[]; // IDs of child components to target (for provider mode)
    mode?: 'wrapper' | 'provider'; // How the effect is applied
}

// Context for provider mode
interface GenericEffectContextType {
    animatedStyles: React.CSSProperties;
    targetIds: string[];
}

const GenericEffectContext = createContext<GenericEffectContextType | null>(null);

// Hook to use the generic effect context
export const useGenericEffect = () => {
    const context = useContext(GenericEffectContext);
    if (!context) {
        throw new Error('useGenericEffect must be used within a GenericEffectProvider');
    }
    return context;
};

// Optional hook that returns null if no provider is found
export const useGenericEffectOptional = () => {
    return useContext(GenericEffectContext);
};

// Hook to check if a generic effect provider exists
export const useHasGenericEffectProvider = (): boolean => {
    const context = useContext(GenericEffectContext);
    return context !== null;
};

// Parse duration from seconds to frames
const parseDuration = (duration: number | string | undefined, contextDuration: number, fps: number): number => {
    if (!duration) return contextDuration;

    if (typeof duration === 'number') {
        return duration * fps;
    }

    if (typeof duration === 'string' && duration.endsWith('%')) {
        const percentage = parseFloat(duration.replace('%', '')) / 100;
        return Math.floor(contextDuration * percentage);
    }

    return contextDuration;
};

// Parse delay from seconds to frames
const parseDelay = (delay: number | string | undefined, contextDuration: number, fps: number): number => {
    if (!delay) return 0;

    if (typeof delay === 'number') {
        return delay * fps;
    }

    if (typeof delay === 'string' && delay.endsWith('%')) {
        const percentage = parseFloat(delay) / 100;
        return Math.floor(contextDuration * percentage);
    }

    return 0;
};

// Easing function mapper
const getEasingFunction = (type: string) => {
    switch (type) {
        case 'linear':
            return Easing.linear;
        case 'ease-in':
            return Easing.in(Easing.ease);
        case 'ease-out':
            return Easing.out(Easing.ease);
        case 'ease-in-out':
            return Easing.inOut(Easing.ease);
        default:
            return Easing.linear;
    }
};

// Calculate animated value based on ranges and progress
const calculateAnimatedValue = (
    ranges: AnimationRange[],
    progress: number,
    key: string
): any => {
    // Sort ranges by progress
    const sortedRanges = [...ranges].sort((a, b) => a.prog - b.prog);

    // Handle edge cases
    if (sortedRanges.length === 0) return 0;
    if (sortedRanges.length === 1) return sortedRanges[0].val;

    // If progress is before first range
    if (progress <= sortedRanges[0].prog) {
        return sortedRanges[0].val;
    }

    // If progress is after last range
    if (progress >= sortedRanges[sortedRanges.length - 1].prog) {
        return sortedRanges[sortedRanges.length - 1].val;
    }

    // Find the current range or interpolate between ranges
    for (let i = 0; i < sortedRanges.length - 1; i++) {
        const currentRange = sortedRanges[i];
        const nextRange = sortedRanges[i + 1];

        if (progress >= currentRange.prog && progress <= nextRange.prog) {
            // Interpolate between current and next range
            const localProgress = (progress - currentRange.prog) / (nextRange.prog - currentRange.prog);
            const currentValue = currentRange.val;
            const nextValue = nextRange.val;

            // Handle different value types
            if (typeof currentValue === 'number' && typeof nextValue === 'number') {
                return interpolate(localProgress, [0, 1], [currentValue, nextValue]);
            } else if (typeof currentValue === 'string' && typeof nextValue === 'string') {
                // For string values, we'll need more sophisticated interpolation
                // For now, return the current value
                return currentValue;
            }

            return currentValue; // Fallback
        }
    }

    // Fallback - should not reach here
    return sortedRanges[0]?.val || 0;
};

// Convert animation ranges to CSS properties
const rangesToCSSProperties = (ranges: AnimationRange[], progress: number): React.CSSProperties => {
    const styles: React.CSSProperties = {};

    // Group ranges by key
    const rangesByKey = ranges.reduce((acc, range) => {
        if (!acc[range.key]) {
            acc[range.key] = [];
        }
        acc[range.key].push(range);
        return acc;
    }, {} as Record<string, AnimationRange[]>);

    // Calculate values for each key
    Object.entries(rangesByKey).forEach(([key, keyRanges]) => {
        const value = calculateAnimatedValue(keyRanges, progress, key);

        // Debug logging for opacity
        if (key === 'opacity') {
            console.log(`Opacity animation - Progress: ${progress}, Value: ${value}, Ranges:`, keyRanges);
        }

        // Map common animation keys to CSS properties
        switch (key) {
            case 'scale':
                styles.transform = `scale(${value})`;
                break;
            case 'rotate':
                styles.transform = `${styles.transform || ''} rotate(${value}deg)`.trim();
                break;
            case 'translateX':
                styles.transform = `${styles.transform || ''} translateX(${value}px)`.trim();
                break;
            case 'translateY':
                styles.transform = `${styles.transform || ''} translateY(${value}px)`.trim();
                break;
            case 'opacity':
                styles.opacity = value;
                break;
            case 'blur':
                styles.filter = `blur(${value}px)`;
                break;
            case 'brightness':
                styles.filter = `${styles.filter || ''} brightness(${value})`.trim();
                break;
            case 'contrast':
                styles.filter = `${styles.filter || ''} contrast(${value})`.trim();
                break;
            default:
                // For custom CSS properties, set them directly
                (styles as any)[key] = value;
        }
    });

    return styles;
};

// Generic Effect Component
export const GenericEffect: React.FC<BaseRenderableProps> = ({
    data,
    children,
    context
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const effectData = data as GenericEffectData;

    const { timing } = context ?? {};
    const contextDuration = timing?.durationInFrames || 50;

    // Parse effect parameters (convert seconds to frames)
    const start = parseDelay(effectData?.start, contextDuration, fps);
    const duration = parseDuration(effectData?.duration, contextDuration, fps);
    const type = effectData?.type || 'linear';
    const ranges = effectData?.ranges || [];
    const targetIds = effectData?.targetIds || [];
    const mode = effectData?.mode || 'wrapper';

    // Calculate animation progress
    const progress = useMemo(() => {
        if (type === 'spring') {
            return spring({
                frame,
                fps,
                config: {
                    stiffness: 100,
                    damping: 10,
                    mass: 1,
                },
                durationInFrames: duration,
                delay: start,
            });
        } else {
            const animationFrame = frame - start;
            const easing = getEasingFunction(type);

            return interpolate(
                animationFrame,
                [0, duration],
                [0, 1],
                {
                    easing,
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                }
            );
        }
    }, [frame, fps, start, duration, type]);

    // Calculate animated styles
    const animatedStyles: React.CSSProperties = useMemo(() => {
        if (ranges.length === 0) return {};
        return rangesToCSSProperties(ranges, progress);
    }, [ranges, progress, frame]);

    // Provider mode: Create context for child components
    if (mode === 'provider') {
        const contextValue: GenericEffectContextType = {
            animatedStyles,
            targetIds,
        };

        return (
            <GenericEffectContext.Provider value={contextValue}>
                {children}
            </GenericEffectContext.Provider>
        );
    }

    // Wrapper mode: Apply styles directly to wrapper div
    return (
        <div style={animatedStyles}>
            {children}
        </div>
    );
};

// Provider component for standalone use
export const GenericEffectProvider: React.FC<{
    children: ReactNode;
    data: GenericEffectData;
    id?: string;
    componentId?: string;
    type?: string;
}> = ({ children, data, id = 'generic-effect', componentId = 'generic-effect', type = 'effect' }) => {
    return (
        <GenericEffect
            id={id}
            componentId={componentId}
            type={type as any}
            data={data}
            context={undefined}
        >
            {children}
        </GenericEffect>
    );
};

// Hook for child components to get their animated styles
export const useAnimatedStyles = (componentId: string): React.CSSProperties => {
    const context = useGenericEffectOptional();

    // If no provider context exists, return empty styles
    if (!context) {
        return {};
    }

    const { animatedStyles, targetIds } = context;

    // If this component is targeted, return the animated styles
    if (targetIds.includes(componentId)) {
        return animatedStyles;
    }

    return {};
};


export const config = {
    displayName: 'generic',
    description: 'Generic effect',
    isInnerSequence: false,
    props: {
    },
};