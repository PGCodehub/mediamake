import { InputCompositionProps } from '@microfox/remotion';
import {
  RenderableComponentData,
  replaceMatchingComponent,
} from '@microfox/datamotion';
import { PresetOutput, PresetPassedProps, PresetMetadata } from './types';
import { presetStdLib } from './preset-stdlib';
import { getPredefinedPresetById } from './registry/presets-registry';

const findMatchingComponents = (
  childrenData: RenderableComponentData[],
  targetIds: string[],
): RenderableComponentData[] => {
  const matches: RenderableComponentData[] = [];

  const searchRecursively = (components: RenderableComponentData[]) => {
    for (const component of components) {
      // Check if this component's ID matches any target ID
      if (targetIds.includes(component.id)) {
        matches.push(component);
      }

      // Recursively search in childrenData if it exists
      if (component.childrenData && component.childrenData.length > 0) {
        searchRecursively(component.childrenData);
      }
    }
  };

  searchRecursively(childrenData);
  return matches;
};

const findMatchingComponentsByQuery = (
  childrenData: RenderableComponentData[],
  query: {
    type?: string;
    componentId?: string;
  },
): RenderableComponentData[] => {
  const matches: RenderableComponentData[] = [];

  const searchRecursively = (components: RenderableComponentData[]) => {
    for (const component of components) {
      // Check if this component matches the query criteria
      let matchesQuery = false;

      if (query.type && component.type === query.type) {
        matchesQuery = true;
      }

      if (query.componentId && component.componentId === query.componentId) {
        matchesQuery = true;
      }

      // If both type and componentId are provided, both must match
      if (query.type && query.componentId) {
        matchesQuery =
          component.type === query.type &&
          component.componentId === query.componentId;
      }

      if (matchesQuery) {
        matches.push(component);
      }

      // Recursively search in childrenData if it exists
      if (component.childrenData && component.childrenData.length > 0) {
        searchRecursively(component.childrenData);
      }
    }
  };

  searchRecursively(childrenData);
  return matches;
};

// Export the new function
export { findMatchingComponentsByQuery };

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

export const runPreset = async <T>(
  presetInput: any,
  presetFunction: string,
  props: PresetPassedProps,
  metadata?: PresetMetadata,
): Promise<PresetOutput | null> => {
  // Create a copy of props to inject dependencies
  const injectedProps: PresetPassedProps = { ...props };

  // Inject dependencies if metadata is provided
  if (metadata?.dependencies) {
    // Inject helper functions from stdlib
    if (metadata.dependencies.helpers && metadata.dependencies.helpers.length > 0) {
      injectedProps.helpers = {};
      for (const helperName of metadata.dependencies.helpers) {
        if (helperName in presetStdLib) {
          injectedProps.helpers[helperName] =
            presetStdLib[helperName as keyof typeof presetStdLib];
        } else {
          console.warn(
            `Helper function "${helperName}" not found in presetStdLib`,
          );
        }
      }
    }

    // Inject other presets as callable functions
    if (metadata.dependencies.presets && metadata.dependencies.presets.length > 0) {
      injectedProps.presets = {};
      for (const presetId of metadata.dependencies.presets) {
        const dependencyPreset = getPredefinedPresetById(presetId);
        if (dependencyPreset) {
          // Create a wrapper function that can be called from within the preset
          injectedProps.presets[presetId] = async (
            params: any,
            childProps?: Partial<PresetPassedProps>,
          ) => {
            const result = await runPreset(
              params,
              dependencyPreset.presetFunction,
              { ...injectedProps, ...childProps },
              dependencyPreset.metadata,
            );
            if (!result) {
              throw new Error(
                `Preset dependency "${presetId}" returned null or failed to execute`,
              );
            }
            return result;
          };
        } else {
          console.warn(
            `Preset dependency "${presetId}" not found in registry`,
          );
        }
      }
    }
  }

  // Execute the preset function with injected dependencies
  const presetJsFunction = new Function(
    'data',
    'props',
    `return (${presetFunction})(data, props);`,
  );
  const output = await presetJsFunction(presetInput, injectedProps);
  if (!output) {
    return null;
  }
  return output as PresetOutput;
};

export const insertPresetToComposition = (
  data: InputCompositionProps,
  options: {
    presetOutput: PresetOutput;
    presetType: 'children' | 'data' | 'context' | 'effects' | 'full';
  },
) => {
  // Extract the output data from the new PresetOutput structure
  const outputData = options.presetOutput.output;
  const outputOptions = options.presetOutput.options;

  if (!data.childrenData || data.childrenData.length === 0) {
    if (options.presetType === 'full') {
      data.childrenData = outputData.childrenData || [];
      if (outputData.config) {
        data.config = outputData.config;
      }
      if (outputData.style) {
        data.style = outputData.style;
      }
      return data;
    } else {
      return data;
    }
  }
  if (options.presetType === 'full') {
    data.childrenData = outputData.childrenData || [];
    if (outputData.config) {
      data.config = {
        ...data.config,
        ...outputData.config,
      };
    }
    if (outputData.style) {
      data.style = {
        ...data.style,
        ...outputData.style,
      };
    }
    return data;
  }

  // For children type presets, we need to handle the new structure
  if (options.presetType === 'children') {
    if (!outputData.childrenData || outputData.childrenData.length === 0) {
      return data;
    }

    // Find the target component to attach to based on options.attachedToId
    const targetId = outputOptions?.attachedToId || 'BaseScene';
    let targetComponents = findMatchingComponents(data.childrenData, [
      targetId,
    ]);

    if (targetComponents.length === 0) {
      // If no matching component found, use the first component
      targetComponents = [data.childrenData[0]];
    }

    // Append the preset children to the target component
    const targetComponent = targetComponents[0];
    if (targetComponent) {
      targetComponent.childrenData = [
        ...(targetComponent.childrenData || []),
        ...outputData.childrenData,
      ];

      // Apply attached containers styling if provided
      if (outputOptions?.attachedContainers) {
        // This would need to be handled by the rendering system
        // For now, we just ensure the children are added
      }
    }

    return data;
  }

  // For other preset types, we need to find the first child and apply changes
  if (!outputData.childrenData || outputData.childrenData.length === 0) {
    return data;
  }

  const firstChild = outputData.childrenData[0];
  const firstChildId = firstChild.id;
  let componeents = findMatchingComponents(data.childrenData, [firstChildId]);
  if (componeents.length === 0) {
    // THERE ARE NO BASE DATA, JUST ASSUME THE PRESET OUTPUT IS FULL THEN
    if (data.childrenData.length === 0) {
      data.childrenData = outputData.childrenData;
      if (outputData.config) {
        data.config = outputData.config;
      }
      if (outputData.style) {
        data.style = outputData.style;
      }
      return data;
    }
    componeents = [data.childrenData[0]];
  }

  if (options.presetType === 'data') {
    // For data type, we need to merge the data from the first child
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
    if (firstChild.context) {
      componeents[0].context = {
        ...componeents[0].context,
        ...firstChild.context,
      };
    }

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
    if (firstChild.effects) {
      componeents[0].effects = Array.isArray(firstChild.effects)
        ? firstChild.effects
        : [firstChild.effects];
    }

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
