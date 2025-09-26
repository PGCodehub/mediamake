import { humanCorrectionMutator } from '../transformers/caption.mutate';
import { TranscriptionSentence } from '../schemas';

// Test data with a single long caption
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

// Test function to verify sentence splitting and duration calculations
export const testSentenceSplitting = () => {
  console.log('=== Testing Sentence Splitting and Duration Calculations ===\n');

  // Test 1: Split single caption into multiple sentences
  console.log('Test 1: Split single caption into multiple sentences');
  const correctedTextWithNewlines = `Hello world
This is a test
So let me start`;

  const result1 = humanCorrectionMutator(testCaptions, {
    humanCorrectedText: correctedTextWithNewlines,
    wordMatching: {
      fuzzyThreshold: 0.8,
    },
    outputFormat: {
      addMetadata: true,
    },
  });

  console.log('Original caption:');
  console.log(`  Text: "${testCaptions[0].text}"`);
  console.log(`  Duration: ${testCaptions[0].duration}s`);
  console.log(
    `  Absolute timing: ${testCaptions[0].absoluteStart}s - ${testCaptions[0].absoluteEnd}s`
  );

  console.log('\nCorrected captions (should be 3 separate sentences):');
  console.log(`  Number of sentences: ${result1.length}`);

  result1.forEach((caption, index) => {
    console.log(`  Sentence ${index + 1}:`);
    console.log(`    Text: "${caption.text}"`);
    console.log(`    Duration: ${caption.duration}s`);
    console.log(
      `    Absolute timing: ${caption.absoluteStart}s - ${caption.absoluteEnd}s`
    );
    console.log(`    Word count: ${caption.words.length}`);

    // Verify timing consistency
    if (caption.words.length > 0) {
      const firstWord = caption.words[0];
      const lastWord = caption.words[caption.words.length - 1];
      console.log(
        `    ✓ First word starts at: ${firstWord.start}s ${firstWord.start === 0 ? '(CORRECT)' : '(ERROR!)'}`
      );
      console.log(`    ✓ Last word ends at: ${lastWord.end}s`);
      console.log(
        `    ✓ Calculated duration: ${lastWord.end - firstWord.start}s ${Math.abs(caption.duration - (lastWord.end - firstWord.start)) < 0.01 ? '(CORRECT)' : '(ERROR!)'}`
      );
    }
    console.log('');
  });

  // Test 2: Verify durations are reasonable (not huge numbers)
  console.log('Test 2: Verify durations are reasonable');
  const hasReasonableDurations = result1.every(
    (caption) => caption.duration < 10
  ); // Should be less than 10 seconds
  console.log(
    `  ✓ All durations are reasonable: ${hasReasonableDurations ? 'YES' : 'NO'}`
  );

  const totalDuration = result1.reduce(
    (sum, caption) => sum + caption.duration,
    0
  );
  console.log(`  ✓ Total duration: ${totalDuration.toFixed(2)}s`);
  console.log(`  ✓ Original duration: ${testCaptions[0].duration}s`);
  console.log('');

  // Test 3: Test with more complex corrections
  console.log('Test 3: Complex corrections with newlines');
  const complexCorrectedText = `Hello world this is a comprehensive test
So let me start with the fundamental basics
This is the final sentence with corrections`;

  const result2 = humanCorrectionMutator(testCaptions, {
    humanCorrectedText: complexCorrectedText,
    wordMatching: {
      fuzzyThreshold: 0.7,
    },
    correctionHandling: {
      handleInsertions: true,
      handleDeletions: true,
    },
    outputFormat: {
      addMetadata: true,
    },
  });

  console.log('Complex corrections result:');
  console.log(`  Number of sentences: ${result2.length}`);

  result2.forEach((caption, index) => {
    console.log(`  Sentence ${index + 1}:`);
    console.log(`    Text: "${caption.text}"`);
    console.log(`    Duration: ${caption.duration}s`);
    console.log(`    Word count: ${caption.words.length}`);

    // Check for reasonable duration
    const isReasonable = caption.duration < 10;
    console.log(
      `    ✓ Duration is reasonable: ${isReasonable ? 'YES' : 'NO'} (${caption.duration}s)`
    );
  });
  console.log('');

  // Test 4: Test with text cleaning
  console.log('Test 4: Test with text cleaning and newlines');
  const textWithCleanup = `Hello world (this is a note) this is a test
/ This is a comment line
So let me [start with] the basics
/ Another comment
This is the final sentence`;

  const result3 = humanCorrectionMutator(testCaptions, {
    humanCorrectedText: textWithCleanup,
    textCleaning: {
      enabled: true,
      removeParentheses: true,
      removeComments: true,
      removeEmptyLines: true,
    },
    wordMatching: {
      fuzzyThreshold: 0.8,
    },
    outputFormat: {
      addMetadata: true,
    },
  });

  console.log('Text with cleanup result:');
  console.log(`  Number of sentences: ${result3.length}`);

  result3.forEach((caption, index) => {
    console.log(`  Sentence ${index + 1}:`);
    console.log(`    Text: "${caption.text}"`);
    console.log(`    Duration: ${caption.duration}s`);
    console.log(`    Word count: ${caption.words.length}`);
  });

  return {
    sentenceSplitting: result1,
    complexCorrections: result2,
    textCleaning: result3,
  };
};

// Run the test
// testSentenceSplitting();
