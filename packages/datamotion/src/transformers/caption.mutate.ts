import { generateId } from '../helpers/utils';
import {
  RenderableComponentData,
  TranscriptionSentence,
  TranscriptionWord,
} from '../schemas';

export interface CaptionMutatorOptions {
  idPrefix?: string;
  // Word and duration limits
  maxWordsPerSentence?: number;
  maxSentenceDuration?: number;
  minWordsPerSentence?: number;
  minSentenceDuration?: number;

  // Character limits
  maxCharactersPerSentence?: number;
  minCharactersPerSentence?: number;

  // Merge and split strategies
  mergeStrategy?: 'aggressive' | 'conservative' | 'balanced';
  splitStrategy?:
    | 'by-words'
    | 'by-duration'
    | 'by-punctuation'
    | 'smart'
    | 'none';

  // Timing adjustments
  timingAdjustment?: {
    paddingBefore?: number;
    paddingAfter?: number;
    minGapBetween?: number;
    maxGapBetween?: number;
  };

  // Text processing
  textProcessing?: {
    removeFillerWords?: boolean;
    capitalizeFirst?: boolean;
    addPunctuation?: boolean;
    normalizeSpacing?: boolean;
  };

  // Quality filters
  qualityFilters?: {
    minConfidence?: number;
    removeLowConfidence?: boolean;
    maxSentenceLength?: number;
  };

  // Output formatting
  outputFormat?: {
    preserveOriginalIds?: boolean;
    generateNewIds?: boolean;
    addMetadata?: boolean;
  };
}

export interface HumanCorrectionMutatorOptions {
  // Human corrected text (source of truth)
  humanCorrectedText: string;

  // Text cleaning options
  textCleaning?: {
    enabled?: boolean;
    removePatterns?: RegExp[]; // Array of regex patterns to remove
    removeParentheses?: boolean; // Remove content in () and []
    removeComments?: boolean; // Remove lines starting with /
    removeEmptyLines?: boolean; // Remove empty lines after cleaning
    preserveWhitespace?: boolean; // Preserve original whitespace structure
  };

  // Alignment strategies
  alignmentStrategy?: 'fuzzy' | 'exact' | 'semantic' | 'hybrid';

  // Word matching options
  wordMatching?: {
    caseSensitive?: boolean;
    ignorePunctuation?: boolean;
    fuzzyThreshold?: number; // 0-1, for fuzzy matching
    maxEditDistance?: number; // for edit distance matching
    complexityThreshold?: number; // 0-1, threshold for complex word replacements
    enableIntelligentReplacement?: boolean; // enable/disable intelligent replacement logic
  };

  // Timing preservation options
  timingPreservation?: {
    preserveOriginalTiming?: boolean;
    distributeTimingEvenly?: boolean;
    useConfidenceWeighting?: boolean;
    minWordDuration?: number;
    maxWordDuration?: number;
  };

  // Correction handling options
  correctionHandling?: {
    handleSplits?: boolean; // Split single word into multiple
    handleMerges?: boolean; // Merge multiple words into one
    handleInsertions?: boolean; // Add new words
    handleDeletions?: boolean; // Remove words
    preserveOriginalWords?: boolean; // Keep original words when no match found
  };

  // Fallback options
  fallbackOptions?: {
    useOriginalWhenNoMatch?: boolean;
    createPlaceholderWords?: boolean;
    skipUnmatchedSentences?: boolean;
    logAlignmentIssues?: boolean;
  };

  // Output formatting
  outputFormat?: {
    preserveOriginalIds?: boolean;
    generateNewIds?: boolean;
    addMetadata?: boolean;
    addCorrectionInfo?: boolean; // Add info about what was corrected
  };
}

