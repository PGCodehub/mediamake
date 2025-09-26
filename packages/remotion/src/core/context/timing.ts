import { ALL_FORMATS, FilePathSource, Input, UrlSource } from 'mediabunny';
import { RenderableComponentData } from '../types';
import { InputCompositionProps } from '../../components/Composition';
import { parseMedia } from '@remotion/media-parser';

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

export const calculateComponentDuration = async (
  component: Pick<RenderableComponentData, 'data' | 'componentId'>
): Promise<number | undefined> => {
  const src = component.data.src;
  if (src.startsWith('http')) {
    const audioInput = new Input({
      formats: ALL_FORMATS,
      source: new UrlSource(src),
    });
    const audioDuration = await audioInput.computeDuration();
    if (component.data.startFrom || component.data.endAt) {
      return (
        audioDuration -
        (component.data.startFrom || 0) -
        (component.data.endAt ? audioDuration - (component.data.endAt || 0) : 0)
      );
    }
    return audioDuration;
  } else {
    // NOT SUPPORTED
    // if (matchingComponents[0].componentId === "VideoAtom") {
    //     const { slowDurationInSeconds, dimensions } = await parseMedia({
    //         src: src,
    //         fields: {
    //             slowDurationInSeconds: true,
    //             dimensions: true,
    //         },
    //     });
    // }
    // try {
    //   console.log(process.cwd() + '../../public/' + src);
    //   cobst file = fs.readFileSync(process.cwd() + '../../public/' + src);
    //   const source = new FilePathSource(process.cwd() + '../../public/' + src);
    //   console.log(source);
    //   const audioInput = new Input({
    //     formats: ALL_FORMATS,
    //     source: source,
    //   });
    //   const calculatedDuration = await audioInput.computeDuration();
    //   return calculatedDuration;
    // } catch (error) {
    //   console.error('Error calculating duration', error);
    //   return undefined;
    // }
  }
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
      calculatedDuration = await calculateComponentDuration(
        matchingComponents[0]
      );
    }
    if (
      matchingComponents[0].type === 'scene' &&
      matchingComponents[0].context?.timing?.duration
    ) {
      calculatedDuration = matchingComponents[0].context.timing.duration;
    }
  }
  return calculatedDuration;
};

export const setDurationsInContext = async (root: InputCompositionProps) => {
  const iterateRecursively = async (
    components: RenderableComponentData[],
    onlyScene: boolean = false
  ): Promise<RenderableComponentData[]> => {
    const updatedComponents: RenderableComponentData[] = [];

    for (const component of components) {
      let updatedComponent = { ...component };

      // Check if this component's ID matches any target ID ( if fitDurationTo exists )
      if (
        component.context?.timing?.fitDurationTo?.length > 0 &&
        !onlyScene &&
        component.context?.timing?.fitDurationTo != component.id &&
        component.context?.timing?.fitDurationTo != 'this' &&
        component.context?.timing?.fitDurationTo != 'fill'
      ) {
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

      if (
        component.type === 'scene' &&
        ((component.context?.timing?.fitDurationTo?.length > 0 &&
          (component.context?.timing?.fitDurationTo == component.id ||
            component.context?.timing?.fitDurationTo == 'this')) ||
          !component.context?.timing?.duration) &&
        onlyScene
      ) {
        const duration =
          updatedComponent.childrenData.reduce(
            (acc, child) => acc + (child.context?.timing?.duration ?? 0),
            0
          ) ?? 10;
        updatedComponent.context = {
          ...(updatedComponent.context || {}),
          timing: {
            ...(updatedComponent.context?.timing || {}),
            duration: duration,
          },
        };
      }

      if (
        component.type === 'atom' &&
        !component.context?.timing?.duration &&
        !onlyScene
      ) {
        if (
          component.componentId === 'VideoAtom' ||
          component.componentId === 'AudioAtom'
        ) {
          const duration = await calculateComponentDuration(component);
          if (!component.context?.timing?.fitDurationTo) {
            updatedComponent.context = {
              ...(updatedComponent.context || {}),
              timing: {
                ...(updatedComponent.context?.timing || {}),
                duration: duration,
              },
            };
          } else if (component.context?.timing?.fitDurationTo) {
            updatedComponent.data = {
              ...updatedComponent.data,
              srcDuration: duration,
            };
          }
        }
      }

      updatedComponents.push(updatedComponent);
    }

    return updatedComponents;
  };

  let updatedChildrenData = await iterateRecursively(root.childrenData, false);
  updatedChildrenData = await iterateRecursively(updatedChildrenData, true);

  return {
    ...root,
    childrenData: updatedChildrenData,
  };
};
