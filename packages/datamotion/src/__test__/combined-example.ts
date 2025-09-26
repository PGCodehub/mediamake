import {
  captionMutator,
  humanCorrectionMutator,
  createPresetOptions,
} from './caption.mutate';
import { TranscriptionSentence } from '../schemas';

// Example showing how to use both mutators in sequence
export const combinedWorkflowExample = () => {
  console.log('=== Combined Workflow Example ===\n');

  // Sample transcription with errors and poor formatting
  const rawTranscription: TranscriptionSentence[] = [
    {
      id: '1',
      text: 'um hello world um this is um a test um',
      start: 0,
      end: 4.0,
      duration: 4.0,
      absoluteStart: 10.0,
      absoluteEnd: 14.0,
      words: [
        {
          text: 'um',
          start: 0,
          end: 0.3,
          duration: 0.3,
          confidence: 0.85,
          absoluteStart: 10.0,
          absoluteEnd: 10.3,
        },
        {
          text: 'hello',
          start: 0.3,
          end: 0.8,
          duration: 0.5,
          confidence: 0.95,
          absoluteStart: 10.3,
          absoluteEnd: 10.8,
        },
        {
          text: 'world',
          start: 0.8,
          end: 1.3,
          duration: 0.5,
          confidence: 0.92,
          absoluteStart: 10.8,
          absoluteEnd: 11.3,
        },
        {
          text: 'um',
          start: 1.3,
          end: 1.6,
          duration: 0.3,
          confidence: 0.85,
          absoluteStart: 11.3,
          absoluteEnd: 11.6,
        },
        {
          text: 'this',
          start: 1.6,
          end: 1.9,
          duration: 0.3,
          confidence: 0.88,
          absoluteStart: 11.6,
          absoluteEnd: 11.9,
        },
        {
          text: 'is',
          start: 1.9,
          end: 2.1,
          duration: 0.2,
          confidence: 0.94,
          absoluteStart: 11.9,
          absoluteEnd: 12.1,
        },
        {
          text: 'um',
          start: 2.1,
          end: 2.4,
          duration: 0.3,
          confidence: 0.85,
          absoluteStart: 12.1,
          absoluteEnd: 12.4,
        },
        {
          text: 'a',
          start: 2.4,
          end: 2.5,
          duration: 0.1,
          confidence: 0.99,
          absoluteStart: 12.4,
          absoluteEnd: 12.5,
        },
        {
          text: 'test',
          start: 2.5,
          end: 3.0,
          duration: 0.5,
          confidence: 0.9,
          absoluteStart: 12.5,
          absoluteEnd: 13.0,
        },
        {
          text: 'um',
          start: 3.0,
          end: 3.3,
          duration: 0.3,
          confidence: 0.85,
          absoluteStart: 13.0,
          absoluteEnd: 13.3,
        },
      ],
    },
    {
      id: '2',
      text: 'so let me start with the basics of our presentation today',
      start: 0,
      end: 4.5,
      duration: 4.5,
      absoluteStart: 14.0,
      absoluteEnd: 18.5,
      words: [
        {
          text: 'so',
          start: 0,
          end: 0.2,
          duration: 0.2,
          confidence: 0.92,
          absoluteStart: 14.0,
          absoluteEnd: 14.2,
        },
        {
          text: 'let',
          start: 0.2,
          end: 0.5,
          duration: 0.3,
          confidence: 0.96,
          absoluteStart: 14.2,
          absoluteEnd: 14.5,
        },
        {
          text: 'me',
          start: 0.5,
          end: 0.6,
          duration: 0.1,
          confidence: 0.98,
          absoluteStart: 14.5,
          absoluteEnd: 14.6,
        },
        {
          text: 'start',
          start: 0.6,
          end: 1.0,
          duration: 0.4,
          confidence: 0.94,
          absoluteStart: 14.6,
          absoluteEnd: 15.0,
        },
        {
          text: 'with',
          start: 1.0,
          end: 1.3,
          duration: 0.3,
          confidence: 0.97,
          absoluteStart: 15.0,
          absoluteEnd: 15.3,
        },
        {
          text: 'the',
          start: 1.3,
          end: 1.5,
          duration: 0.2,
          confidence: 0.99,
          absoluteStart: 15.3,
          absoluteEnd: 15.5,
        },
        {
          text: 'basics',
          start: 1.5,
          end: 2.2,
          duration: 0.7,
          confidence: 0.88,
          absoluteStart: 15.5,
          absoluteEnd: 16.2,
        },
        {
          text: 'of',
          start: 2.2,
          end: 2.4,
          duration: 0.2,
          confidence: 0.95,
          absoluteStart: 16.2,
          absoluteEnd: 16.4,
        },
        {
          text: 'our',
          start: 2.4,
          end: 2.7,
          duration: 0.3,
          confidence: 0.93,
          absoluteStart: 16.4,
          absoluteEnd: 16.7,
        },
        {
          text: 'presentation',
          start: 2.7,
          end: 3.5,
          duration: 0.8,
          confidence: 0.87,
          absoluteStart: 16.7,
          absoluteEnd: 17.5,
        },
        {
          text: 'today',
          start: 3.5,
          end: 4.0,
          duration: 0.5,
          confidence: 0.96,
          absoluteStart: 17.5,
          absoluteEnd: 18.0,
        },
      ],
    },
  ];

  console.log('Step 1: Raw transcription');
  rawTranscription.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
  });

  // Step 1: Clean up the transcription using captionMutator
  console.log(
    '\nStep 2: Cleaning up transcription (removing fillers, normalizing)'
  );
  const cleanedTranscription = captionMutator(rawTranscription, {
    ...createPresetOptions.accessibility(),
    textProcessing: {
      removeFillerWords: true,
      capitalizeFirst: true,
      addPunctuation: true,
      normalizeSpacing: true,
    },
    qualityFilters: {
      minConfidence: 0.8,
      removeLowConfidence: true,
    },
  });

  cleanedTranscription.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
  });

  // Step 2: Apply human corrections
  console.log('\nStep 3: Applying human corrections');
  const humanCorrectedText = `Hello world, this is a comprehensive test.
So let me start with the fundamental basics of our presentation today.`;

  const correctedTranscription = humanCorrectionMutator(cleanedTranscription, {
    humanCorrectedText,
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

  correctedTranscription.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
    if ((caption as any).metadata?.correctionInfo) {
      const corrections = (caption as any).metadata.correctionInfo
        .correctionsApplied;
      if (corrections > 0) {
        console.log(`     (${corrections} corrections applied)`);
      }
    }
  });

  // Step 3: Final formatting for social media
  console.log('\nStep 4: Final formatting for social media');
  const finalTranscription = captionMutator(correctedTranscription, {
    ...createPresetOptions.socialMedia(),
    timingAdjustment: {
      paddingBefore: 0.1,
      paddingAfter: 0.1,
    },
  });

  finalTranscription.forEach((caption, index) => {
    console.log(`  ${index + 1}. "${caption.text}"`);
    console.log(`     Duration: ${caption.duration.toFixed(1)}s`);
    console.log(`     Words: ${caption.words.length}`);
  });

  console.log('\n=== Summary ===');
  console.log(`Original sentences: ${rawTranscription.length}`);
  console.log(`After cleaning: ${cleanedTranscription.length}`);
  console.log(`After correction: ${correctedTranscription.length}`);
  console.log(`Final result: ${finalTranscription.length}`);

  return {
    raw: rawTranscription,
    cleaned: cleanedTranscription,
    corrected: correctedTranscription,
    final: finalTranscription,
  };
};

