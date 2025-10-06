import React, { useMemo, createContext, useContext, ReactNode } from 'react';
import mergeCSSStyles from './mergeCSSStyles';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { BaseRenderableProps } from '../../core/types/renderable.types';

// Animation range type for keyframe animations
export interface AnimationRange {
    key: string; // CSS property key (e.g., 'transform', 'opacity', 'scale')
    val: any; // Value for this keyframe
    prog: number; // Progress (0-1) when this keyframe should be active
}

// Universal effect data interface - extends any effect with provider capabilities
export interface UniversalEffectData {
    start?: number; // Start time in seconds
    duration?: number; // Duration in seconds
    type?: 'spring' | 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
    ranges?: AnimationRange[]; // Animation keyframes
    targetIds?: string[]; // IDs of child components to target (for provider mode)
    mode?: 'wrapper' | 'provider'; // How the effect is applied
    props?: any; // Additional properties for the effect
    // Effect-specific properties (can be extended by any effect)
    [key: string]: any;
}

// Context for universal effect provider mode
interface UniversalEffectContextType {
    animatedStyles: React.CSSProperties;
    targetIds: string[];
    effectType: string;
}

const UniversalEffectContext = createContext<UniversalEffectContextType | null>(null);

// Hook to use the universal effect context
export const useUniversalEffect = () => {
    const context = useContext(UniversalEffectContext);
    if (!context) {
        throw new Error('useUniversalEffect must be used within a UniversalEffectProvider');
    }
    return context;
};

// Optional hook that returns null if no provider is found
export const useUniversalEffectOptional = () => {
    return useContext(UniversalEffectContext);
};

// Hook to check if a universal effect provider exists
export const useHasUniversalEffectProvider = (): boolean => {
    const context = useContext(UniversalEffectContext);
    return context !== null;
};

// Export the context so it can be used by other effect components
export { UniversalEffectContext };

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
    hex = hex.replace('#', '').toLowerCase();

    if (!/^[0-9a-f]+$/.test(hex)) {
        return { r: 0, g: 0, b: 0, a: 1 };
    }

    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    if (hex.length === 6) {
        return {
            r: Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16))),
            g: Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16))),
            b: Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16))),
            a: 1
        };
    }

    if (hex.length === 8) {
        return {
            r: Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16))),
            g: Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16))),
            b: Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16))),
            a: Math.max(0, Math.min(1, parseInt(hex.substr(6, 2), 16) / 255))
        };
    }

    return { r: 0, g: 0, b: 0, a: 1 };
};

// Parse rgba color to RGBA
const parseRgbaColor = (rgba: string): ColorRGBA => {
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
    const sortedRanges = [...ranges].sort((a, b) => a.prog - b.prog);

    if (sortedRanges.length === 0) return 0;
    if (sortedRanges.length === 1) return sortedRanges[0].val;

    if (progress <= sortedRanges[0].prog) {
        return sortedRanges[0].val;
    }

    if (progress >= sortedRanges[sortedRanges.length - 1].prog) {
        return sortedRanges[sortedRanges.length - 1].val;
    }

    for (let i = 0; i < sortedRanges.length - 1; i++) {
        const currentRange = sortedRanges[i];
        const nextRange = sortedRanges[i + 1];

        if (progress >= currentRange.prog && progress <= nextRange.prog) {
            const localProgress = (progress - currentRange.prog) / (nextRange.prog - currentRange.prog);
            const currentValue = currentRange.val;
            const nextValue = nextRange.val;

            if (typeof currentValue === 'number' && typeof nextValue === 'number') {
                if (isFinite(currentValue) && isFinite(nextValue) && !isNaN(currentValue) && !isNaN(nextValue)) {
                    const interpolatedValue = currentValue + (nextValue - currentValue) * localProgress;
                    if (isFinite(interpolatedValue) && !isNaN(interpolatedValue)) {
                        return interpolatedValue;
                    }
                }
                return currentValue;
            } else if (typeof currentValue === 'string' && typeof nextValue === 'string') {
                const isColor = (str: string) => {
                    const trimmed = str.trim().toLowerCase();
                    return trimmed.startsWith('#') || trimmed.startsWith('rgb');
                };

                if (isColor(currentValue) && isColor(nextValue)) {
                    return interpolateColors(currentValue, nextValue, localProgress);
                }

                const getUnitAndValue = (str: string) => {
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

                    const value = parseFloat(str);
                    return {
                        value: isNaN(value) ? 0 : value,
                        unit: ''
                    };
                };

                const current = getUnitAndValue(currentValue);
                const next = getUnitAndValue(nextValue);

                if (current.unit === next.unit && isFinite(current.value) && isFinite(next.value)) {
                    const interpolatedValue = interpolate(localProgress, [0, 1], [current.value, next.value]);
                    if (isFinite(interpolatedValue)) {
                        return current.unit ? `${interpolatedValue}${current.unit}` : interpolatedValue;
                    }
                }

                return currentValue;
            }

            return currentValue;
        }
    }

    return sortedRanges[0]?.val || 0;
};

