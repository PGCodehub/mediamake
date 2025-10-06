import {
  GenericEffectData,
  InputCompositionProps,
  TextAtomData,
} from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

const presetParams = z.object({
  // Text content
  text: z.string().describe('Text content to display'),

  // Font configuration
  fontFamily: z
    .string()
    .optional()
    .describe('Font family (e.g., "Inter", "Roboto")'),
  fontWeight: z
    .string()
    .optional()
    .describe('Font weight (e.g., "400", "700", "bold")'),
  fontSize: z.number().optional().describe('Font size in pixels'),

  // Text styling
  color: z
    .string()
    .optional()
    .describe('Text color (hex, rgb, or named color)'),
  backgroundColor: z.string().optional().describe('Background color for text'),
  textAlign: z
    .enum(['left', 'center', 'right', 'justify'])
    .optional()
    .describe('Text alignment'),
  textDecoration: z
    .string()
    .optional()
    .describe('Text decoration (underline, line-through, etc.)'),
  textTransform: z
    .enum(['none', 'uppercase', 'lowercase', 'capitalize'])
    .optional()
    .describe('Text transformation'),
  letterSpacing: z.number().optional().describe('Letter spacing in pixels'),
  lineHeight: z.number().optional().describe('Line height multiplier'),

  // Positioning
  position: z
    .enum(['absolute', 'relative', 'fixed'])
    .optional()
    .describe('Position type'),
  top: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Top position (px or %)'),
  right: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Right position (px or %)'),
  bottom: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Bottom position (px or %)'),
  left: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Left position (px or %)'),

  // Flex positioning (when using flex layout)
  justifyContent: z
    .enum([
      'flex-start',
      'center',
      'flex-end',
      'space-between',
      'space-around',
      'space-evenly',
    ])
    .optional()
    .describe('Justify content for flex layout'),
  alignItems: z
    .enum(['flex-start', 'center', 'flex-end', 'stretch', 'baseline'])
    .optional()
    .describe('Align items for flex layout'),

  // Size and spacing
  width: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Width (px or %)'),
  height: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Height (px or %)'),
  maxWidth: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Maximum width'),
  maxHeight: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Maximum height'),
  padding: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Padding (px)'),
  margin: z.union([z.number(), z.string()]).optional().describe('Margin (px)'),

  // Border and shadow
  border: z
    .string()
    .optional()
    .describe('Border style (e.g., "1px solid #000")'),
  borderRadius: z.number().optional().describe('Border radius in pixels'),
  boxShadow: z
    .string()
    .optional()
    .describe('Box shadow (e.g., "0 2px 10px rgba(0,0,0,0.3)")'),
  textShadow: z
    .string()
    .optional()
    .describe('Text shadow (e.g., "0 2px 4px rgba(0,0,0,0.5)")'),

  // Opacity and visibility
  opacity: z.number().min(0).max(1).optional().describe('Opacity (0-1)'),

  // Animation effects
  fadeIn: z.boolean().optional().describe('Enable fade in animation'),
  fadeInDuration: z.number().optional().describe('Fade in duration in seconds'),
  slideIn: z
    .enum(['none', 'top', 'bottom', 'left', 'right'])
    .optional()
    .describe('Slide in direction'),
  slideInDuration: z
    .number()
    .optional()
    .describe('Slide in duration in seconds'),
  scaleIn: z.boolean().optional().describe('Enable scale in animation'),
  scaleInDuration: z
    .number()
    .optional()
    .describe('Scale in duration in seconds'),

  // Layout container
  containerBackground: z
    .string()
    .optional()
    .describe('Container background color'),
  containerPadding: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Container padding'),
  containerBorderRadius: z
    .number()
    .optional()
    .describe('Container border radius'),

  // Responsive settings
  responsiveFontSize: z
    .boolean()
    .optional()
    .describe('Enable responsive font sizing'),
  minFontSize: z
    .number()
    .optional()
    .describe('Minimum font size for responsive scaling'),
  maxFontSize: z
    .number()
    .optional()
    .describe('Maximum font size for responsive scaling'),
});

