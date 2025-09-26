import { humanCorrectionMutator } from '../transformers/caption.mutate';
import { TranscriptionSentence } from '../schemas';

// Test data
const testCaptions: TranscriptionSentence[] = [
  {
    id: '1',
    text: 'Hello world this is a test',
    start: 0,
    end: 2.5,
    duration: 2.5,
    absoluteStart: 10.0,
    absoluteEnd: 12.5,
    words: [
      {
        text: 'Hello',
        start: 0,
        end: 0.5,
        duration: 0.5,
        confidence: 0.95,
        absoluteStart: 10.0,
        absoluteEnd: 10.5,
      },
      {
        text: 'world',
        start: 0.5,
        end: 1.0,
        duration: 0.5,
        confidence: 0.92,
        absoluteStart: 10.5,
        absoluteEnd: 11.0,
      },
      {
        text: 'this',
        start: 1.0,
        end: 1.3,
        duration: 0.3,
        confidence: 0.88,
        absoluteStart: 11.0,
        absoluteEnd: 11.3,
      },
      {
        text: 'is',
        start: 1.3,
        end: 1.5,
        duration: 0.2,
        confidence: 0.94,
        absoluteStart: 11.3,
        absoluteEnd: 11.5,
      },
      {
        text: 'a',
        start: 1.5,
        end: 1.6,
        duration: 0.1,
        confidence: 0.99,
        absoluteStart: 11.5,
        absoluteEnd: 11.6,
      },
      {
        text: 'test',
        start: 1.6,
        end: 2.5,
        duration: 0.9,
        confidence: 0.9,
        absoluteStart: 11.6,
        absoluteEnd: 12.5,
      },
    ],
  },
];

// Test function for text cleaning functionality
export const testTextCleaning = () => {
  console.log('=== Testing Text Cleaning Functionality ===\n');

  // Test 1: Basic text cleaning with parentheses and brackets
  console.log('Test 1: Basic text cleaning (parentheses, brackets, comments)');
  const textWithCleanup = `Hello world (this is a note) this is a test
/ This is a comment line
So let me [start with] the basics
/ Another comment
This is the final sentence`;

  const result1 = humanCorrectionMutator(testCaptions, {
    humanCorrectedText: textWithCleanup,
    textCleaning: {
      enabled: true,
      removeParentheses: true,
      removeComments: true,
      removeEmptyLines: true,
    },
    outputFormat: {
      addMetadata: true,
    },
  });

  console.log('Original text with cleanup markers:');
  console.log(textWithCleanup);
  console.log('\nCleaned and processed:');
  result1.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
  });

  if ((result1[0] as any).metadata) {
    const metadata = (result1[0] as any).metadata;
    console.log('\nMetadata:');
    console.log(`  Text cleaning applied: ${metadata.textCleaningApplied}`);
    console.log(`  Original human text: "${metadata.originalHumanText}"`);
    console.log(`  Cleaned human text: "${metadata.cleanedHumanText}"`);
  }
  console.log('');

  // Test 2: Custom regex patterns
  console.log('Test 2: Custom regex patterns');
  const textWithCustomPatterns = `Hello world ***REMOVE*** this is a test
So let me start with the basics ***CLEANUP***
This is the final sentence`;

  const result2 = humanCorrectionMutator(testCaptions, {
    humanCorrectedText: textWithCustomPatterns,
    textCleaning: {
      enabled: true,
      removePatterns: [
        /\*\*\*REMOVE\*\*\*/g, // Remove ***REMOVE*** markers
        /\*\*\*CLEANUP\*\*\*/g, // Remove ***CLEANUP*** markers
        /\b(um|uh|er)\b/gi, // Remove filler words
      ],
      removeParentheses: false,
      removeComments: false,
    },
    outputFormat: {
      addMetadata: true,
    },
  });

  console.log('Original text with custom patterns:');
  console.log(textWithCustomPatterns);
  console.log('\nCleaned and processed:');
  result2.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
  });
  console.log('');

  // Test 3: Complex cleaning scenario
  console.log('Test 3: Complex cleaning scenario');
  const complexText = `Hello world (this is a note) this is a test
/ This is a comment line that should be removed
So let me [start with] the basics (another note)
/ Another comment
This is the final sentence with ***CLEANUP*** markers`;

  const result3 = humanCorrectionMutator(testCaptions, {
    humanCorrectedText: complexText,
    textCleaning: {
      enabled: true,
      removeParentheses: true,
      removeComments: true,
      removeEmptyLines: true,
      removePatterns: [
        /\*\*\*CLEANUP\*\*\*/g, // Remove cleanup markers
        /\b(um|uh|er|ah)\b/gi, // Remove filler words
      ],
      preserveWhitespace: false,
    },
    outputFormat: {
      addMetadata: true,
    },
  });

  console.log('Complex text with multiple cleanup markers:');
  console.log(complexText);
  console.log('\nCleaned and processed:');
  result3.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
  });
  console.log('');

  // Test 4: Disabled text cleaning
  console.log('Test 4: Disabled text cleaning');
  const result4 = humanCorrectionMutator(testCaptions, {
    humanCorrectedText: textWithCleanup,
    textCleaning: {
      enabled: false, // Disable cleaning
    },
    outputFormat: {
      addMetadata: true,
    },
  });

  console.log('With text cleaning disabled:');
  result4.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
  });
  console.log('');

  return {
    basicCleaning: result1,
    customPatterns: result2,
    complexCleaning: result3,
    disabledCleaning: result4,
  };
};

