import { humanCorrectionMutator } from '../transformers/caption.mutate';
import { TranscriptionSentence } from '../schemas';

// Test data with transcription errors
const testCaptionsWithErrors: TranscriptionSentence[] = [
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
  {
    id: '2',
    text: 'um so let me start with the basics',
    start: 0,
    end: 3.0,
    duration: 3.0,
    absoluteStart: 13.0,
    absoluteEnd: 16.0,
    words: [
      {
        text: 'um',
        start: 0,
        end: 0.3,
        duration: 0.3,
        confidence: 0.85,
        absoluteStart: 13.0,
        absoluteEnd: 13.3,
      },
      {
        text: 'so',
        start: 0.3,
        end: 0.5,
        duration: 0.2,
        confidence: 0.92,
        absoluteStart: 13.3,
        absoluteEnd: 13.5,
      },
      {
        text: 'let',
        start: 0.5,
        end: 0.8,
        duration: 0.3,
        confidence: 0.96,
        absoluteStart: 13.5,
        absoluteEnd: 13.8,
      },
      {
        text: 'me',
        start: 0.8,
        end: 0.9,
        duration: 0.1,
        confidence: 0.98,
        absoluteStart: 13.8,
        absoluteEnd: 13.9,
      },
      {
        text: 'start',
        start: 0.9,
        end: 1.3,
        duration: 0.4,
        confidence: 0.94,
        absoluteStart: 13.9,
        absoluteEnd: 14.3,
      },
      {
        text: 'with',
        start: 1.3,
        end: 1.6,
        duration: 0.3,
        confidence: 0.97,
        absoluteStart: 14.3,
        absoluteEnd: 14.6,
      },
      {
        text: 'the',
        start: 1.6,
        end: 1.8,
        duration: 0.2,
        confidence: 0.99,
        absoluteStart: 14.6,
        absoluteEnd: 14.8,
      },
      {
        text: 'basics',
        start: 1.8,
        end: 2.5,
        duration: 0.7,
        confidence: 0.88,
        absoluteStart: 14.8,
        absoluteEnd: 15.5,
      },
    ],
  },
];

// Test function for human correction mutator
export const testHumanCorrectionMutator = () => {
  console.log('=== Testing Human Correction Mutator ===\n');

  // Test 1: Basic word corrections
  console.log('Test 1: Basic word corrections');
  const correctedText1 = `Hello world this is a test
So let me start with the basics`;

  const result1 = humanCorrectionMutator(testCaptionsWithErrors, {
    humanCorrectedText: correctedText1,
    wordMatching: {
      caseSensitive: false,
      ignorePunctuation: true,
      fuzzyThreshold: 0.8,
    },
    correctionHandling: {
      handleSplits: true,
      handleMerges: true,
      handleInsertions: true,
      handleDeletions: true,
      preserveOriginalWords: true,
    },
    outputFormat: {
      addCorrectionInfo: true,
      addMetadata: true,
    },
  });

  console.log('Original captions:');
  testCaptionsWithErrors.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
  });

  console.log('\nCorrected captions:');
  result1.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
    if ((caption as any).metadata?.correctionInfo) {
      console.log(
        `     Corrections: ${(caption as any).metadata.correctionInfo.correctionsApplied}`
      );
    }
  });
  console.log('');

  // Test 2: Word splitting (single word -> multiple words)
  console.log('Test 2: Word splitting');
  const correctedText2 = `Hello world this is a comprehensive test
So let me start with the basic concepts`;

  const result2 = humanCorrectionMutator(testCaptionsWithErrors, {
    humanCorrectedText: correctedText2,
    wordMatching: {
      fuzzyThreshold: 0.7,
    },
    correctionHandling: {
      handleSplits: true,
      handleMerges: true,
      handleInsertions: true,
      handleDeletions: true,
    },
    outputFormat: {
      addCorrectionInfo: true,
    },
  });

  console.log('Word splitting results:');
  result2.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
    console.log(`     Word count: ${caption.words.length}`);
  });
  console.log('');

  // Test 3: Word merging (multiple words -> single word)
  console.log('Test 3: Word merging');
  const correctedText3 = `Hello world this is a test
So let me start with basics`;

  const result3 = humanCorrectionMutator(testCaptionsWithErrors, {
    humanCorrectedText: correctedText3,
    wordMatching: {
      fuzzyThreshold: 0.8,
    },
    correctionHandling: {
      handleSplits: true,
      handleMerges: true,
      handleInsertions: true,
      handleDeletions: true,
    },
    outputFormat: {
      addCorrectionInfo: true,
    },
  });

  console.log('Word merging results:');
  result3.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
    console.log(`     Word count: ${caption.words.length}`);
  });
  console.log('');

  // Test 4: Complex corrections with insertions and deletions
  console.log('Test 4: Complex corrections');
  const correctedText4 = `Hello everyone this is a comprehensive test
So let me start with the fundamental basics`;

  const result4 = humanCorrectionMutator(testCaptionsWithErrors, {
    humanCorrectedText: correctedText4,
    wordMatching: {
      fuzzyThreshold: 0.7,
    },
    correctionHandling: {
      handleSplits: true,
      handleMerges: true,
      handleInsertions: true,
      handleDeletions: true,
    },
    timingPreservation: {
      preserveOriginalTiming: true,
      useConfidenceWeighting: true,
    },
    outputFormat: {
      addCorrectionInfo: true,
      addMetadata: true,
    },
  });

  console.log('Complex corrections results:');
  result4.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
    console.log(`     Original: "${testCaptionsWithErrors[index]?.text}"`);
    console.log(`     Word count: ${caption.words.length}`);
    if ((caption as any).metadata?.correctionInfo) {
      const corrections = (caption as any).metadata.correctionInfo.alignmentLog;
      if (corrections.length > 0) {
        console.log(`     Corrections applied:`);
        corrections.forEach((correction: string) => {
          console.log(`       - ${correction}`);
        });
      }
    }
  });
  console.log('');

  // Test 5: Timing preservation verification
  console.log('Test 5: Timing preservation verification');
  const result5 = humanCorrectionMutator(testCaptionsWithErrors, {
    humanCorrectedText: correctedText1,
    wordMatching: {
      fuzzyThreshold: 0.8,
    },
    timingPreservation: {
      preserveOriginalTiming: true,
      useConfidenceWeighting: true,
    },
    outputFormat: {
      addMetadata: true,
    },
  });

  console.log('Timing preservation results:');
  result5.forEach((caption, index) => {
    console.log(`  Caption ${index + 1}:`);
    console.log(`    Text: "${caption.text}"`);
    console.log(
      `    Absolute timing: ${caption.absoluteStart}s - ${caption.absoluteEnd}s`
    );
    console.log(`    Relative timing: ${caption.start}s - ${caption.end}s`);
    console.log(`    Words:`);
    caption.words.forEach((word, wordIndex) => {
      console.log(
        `      ${wordIndex + 1}. "${word.text}": abs(${word.absoluteStart}s-${word.absoluteEnd}s) rel(${word.start}s-${word.end}s)`
      );
    });
  });

  return {
    basicCorrections: result1,
    wordSplitting: result2,
    wordMerging: result3,
    complexCorrections: result4,
    timingPreservation: result5,
  };
};

