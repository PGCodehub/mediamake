import { toast } from 'sonner';

export interface ReferenceItem {
  key: string;
  type:
    | 'media'
    | 'medias'
    | 'captions'
    | 'string'
    | 'number'
    | 'boolean'
    | 'object'
    | 'objects';
  value: any;
}

export interface DefaultPresetData {
  references: ReferenceItem[];
}

/**
 * Processes input data to replace data:[key] references with actual values from baseData
 * @param inputData - The input data to process
 * @param baseData - The base data containing references
 * @returns Processed input data with references resolved
 */
export function processDataReferences(
  inputData: any,
  baseData: Record<string, any>,
): any {
  if (!inputData || !baseData) {
    return inputData;
  }

  // Deep clone to avoid mutating original data
  const processedData = JSON.parse(JSON.stringify(inputData));

  return processDataReferencesRecursive(processedData, baseData);
}

/**
 * Recursively processes data references in nested objects and arrays
 */
function processDataReferencesRecursive(
  data: any,
  baseData: Record<string, any>,
): any {
  if (typeof data === 'string') {
    // Check if this is a data:[key] or data:[key][range] reference
    if (data.startsWith('data:[')) {
      const match = data.match(/^data:\[([^\]]+)\](?:\[([^\]]+)\])?$/);
      if (match) {
        const key = match[1].trim();
        const range = match[2];

        if (baseData[key] !== undefined) {
          const referenceValue = baseData[key];

          // If it's an array and has a range, process the range
          if (Array.isArray(referenceValue) && range) {
            return processArrayRange(referenceValue, range, 'array');
          }

          // If it's a captions array and has a time range, process the time range
          if (
            referenceValue &&
            typeof referenceValue === 'object' &&
            referenceValue.captions &&
            Array.isArray(referenceValue.captions) &&
            range
          ) {
            return processArrayRange(
              referenceValue.captions,
              range,
              'captions',
            );
          }

          return referenceValue;
        } else {
          toast.error(`Reference '${key}' not found in base data`);
          console.warn(
            `Data reference '${key}' not found in base data:`,
            baseData,
          );
          return data;
        }
      }
    }
    return processStringReference(data, baseData);
  }

  if (Array.isArray(data)) {
    return data.map(item => processDataReferencesRecursive(item, baseData));
  }

  if (data && typeof data === 'object') {
    const processed: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Process all values recursively first
      processed[key] = processDataReferencesRecursive(value, baseData);
    }
    return processed;
  }

  return data;
}

/**
 * Processes a string value to replace data:[key] references with range support
 */
function processStringReference(
  value: string,
  baseData: Record<string, any>,
): any {
  if (typeof value !== 'string') {
    return value;
  }

  // Match data:[key] or data:[key][range] pattern
  const dataReferencePattern = /data:\[([^\]]+)\](?:\[([^\]]+)\])?/g;

  return value.replace(dataReferencePattern, (match, key, range) => {
    const trimmedKey = key.trim();

    if (baseData[trimmedKey] !== undefined) {
      const referenceValue = baseData[trimmedKey];

      // Handle media objects - extract src for string fields
      if (referenceValue && typeof referenceValue === 'object') {
        // Check for direct src property
        if (referenceValue.src) {
          return referenceValue.src;
        }
        // Check for nested metadata.src property
        if (referenceValue.metadata && referenceValue.metadata.src) {
          return referenceValue.metadata.src;
        }
        // Check for filePath property as fallback
        if (referenceValue.filePath) {
          return referenceValue.filePath;
        }
        // Check for caption title property
        if (referenceValue.title) {
          return referenceValue.title;
        }
        // Check for caption text property
        if (referenceValue.text) {
          return referenceValue.text;
        }
        // Check for captions array property
        if (referenceValue.captions && Array.isArray(referenceValue.captions)) {
          return processArrayRange(referenceValue.captions, range, 'captions');
        }
      }

      // If referenceValue is already an array, apply range if specified
      if (Array.isArray(referenceValue)) {
        return processArrayRange(referenceValue, range, 'array');
      }

      return referenceValue;
    } else {
      // Show error toast for missing reference
      toast.error(`Reference '${trimmedKey}' not found in base data`);
      console.warn(
        `Data reference '${trimmedKey}' not found in base data:`,
        baseData,
      );
      return match; // Return original string if reference not found
    }
  });
}

/**
 * Processes array range selection
 * @param array - The array to process
 * @param range - The range specification (e.g., "2-33", "1:04-2:03")
 * @param type - The type of array ("array" for index ranges, "captions" for time ranges)
 */
function processArrayRange(
  array: any[],
  range: string | undefined,
  type: 'array' | 'captions',
): any[] {
  if (!range || !Array.isArray(array)) {
    return array;
  }

  // Auto-detect time range format (MM:SS-MM:SS) vs index range format (N-N)
  const isTimeRange = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/.test(range);
  const isIndexRange = /^\d+-\d+$/.test(range);

  if (isTimeRange) {
    return processTimeRange(array, range);
  } else if (isIndexRange) {
    return processIndexRange(array, range);
  } else {
    console.warn(`Unknown range format: ${range}`);
    return array;
  }
}

/**
 * Processes index-based range selection (e.g., "2-33")
 */
function processIndexRange(array: any[], range: string): any[] {
  const rangeMatch = range.match(/^(\d+)-(\d+)$/);
  if (!rangeMatch) {
    console.warn(`Invalid index range format: ${range}`);
    return array;
  }

  const startIndex = parseInt(rangeMatch[1], 10);
  const endIndex = parseInt(rangeMatch[2], 10);

  if (startIndex < 0 || endIndex >= array.length || startIndex > endIndex) {
    console.warn(
      `Invalid range ${startIndex}-${endIndex} for array of length ${array.length}`,
    );
    return array;
  }

  return array.slice(startIndex, endIndex + 1);
}

