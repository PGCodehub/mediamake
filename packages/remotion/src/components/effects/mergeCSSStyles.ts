import React from 'react';

type MergeableProperties =
  | 'transform'
  | 'filter'
  | 'opacity'
  | 'transformOrigin'
  | 'color'
  | 'backgroundColor';

// Parses a string of CSS functions (e.g., "scale(1.2) rotate(10deg)") into a map.
const parseFunctionsString = (
  functions: string | undefined
): Map<string, string> => {
  const result = new Map<string, string>();
  if (!functions) {
    return result;
  }
  // Regex to match CSS functions like `scale(1.5)` or `translateX(10px)`
  const regex = /(\w+)\(([^)]*)\)/g;
  let match;
  while ((match = regex.exec(functions)) !== null) {
    // match[1] is the function name (e.g., 'scale')
    // match[0] is the full function call (e.g., 'scale(1.5)')
    result.set(match[1], match[0]);
  }
  return result;
};

// A smarter CSS style merging function
export const mergeCSSStyles = (
  parent: React.CSSProperties = {},
  child: React.CSSProperties = {}
): React.CSSProperties => {
  const result: React.CSSProperties = { ...parent };

  for (const key in child) {
    if (Object.prototype.hasOwnProperty.call(child, key)) {
      const pValue = result[key as keyof React.CSSProperties];
      const cValue = child[key as keyof React.CSSProperties];

      // If child value is undefined or null, we keep the parent value (i.e., do nothing)
      if (cValue === undefined || cValue === null) {
        continue;
      }

      switch (key as MergeableProperties) {
        case 'transform':
        case 'filter': {
          const parentFunctions = parseFunctionsString(
            pValue as string | undefined
          );
          const childFunctions = parseFunctionsString(
            cValue as string | undefined
          );
          const mergedFunctions = new Map([
            ...parentFunctions,
            ...childFunctions,
          ]);
          result[key] = Array.from(mergedFunctions.values()).join(' ').trim();
          break;
        }

        case 'opacity':
          // Multiply opacities, ensuring they are within the 0-1 range
          const parentOpacity =
            typeof pValue === 'number' && !isNaN(pValue) ? pValue : 1;
          const childOpacity =
            typeof cValue === 'number' && !isNaN(cValue) ? cValue : 1;
          result.opacity = Math.max(
            0,
            Math.min(1, parentOpacity * childOpacity)
          );
          break;

        case 'transformOrigin':
          result.transformOrigin = cValue;
          break;

        case 'color':
        case 'backgroundColor':
          result[key] = cValue;
          break;

        default:
          // For other properties, child overrides parent.
          // This includes numeric properties that should not be combined (e.g., width, height).
          (result as any)[key] = cValue;
          break;
      }
    }
  }

  // Clean up empty transform/filter strings
  if (result.transform === '') {
    delete result.transform;
  }
  if (result.filter === '') {
    delete result.filter;
  }

  return result;
};

export default mergeCSSStyles;
