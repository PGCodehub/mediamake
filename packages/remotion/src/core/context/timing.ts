import { ALL_FORMATS, Input, UrlSource } from 'mediabunny';
import { RenderableComponentData } from '../types';
import { InputCompositionProps } from '../../components/Composition';

export const findMatchingComponents = (
  childrenData: RenderableComponentData[],
  targetIds: string[]
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

export const calculateDuration = async (
  childrenData: RenderableComponentData[],
  config: {
    fitDurationTo: string[] | string;
  }
): Promise<number | undefined> => {
  // Helper function to recursively find all matching component IDs

  let calculatedDuration: number | undefined = undefined;
  // Convert fitDurationTo to array if it's a string
  const targetIds = Array.isArray(config.fitDurationTo)
    ? config.fitDurationTo
    : [config.fitDurationTo];

  // Find all matching components
  const matchingComponents = findMatchingComponents(
    childrenData || [],
    targetIds
  );

  // Now you can use matchingComponents to calculate the duration
  // For example, you might want to find the maximum duration among matching components
  // or sum their durations, etc.

  if (matchingComponents.length === 1) {
    if (
      matchingComponents[0].type === 'atom' &&
      (matchingComponents[0].componentId === 'AudioAtom' ||
        matchingComponents[0].componentId === 'VideoAtom')
    ) {
      const src = matchingComponents[0].data.src;
      if (src.startsWith('http')) {
        const audioInput = new Input({
          formats: ALL_FORMATS,
          source: new UrlSource(src),
        });
        calculatedDuration = await audioInput.computeDuration();
      } else {
        // if (matchingComponents[0].componentId === "VideoAtom") {
        //     const { slowDurationInSeconds, dimensions } = await parseMedia({
        //         src: src,
        //         fields: {
        //             slowDurationInSeconds: true,
        //             dimensions: true,
        //         },
        //     });
        // }
        // const audioInput = new Input({
        //     formats: ALL_FORMATS,
        //     source: new FilePathSource("/Users/subhakartikkireddy/Desktop/CODE/THEMOONDEVS/microfox-ai/mediamake/apps/mediamake/public/" + src),
        // });
        // calculatedDuration = await audioInput.computeDuration();
      }
    }
  }
  return calculatedDuration;
};

export const setDurationsInContext = async (root: InputCompositionProps) => {
  const iterateRecursively = async (
    components: RenderableComponentData[]
  ): Promise<RenderableComponentData[]> => {
    const updatedComponents: RenderableComponentData[] = [];

    for (const component of components) {
      let updatedComponent = { ...component };

      // Check if this component's ID matches any target ID
      if (component.context?.timing?.fitDurationTo?.length > 0) {
        const duration = await calculateDuration(component.childrenData, {
          fitDurationTo: component.context?.timing?.fitDurationTo,
        });

        // Create a new context object with updated timing
        updatedComponent = {
          ...component,
          context: {
            ...component.context,
            timing: {
              ...component.context.timing,
              duration: duration,
            },
          },
        };
      }

      // Recursively process childrenData if it exists
      if (component.childrenData && component.childrenData.length > 0) {
        updatedComponent.childrenData = await iterateRecursively(
          component.childrenData
        );
      }

      updatedComponents.push(updatedComponent);
    }

    return updatedComponents;
  };

  const updatedChildrenData = await iterateRecursively(root.childrenData);

  return {
    ...root,
    childrenData: updatedChildrenData,
  };
};
