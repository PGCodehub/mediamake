import React, { Children, ComponentType, ReactNode, useMemo } from 'react';
import { AbsoluteFill } from 'remotion';
import { BaseRenderableProps, ComponentConfig } from '../../core/types';
import { useAnimatedStyles } from '../effects';

interface BaseLayoutProps extends BaseRenderableProps {
    children?: ReactNode;
    data: {
        isAbsoluteFill?: boolean;
        containerProps?: any;
        childrenProps?: any[];
        repeatChildrenProps?: boolean;
    }
}

export const Layout: ComponentType<BaseLayoutProps> = ({ id, children, data, context }) => {
    const { containerProps = {}, childrenProps = [], repeatChildrenProps = {} } = data;
    const overrideStyles = useAnimatedStyles(id);
    const childrenArray = Children.toArray(children);

    const enhancedStyle = useMemo(() => ({
        ...(!context?.boundaries?.reset ? context?.boundaries : {}),
        ...containerProps.style,
        ...overrideStyles
    }), [
        !context?.boundaries?.reset ? context?.boundaries : {},
        containerProps.style,
        overrideStyles]
    );

    // console.log('data in ', id, repeatChildrenProps, childrenProps);
    if (Object.keys(repeatChildrenProps).length <= 0 && childrenProps.length <= 0) {

        if (data.isAbsoluteFill) {
            return (
                <AbsoluteFill
                    {...containerProps} style={enhancedStyle}>
                    {childrenArray}
                </AbsoluteFill>
            );
        }

        return (
            <div
                id={id}
                {...containerProps} style={enhancedStyle}>
                {childrenArray.map((child, index) => (
                    <>
                        {child}
                    </>
                ))}
            </div>
        );
    }

    if (data.isAbsoluteFill) {
        return (
            <AbsoluteFill
                id={id}
                {...containerProps} style={enhancedStyle}>
                {childrenArray.map((child, index) => (
                    <div
                        key={index}
                        {...((childrenProps.length > 0 && index < childrenProps.length) ? childrenProps[index] : repeatChildrenProps ? repeatChildrenProps : {})}
                    >
                        {child}
                    </div>
                ))}
            </AbsoluteFill>
        );
    }

    return (
        <div
            id={id}
            {...containerProps} style={enhancedStyle}>
            {childrenArray.map((child, index) => (
                <div
                    key={index}
                    {...((childrenProps.length > 0 && index < childrenProps.length) ? childrenProps[index] : repeatChildrenProps ? repeatChildrenProps : {})}
                >
                    {child}
                </div>
            ))}
        </div>
    );
};

export const config: ComponentConfig = {
    displayName: 'BaseLayout',
    type: 'layout',
    isInnerSequence: false,
}