export const captionMutator = (
  captions: TranscriptionSentence[],
  options: CaptionMutatorOptions = {}
): TranscriptionSentence[] => {
  const {
    maxWordsPerSentence = 15,
    maxSentenceDuration = 5,
    minWordsPerSentence = 1,
    minSentenceDuration = 0.5,
    maxCharactersPerSentence,
    minCharactersPerSentence = 1,
    mergeStrategy = 'balanced',
    splitStrategy = 'smart',
    timingAdjustment = {},
    textProcessing = {},
    qualityFilters = {},
    outputFormat = {},
  } = options;

  const {
    paddingBefore = 0,
    paddingAfter = 0,
    minGapBetween = 0.1,
    maxGapBetween = 2,
  } = timingAdjustment;

  const {
    removeFillerWords = false,
    capitalizeFirst = false,
    addPunctuation = false,
    normalizeSpacing = false,
  } = textProcessing;

  const {
    minConfidence = 0.1,
    removeLowConfidence = false,
    maxSentenceLength = 100,
  } = qualityFilters;

  const {
    preserveOriginalIds = false,
    generateNewIds = true,
    addMetadata = false,
  } = outputFormat;

  // Input validation
  if (!Array.isArray(captions)) {
    throw new Error('Captions must be an array');
  }

  if (maxWordsPerSentence < minWordsPerSentence) {
    throw new Error(
      'maxWordsPerSentence must be greater than or equal to minWordsPerSentence'
    );
  }

  if (maxSentenceDuration < minSentenceDuration) {
    throw new Error(
      'maxSentenceDuration must be greater than or equal to minSentenceDuration'
    );
  }

  if (
    maxCharactersPerSentence &&
    maxCharactersPerSentence < minCharactersPerSentence
  ) {
    throw new Error(
      'maxCharactersPerSentence must be greater than or equal to minCharactersPerSentence'
    );
  }

  // Helper functions
  const isFillerWord = (word: string): boolean => {
    const fillers = [
      'um',
      'uh',
      'ah',
      'er',
      'like',
      'you know',
      'so',
      'well',
      'actually',
    ];
    return fillers.includes(word.toLowerCase().trim());
  };

  const processText = (text: string): string => {
    let processed = text;

    if (normalizeSpacing) {
      processed = processed.replace(/\s+/g, ' ').trim();
    }

    if (capitalizeFirst) {
      processed = processed.charAt(0).toUpperCase() + processed.slice(1);
    }

    if (addPunctuation && !processed.match(/[.!?]$/)) {
      processed += '.';
    }

    return processed;
  };

  const filterWords = (words: TranscriptionWord[]): TranscriptionWord[] => {
    return words.filter((word) => {
      if (removeLowConfidence && word.confidence < minConfidence) {
        return false;
      }
      if (removeFillerWords && isFillerWord(word.text)) {
        return false;
      }
      return true;
    });
  };

  const splitSentence = (
    sentence: TranscriptionSentence
  ): TranscriptionSentence[] => {
    const words = filterWords(sentence.words);

    // If no words after filtering, return empty array
    if (words.length === 0) {
      return [];
    }

    // Check if sentence needs splitting
    const needsSplitting =
      words.length > maxWordsPerSentence ||
      sentence.duration > maxSentenceDuration ||
      (maxCharactersPerSentence &&
        sentence.text.length > maxCharactersPerSentence);

    if (!needsSplitting) {
      return [sentence];
    }

    // Handle different split strategies
    switch (splitStrategy) {
      case 'by-words':
        return splitByWords(words, sentence);
      case 'by-duration':
        return splitByDuration(words, sentence);
      case 'by-punctuation':
        return splitByPunctuation(words, sentence);
      case 'smart':
        return splitSmart(words, sentence);
      case 'none':
        return [sentence];
      default:
        return splitSmart(words, sentence);
    }
  };

  const splitByWords = (
    words: TranscriptionWord[],
    sentence: TranscriptionSentence
  ): TranscriptionSentence[] => {
    const chunks: TranscriptionWord[][] = [];
    let currentChunk: TranscriptionWord[] = [];

    for (const word of words) {
      if (currentChunk.length >= maxWordsPerSentence) {
        chunks.push([...currentChunk]);
        currentChunk = [word];
      } else {
        currentChunk.push(word);
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return createSentencesFromChunks(chunks, sentence);
  };

  const splitByDuration = (
    words: TranscriptionWord[],
    sentence: TranscriptionSentence
  ): TranscriptionSentence[] => {
    const chunks: TranscriptionWord[][] = [];
    let currentChunk: TranscriptionWord[] = [];
    let currentDuration = 0;

    for (const word of words) {
      if (
        currentDuration + word.duration > maxSentenceDuration &&
        currentChunk.length > 0
      ) {
        chunks.push([...currentChunk]);
        currentChunk = [word];
        currentDuration = word.duration;
      } else {
        currentChunk.push(word);
        currentDuration += word.duration;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return createSentencesFromChunks(chunks, sentence);
  };

  const splitByPunctuation = (
    words: TranscriptionWord[],
    sentence: TranscriptionSentence
  ): TranscriptionSentence[] => {
    const chunks: TranscriptionWord[][] = [];
    let currentChunk: TranscriptionWord[] = [];
    let currentDuration = 0;
    let currentCharCount = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordCharCount = word.text.length;
      const wouldExceedWords = currentChunk.length >= maxWordsPerSentence;
      const wouldExceedDuration =
        currentDuration + word.duration > maxSentenceDuration;
      // More flexible character limit - allow reasonable threshold adjustment
      const currentCharCountWithWord =
        currentCharCount + wordCharCount + (currentChunk.length > 0 ? 1 : 0);
      const wouldExceedChars =
        maxCharactersPerSentence &&
        currentCharCountWithWord > maxCharactersPerSentence * 1.2; // 20% tolerance

      // Check if current word ends with punctuation
      const hasPunctuation = /[,.?!]$/.test(word.text);

      // If we have punctuation, we can split here
      if (hasPunctuation) {
        currentChunk.push(word);
        currentDuration += word.duration;
        currentCharCount += wordCharCount + (currentChunk.length > 1 ? 1 : 0);

        chunks.push([...currentChunk]);
        currentChunk = [];
        currentDuration = 0;
        currentCharCount = 0;
      } else {
        // Check if we need to split due to limits
        const needsSplit =
          (wouldExceedWords || wouldExceedDuration || wouldExceedChars) &&
          currentChunk.length > 0;

        if (needsSplit) {
          // Force split at word boundary since no punctuation found
          chunks.push([...currentChunk]);
          currentChunk = [word];
          currentDuration = word.duration;
          currentCharCount = wordCharCount;
        } else {
          currentChunk.push(word);
          currentDuration += word.duration;
          currentCharCount += wordCharCount + (currentChunk.length > 1 ? 1 : 0);
        }
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return createSentencesFromChunks(chunks, sentence);
  };

  const splitSmart = (
    words: TranscriptionWord[],
    sentence: TranscriptionSentence
  ): TranscriptionSentence[] => {
    const chunks: TranscriptionWord[][] = [];
    let currentChunk: TranscriptionWord[] = [];
    let currentDuration = 0;
    let currentCharCount = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordCharCount = word.text.length;
      const wouldExceedWords = currentChunk.length >= maxWordsPerSentence;
      const wouldExceedDuration =
        currentDuration + word.duration > maxSentenceDuration;

      // More flexible character limit - allow reasonable threshold adjustment
      const currentCharCountWithWord =
        currentCharCount + wordCharCount + (currentChunk.length > 0 ? 1 : 0);
      const wouldExceedChars =
        maxCharactersPerSentence &&
        currentCharCountWithWord > maxCharactersPerSentence * 1.2; // 20% tolerance

      // Check if current word ends with punctuation
      const hasPunctuation = /[,.?!]$/.test(word.text);

      // Check if we need to split
      const needsSplit =
        (wouldExceedWords || wouldExceedDuration || wouldExceedChars) &&
        currentChunk.length > 0;

      if (needsSplit) {
        // Look for punctuation in current chunk to find a good split point
        let splitIndex = currentChunk.length;

        if (splitStrategy === 'smart') {
          // Look backwards for punctuation
          for (let j = currentChunk.length - 1; j >= 0; j--) {
            const chunkWord = currentChunk[j];
            if (/[,.?!]$/.test(chunkWord.text)) {
              splitIndex = j + 1;
              break;
            }
          }

          // If no punctuation found, check if we can wait for punctuation
          if (splitIndex === currentChunk.length) {
            // Check if splitting would create chunks below minimum requirements
            const remainingWords = words.length - i;
            const wouldCreateTooSmallChunk =
              currentChunk.length - 1 < minWordsPerSentence ||
              remainingWords < minWordsPerSentence;

            // If we're only exceeding character limits (not word/duration),
            // and we're not too far over, try to find punctuation in upcoming words
            if (
              wouldExceedChars &&
              !wouldExceedWords &&
              !wouldExceedDuration &&
              currentCharCountWithWord <= maxCharactersPerSentence * 1.5
            ) {
              // Look ahead for punctuation in the next few words
              let foundPunctuationAhead = false;
              for (let k = i; k < Math.min(i + 3, words.length); k++) {
                if (/[,.?!]$/.test(words[k].text)) {
                  foundPunctuationAhead = true;
                  break;
                }
              }

              if (foundPunctuationAhead && !wouldCreateTooSmallChunk) {
                // Continue building the chunk to reach the punctuation
                currentChunk.push(word);
                currentDuration += word.duration;
                currentCharCount +=
                  wordCharCount + (currentChunk.length > 1 ? 1 : 0);
                continue;
              }
            }

            if (wouldCreateTooSmallChunk) {
              // Don't split, just add the word and continue
              currentChunk.push(word);
              currentDuration += word.duration;
              currentCharCount +=
                wordCharCount + (currentChunk.length > 1 ? 1 : 0);
              continue;
            }

            // Split at word boundary (don't split words)
            splitIndex = currentChunk.length;
          }
        }

        // Create chunks based on split index
        if (splitIndex > 0) {
          chunks.push(currentChunk.slice(0, splitIndex));
          currentChunk = currentChunk.slice(splitIndex);

          // Recalculate current chunk metrics
          currentDuration = currentChunk.reduce(
            (sum, w) => sum + w.duration,
            0
          );
          currentCharCount = currentChunk.reduce(
            (sum, w, idx) => sum + w.text.length + (idx > 0 ? 1 : 0),
            0
          );
        } else {
          chunks.push([...currentChunk]);
          currentChunk = [];
          currentDuration = 0;
          currentCharCount = 0;
        }
      }

      // Add current word to chunk
      currentChunk.push(word);
      currentDuration += word.duration;
      currentCharCount += wordCharCount + (currentChunk.length > 1 ? 1 : 0);
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return createSentencesFromChunks(chunks, sentence);
  };

  const createSentencesFromChunks = (
    chunks: TranscriptionWord[][],
    originalSentence: TranscriptionSentence
  ): TranscriptionSentence[] => {
    const validChunks = chunks.filter((chunk) => chunk.length > 0); // Filter out empty chunks

    // If no valid chunks, return the original sentence
    if (validChunks.length === 0) {
      return [originalSentence];
    }

    return validChunks.map((chunk, index) => {
      // Calculate absolute timestamps
      const absoluteStart = chunk[0].absoluteStart || chunk[0].start;
      const absoluteEnd =
        chunk[chunk.length - 1].absoluteEnd || chunk[chunk.length - 1].end;
      const text = processText(chunk.map((w) => w.text).join(' '));

      // Recalculate relative timings (first word starts at 0)
      const adjustedWords = chunk.map((word, wordIndex) => {
        const wordAbsoluteStart = word.absoluteStart || word.start;
        const wordAbsoluteEnd = word.absoluteEnd || word.end;

        return {
          ...word,
          start: wordIndex === 0 ? 0 : wordAbsoluteStart - absoluteStart,
          end: wordAbsoluteEnd - absoluteStart,
          duration: wordAbsoluteEnd - wordAbsoluteStart,
          absoluteStart: wordAbsoluteStart,
          absoluteEnd: wordAbsoluteEnd,
        };
      });

      return {
        id: generateNewIds ? generateId() : `${originalSentence.id}_${index}`,
        text,
        start: 0, // First word always starts at 0
        end: absoluteEnd - absoluteStart,
        duration: absoluteEnd - absoluteStart,
        absoluteStart: absoluteStart - paddingBefore,
        absoluteEnd: absoluteEnd + paddingAfter,
        words: adjustedWords,
      };
    });
  };

  const mergeSentences = (
    sentences: TranscriptionSentence[]
  ): TranscriptionSentence[] => {
    if (mergeStrategy === 'conservative') {
      return sentences;
    }

    const merged: TranscriptionSentence[] = [];
    let currentGroup: TranscriptionSentence[] = [];

    for (const sentence of sentences) {
      const words = filterWords(sentence.words);

      if (
        words.length < minWordsPerSentence ||
        sentence.duration < minSentenceDuration
      ) {
        currentGroup.push(sentence);
        continue;
      }

      const totalWords =
        currentGroup.reduce((sum, s) => sum + s.words.length, 0) + words.length;
      const totalDuration =
        currentGroup.reduce((sum, s) => sum + s.duration, 0) +
        sentence.duration;
      const totalChars =
        currentGroup.reduce((sum, s) => sum + s.text.length, 0) +
        sentence.text.length;
      const gap =
        currentGroup.length > 0
          ? sentence.start - currentGroup[currentGroup.length - 1].end
          : 0;

      const shouldMerge =
        mergeStrategy === 'aggressive' ||
        (mergeStrategy === 'balanced' &&
          totalWords <= maxWordsPerSentence &&
          totalDuration <= maxSentenceDuration &&
          (!maxCharactersPerSentence ||
            totalChars <= maxCharactersPerSentence * 1.2) && // 20% tolerance for merging
          gap <= maxGapBetween);

      if (shouldMerge && currentGroup.length > 0) {
        currentGroup.push(sentence);
      } else {
        if (currentGroup.length > 0) {
          merged.push(mergeSentenceGroup(currentGroup));
          currentGroup = [];
        }
        currentGroup.push(sentence);
      }
    }

    if (currentGroup.length > 0) {
      merged.push(mergeSentenceGroup(currentGroup));
    }

    return merged;
  };

  const mergeSentenceGroup = (
    group: TranscriptionSentence[]
  ): TranscriptionSentence => {
    const allWords = group
      .flatMap((s) => s.words)
      .sort(
        (a, b) => (a.absoluteStart || a.start) - (b.absoluteStart || b.start)
      );

    // Calculate absolute timestamps
    const absoluteStart = Math.min(
      ...group.map((s) => s.absoluteStart || s.start)
    );
    const absoluteEnd = Math.max(...group.map((s) => s.absoluteEnd || s.end));
    const text = processText(group.map((s) => s.text).join(' '));

    // Recalculate relative timings (first word starts at 0)
    const adjustedWords = allWords.map((word, wordIndex) => {
      const wordAbsoluteStart = word.absoluteStart || word.start;
      const wordAbsoluteEnd = word.absoluteEnd || word.end;

      return {
        ...word,
        start: wordIndex === 0 ? 0 : wordAbsoluteStart - absoluteStart,
        end: wordAbsoluteEnd - absoluteStart,
        duration: wordAbsoluteEnd - wordAbsoluteStart,
        absoluteStart: wordAbsoluteStart,
        absoluteEnd: wordAbsoluteEnd,
      };
    });

    return {
      id: generateNewIds ? generateId() : group[0].id,
      text,
      start: 0, // First word always starts at 0
      end: absoluteEnd - absoluteStart,
      duration: absoluteEnd - absoluteStart,
      absoluteStart: absoluteStart - paddingBefore,
      absoluteEnd: absoluteEnd + paddingAfter,
      words: adjustedWords,
    };
  };

  // Main processing pipeline
  let processedCaptions = [...captions];

  // Apply quality filters
  if (removeLowConfidence || removeFillerWords) {
    const filteredResults: TranscriptionSentence[] = [];

    for (const sentence of processedCaptions) {
      const filteredWords = filterWords(sentence.words);

      if (filteredWords.length === 0) {
        continue;
      }

      // Recalculate relative timings after filtering
      const absoluteStart = Math.min(
        ...filteredWords.map((w) => w.absoluteStart || w.start)
      );
      const absoluteEnd = Math.max(
        ...filteredWords.map((w) => w.absoluteEnd || w.end)
      );

      const adjustedWords = filteredWords.map((word, wordIndex) => {
        const wordAbsoluteStart = word.absoluteStart || word.start;
        const wordAbsoluteEnd = word.absoluteEnd || word.end;

        return {
          ...word,
          start: wordIndex === 0 ? 0 : wordAbsoluteStart - absoluteStart,
          end: wordAbsoluteEnd - absoluteStart,
          duration: wordAbsoluteEnd - wordAbsoluteStart,
          absoluteStart: wordAbsoluteStart,
          absoluteEnd: wordAbsoluteEnd,
        };
      });

      filteredResults.push({
        ...sentence,
        words: adjustedWords,
        text: processText(sentence.text),
        start: 0, // First word always starts at 0
        end: absoluteEnd - absoluteStart,
        duration: absoluteEnd - absoluteStart,
        absoluteStart: sentence.absoluteStart || sentence.start,
        absoluteEnd: sentence.absoluteEnd || sentence.end,
      });
    }

    processedCaptions = filteredResults;
  }

  // Split long sentences
  if (splitStrategy !== 'none') {
    const splitResults: TranscriptionSentence[] = [];
    for (const sentence of processedCaptions) {
      splitResults.push(...splitSentence(sentence));
    }
    processedCaptions = splitResults;
  }

  // Merge short sentences
  processedCaptions = mergeSentences(processedCaptions);

  // Final validation and cleanup
  processedCaptions = processedCaptions.filter((sentence) => {
    const words = sentence.words;
    const textLength = sentence.text.length;
    const isValid =
      words.length >= minWordsPerSentence &&
      sentence.duration >= minSentenceDuration &&
      textLength >= minCharactersPerSentence &&
      textLength <= maxSentenceLength &&
      (!maxCharactersPerSentence ||
        textLength <= maxCharactersPerSentence * 1.3); // 30% tolerance for final validation

    return isValid;
  });

  // Add metadata if requested
  if (addMetadata) {
    processedCaptions = processedCaptions.map((sentence) => ({
      ...sentence,
      metadata: {
        originalWordCount: sentence.words.length,
        processedAt: new Date().toISOString(),
        confidence:
          sentence.words.reduce((sum, w) => sum + w.confidence, 0) /
          sentence.words.length,
      },
    }));
  }

  return processedCaptions;
};

// Utility functions for common caption operations

export const createPresetOptions = {
  // For social media (short, punchy captions)
  socialMedia: (): CaptionMutatorOptions => ({
    maxWordsPerSentence: 8,
    maxSentenceDuration: 3,
    minWordsPerSentence: 2,
    minSentenceDuration: 1,
    maxCharactersPerSentence: 60,
    minCharactersPerSentence: 5,
    mergeStrategy: 'aggressive',
    splitStrategy: 'smart',
    textProcessing: {
      removeFillerWords: true,
      capitalizeFirst: true,
      addPunctuation: true,
      normalizeSpacing: true,
    },
    qualityFilters: {
      minConfidence: 0.7,
      removeLowConfidence: true,
      maxSentenceLength: 50,
    },
  }),

  // For educational content (longer, more detailed)
  educational: (): CaptionMutatorOptions => ({
    maxWordsPerSentence: 20,
    maxSentenceDuration: 8,
    minWordsPerSentence: 3,
    minSentenceDuration: 1.5,
    maxCharactersPerSentence: 120,
    minCharactersPerSentence: 10,
    mergeStrategy: 'balanced',
    splitStrategy: 'by-punctuation',
    textProcessing: {
      removeFillerWords: true,
      capitalizeFirst: true,
      addPunctuation: true,
      normalizeSpacing: true,
    },
    qualityFilters: {
      minConfidence: 0.6,
      removeLowConfidence: false,
      maxSentenceLength: 150,
    },
  }),

  // For accessibility (clear, well-spaced)
  accessibility: (): CaptionMutatorOptions => ({
    maxWordsPerSentence: 12,
    maxSentenceDuration: 4,
    minWordsPerSentence: 2,
    minSentenceDuration: 1,
    maxCharactersPerSentence: 80,
    minCharactersPerSentence: 8,
    mergeStrategy: 'conservative',
    splitStrategy: 'smart',
    timingAdjustment: {
      paddingBefore: 0.2,
      paddingAfter: 0.2,
      minGapBetween: 0.3,
      maxGapBetween: 1.5,
    },
    textProcessing: {
      removeFillerWords: true,
      capitalizeFirst: true,
      addPunctuation: true,
      normalizeSpacing: true,
    },
    qualityFilters: {
      minConfidence: 0.8,
      removeLowConfidence: true,
      maxSentenceLength: 80,
    },
  }),

  // For live streaming (real-time processing)
  liveStream: (): CaptionMutatorOptions => ({
    maxWordsPerSentence: 10,
    maxSentenceDuration: 3,
    minWordsPerSentence: 1,
    minSentenceDuration: 0.5,
    maxCharactersPerSentence: 50,
    minCharactersPerSentence: 3,
    mergeStrategy: 'aggressive',
    splitStrategy: 'by-words',
    textProcessing: {
      removeFillerWords: false, // Keep fillers for natural speech
      capitalizeFirst: true,
      addPunctuation: false, // Don't add punctuation for live
      normalizeSpacing: true,
    },
    qualityFilters: {
      minConfidence: 0.4, // Lower threshold for live
      removeLowConfidence: false,
      maxSentenceLength: 60,
    },
  }),
};

export const analyzeCaptions = (captions: TranscriptionSentence[]) => {
  const stats = {
    totalSentences: captions.length,
    totalWords: captions.reduce((sum, s) => sum + s.words.length, 0),
    totalDuration: captions.reduce((sum, s) => sum + s.duration, 0),
    averageWordsPerSentence: 0,
    averageSentenceDuration: 0,
    averageConfidence: 0,
    longestSentence: { text: '', duration: 0 },
    shortestSentence: { text: '', duration: Infinity },
    wordCountDistribution: {} as Record<number, number>,
    durationDistribution: {} as Record<string, number>,
  };

  if (captions.length === 0) return stats;

  // Calculate averages
  stats.averageWordsPerSentence = stats.totalWords / stats.totalSentences;
  stats.averageSentenceDuration = stats.totalDuration / stats.totalSentences;

  // Calculate average confidence
  const totalConfidence = captions.reduce(
    (sum, s) => sum + s.words.reduce((wordSum, w) => wordSum + w.confidence, 0),
    0
  );
  stats.averageConfidence = totalConfidence / stats.totalWords;

  // Find longest and shortest sentences
  for (const sentence of captions) {
    if (sentence.duration > stats.longestSentence.duration) {
      stats.longestSentence = {
        text: sentence.text,
        duration: sentence.duration,
      };
    }
    if (sentence.duration < stats.shortestSentence.duration) {
      stats.shortestSentence = {
        text: sentence.text,
        duration: sentence.duration,
      };
    }

    // Word count distribution
    const wordCount = sentence.words.length;
    stats.wordCountDistribution[wordCount] =
      (stats.wordCountDistribution[wordCount] || 0) + 1;

    // Duration distribution (rounded to nearest 0.5s)
    const durationBucket = Math.round(sentence.duration * 2) / 2;
    stats.durationDistribution[durationBucket] =
      (stats.durationDistribution[durationBucket] || 0) + 1;
  }

  return stats;
};

export const validateCaptions = (
  captions: TranscriptionSentence[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!Array.isArray(captions)) {
    errors.push('Captions must be an array');
    return { isValid: false, errors };
  }

  for (let i = 0; i < captions.length; i++) {
    const caption = captions[i];

    if (!caption.id) {
      errors.push(`Caption at index ${i} is missing an id`);
    }

    if (!caption.text || typeof caption.text !== 'string') {
      errors.push(`Caption at index ${i} has invalid text`);
    }

    if (typeof caption.start !== 'number' || caption.start < 0) {
      errors.push(`Caption at index ${i} has invalid start time`);
    }

    if (typeof caption.end !== 'number' || caption.end <= caption.start) {
      errors.push(`Caption at index ${i} has invalid end time`);
    }

    if (typeof caption.duration !== 'number' || caption.duration <= 0) {
      errors.push(`Caption at index ${i} has invalid duration`);
    }

    if (!Array.isArray(caption.words)) {
      errors.push(`Caption at index ${i} has invalid words array`);
    } else {
      for (let j = 0; j < caption.words.length; j++) {
        const word = caption.words[j];

        if (!word.text || typeof word.text !== 'string') {
          errors.push(
            `Caption at index ${i}, word at index ${j} has invalid text`
          );
        }

        if (typeof word.start !== 'number' || word.start < 0) {
          errors.push(
            `Caption at index ${i}, word at index ${j} has invalid start time`
          );
        }

        if (typeof word.end !== 'number' || word.end <= word.start) {
          errors.push(
            `Caption at index ${i}, word at index ${j} has invalid end time`
          );
        }

        if (
          typeof word.confidence !== 'number' ||
          word.confidence < 0 ||
          word.confidence > 1
        ) {
          errors.push(
            `Caption at index ${i}, word at index ${j} has invalid confidence`
          );
        }
      }
    }
  }

  return { isValid: errors.length === 0, errors };
};

export const exportCaptions = {
  srt: (captions: TranscriptionSentence[]): string => {
    return captions
      .map((caption, index) => {
        const startTime = formatSRTTime(caption.start);
        const endTime = formatSRTTime(caption.end);
        return `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n`;
      })
      .join('\n');
  },

  vtt: (captions: TranscriptionSentence[]): string => {
    const header = 'WEBVTT\n\n';
    const body = captions
      .map((caption) => {
        const startTime = formatVTTTime(caption.start);
        const endTime = formatVTTTime(caption.end);
        return `${startTime} --> ${endTime}\n${caption.text}`;
      })
      .join('\n\n');
    return header + body;
  },

  json: (captions: TranscriptionSentence[]): string => {
    return JSON.stringify(captions, null, 2);
  },
};

const formatSRTTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
};

const formatVTTTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

// Human Correction Mutator
export const humanCorrectionMutator = (
  captions: TranscriptionSentence[],
  options: HumanCorrectionMutatorOptions
): TranscriptionSentence[] => {
  const {
    humanCorrectedText,
    textCleaning = {},
    alignmentStrategy = 'hybrid',
    wordMatching = {},
    timingPreservation = {},
    correctionHandling = {},
    fallbackOptions = {},
    outputFormat = {},
  } = options;

  const {
    enabled: textCleaningEnabled = true,
    removePatterns = [],
    removeParentheses = true,
    removeComments = true,
    removeEmptyLines = true,
    preserveWhitespace = false,
  } = textCleaning;

  const {
    caseSensitive = false,
    ignorePunctuation = true,
    fuzzyThreshold = 0.8,
    maxEditDistance = 2,
    complexityThreshold = 0.6,
    enableIntelligentReplacement = true,
  } = wordMatching;

  const {
    preserveOriginalTiming = true,
    distributeTimingEvenly = false,
    useConfidenceWeighting = true,
    minWordDuration = 0.1,
    maxWordDuration = 3.0,
  } = timingPreservation;

  const {
    handleSplits = true,
    handleMerges = true,
    handleInsertions = true,
    handleDeletions = true,
    preserveOriginalWords = true,
  } = correctionHandling;

  const {
    useOriginalWhenNoMatch = true,
    createPlaceholderWords = false,
    skipUnmatchedSentences = false,
    logAlignmentIssues = false,
  } = fallbackOptions;

  const {
    preserveOriginalIds = false,
    generateNewIds = true,
    addMetadata = false,
    addCorrectionInfo = true,
  } = outputFormat;

  // Input validation
  if (!humanCorrectedText || typeof humanCorrectedText !== 'string') {
    throw new Error('humanCorrectedText is required and must be a string');
  }

  if (!Array.isArray(captions)) {
    throw new Error('Captions must be an array');
  }

  // Text cleaning function
  const cleanText = (text: string): string => {
    if (!textCleaningEnabled) {
      return text;
    }

    let cleanedText = text;

    // Remove content in parentheses and brackets (but preserve line structure)
    if (removeParentheses) {
      cleanedText = cleanedText
        .split('\n')
        .map((line) => {
          const trimmedLine = line.trim();
          // Remove section headers like "(Verse 1)", "(Chorus)", etc.
          if (trimmedLine.match(/^\([^)]*\)$/)) {
            return ''; // Remove the entire line
          }
          // Remove parentheses content but keep the line
          return line.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
        })
        .join('\n');
    }

    // Remove comment lines (lines starting with /)
    if (removeComments) {
      cleanedText = cleanedText
        .split('\n')
        .filter((line) => !line.trim().startsWith('/'))
        .join('\n');
    }

    // Apply custom regex patterns
    removePatterns.forEach((pattern) => {
      cleanedText = cleanedText.replace(pattern, '');
    });

    // Remove empty lines
    if (removeEmptyLines) {
      cleanedText = cleanedText
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .join('\n');
    }

    // Preserve or normalize whitespace
    if (!preserveWhitespace) {
      cleanedText = cleanedText
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .join('\n')
        .trim();
    }

    return cleanedText;
  };

  // Helper functions
  const normalizeText = (text: string): string => {
    let normalized = text;
    if (!caseSensitive) {
      normalized = normalized.toLowerCase();
    }
    if (ignorePunctuation) {
      normalized = normalized.replace(/[^\w\s]/g, '');
    }
    return normalized.trim();
  };

  const calculateEditDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const normalized1 = normalizeText(str1);
    const normalized2 = normalizeText(str2);

    if (normalized1 === normalized2) return 1.0;

    const editDistance = calculateEditDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);

    return maxLength === 0 ? 1.0 : 1 - editDistance / maxLength;
  };

  // New complexity detection functions
  const detectReplacementComplexity = (
    originalWord: string,
    correctedWord: string
  ): {
    type: 'simple' | 'complex' | 'merge' | 'split';
    confidence: number;
    reason: string;
  } => {
    const normalizedOriginal = normalizeText(originalWord);
    const normalizedCorrected = normalizeText(correctedWord);

    // Exact match - no replacement needed
    if (normalizedOriginal === normalizedCorrected) {
      return {
        type: 'simple',
        confidence: 1.0,
        reason: 'exact_match',
      };
    }

    // Check for simple character-level differences (typos, minor corrections)
    const editDistance = calculateEditDistance(
      normalizedOriginal,
      normalizedCorrected
    );
    const maxLength = Math.max(
      normalizedOriginal.length,
      normalizedCorrected.length
    );
    const similarity = maxLength === 0 ? 1.0 : 1 - editDistance / maxLength;

    // Simple replacement: high similarity, similar length, single word to single word
    if (
      similarity >= 0.7 &&
      Math.abs(normalizedOriginal.length - normalizedCorrected.length) <= 2 &&
      !normalizedOriginal.includes(' ') &&
      !normalizedCorrected.includes(' ')
    ) {
      return {
        type: 'simple',
        confidence: similarity,
        reason: 'character_level_correction',
      };
    }

    // Check for merge: multiple words becoming one word
    if (
      normalizedCorrected.includes(' ') &&
      !normalizedOriginal.includes(' ')
    ) {
      return {
        type: 'merge',
        confidence: 0.3,
        reason: 'multiple_words_to_one',
      };
    }

    // Check for split: one word becoming multiple words
    if (
      !normalizedCorrected.includes(' ') &&
      normalizedOriginal.includes(' ')
    ) {
      return {
        type: 'split',
        confidence: 0.3,
        reason: 'one_word_to_multiple',
      };
    }

    // Check for complex replacement: very different words, different lengths
    if (
      similarity < 0.5 ||
      Math.abs(normalizedOriginal.length - normalizedCorrected.length) > 3
    ) {
      return {
        type: 'complex',
        confidence: similarity,
        reason: 'significantly_different_words',
      };
    }

    // Default to complex for any other case
    return {
      type: 'complex',
      confidence: similarity,
      reason: 'unknown_complexity',
    };
  };

  const shouldReplaceWord = (
    originalWord: string,
    correctedWord: string,
    complexityThreshold: number = 0.6
  ): { shouldReplace: boolean; reason: string; complexity: any } => {
    const complexity = detectReplacementComplexity(originalWord, correctedWord);

    // Always replace for simple operations
    if (complexity.type === 'simple') {
      return {
        shouldReplace: true,
        reason: `Simple ${complexity.reason} (confidence: ${complexity.confidence.toFixed(2)})`,
        complexity,
      };
    }

    // For complex operations, only replace if confidence is high enough
    if (
      complexity.type === 'complex' &&
      complexity.confidence >= complexityThreshold
    ) {
      return {
        shouldReplace: true,
        reason: `Complex replacement with high confidence (${complexity.confidence.toFixed(2)})`,
        complexity,
      };
    }

    // Avoid merge and split operations, and low-confidence complex operations
    return {
      shouldReplace: false,
      reason: `Avoiding ${complexity.type} operation (confidence: ${complexity.confidence.toFixed(2)})`,
      complexity,
    };
  };

  const findBestMatch = (
    targetWord: string,
    wordList: TranscriptionWord[],
    startIndex: number = 0
  ): { word: TranscriptionWord; index: number; similarity: number } | null => {
    let bestMatch = null;
    let bestSimilarity = 0;
    let bestIndex = -1;

    for (let i = startIndex; i < wordList.length; i++) {
      const word = wordList[i];
      const similarity = calculateSimilarity(targetWord, word.text);

      if (similarity > bestSimilarity && similarity >= fuzzyThreshold) {
        bestMatch = word;
        bestSimilarity = similarity;
        bestIndex = i;
      }
    }

    return bestMatch
      ? { word: bestMatch, index: bestIndex, similarity: bestSimilarity }
      : null;
  };

  const distributeTiming = (
    words: TranscriptionWord[],
    totalDuration: number,
    useWeighting: boolean = true
  ): TranscriptionWord[] => {
    if (words.length === 0) return words;

    const totalWeight = useWeighting
      ? words.reduce((sum, w) => sum + w.confidence, 0)
      : words.length;

    let currentTime = 0;

    return words.map((word, index) => {
      const weight = useWeighting ? word.confidence : 1;
      const duration = Math.max(
        minWordDuration,
        Math.min(maxWordDuration, (weight / totalWeight) * totalDuration)
      );

      const start = currentTime;
      const end = start + duration;
      currentTime = end;

      return {
        ...word,
        start,
        end,
        duration,
      };
    });
  };

  const createWordFromTiming = (
    text: string,
    startTime: number,
    endTime: number,
    confidence: number = 0.5
  ): TranscriptionWord => {
    const duration = endTime - startTime;
    return {
      text,
      start: 0, // Will be adjusted relative to sentence
      end: duration,
      duration: duration,
      confidence,
      absoluteStart: startTime,
      absoluteEnd: endTime,
    };
  };

  // Clean the human corrected text
  const cleanedHumanText = cleanText(humanCorrectedText);

  // Parse corrected text into sentences
  const correctedSentences = cleanedHumanText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(/\s+/).filter((word) => word.length > 0));

  // Debug logging
  if (logAlignmentIssues) {
    console.log('Cleaned human text:', cleanedHumanText);
    console.log('Number of corrected sentences:', correctedSentences.length);
    correctedSentences.forEach((sentence, index) => {
      console.log(`Sentence ${index + 1}: "${sentence.join(' ')}"`);
    });
  }

  if (correctedSentences.length === 0) {
    throw new Error('No valid sentences found in humanCorrectedText');
  }

  // Calculate total words and timing from all original captions
  const allOriginalWords = captions.flatMap((caption) => caption.words);
  const totalOriginalWords = allOriginalWords.length;
  const totalOriginalStart = Math.min(
    ...captions.map((c) => c.absoluteStart || c.start)
  );
  const totalOriginalEnd = Math.max(
    ...captions.map((c) => c.absoluteEnd || c.end)
  );

  // Calculate total words in corrected text
  const totalCorrectedWords = correctedSentences.reduce(
    (sum, sentence) => sum + sentence.length,
    0
  );

  // Process each corrected sentence (each line from humanCorrectedText)
  const processedCaptions: TranscriptionSentence[] = [];
  let currentWordIndex = 0;

  for (
    let correctedSentenceIndex = 0;
    correctedSentenceIndex < correctedSentences.length;
    correctedSentenceIndex++
  ) {
    const correctedWords = correctedSentences[correctedSentenceIndex];
    const sentenceWordCount = correctedWords.length;

    // Create words for this sentence using sequential approach
    const alignedWords: TranscriptionWord[] = [];
    let actualWordsProcessed = 0;

    for (let i = 0; i < correctedWords.length; i++) {
      const correctedWord = correctedWords[i];
      const originalWordIndex = currentWordIndex + i;
      const originalWord = allOriginalWords[originalWordIndex];

      if (originalWord) {
        let shouldReplace = false;
        let reason = '';

        if (enableIntelligentReplacement) {
          // Use intelligent replacement logic to determine if we should replace the word
          const replacementDecision = shouldReplaceWord(
            originalWord.text,
            correctedWord,
            complexityThreshold
          );
          shouldReplace = replacementDecision.shouldReplace;
          reason = replacementDecision.reason;
        } else {
          // Fallback to simple similarity-based approach
          const similarity = calculateSimilarity(
            correctedWord,
            originalWord.text
          );
          shouldReplace = similarity >= fuzzyThreshold;
          reason = `Simple similarity check (${similarity.toFixed(2)} >= ${fuzzyThreshold})`;
        }

        if (shouldReplace) {
          // Use corrected text
          const word = createWordFromTiming(
            correctedWord,
            originalWord.absoluteStart || originalWord.start,
            originalWord.absoluteEnd || originalWord.end,
            originalWord.confidence
          );
          alignedWords.push(word);
          actualWordsProcessed++;

          if (logAlignmentIssues) {
            console.log(
              `Replacing "${originalWord.text}" with "${correctedWord}" - ${reason}`
            );
          }
        } else {
          // Keep original to avoid complex or uncertain mappings
          const word = createWordFromTiming(
            originalWord.text,
            originalWord.absoluteStart || originalWord.start,
            originalWord.absoluteEnd || originalWord.end,
            originalWord.confidence
          );
          alignedWords.push(word);
          actualWordsProcessed++;

          if (logAlignmentIssues) {
            console.log(
              `Keeping original "${originalWord.text}" instead of "${correctedWord}" - ${reason}`
            );
          }
        }
      } else {
        // If no original word found, skip this word rather than forcing timing
        if (logAlignmentIssues) {
          console.warn(
            `No original word found for corrected word: "${correctedWord}" at index ${originalWordIndex}`
          );
        }
      }
    }

    // Update current word index for next sentence based on actual words processed
    currentWordIndex += actualWordsProcessed;

    // Calculate sentence timing based on actual word timings (respecting natural timing)
    if (alignedWords.length === 0) {
      // Skip empty sentences
      continue;
    }

    // Use original caption timing as base, but adjust based on actual word timings
    const sentenceAbsoluteStart = Math.min(
      ...alignedWords.map((w) => w.absoluteStart || w.start)
    );
    const sentenceAbsoluteEnd = Math.max(
      ...alignedWords.map((w) => w.absoluteEnd || w.end)
    );

    // Recalculate relative timings for words within this sentence
    const adjustedWords = alignedWords.map((word, wordIndex) => {
      const wordAbsoluteStart = word.absoluteStart || word.start;
      const wordAbsoluteEnd = word.absoluteEnd || word.end;

      // Calculate relative start and end times within the sentence
      const relativeStart =
        wordIndex === 0 ? 0 : wordAbsoluteStart - sentenceAbsoluteStart;
      const relativeEnd = wordAbsoluteEnd - sentenceAbsoluteStart;
      const relativeDuration = relativeEnd - relativeStart;

      return {
        ...word,
        start: relativeStart,
        end: relativeEnd,
        duration: relativeDuration,
        absoluteStart: wordAbsoluteStart,
        absoluteEnd: wordAbsoluteEnd,
      };
    });

    // Create the corrected sentence using actual words that were processed
    const actualText = alignedWords.map((w) => w.text).join(' ');

    // Calculate sentence duration from the relative timings of the words
    const sentenceDuration =
      adjustedWords.length > 0
        ? adjustedWords[adjustedWords.length - 1].end
        : 0;

    const correctedCaption: TranscriptionSentence = {
      id: generateNewIds ? generateId() : `corrected_${correctedSentenceIndex}`,
      text: actualText,
      start: 0,
      end: sentenceDuration,
      duration: sentenceDuration,
      absoluteStart: sentenceAbsoluteStart,
      absoluteEnd: sentenceAbsoluteEnd,
      words: adjustedWords,
    };

    // Add metadata if requested
    if (addMetadata || addCorrectionInfo) {
      (correctedCaption as any).metadata = {
        ...(addMetadata
          ? {
              originalWordCount: totalOriginalWords,
              correctedWordCount: totalCorrectedWords,
              processedAt: new Date().toISOString(),
              textCleaningApplied: textCleaningEnabled,
              originalHumanText: humanCorrectedText,
              cleanedHumanText: cleanedHumanText,
            }
          : {}),
        ...(addCorrectionInfo
          ? {
              correctionsApplied: correctedWords.length,
              originalText: captions.map((c) => c.text).join(' '),
              correctedText: actualText,
            }
          : {}),
      };
    }

    processedCaptions.push(correctedCaption);
  }

  return processedCaptions;
};
