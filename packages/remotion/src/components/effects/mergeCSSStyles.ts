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

interface MergeOptions {
  // When true, if both parent and child define the same property/function at progress boundary,
  // prefer the parent's value over the child's (useful when child progress is 0)
  preferParentOnOverlap?: boolean;
}

// Merge CSS functions (like transform/filter) preserving parent order and resolving overlaps
const mergeFunctionStrings = (
  parentValue: string | undefined,
  childValue: string | undefined,
  preferParentOnOverlap: boolean
): string => {
  const parentFunctions = parseFunctionsString(parentValue);
  const childFunctions = parseFunctionsString(childValue);

  // Build final map while preserving the order of parent's functions
  const orderedFunctionNames: string[] = [];
  parentFunctions.forEach((_v, k) => orderedFunctionNames.push(k));
  childFunctions.forEach((_v, k) => {
    if (!orderedFunctionNames.includes(k)) {
      orderedFunctionNames.push(k);
    }
  });

  const finalFunctions = orderedFunctionNames.map((name) => {
    if (preferParentOnOverlap && parentFunctions.has(name)) {
      return parentFunctions.get(name)!;
    }
    // Default: child overrides when present, otherwise use parent
    return (childFunctions.get(name) ?? parentFunctions.get(name))!;
  });

  return finalFunctions.join(' ').trim();
};

// A smarter CSS style merging function
export const mergeCSSStyles = (
  parent: React.CSSProperties = {},
  child: React.CSSProperties = {},
  options: MergeOptions = {}
): React.CSSProperties => {
  const result: React.CSSProperties = { ...parent };
  const preferParentOnOverlap = Boolean(options.preferParentOnOverlap);

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
          result[key] = mergeFunctionStrings(
            pValue as string | undefined,
            cValue as string | undefined,
            preferParentOnOverlap
          );
          break;
        }

        case 'opacity':
          // At overlap preference, keep parent's opacity if both define it
          if (
            preferParentOnOverlap &&
            pValue !== undefined &&
            cValue !== undefined
          ) {
            const parentOpacity =
              typeof pValue === 'number' && !isNaN(pValue as number)
                ? (pValue as number)
                : 1;
            result.opacity = Math.max(0, Math.min(1, parentOpacity));
          } else {
            // Multiply opacities, ensuring they are within the 0-1 range
            const parentOpacity =
              typeof pValue === 'number' && !isNaN(pValue as number)
                ? (pValue as number)
                : 1;
            const childOpacity =
              typeof cValue === 'number' && !isNaN(cValue as number)
                ? (cValue as number)
                : 1;
            result.opacity = Math.max(
              0,
              Math.min(1, parentOpacity * childOpacity)
            );
          }
          break;

        case 'transformOrigin':
          result.transformOrigin = cValue;
          break;

        case 'color':
        case 'backgroundColor':
          result[key] = cValue;
          break;

        default:
          // For other properties, allow preferring parent on overlap
          if (preferParentOnOverlap && pValue !== undefined) {
            (result as any)[key] = pValue as any;
          } else {
            // Child overrides parent.
            (result as any)[key] = cValue as any;
          }
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