// Test function for edge cases
export const testHumanCorrectionEdgeCases = () => {
  console.log('\n=== Testing Edge Cases ===\n');

  // Edge case 1: Empty corrected text
  try {
    humanCorrectionMutator(testCaptionsWithErrors, {
      humanCorrectedText: '',
    });
  } catch (error) {
    console.log('Edge case 1 - Empty corrected text:');
    console.log(`  Error: ${(error as Error).message}`);
  }

  // Edge case 2: Completely different text
  console.log('\nEdge case 2 - Completely different text:');
  const completelyDifferentText = `This is completely different content
That has nothing to do with the original`;

  const result2 = humanCorrectionMutator(testCaptionsWithErrors, {
    humanCorrectedText: completelyDifferentText,
    wordMatching: {
      fuzzyThreshold: 0.3, // Very low threshold
    },
    fallbackOptions: {
      useOriginalWhenNoMatch: true,
      logAlignmentIssues: true,
    },
    outputFormat: {
      addCorrectionInfo: true,
    },
  });

  result2.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
  });

  // Edge case 3: More corrected sentences than original
  console.log('\nEdge case 3 - More corrected sentences than original:');
  const moreSentencesText = `Hello world this is a test
So let me start with the basics
This is an additional sentence
And another one here`;

  const result3 = humanCorrectionMutator(testCaptionsWithErrors, {
    humanCorrectedText: moreSentencesText,
    fallbackOptions: {
      skipUnmatchedSentences: false,
    },
  });

  console.log(`  Original sentences: ${testCaptionsWithErrors.length}`);
  console.log(`  Corrected sentences: ${result3.length}`);
  result3.forEach((caption, index) => {
    console.log(`    ${index + 1}. "${caption.text}"`);
  });

  return {
    completelyDifferent: result2,
    moreSentences: result3,
  };
};