// Example regex patterns for common use cases
export const commonRegexPatterns = {
  // Remove timestamps (e.g., [00:15] or (00:15))
  timestamps: /\[?\d{1,2}:\d{2}\]?/g,

  // Remove speaker labels (e.g., [Speaker 1:] or (Speaker 1:))
  speakerLabels: /\[?[Ss]peaker\s+\d+:\]?/gi,

  // Remove stage directions (e.g., [laughs] or (laughs))
  stageDirections: /\[?[a-z\s]+\]?/gi,

  // Remove filler words
  fillerWords: /\b(um|uh|er|ah|like|you know|so|well|actually)\b/gi,

  // Remove repeated words (e.g., "the the" -> "the")
  repeatedWords: /\b(\w+)\s+\1\b/gi,

  // Remove extra punctuation
  extraPunctuation: /[!]{2,}|[?]{2,}|[.]{3,}/g,

  // Remove HTML tags
  htmlTags: /<[^>]*>/g,

  // Remove markdown formatting
  markdown: /[*_`~#]/g,

  // Remove URLs
  urls: /https?:\/\/[^\s]+/g,

  // Remove email addresses
  emails: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
};

// Example usage function
export const exampleUsage = () => {
  console.log('\n=== Example Usage Patterns ===\n');

  const sampleText = `Hello world [00:15] this is a test
/ This is a comment
So let me start with the basics (Speaker 1:)
This is the final sentence with um filler words`;

  console.log('Sample text with various markers:');
  console.log(sampleText);
  console.log('');

  // Example 1: Basic cleanup
  console.log('Example 1: Basic cleanup');
  const basicResult = humanCorrectionMutator(testCaptions, {
    humanCorrectedText: sampleText,
    textCleaning: {
      enabled: true,
      removeParentheses: true,
      removeComments: true,
      removeEmptyLines: true,
    },
  });

  basicResult.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
  });
  console.log('');

  // Example 2: Advanced cleanup with custom patterns
  console.log('Example 2: Advanced cleanup with custom patterns');
  const advancedResult = humanCorrectionMutator(testCaptions, {
    humanCorrectedText: sampleText,
    textCleaning: {
      enabled: true,
      removeParentheses: true,
      removeComments: true,
      removeEmptyLines: true,
      removePatterns: [
        commonRegexPatterns.timestamps,
        commonRegexPatterns.speakerLabels,
        commonRegexPatterns.fillerWords,
      ],
    },
  });

  advancedResult.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
  });
  console.log('');

  // Example 3: Custom regex for specific use case
  console.log('Example 3: Custom regex for specific use case');
  const customResult = humanCorrectionMutator(testCaptions, {
    humanCorrectedText: sampleText,
    textCleaning: {
      enabled: true,
      removeParentheses: false,
      removeComments: true,
      removeEmptyLines: true,
      removePatterns: [
        /\[?\d{1,2}:\d{2}\]?/g, // Remove timestamps
        /\[?[Ss]peaker\s+\d+:\]?/gi, // Remove speaker labels
        /\b(um|uh|er|ah)\b/gi, // Remove filler words
      ],
    },
  });

  customResult.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
  });

  return {
    basic: basicResult,
    advanced: advancedResult,
    custom: customResult,
  };
};

// Run tests
// testTextCleaning();
// exampleUsage();