const presetExecution = (
  params: z.infer<typeof presetParams>,
): PresetOutput => {
  const {
    text,
    fontFamily,
    fontWeight,
    fontSize = 24,
    color = '#FFFFFF',
    backgroundColor,
    textAlign = 'center',
    textDecoration,
    textTransform,
    letterSpacing,
    lineHeight,
    position = 'absolute',
    top,
    right,
    bottom,
    left,
    justifyContent = 'center',
    alignItems = 'center',
    width,
    height,
    maxWidth,
    maxHeight,
    padding,
    margin,
    border,
    borderRadius,
    boxShadow,
    textShadow,
    opacity = 1,
    fadeIn = true,
    fadeInDuration = 1,
    slideIn,
    slideInDuration = 1,
    scaleIn = false,
    scaleInDuration = 1,
    containerBackground,
    containerPadding,
    containerBorderRadius,
    responsiveFontSize = false,
    minFontSize,
    maxFontSize,
  } = params;

  // Calculate responsive font size if enabled
  const getResponsiveFontSize = () => {
    if (!responsiveFontSize) return fontSize;

    const baseWidth = 1920; // Base width for responsive calculation
    const scaleFactor = Math.min(1, Math.max(0.5, baseWidth / 1920));
    const responsiveSize = fontSize * scaleFactor;

    if (minFontSize && responsiveSize < minFontSize) return minFontSize;
    if (maxFontSize && responsiveSize > maxFontSize) return maxFontSize;
    return responsiveSize;
  };

  // Build style object
  const textStyle: React.CSSProperties = {
    fontSize: getResponsiveFontSize(),
    color,
    textAlign,
    textDecoration,
    textTransform,
    letterSpacing: letterSpacing ? `${letterSpacing}px` : undefined,
    lineHeight,
    position,
    top: typeof top === 'number' ? `${top}px` : top,
    right: typeof right === 'number' ? `${right}px` : right,
    bottom: typeof bottom === 'number' ? `${bottom}px` : bottom,
    left: typeof left === 'number' ? `${left}px` : left,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
    maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
    padding: typeof padding === 'number' ? `${padding}px` : padding,
    margin: typeof margin === 'number' ? `${margin}px` : margin,
    border,
    borderRadius: borderRadius ? `${borderRadius}px` : undefined,
    boxShadow,
    textShadow,
    opacity,
    backgroundColor,
  };

  // Build effects array
  const effects: Array<{
    id: string;
    componentId: string;
    data: GenericEffectData;
  }> = [];

  // Fade in effect
  if (fadeIn) {
    effects.push({
      id: 'text-fade-in',
      componentId: 'generic',
      data: {
        start: 0,
        duration: fadeInDuration,
        mode: 'provider',
        targetIds: ['text-overlay'],
        type: 'ease-in-out',
        ranges: [
          {
            key: 'opacity',
            val: 0,
            prog: 0,
          },
          {
            key: 'opacity',
            val: opacity,
            prog: 1,
          },
        ],
      },
    });
  }

  // Slide in effect
  if (slideIn && slideIn !== 'none') {
    const isVertical = slideIn === 'top' || slideIn === 'bottom';
    const translateKey = isVertical ? 'translateY' : 'translateX';

    let translateValue: string;
    if (slideIn === 'top') {
      translateValue = '-100%';
    } else if (slideIn === 'bottom') {
      translateValue = '100%';
    } else if (slideIn === 'left') {
      translateValue = '-100%';
    } else if (slideIn === 'right') {
      translateValue = '100%';
    } else {
      translateValue = '0px';
    }

    effects.push({
      id: 'text-slide-in',
      componentId: 'generic',
      data: {
        start: 0,
        duration: slideInDuration,
        mode: 'provider',
        targetIds: ['text-overlay'],
        type: 'ease-out',
        ranges: [
          {
            key: translateKey,
            val: translateValue,
            prog: 0,
          },
          {
            key: translateKey,
            val: '0px',
            prog: 1,
          },
        ],
      },
    });
  }

  // Scale in effect
  if (scaleIn) {
    effects.push({
      id: 'text-scale-in',
      componentId: 'generic',
      data: {
        start: 0,
        duration: scaleInDuration,
        mode: 'provider',
        targetIds: ['text-overlay'],
        type: 'ease-out',
        ranges: [
          {
            key: 'scale',
            val: 0,
            prog: 0,
          },
          {
            key: 'scale',
            val: 1,
            prog: 1,
          },
        ],
      },
    });
  }

  // Text atom data
  const textAtomData: TextAtomData = {
    text,
    style: textStyle,
    className: 'text-overlay',
    font: fontFamily
      ? {
          family: fontFamily,
          weights: fontWeight ? [fontWeight] : ['400', '700'],
        }
      : undefined,
  };

  // Container style for BaseLayout
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent,
    alignItems,
    backgroundColor: containerBackground,
    padding:
      typeof containerPadding === 'number'
        ? `${containerPadding}px`
        : containerPadding,
    borderRadius: containerBorderRadius
      ? `${containerBorderRadius}px`
      : undefined,
  };

  return {
    output: {
      config: {
        duration: 20,
      },
      childrenData: [
        {
          id: 'text-overlay',
          componentId: 'TextAtom',
          type: 'atom' as const,
          effects,
          data: textAtomData,
          context: {
            timing: {
              fitDurationTo: 'BaseScene',
            },
          },
        },
      ],
    },
    options: {
      attachedToId: `BaseScene`,
      attachedContainers: [
        {
          className: 'text-overlay-container',
          style: containerStyle,
        },
      ],
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'text-overlay',
  title: 'Text Overlay',
  description:
    'A customizable text overlay with positioning, styling, and animation controls',
  type: 'predefined',
  presetType: 'children',
  tags: ['text', 'overlay', 'typography', 'positioning', 'animation'],
  defaultInputParams: {
    text: 'Your Text Here',
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    fadeIn: true,
    fadeInDuration: 1,
    opacity: 1,
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
};

const presetFunction = presetExecution.toString();
const presetParamsSchema = z.toJSONSchema(presetParams);

const textOverlayPreset = {
  metadata: presetMetadata,
  presetFunction: presetFunction,
  presetParams: presetParamsSchema,
};

export { textOverlayPreset };