// Test function for intelligent word replacement
export const testIntelligentWordReplacement = () => {
  console.log('\n=== Testing Intelligent Word Replacement ===\n');

  // Test data with multiple sentences to test newline preservation
  const testCaptionsForIntelligentReplacement: TranscriptionSentence[] = [
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
    {
      id: '2',
      text: 'This is the second sentence',
      start: 0,
      end: 2.0,
      duration: 2.0,
      absoluteStart: 13.0,
      absoluteEnd: 15.0,
      words: [
        {
          text: 'This',
          start: 0,
          end: 0.4,
          duration: 0.4,
          confidence: 0.96,
          absoluteStart: 13.0,
          absoluteEnd: 13.4,
        },
        {
          text: 'is',
          start: 0.4,
          end: 0.6,
          duration: 0.2,
          confidence: 0.98,
          absoluteStart: 13.4,
          absoluteEnd: 13.6,
        },
        {
          text: 'the',
          start: 0.6,
          end: 0.8,
          duration: 0.2,
          confidence: 0.99,
          absoluteStart: 13.6,
          absoluteEnd: 13.8,
        },
        {
          text: 'second',
          start: 0.8,
          end: 1.3,
          duration: 0.5,
          confidence: 0.93,
          absoluteStart: 13.8,
          absoluteEnd: 14.3,
        },
        {
          text: 'sentence',
          start: 1.3,
          end: 2.0,
          duration: 0.7,
          confidence: 0.91,
          absoluteStart: 14.3,
          absoluteEnd: 15.0,
        },
      ],
    },
  ];

  // Test 1: Newline-based sentence preservation
  console.log('Test 1: Newline-based sentence preservation');
  const newlineCorrections = `Hello world this is a test
This is the second sentence`;

  const result1 = humanCorrectionMutator(
    testCaptionsForIntelligentReplacement,
    {
      humanCorrectedText: newlineCorrections,
      wordMatching: {
        enableIntelligentReplacement: true,
        complexityThreshold: 0.6,
      },
      fallbackOptions: {
        logAlignmentIssues: true,
      },
    }
  );

  console.log(
    'Newline-based corrections (should preserve sentence structure):'
  );
  result1.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}" (ID: ${caption.id})`);
  });
  console.log('');

  // Test 2: Complex word replacements (should be avoided)
  console.log('Test 2: Complex word replacements');
  const complexCorrections = `Hello universe this is a comprehensive examination
This is the second sentence`;

  const result2 = humanCorrectionMutator(
    testCaptionsForIntelligentReplacement,
    {
      humanCorrectedText: complexCorrections,
      wordMatching: {
        enableIntelligentReplacement: true,
        complexityThreshold: 0.6,
      },
      fallbackOptions: {
        logAlignmentIssues: true,
      },
    }
  );

  console.log(
    'Complex corrections (should keep originals for first sentence):'
  );
  result2.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}" (ID: ${caption.id})`);
  });
  console.log('');

  // Test 3: Sentence count mismatch (more corrected sentences than original)
  console.log('Test 3: Sentence count mismatch');
  const moreSentencesCorrections = `Hello world this is a test
This is the second sentence
This is an additional third sentence`;

  const result3 = humanCorrectionMutator(
    testCaptionsForIntelligentReplacement,
    {
      humanCorrectedText: moreSentencesCorrections,
      wordMatching: {
        enableIntelligentReplacement: true,
        complexityThreshold: 0.6,
      },
      fallbackOptions: {
        logAlignmentIssues: true,
      },
    }
  );

  console.log(
    'More corrected sentences than original (should process only matching ones):'
  );
  result3.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}" (ID: ${caption.id})`);
  });
  console.log('');

  // Test 4: Sentence count mismatch (fewer corrected sentences than original)
  console.log('Test 4: Fewer corrected sentences');
  const fewerSentencesCorrections = `Hello world this is a test`;

  const result4 = humanCorrectionMutator(
    testCaptionsForIntelligentReplacement,
    {
      humanCorrectedText: fewerSentencesCorrections,
      wordMatching: {
        enableIntelligentReplacement: true,
        complexityThreshold: 0.6,
      },
      fallbackOptions: {
        logAlignmentIssues: true,
      },
    }
  );

  console.log(
    'Fewer corrected sentences than original (should process only first one):'
  );
  result4.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}" (ID: ${caption.id})`);
  });
  console.log('');

  // Test 5: Comparison with old simple approach
  console.log('Test 5: Comparison with old simple approach');
  const comparisonCorrections = `Hello universe this is a test
This is the second sentence`;

  const result5Intelligent = humanCorrectionMutator(
    testCaptionsForIntelligentReplacement,
    {
      humanCorrectedText: comparisonCorrections,
      wordMatching: {
        enableIntelligentReplacement: true,
        complexityThreshold: 0.6,
      },
      fallbackOptions: {
        logAlignmentIssues: true,
      },
    }
  );

  const result5Simple = humanCorrectionMutator(
    testCaptionsForIntelligentReplacement,
    {
      humanCorrectedText: comparisonCorrections,
      wordMatching: {
        enableIntelligentReplacement: false,
        fuzzyThreshold: 0.8,
      },
      fallbackOptions: {
        logAlignmentIssues: true,
      },
    }
  );

  console.log('Comparison results:');
  console.log('  Intelligent approach:');
  result5Intelligent.forEach((caption, index) => {
    console.log(`    ${index + 1}. "${caption.text}" (ID: ${caption.id})`);
  });
  console.log('  Simple approach:');
  result5Simple.forEach((caption, index) => {
    console.log(`    ${index + 1}. "${caption.text}" (ID: ${caption.id})`);
  });
  console.log('');

  return {
    newlinePreservation: result1,
    complexCorrections: result2,
    moreSentences: result3,
    fewerSentences: result4,
    intelligentVsSimple: {
      intelligent: result5Intelligent,
      simple: result5Simple,
    },
  };
};

// Run the tests
// testHumanCorrectionMutator();
// testHumanCorrectionEdgeCases();
// testIntelligentWordReplacement();