// Example for different use cases
export const useCaseExamples = () => {
  console.log('\n=== Use Case Examples ===\n');

  const sampleTranscription: TranscriptionSentence[] = [
    {
      id: '1',
      text: 'welcome to our company presentation',
      start: 0,
      end: 2.0,
      duration: 2.0,
      absoluteStart: 0,
      absoluteEnd: 2.0,
      words: [
        {
          text: 'welcome',
          start: 0,
          end: 0.5,
          duration: 0.5,
          confidence: 0.95,
          absoluteStart: 0,
          absoluteEnd: 0.5,
        },
        {
          text: 'to',
          start: 0.5,
          end: 0.6,
          duration: 0.1,
          confidence: 0.99,
          absoluteStart: 0.5,
          absoluteEnd: 0.6,
        },
        {
          text: 'our',
          start: 0.6,
          end: 0.8,
          duration: 0.2,
          confidence: 0.97,
          absoluteStart: 0.6,
          absoluteEnd: 0.8,
        },
        {
          text: 'company',
          start: 0.8,
          end: 1.3,
          duration: 0.5,
          confidence: 0.93,
          absoluteStart: 0.8,
          absoluteEnd: 1.3,
        },
        {
          text: 'presentation',
          start: 1.3,
          end: 2.0,
          duration: 0.7,
          confidence: 0.91,
          absoluteStart: 1.3,
          absoluteEnd: 2.0,
        },
      ],
    },
  ];

  // Use case 1: Educational content
  console.log('Use case 1: Educational content');
  const educationalText = `Welcome to our comprehensive company presentation.`;

  const educationalResult = humanCorrectionMutator(sampleTranscription, {
    humanCorrectedText: educationalText,
    wordMatching: { fuzzyThreshold: 0.8 },
    correctionHandling: { handleSplits: true, handleMerges: true },
    outputFormat: { addCorrectionInfo: true },
  });

  console.log(`  Original: "${sampleTranscription[0].text}"`);
  console.log(`  Corrected: "${educationalResult[0].text}"`);

  // Use case 2: Social media
  console.log('\nUse case 2: Social media');
  const socialMediaText = `Welcome to our company presentation!`;

  const socialMediaResult = humanCorrectionMutator(sampleTranscription, {
    humanCorrectedText: socialMediaText,
    wordMatching: { fuzzyThreshold: 0.8 },
    correctionHandling: { handleSplits: true, handleMerges: true },
    outputFormat: { addCorrectionInfo: true },
  });

  console.log(`  Original: "${sampleTranscription[0].text}"`);
  console.log(`  Corrected: "${socialMediaResult[0].text}"`);

  // Use case 3: Accessibility
  console.log('\nUse case 3: Accessibility');
  const accessibilityText = `Welcome to our company presentation.`;

  const accessibilityResult = humanCorrectionMutator(sampleTranscription, {
    humanCorrectedText: accessibilityText,
    wordMatching: { fuzzyThreshold: 0.9 }, // Higher threshold for accuracy
    timingPreservation: {
      preserveOriginalTiming: true,
      useConfidenceWeighting: true,
    },
    outputFormat: { addCorrectionInfo: true },
  });

  console.log(`  Original: "${sampleTranscription[0].text}"`);
  console.log(`  Corrected: "${accessibilityResult[0].text}"`);

  return {
    educational: educationalResult,
    socialMedia: socialMediaResult,
    accessibility: accessibilityResult,
  };
};

// Run examples
// combinedWorkflowExample();
// useCaseExamples();
