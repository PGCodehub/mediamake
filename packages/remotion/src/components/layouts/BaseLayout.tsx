import React, { Children, ComponentType, ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { BaseRenderableProps, ComponentConfig } from '../../core/types';

interface BaseLayoutProps extends BaseRenderableProps {
    children?: ReactNode;
}

export const Layout: ComponentType<BaseLayoutProps> = ({ id, children, data, context }) => {
    const { containerProps, childrenProps } = data || {
        containerProps: {},
        childrenProps: [],
    };
    const childrenArray = Children.toArray(children);

    return (
        // @ts-ignore
        <AbsoluteFill
            {...containerProps} style={{
                ...context?.boundaries,
                ...containerProps.style,
            }}>
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