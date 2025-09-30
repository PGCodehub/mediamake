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
    props?: any; // Additional properties for the effect
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

// Color parsing and interpolation utilities
interface ColorRGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

// Parse hex color to RGBA
const parseHexColor = (hex: string): ColorRGBA => {
    // Remove # if present and normalize
    hex = hex.replace('#', '').toLowerCase();

    // Validate hex characters
    if (!/^[0-9a-f]+$/.test(hex)) {
        return { r: 0, g: 0, b: 0, a: 1 };
    }

    // Handle 3-digit hex
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    // Handle 6-digit hex
    if (hex.length === 6) {
        return {
            r: Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16))),
            g: Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16))),
            b: Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16))),
            a: 1
        };
    }

    // Handle 8-digit hex (with alpha)
    if (hex.length === 8) {
        return {
            r: Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16))),
            g: Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16))),
            b: Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16))),
            a: Math.max(0, Math.min(1, parseInt(hex.substr(6, 2), 16) / 255))
        };
    }

    // Default fallback
    return { r: 0, g: 0, b: 0, a: 1 };
};

// Parse rgba color to RGBA
const parseRgbaColor = (rgba: string): ColorRGBA => {
    // More robust regex that handles both rgb() and rgba() with optional alpha
    const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
    if (match) {
        return {
            r: Math.max(0, Math.min(255, parseInt(match[1], 10))),
            g: Math.max(0, Math.min(255, parseInt(match[2], 10))),
            b: Math.max(0, Math.min(255, parseInt(match[3], 10))),
            a: match[4] ? Math.max(0, Math.min(1, parseFloat(match[4]))) : 1
        };
    }
    return { r: 0, g: 0, b: 0, a: 1 };
};

// Parse any color format to RGBA
const parseColor = (color: string): ColorRGBA => {
    const trimmedColor = color.trim();

    if (trimmedColor.startsWith('#')) {
        return parseHexColor(trimmedColor);
    } else if (trimmedColor.toLowerCase().startsWith('rgb')) {
        return parseRgbaColor(trimmedColor);
    }

    // Default fallback
    return { r: 0, g: 0, b: 0, a: 1 };
};

