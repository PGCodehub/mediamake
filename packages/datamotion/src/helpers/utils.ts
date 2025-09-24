export const createIdGenerator = ({
  prefix,
  size = 16,
  alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  separator = '-',
}: {
  prefix?: string;
  size?: number;
  alphabet?: string;
  separator?: string;
} = {}) => {
  const generator = () => {
    const alphabetLength = alphabet.length;
    const chars = new Array(size);
    for (let i = 0; i < size; i++) {
      chars[i] = alphabet[(Math.random() * alphabetLength) | 0];
    }
    return chars.join('');
  };
  if (prefix == null) {
    return generator;
  }
  if (alphabet.includes(separator)) {
    throw new Error(
      `The separator "${separator}" must not be part of the alphabet "${alphabet}".`
    );
  }
  return () => `${prefix}${separator}${generator()}`;
};
export const generateId = createIdGenerator();

import { RenderableComponentData } from '../schemas';

/**
 * Replaces matching components in the childrenData array with a replacement component
 * @param childrenData - Array of components to search through
 * @param targetIds - Array of IDs to match and replace
 * @param replacementComponent - The component to replace matching components with
 * @returns The modified childrenData array
 */
export const replaceMatchingComponent = (
  childrenData: RenderableComponentData[],
  targetIds: string[],
  replacementComponent: RenderableComponentData
): RenderableComponentData[] => {
  const replaceRecursively = (
    components: RenderableComponentData[]
  ): RenderableComponentData[] => {
    return components.map((component) => {
      // Check if this component's ID matches any target ID
      if (targetIds.includes(component.id)) {
        return replacementComponent;
      }

      // Recursively replace in childrenData if it exists
      if (component.childrenData && component.childrenData.length > 0) {
        return {
          ...component,
          childrenData: replaceRecursively(component.childrenData),
        };
      }

      return component;
    });
  };

  return replaceRecursively(childrenData);
};
