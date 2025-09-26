'use client';

import {
  findMatchingComponents,
  InputCompositionProps,
  RenderableContext,
} from '@microfox/remotion';
import { replaceMatchingComponent } from '@microfox/datamotion';
import { preset } from 'swr/_internal';

// Helper function to clean function string by removing imports and type annotations
export const cleanFunctionString = (func: Function): string => {
  const funcString = func.toString();

  // Extract just the function body if it's a function declaration
  const functionMatch = funcString.match(/function\s*\([^)]*\)\s*{([\s\S]*)}/);
  if (functionMatch) {
    const functionBody = functionMatch[1];
    // Create a clean function with just the body
    return `function(params) {${functionBody}}`;
  }

  // For arrow functions, try to extract the body
  const arrowMatch = funcString.match(/\([^)]*\)\s*=>\s*{([\s\S]*)}/);
  if (arrowMatch) {
    const functionBody = arrowMatch[1];
    return `function(params) {${functionBody}}`;
  }

  // Fallback: return the original function string
  return funcString;
};

export const runPreset = <T>(
  presetInput: any,
  presetFunction: string,
): T | null => {
  const presetJsFunction = new Function(
    'data',
    `return (${presetFunction})(data);`,
  );
  const childrenData = presetJsFunction(presetInput);
  if (!childrenData) {
    return null;
  }
  return childrenData as T;
};

export const insertPresetToComposition = (
  data: InputCompositionProps,
  options: {
    presetOutput: any;
    presetType: 'children' | 'data' | 'context' | 'effects' | 'full';
  },
) => {
  if (!data.childrenData || data.childrenData.length === 0) {
    if (options.presetType === 'full') {
      data.childrenData = Array.isArray(options.presetOutput.childrenData)
        ? options.presetOutput.childrenData
        : [options.presetOutput.childrenData];
      if (options.presetOutput.config) {
        data.config = {
          ...data.config,
          ...options.presetOutput.config,
        };
      }
      if (options.presetOutput.style) {
        data.style = {
          ...data.style,
          ...options.presetOutput.style,
        };
      }
      return data;
    } else {
      return data;
    }
  }
  if (options.presetType === 'full') {
    data.childrenData = Array.isArray(options.presetOutput.childrenData)
      ? options.presetOutput.childrenData
      : [options.presetOutput.childrenData];
    if (options.presetOutput.config) {
      data.config = {
        ...data.config,
        ...options.presetOutput.config,
      };
    }
    if (options.presetOutput.style) {
      data.style = {
        ...data.style,
        ...options.presetOutput.style,
      };
    }
    return data;
  }

  const firstChild = options.presetOutput.childrenData[0];
  const firstChildId = firstChild.id;
  let componeents = findMatchingComponents(data.childrenData, [firstChildId]);
  if (componeents.length === 0) {
    // THERE ARE NO BASE DATA, JUST ASSUME THE PRESET OUTPUT IS FULL THEN
    if (data.childrenData.length === 0) {
      data.childrenData = Array.isArray(options.presetOutput.childrenData)
        ? options.presetOutput.childrenData
        : [options.presetOutput.childrenData];
      if (options.presetOutput.config) {
        data.config = {
          ...data.config,
          ...options.presetOutput.config,
        };
      }
      if (options.presetOutput.style) {
        data.style = {
          ...data.style,
          ...options.presetOutput.style,
        };
      }
      return data;
    }
    componeents = [data.childrenData[0]];
  }
  if (options.presetType === 'children') {
    const appendchildrenData = Array.isArray(firstChild.childrenData)
      ? firstChild.childrenData
      : [firstChild.childrenData];
    componeents[0].childrenData = [
      ...(componeents[0].childrenData || []),
      ...appendchildrenData,
    ];
    if (firstChild.data) {
      Object.entries(firstChild.data).forEach(([key, value]) => {
        if (!componeents[0].data) {
          componeents[0].data = {};
        }
        if (key in componeents[0].data) {
          if (Array.isArray(value)) {
            componeents[0].data[key] = [
              ...(componeents[0].data[key] || []),
              ...value,
            ];
          } else if (typeof value === 'object' && value !== null) {
            componeents[0].data[key] = {
              ...componeents[0].data[key],
              ...value,
            };
          } else {
            componeents[0].data[key] = value;
          }
        } else {
          componeents[0].data[key] = value;
        }
      });
    }
    // if(firstChild.context) {
    //   Object.entries(firstChild.context).forEach(([key, value]) => {
    //     if(!componeents[0].context) {
    //       componeents[0].context = {};
    //     }
    //     if(key in componeents[0].context) {
    //       typeof value === 'object' && value !== null ? componeents[0].context[key as keyof RenderableContext] = {
    //         ...componeents[0].context[key as keyof RenderableContext],
    //         ...value,
    //       } : componeents[0].context[key as keyof RenderableContext] = value;
    //     } else {
    //       componeents[0].context[key as keyof RenderableContext] = value;
    //     }
    //   });
    // }
    // if (options.presetOutput.context) {
    //   componeents[0].context = {
    //     ...(componeents[0].context || {}),
    //     timing: {
    //       ...(componeents[0].context?.timing || {}),
    //       ...(options.presetOutput.context.timing || {}),
    //     },
    //     boundaries: {
    //       ...(componeents[0].context?.boundaries || {}),
    //       ...(options.presetOutput.context.boundaries || {}),
    //     },
    //   };
    // }

    // Replace matching components with components[0] before returning
    if (componeents.length > 0) {
      data.childrenData = replaceMatchingComponent(
        data.childrenData || [],
        [firstChildId],
        componeents[0],
      );
    }

    return data;
  }
  if (options.presetType === 'data') {
    componeents[0].data = options.presetOutput.data;

    // Replace matching components with components[0] before returning
    if (componeents.length > 0) {
      data.childrenData = replaceMatchingComponent(
        data.childrenData || [],
        [firstChildId],
        componeents[0],
      );
    }

    return data;
  }
  if (options.presetType === 'context') {
    componeents[0].context = options.presetOutput.context;

    // Replace matching components with components[0] before returning
    if (componeents.length > 0) {
      data.childrenData = replaceMatchingComponent(
        data.childrenData || [],
        [firstChildId],
        componeents[0],
      );
    }

    return data;
  }
  if (options.presetType === 'effects') {
    componeents[0].effects = Array.isArray(options.presetOutput.effects)
      ? options.presetOutput.effects
      : [options.presetOutput.effects];

    // Replace matching components with components[0] before returning
    if (componeents.length > 0) {
      data.childrenData = replaceMatchingComponent(
        data.childrenData || [],
        [firstChildId],
        componeents[0],
      );
    }

    return data;
  }
  return data;
};