// Convert RGBA back to CSS color string
const rgbaToString = (color: ColorRGBA): string => {
    if (color.a === 1) {
        return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
    } else {
        return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a})`;
    }
};

// Interpolate between two colors
const interpolateColors = (color1: string, color2: string, progress: number): string => {
    const parsedColor1 = parseColor(color1);
    const parsedColor2 = parseColor(color2);

    const interpolatedColor: ColorRGBA = {
        r: interpolate(progress, [0, 1], [parsedColor1.r, parsedColor2.r]),
        g: interpolate(progress, [0, 1], [parsedColor1.g, parsedColor2.g]),
        b: interpolate(progress, [0, 1], [parsedColor1.b, parsedColor2.b]),
        a: interpolate(progress, [0, 1], [parsedColor1.a, parsedColor2.a])
    };

    return rgbaToString(interpolatedColor);
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
                // Ensure both values are finite and valid before interpolating
                if (isFinite(currentValue) && isFinite(nextValue) && !isNaN(currentValue) && !isNaN(nextValue)) {
                    // For numbers, use simple linear interpolation to avoid double interpolation
                    const interpolatedValue = currentValue + (nextValue - currentValue) * localProgress;
                    // Ensure interpolated value is valid
                    if (isFinite(interpolatedValue) && !isNaN(interpolatedValue)) {
                        return interpolatedValue;
                    }
                }
                // Return current value if interpolation fails
                return currentValue;
            } else if (typeof currentValue === 'string' && typeof nextValue === 'string') {
                // Check if both values are colors (hex or rgba)
                const isColor = (str: string) => {
                    const trimmed = str.trim().toLowerCase();
                    return trimmed.startsWith('#') || trimmed.startsWith('rgb');
                };

                if (isColor(currentValue) && isColor(nextValue)) {
                    // Interpolate colors
                    return interpolateColors(currentValue, nextValue, localProgress);
                }

                // Extract unit and value from both strings
                const getUnitAndValue = (str: string) => {
                    // Check for units in order of specificity (longer units first)
                    const units = ['vmax', 'vmin', 'rem', 'deg', 'bpm', 'vh', 'vw', 'px', 'em', 'ms', 'hz', 'db', 'fr', 's', '%'];

                    for (const unit of units) {
                        if (str.endsWith(unit)) {
                            const value = parseFloat(str.slice(0, -unit.length));
                            return {
                                value: isNaN(value) ? 0 : value,
                                unit: unit
                            };
                        }
                    }

                    // If no unit found, treat as number
                    const value = parseFloat(str);
                    return {
                        value: isNaN(value) ? 0 : value,
                        unit: ''
                    };
                };

                const current = getUnitAndValue(currentValue);
                const next = getUnitAndValue(nextValue);

                // Only interpolate if units match and values are finite
                if (current.unit === next.unit && isFinite(current.value) && isFinite(next.value)) {
                    const interpolatedValue = interpolate(localProgress, [0, 1], [current.value, next.value]);
                    // Ensure interpolated value is finite
                    if (isFinite(interpolatedValue)) {
                        return current.unit ? `${interpolatedValue}${current.unit}` : interpolatedValue;
                    }
                }

                // Fallback: return current value if interpolation fails
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

        // Map common animation keys to CSS properties
        switch (key) {
            case 'scale':
                styles.transform = `scale(${value})`;
                break;
            case 'rotate':
                // Handle both number and string values for rotate
                const rotateValue = typeof value === 'string' && value.includes('deg') ? value : `${value}deg`;
                styles.transform = `${styles.transform || ''} rotate(${rotateValue})`.trim();
                break;
            case 'translateX':
                // Handle both number and string values for translateX
                const translateXValue = typeof value === 'string' && (value.includes('px') || value.includes('%') || value.includes('vw') || value.includes('vh')) ? value : `${value}px`;
                styles.transform = `${styles.transform || ''} translateX(${translateXValue})`.trim();
                break;
            case 'translateY':
                // Handle both number and string values for translateY
                const translateYValue = typeof value === 'string' && (value.includes('px') || value.includes('%') || value.includes('vw') || value.includes('vh')) ? value : `${value}px`;
                styles.transform = `${styles.transform || ''} translateY(${translateYValue})`.trim();
                break;
            case 'opacity':
                // Ensure opacity is always a valid number between 0 and 1
                // Use Math.round to prevent floating point precision issues that cause flickering
                const opacityValue = typeof value === 'number'
                    ? Math.max(0, Math.min(1, isFinite(value) && !isNaN(value) ? Math.round(value * 1000) / 1000 : 1))
                    : 1;
                styles.opacity = opacityValue;
                break;
            case 'blur':
                // Handle both number and string values for blur
                const blurValue = typeof value === 'string' && (value.includes('px') || value.includes('rem') || value.includes('em')) ? value : `${value}px`;
                styles.filter = `blur(${blurValue})`;
                break;
            case 'brightness':
                styles.filter = `${styles.filter || ''} brightness(${value})`.trim();
                break;
            case 'contrast':
                styles.filter = `${styles.filter || ''} contrast(${value})`.trim();
                break;
            case 'color':
                styles.color = value;
                break;
            case 'backgroundColor':
                styles.backgroundColor = value;
                break;
            default:
                // For custom CSS properties, set them directly
                // This supports any CSS property including CSS custom properties (CSS variables)
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

    const easing = getEasingFunction(type);

    const progress = interpolate(
        frame - start,
        [0, duration],
        [0, 1],
        {
            easing,
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }
    );
    // useMemo(() => {
    //     if (type === 'spring') {
    //         return spring({
    //             frame,
    //             fps,
    //             config: {
    //                 stiffness: 100,
    //                 damping: 10,
    //                 mass: 1,
    //             },
    //             durationInFrames: duration,
    //             delay: start,
    //         });
    //     } else {
    //         const animationFrame = frame - start;
    //         const easing = getEasingFunction(type);

    //         return interpolate(
    //             animationFrame,
    //             [0, duration],
    //             [0, 1],
    //             {
    //                 easing,
    //                 extrapolateLeft: 'clamp',
    //                 extrapolateRight: 'clamp',
    //             }
    //         );
    //     }
    // }, [frame, fps, start, duration, type]);



    // Provider mode: Create context for child components
    const parentContext = useGenericEffectOptional();

    // Calculate animated styles once with proper dependencies
    const animatedStyles: React.CSSProperties = useMemo(() => {
        if (ranges.length === 0) return {};

        const currentStyles = rangesToCSSProperties(ranges, progress);

        // If we have a parent context and we're in provider mode, merge styles
        if (parentContext && mode === 'provider') {
            return { ...parentContext.animatedStyles, ...currentStyles };
        }

        return currentStyles;
    }, [ranges, progress, parentContext?.animatedStyles, mode]);

    // Create context value once to prevent unnecessary re-renders
    const contextValue: GenericEffectContextType = useMemo(() => ({
        animatedStyles,
        targetIds,
    }), [animatedStyles, targetIds]);

    if (mode === 'provider') {
        return (
            <GenericEffectContext.Provider value={contextValue}>
                {children}
            </GenericEffectContext.Provider>
        );
    } else {
        return (
            <div {...effectData.props} style={animatedStyles}>
                {children}
            </div>
        );
    }

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