/**
 * Processes time-based range selection for captions (e.g., "1:04-2:03")
 */
function processTimeRange(captions: any[], range: string): any[] {
  // More flexible regex to handle different time formats
  const timeRangeMatch = range.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!timeRangeMatch) {
    console.warn(
      `Invalid time range format: ${range}. Expected format: MM:SS-MM:SS`,
    );
    return captions;
  }

  const startMinutes = parseInt(timeRangeMatch[1], 10);
  const startSeconds = parseInt(timeRangeMatch[2], 10);
  const endMinutes = parseInt(timeRangeMatch[3], 10);
  const endSeconds = parseInt(timeRangeMatch[4], 10);

  const startTime = startMinutes * 60 + startSeconds;
  const endTime = endMinutes * 60 + endSeconds;

  return captions.filter((caption: any) => {
    // Check if caption has absoluteStart and absoluteEnd properties
    if (
      typeof caption.absoluteStart === 'number' &&
      typeof caption.absoluteEnd === 'number'
    ) {
      // Check if caption overlaps with the time range
      return caption.absoluteStart < endTime && caption.absoluteEnd > startTime;
    }

    // Fallback to start/end if absoluteStart/absoluteEnd not available
    if (typeof caption.start === 'number' && typeof caption.end === 'number') {
      return caption.start < endTime && caption.end > startTime;
    }

    return false;
  });
}

/**
 * Validates that all data references in input data exist in baseData
 * @param inputData - The input data to validate
 * @param baseData - The base data containing references
 * @returns Array of missing reference keys
 */
export function validateDataReferences(
  inputData: any,
  baseData: Record<string, any>,
): string[] {
  const missingReferences: string[] = [];

  if (!inputData || !baseData) {
    return missingReferences;
  }

  validateDataReferencesRecursive(inputData, baseData, missingReferences);
  return missingReferences;
}

/**
 * Recursively validates data references
 */
function validateDataReferencesRecursive(
  data: any,
  baseData: Record<string, any>,
  missingReferences: string[],
): void {
  if (typeof data === 'string') {
    const dataReferencePattern = /data:\[([^\]]+)\]/g;
    let match;

    while ((match = dataReferencePattern.exec(data)) !== null) {
      const key = match[1].trim();
      if (baseData[key] === undefined) {
        if (!missingReferences.includes(key)) {
          missingReferences.push(key);
        }
      }
    }
  } else if (Array.isArray(data)) {
    data.forEach(item =>
      validateDataReferencesRecursive(item, baseData, missingReferences),
    );
  } else if (data && typeof data === 'object') {
    Object.values(data).forEach(value =>
      validateDataReferencesRecursive(value, baseData, missingReferences),
    );
  }
}

/**
 * Creates a base data object from references array
 * @param references - Array of reference items
 * @returns Base data object
 */
export function createBaseDataFromReferences(
  references: ReferenceItem[],
): Record<string, any> {
  const baseData: Record<string, any> = {};

  references.forEach(ref => {
    baseData[ref.key] = ref.value;
  });

  return baseData;
}

/**
 * Processes preset input data with base data references
 * This is the main function to use for processing preset inputs
 * @param inputData - The preset input data
 * @param baseData - The base data containing references
 * @returns Processed input data with all references resolved
 */
export function processPresetInputData(
  inputData: any,
  baseData: Record<string, any>,
): any {
  if (!baseData || Object.keys(baseData).length === 0) {
    return inputData;
  }

  return processDataReferences(inputData, baseData);
}

/**
 * Processes object references with flexible merging
 * This allows partial object mapping where reference provides base data
 * and the input can override or add additional fields
 * @param inputData - The input data containing object references
 * @param baseData - The base data containing references
 * @returns Processed input data with flexible object merging
 */
export function processFlexibleObjectReferences(
  inputData: any,
  baseData: Record<string, any>,
): any {
  if (!inputData || !baseData) {
    return inputData;
  }

  const processed = JSON.parse(JSON.stringify(inputData));
  return processFlexibleObjectReferencesRecursive(processed, baseData);
}

/**
 * Recursively processes flexible object references
 */
function processFlexibleObjectReferencesRecursive(
  data: any,
  baseData: Record<string, any>,
): any {
  if (typeof data === 'string') {
    // Handle string references
    if (data.startsWith('data:[') && data.endsWith(']')) {
      const refKey = data.slice(6, -1).trim();
      if (baseData[refKey] !== undefined) {
        return baseData[refKey];
      }
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item =>
      processFlexibleObjectReferencesRecursive(item, baseData),
    );
  }

  if (data && typeof data === 'object') {
    const processed: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (
        typeof value === 'string' &&
        value.startsWith('data:[') &&
        value.endsWith(']')
      ) {
        const refKey = value.slice(6, -1).trim();
        if (baseData[refKey] !== undefined) {
          const referenceValue = baseData[refKey];

          // If reference is an object, merge with any existing object data
          if (
            typeof referenceValue === 'object' &&
            !Array.isArray(referenceValue)
          ) {
            processed[key] = {
              ...referenceValue,
              ...(typeof data[key] === 'object' ? data[key] : {}),
            };
          } else {
            processed[key] = referenceValue;
          }
        } else {
          processed[key] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects
        processed[key] = processFlexibleObjectReferencesRecursive(
          value,
          baseData,
        );
      } else {
        processed[key] = value;
      }
    }

    return processed;
  }

  return data;
}
