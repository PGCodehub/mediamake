import { humanCorrectionMutator } from '../transformers/caption.mutate';
import { TranscriptionSentence } from '../schemas';

// Test data with proper absolute and relative timings
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

// Test function to verify timing calculations are fixed
export const testTimingCalculations = () => {
  console.log('=== Testing Fixed Timing Calculations ===\n');

  // Test 1: Simple word correction
  console.log('Test 1: Simple word correction');
  const correctedText1 = `Hello world this is a comprehensive test`;

  const result1 = humanCorrectionMutator(testCaptions, {
    humanCorrectedText: correctedText1,
    wordMatching: {
      fuzzyThreshold: 0.8,
    },
    outputFormat: {
      addMetadata: true,
    },
  });

  console.log('Original caption:');
  console.log(`  Text: "${testCaptions[0].text}"`);
  console.log(
    `  Absolute timing: ${testCaptions[0].absoluteStart}s - ${testCaptions[0].absoluteEnd}s`
  );
  console.log(
    `  Relative timing: ${testCaptions[0].start}s - ${testCaptions[0].end}s`
  );
  console.log(`  Words:`);
  testCaptions[0].words.forEach((word, index) => {
    console.log(
      `    ${index + 1}. "${word.text}": abs(${word.absoluteStart}s-${word.absoluteEnd}s) rel(${word.start}s-${word.end}s) dur(${word.duration}s)`
    );
  });

  console.log('\nCorrected caption:');
  console.log(`  Text: "${result1[0].text}"`);
  console.log(
    `  Absolute timing: ${result1[0].absoluteStart}s - ${result1[0].absoluteEnd}s`
  );
  console.log(`  Relative timing: ${result1[0].start}s - ${result1[0].end}s`);
  console.log(`  Words:`);
  result1[0].words.forEach((word, index) => {
    console.log(
      `    ${index + 1}. "${word.text}": abs(${word.absoluteStart}s-${word.absoluteEnd}s) rel(${word.start}s-${word.end}s) dur(${word.duration}s)`
    );
  });

  // Verify timing consistency
  console.log('\nTiming verification:');
  const firstWord = result1[0].words[0];
  const lastWord = result1[0].words[result1[0].words.length - 1];

  console.log(
    `  ✓ First word starts at: ${firstWord.start}s ${firstWord.start === 0 ? '(CORRECT)' : '(ERROR!)'}`
  );
  console.log(`  ✓ Last word ends at: ${lastWord.end}s`);
  console.log(`  ✓ Sentence duration: ${result1[0].duration}s`);
  console.log(
    `  ✓ Calculated duration: ${lastWord.end - firstWord.start}s ${Math.abs(result1[0].duration - (lastWord.end - firstWord.start)) < 0.01 ? '(CORRECT)' : '(ERROR!)'}`
  );
  console.log('');

  // Test 2: Word insertion
  console.log('Test 2: Word insertion');
  const correctedText2 = `Hello world this is a comprehensive test`;

  const result2 = humanCorrectionMutator(testCaptions, {
    humanCorrectedText: correctedText2,
    wordMatching: {
      fuzzyThreshold: 0.8,
    },
    correctionHandling: {
      handleInsertions: true,
    },
    outputFormat: {
      addMetadata: true,
    },
  });

  console.log('Word insertion result:');
  console.log(`  Text: "${result2[0].text}"`);
  console.log(
    `  Word count: ${result2[0].words.length} (original: ${testCaptions[0].words.length})`
  );
  console.log(`  Words:`);
  result2[0].words.forEach((word, index) => {
    console.log(
      `    ${index + 1}. "${word.text}": abs(${word.absoluteStart}s-${word.absoluteEnd}s) rel(${word.start}s-${word.end}s) dur(${word.duration}s)`
    );
  });

  // Verify timing consistency for insertion
  const firstWord2 = result2[0].words[0];
  const lastWord2 = result2[0].words[result2[0].words.length - 1];

  console.log(
    `  ✓ First word starts at: ${firstWord2.start}s ${firstWord2.start === 0 ? '(CORRECT)' : '(ERROR!)'}`
  );
  console.log(`  ✓ Last word ends at: ${lastWord2.end}s`);
  console.log(`  ✓ Sentence duration: ${result2[0].duration}s`);
  console.log(
    `  ✓ Calculated duration: ${lastWord2.end - firstWord2.start}s ${Math.abs(result2[0].duration - (lastWord2.end - firstWord2.start)) < 0.01 ? '(CORRECT)' : '(ERROR!)'}`
  );
  console.log('');

  // Test 3: Word deletion
  console.log('Test 3: Word deletion');
  const correctedText3 = `Hello world this is test`;

  const result3 = humanCorrectionMutator(testCaptions, {
    humanCorrectedText: correctedText3,
    wordMatching: {
      fuzzyThreshold: 0.8,
    },
    correctionHandling: {
      handleDeletions: true,
    },
    outputFormat: {
      addMetadata: true,
    },
  });

  console.log('Word deletion result:');
  console.log(`  Text: "${result3[0].text}"`);
  console.log(
    `  Word count: ${result3[0].words.length} (original: ${testCaptions[0].words.length})`
  );
  console.log(`  Words:`);
  result3[0].words.forEach((word, index) => {
    console.log(
      `    ${index + 1}. "${word.text}": abs(${word.absoluteStart}s-${word.absoluteEnd}s) rel(${word.start}s-${word.end}s) dur(${word.duration}s)`
    );
  });

  // Verify timing consistency for deletion
  const firstWord3 = result3[0].words[0];
  const lastWord3 = result3[0].words[result3[0].words.length - 1];

  console.log(
    `  ✓ First word starts at: ${firstWord3.start}s ${firstWord3.start === 0 ? '(CORRECT)' : '(ERROR!)'}`
  );
  console.log(`  ✓ Last word ends at: ${lastWord3.end}s`);
  console.log(`  ✓ Sentence duration: ${result3[0].duration}s`);
  console.log(
    `  ✓ Calculated duration: ${lastWord3.end - firstWord3.start}s ${Math.abs(result3[0].duration - (lastWord3.end - firstWord3.start)) < 0.01 ? '(CORRECT)' : '(ERROR!)'}`
  );
  console.log('');

  return {
    simpleCorrection: result1,
    wordInsertion: result2,
    wordDeletion: result3,
  };
};

// Run the test
testTimingCalculations();