// Convert animation ranges to CSS properties
const rangesToCSSProperties = (ranges: AnimationRange[], progress: number): React.CSSProperties => {
    const styles: React.CSSProperties = {};

    const rangesByKey = ranges.reduce((acc, range) => {
        if (!acc[range.key]) {
            acc[range.key] = [];
        }
        acc[range.key].push(range);
        return acc;
    }, {} as Record<string, AnimationRange[]>);

    Object.entries(rangesByKey).forEach(([key, keyRanges]) => {
        const value = calculateAnimatedValue(keyRanges, progress, key);

        switch (key) {
            case 'scale':
                styles.transform = `scale(${value})`;
                break;
            case 'rotate':
                const rotateValue = typeof value === 'string' && value.includes('deg') ? value : `${value}deg`;
                styles.transform = `${styles.transform || ''} rotate(${rotateValue})`.trim();
                break;
            case 'translateX':
                const translateXValue = typeof value === 'string' && (value.includes('px') || value.includes('%') || value.includes('vw') || value.includes('vh')) ? value : `${value}px`;
                styles.transform = `${styles.transform || ''} translateX(${translateXValue})`.trim();
                break;
            case 'translateY':
                const translateYValue = typeof value === 'string' && (value.includes('px') || value.includes('%') || value.includes('vw') || value.includes('vh')) ? value : `${value}px`;
                styles.transform = `${styles.transform || ''} translateY(${translateYValue})`.trim();
                break;
            case 'opacity':
                const opacityValue = typeof value === 'number'
                    ? Math.max(0, Math.min(1, isFinite(value) && !isNaN(value) ? Math.round(value * 1000) / 1000 : 1))
                    : 1;
                styles.opacity = opacityValue;
                break;
            case 'blur':
                const blurValue = typeof value === 'string' && (value.includes('px') || value.includes('rem') || value.includes('em')) ? value : `${value}px`;
                styles.filter = `blur(${blurValue})`;
                break;
            case 'brightness':
                styles.filter = `${styles.filter || ''} brightness(${value})`.trim();
                break;
            case 'contrast':
                styles.filter = `${styles.filter || ''} contrast(${value})`.trim();
                break;
            case 'filter':
                styles.filter = value;
                break;
            case 'color':
                styles.color = value;
                break;
            case 'backgroundColor':
                styles.backgroundColor = value;
                break;
            default:
                (styles as any)[key] = value;
        }
    });

    return styles;
};

// A new hook to encapsulate the core animation logic
export const useUniversalAnimation = (data: UniversalEffectData, context?: any) => {
    // Safely get Remotion context with fallbacks
    let frame = 0;
    let fps = 30;

    try {
        frame = useCurrentFrame();
        const videoConfig = useVideoConfig();
        fps = videoConfig.fps;
    } catch (error) {
        console.warn('useUniversalAnimation used outside Remotion context, using fallback values');
    }

    const effectData = data as UniversalEffectData;
    const { timing } = context ?? {};
    const contextDuration = timing?.durationInFrames || 50;

    // Parse effect parameters
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

    return {
        frame,
        fps,
        progress,
        start,
        duration,
        type,
        ranges,
        targetIds,
        mode,
        effectData,
    };
};

// Universal Effect Component - now a thin wrapper for provider/wrapper logic
export const UniversalEffect: React.FC<BaseRenderableProps & {
    effectType?: string;
    customAnimationLogic?: (effectData: UniversalEffectData, progress: number, frame: number) => React.CSSProperties;
}> = ({
    id,
    data,
    children,
    context,
    effectType = 'universal',
    customAnimationLogic
}) => {
        const { progress, frame, ranges, mode, targetIds, effectData } = useUniversalAnimation(data, context);
        const parentContext = useUniversalEffectOptional();

        const animatedStyles: React.CSSProperties = useMemo(() => {

            if (progress <= 0 || progress >= 1) {
                return parentContext?.animatedStyles || {};
            }

            let currentStyles = {};
            if (customAnimationLogic) {
                currentStyles = customAnimationLogic(effectData, progress, frame);
            } else if (ranges.length > 0) {
                currentStyles = rangesToCSSProperties(ranges, progress);
            }

            if (parentContext && mode === 'provider') {
                const combinedStyles = mergeCSSStyles(parentContext.animatedStyles, currentStyles);
                return combinedStyles;
            }

            console.log('currentStyles', currentStyles);

            return currentStyles;
        }, [ranges, progress, parentContext?.animatedStyles, mode, customAnimationLogic, effectData, frame]);

        const contextValue: UniversalEffectContextType = useMemo(() => ({
            animatedStyles,
            targetIds,
            effectType,
        }), [animatedStyles, targetIds, effectType]);

        if (mode === 'provider') {
            return (
                <UniversalEffectContext.Provider value={contextValue}>
                    {children}
                </UniversalEffectContext.Provider>
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
export const UniversalEffectProvider: React.FC<{
    children: ReactNode;
    data: UniversalEffectData;
    effectType?: string;
    customAnimationLogic?: (effectData: UniversalEffectData, progress: number, frame: number) => React.CSSProperties;
    id?: string;
    componentId?: string;
    type?: string;
}> = ({
    children,
    data,
    effectType = 'universal',
    customAnimationLogic,
    id = 'generic',
    componentId = 'generic',
    type = 'effect'
}) => {
        return (
            <UniversalEffect
                id={id}
                componentId={componentId}
                type={type as any}
                data={data}
                context={undefined}
                effectType={effectType}
                customAnimationLogic={customAnimationLogic}
            >
                {children}
            </UniversalEffect>
        );
    };

// Hook for child components to get their animated styles
export const useAnimatedStyles = (componentId: string): React.CSSProperties => {
    const context = useUniversalEffectOptional();

    if (!context) {
        return {};
    }

    const { animatedStyles, targetIds } = context;



    if (targetIds.includes(componentId)) {
        return animatedStyles;
    }

    return {};
};

export const config = {
    displayName: 'generic',
    description: 'Universal effect that can be extended for any effect type',
    isInnerSequence: false,
    props: {},
};
