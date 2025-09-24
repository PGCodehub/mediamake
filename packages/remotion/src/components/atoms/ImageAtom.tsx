import React, { useMemo } from 'react';
import { Img, staticFile } from 'remotion';
import { BaseRenderableProps } from '../../core/types';
import { ComponentConfig } from '../../core/types';
import { useAnimatedStyles } from '../effects';

interface ImageAtomProps extends BaseRenderableProps {
    data: {
        src: string;
        style?: React.CSSProperties;
        className?: string;
    };
}

export const Atom: React.FC<ImageAtomProps> = ({ data, id }) => {

    const overrideStyles = useAnimatedStyles(id);
    const source = useMemo(() => {
        if (data.src.startsWith('http')) {
            return data.src;
        }
        return staticFile(data.src);
    }, [data.src]);

    const enhancedStyle = useMemo(() => ({ ...data.style, ...overrideStyles }), [data.style, overrideStyles]);

    // @ts-ignore
    return <Img className={data.className} src={source} style={enhancedStyle} crossOrigin='anonymous' maxRetries={4} />;
};

// Static config for ImageAtom
export const config: ComponentConfig = {
    displayName: 'ImageAtom',
    type: 'atom',
    isInnerSequence: false,
}; 