import { captionMutator } from './caption.mutate';
import { TranscriptionSentence } from '../schemas';

// Test data with proper absolute and relative timings
const testCaptions: TranscriptionSentence[] = [
  {
    id: '1',
    text: 'Hello world this is a test',
    start: 0, // Relative start (first word starts at 0)
    end: 2.5, // Relative end
    duration: 2.5, // Relative duration
    absoluteStart: 10.0, // Absolute start in the video
    absoluteEnd: 12.5, // Absolute end in the video
    words: [
      {
        text: 'Hello',
        start: 0, // Relative to sentence start
        end: 0.5,
        duration: 0.5,
        confidence: 0.95,
        absoluteStart: 10.0, // Absolute in video
        absoluteEnd: 10.5,
      },
      {
        text: 'world',
        start: 0.5, // Relative to sentence start
        end: 1.0,
        duration: 0.5,
        confidence: 0.92,
        absoluteStart: 10.5, // Absolute in video
        absoluteEnd: 11.0,
      },
      {
        text: 'this',
        start: 1.0, // Relative to sentence start
        end: 1.3,
        duration: 0.3,
        confidence: 0.88,
        absoluteStart: 11.0, // Absolute in video
        absoluteEnd: 11.3,
      },
      {
        text: 'is',
        start: 1.3, // Relative to sentence start
        end: 1.5,
        duration: 0.2,
        confidence: 0.94,
        absoluteStart: 11.3, // Absolute in video
        absoluteEnd: 11.5,
      },
      {
        text: 'a',
        start: 1.5, // Relative to sentence start
        end: 1.6,
        duration: 0.1,
        confidence: 0.99,
        absoluteStart: 11.5, // Absolute in video
        absoluteEnd: 11.6,
      },
      {
        text: 'test',
        start: 1.6, // Relative to sentence start
        end: 2.5,
        duration: 0.9,
        confidence: 0.9,
        absoluteStart: 11.6, // Absolute in video
        absoluteEnd: 12.5,
      },
    ],
  },
];

