import React, { Children, ComponentType, ReactNode, useMemo } from 'react';
import { AbsoluteFill } from 'remotion';
import { BaseRenderableProps, ComponentConfig } from '../../core/types';
import { useAnimatedStyles } from '../effects';

interface BaseLayoutProps extends BaseRenderableProps {
    children?: ReactNode;
}

export const Layout: ComponentType<BaseLayoutProps> = ({ id, children, data, context }) => {
    const { containerProps, childrenProps } = data || {
        containerProps: {},
        childrenProps: [],
    };
    const overrideStyles = useAnimatedStyles(id);
    const childrenArray = Children.toArray(children);

    const enhancedStyle = useMemo(() => ({ ...context?.boundaries, ...containerProps.style, ...overrideStyles }), [context?.boundaries, containerProps.style, overrideStyles]);
    return (
        // @ts-ignore
        <AbsoluteFill
            {...containerProps} style={enhancedStyle}>
            {childrenArray.map((child, index) => (
                <div
                    key={index}
                    {...(index < childrenProps.length && childrenProps[index])}
                >
                    {child}
                </div>
            ))}
        </AbsoluteFill>
    );
};

export const config: ComponentConfig = {
    displayName: 'BaseLayout',
    type: 'layout',
    isInnerSequence: false,
}