import { humanCorrectionMutator } from '../transformers/caption.mutate';
import { TranscriptionSentence } from '../schemas';

// Simple example showing how to use text cleaning with regex patterns
export const textCleaningExamples = () => {
  console.log('=== Text Cleaning Examples ===\n');

  // Sample transcription
  const sampleCaptions: TranscriptionSentence[] = [
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

  // Example 1: Remove parentheses and brackets
  console.log('Example 1: Remove parentheses and brackets');
  const textWithParentheses = `Hello world (this is a note) this is a test
So let me [start with] the basics`;

  const result1 = humanCorrectionMutator(sampleCaptions, {
    humanCorrectedText: textWithParentheses,
    textCleaning: {
      enabled: true,
      removeParentheses: true, // Removes (content) and [content]
    },
  });

  console.log('Original:', textWithParentheses);
  console.log('Result:', result1[0].text);
  console.log('');

  // Example 2: Remove comment lines
  console.log('Example 2: Remove comment lines');
  const textWithComments = `Hello world this is a test
/ This is a comment line
So let me start with the basics
/ Another comment`;

  const result2 = humanCorrectionMutator(sampleCaptions, {
    humanCorrectedText: textWithComments,
    textCleaning: {
      enabled: true,
      removeComments: true, // Removes lines starting with /
    },
  });

  console.log('Original:', textWithComments);
  console.log('Result:', result2[0].text);
  console.log('');

  // Example 3: Custom regex patterns
  console.log('Example 3: Custom regex patterns');
  const textWithCustomMarkers = `Hello world ***REMOVE*** this is a test
So let me start with the basics ***CLEANUP***`;

  const result3 = humanCorrectionMutator(sampleCaptions, {
    humanCorrectedText: textWithCustomMarkers,
    textCleaning: {
      enabled: true,
      removePatterns: [
        /\*\*\*REMOVE\*\*\*/g, // Remove ***REMOVE*** markers
        /\*\*\*CLEANUP\*\*\*/g, // Remove ***CLEANUP*** markers
      ],
    },
  });

  console.log('Original:', textWithCustomMarkers);
  console.log('Result:', result3[0].text);
  console.log('');

  // Example 4: Common regex patterns
  console.log('Example 4: Common regex patterns');
  const textWithCommonMarkers = `Hello world [00:15] this is a test
So let me start with the basics (Speaker 1:)
This has um filler words`;

  const result4 = humanCorrectionMutator(sampleCaptions, {
    humanCorrectedText: textWithCommonMarkers,
    textCleaning: {
      enabled: true,
      removePatterns: [
        /\[?\d{1,2}:\d{2}\]?/g, // Remove timestamps like [00:15]
        /\[?[Ss]peaker\s+\d+:\]?/gi, // Remove speaker labels like (Speaker 1:)
        /\b(um|uh|er|ah)\b/gi, // Remove filler words
      ],
    },
  });

  console.log('Original:', textWithCommonMarkers);
  console.log('Result:', result4[0].text);
  console.log('');

  // Example 5: Combined cleaning
  console.log('Example 5: Combined cleaning');
  const complexText = `Hello world (this is a note) this is a test
/ This is a comment line
So let me [start with] the basics ***CLEANUP***
/ Another comment
This is the final sentence`;

  const result5 = humanCorrectionMutator(sampleCaptions, {
    humanCorrectedText: complexText,
    textCleaning: {
      enabled: true,
      removeParentheses: true, // Remove (content) and [content]
      removeComments: true, // Remove lines starting with /
      removeEmptyLines: true, // Remove empty lines
      removePatterns: [
        /\*\*\*CLEANUP\*\*\*/g, // Remove cleanup markers
      ],
    },
  });

  console.log('Original:', complexText);
  console.log('Result:', result5[0].text);
  console.log('');

  return {
    parentheses: result1,
    comments: result2,
    custom: result3,
    common: result4,
    combined: result5,
  };
};

// Common regex patterns for reference
export const regexPatterns = {
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

// Run examples
// textCleaningExamples();