// Test function to verify timing calculations
export const testTimingCalculations = () => {
  console.log('=== Testing Timing Calculations ===\n');

  console.log('Original captions:');
  testCaptions.forEach((caption, index) => {
    console.log(`Caption ${index + 1}:`);
    console.log(`  Text: "${caption.text}"`);
    console.log(
      `  Relative timing: ${caption.start}s - ${caption.end}s (duration: ${caption.duration}s)`
    );
    console.log(
      `  Absolute timing: ${caption.absoluteStart}s - ${caption.absoluteEnd}s`
    );
    console.log(`  Words:`);
    caption.words.forEach((word, wordIndex) => {
      console.log(
        `    ${wordIndex + 1}. "${word.text}": rel(${word.start}s-${word.end}s) abs(${word.absoluteStart}s-${word.absoluteEnd}s)`
      );
    });
    console.log('');
  });

  // Test with splitting (should create multiple sentences with proper relative timings)
  console.log('Testing with splitting (max 3 words per sentence):');
  const splitOptions = {
    maxWordsPerSentence: 3,
    maxSentenceDuration: 10,
    splitStrategy: 'by-words' as const,
  };

  const splitResults = captionMutator(testCaptions, splitOptions);

  splitResults.forEach((caption, index) => {
    console.log(`Split Caption ${index + 1}:`);
    console.log(`  Text: "${caption.text}"`);
    console.log(
      `  Relative timing: ${caption.start}s - ${caption.end}s (duration: ${caption.duration}s)`
    );
    console.log(
      `  Absolute timing: ${caption.absoluteStart}s - ${caption.absoluteEnd}s`
    );
    console.log(`  Words:`);
    caption.words.forEach((word, wordIndex) => {
      console.log(
        `    ${wordIndex + 1}. "${word.text}": rel(${word.start}s-${word.end}s) abs(${word.absoluteStart}s-${word.absoluteEnd}s)`
      );
    });

    // Verify that first word starts at 0
    if (caption.words.length > 0) {
      const firstWordStart = caption.words[0].start;
      console.log(
        `  ✓ First word starts at: ${firstWordStart}s ${firstWordStart === 0 ? '(CORRECT)' : '(ERROR!)'}`
      );
    }
    console.log('');
  });

  // Test with filtering (should maintain proper relative timings)
  console.log('Testing with filler word removal:');
  const filterOptions = {
    textProcessing: {
      removeFillerWords: true,
    },
  };

  const testWithFillers: TranscriptionSentence[] = [
    {
      id: '2',
      text: 'um hello world um this is um a test',
      start: 0,
      end: 4.0,
      duration: 4.0,
      absoluteStart: 15.0,
      absoluteEnd: 19.0,
      words: [
        {
          text: 'um',
          start: 0,
          end: 0.3,
          duration: 0.3,
          confidence: 0.85,
          absoluteStart: 15.0,
          absoluteEnd: 15.3,
        },
        {
          text: 'hello',
          start: 0.3,
          end: 0.8,
          duration: 0.5,
          confidence: 0.95,
          absoluteStart: 15.3,
          absoluteEnd: 15.8,
        },
        {
          text: 'world',
          start: 0.8,
          end: 1.3,
          duration: 0.5,
          confidence: 0.92,
          absoluteStart: 15.8,
          absoluteEnd: 16.3,
        },
        {
          text: 'um',
          start: 1.3,
          end: 1.6,
          duration: 0.3,
          confidence: 0.85,
          absoluteStart: 16.3,
          absoluteEnd: 16.6,
        },
        {
          text: 'this',
          start: 1.6,
          end: 1.9,
          duration: 0.3,
          confidence: 0.88,
          absoluteStart: 16.6,
          absoluteEnd: 16.9,
        },
        {
          text: 'is',
          start: 1.9,
          end: 2.1,
          duration: 0.2,
          confidence: 0.94,
          absoluteStart: 16.9,
          absoluteEnd: 17.1,
        },
        {
          text: 'um',
          start: 2.1,
          end: 2.4,
          duration: 0.3,
          confidence: 0.85,
          absoluteStart: 17.1,
          absoluteEnd: 17.4,
        },
        {
          text: 'a',
          start: 2.4,
          end: 2.5,
          duration: 0.1,
          confidence: 0.99,
          absoluteStart: 17.4,
          absoluteEnd: 17.5,
        },
        {
          text: 'test',
          start: 2.5,
          end: 3.0,
          duration: 0.5,
          confidence: 0.9,
          absoluteStart: 17.5,
          absoluteEnd: 18.0,
        },
      ],
    },
  ];

  const filteredResults = captionMutator(testWithFillers, filterOptions);

  filteredResults.forEach((caption, index) => {
    console.log(`Filtered Caption ${index + 1}:`);
    console.log(`  Text: "${caption.text}"`);
    console.log(
      `  Relative timing: ${caption.start}s - ${caption.end}s (duration: ${caption.duration}s)`
    );
    console.log(
      `  Absolute timing: ${caption.absoluteStart}s - ${caption.absoluteEnd}s`
    );
    console.log(`  Words:`);
    caption.words.forEach((word, wordIndex) => {
      console.log(
        `    ${wordIndex + 1}. "${word.text}": rel(${word.start}s-${word.end}s) abs(${word.absoluteStart}s-${word.absoluteEnd}s)`
      );
    });

    // Verify that first word starts at 0
    if (caption.words.length > 0) {
      const firstWordStart = caption.words[0].start;
      console.log(
        `  ✓ First word starts at: ${firstWordStart}s ${firstWordStart === 0 ? '(CORRECT)' : '(ERROR!)'}`
      );
    }
    console.log('');
  });

  return {
    original: testCaptions,
    splitResults,
    filteredResults,
  };
};

// Run the test
// testTimingCalculations();
