import {
  InputCompositionProps,
  PanEffectData,
  ZoomEffectData,
  GenericEffectData,
} from '@microfox/remotion';
import z from 'zod';
import { PresetMetadata, PresetOutput } from '../types';

const presetParams = z.object({
  audio: z.object({
    src: z.string().describe('Audio source URL'),
    start: z.number().optional(),
    duration: z.number().optional(),
  }),
  clips: z
    .array(
      z.object({
        src: z.string().url().describe('Clip source URL'),
        type: z.enum(['video', 'image']).describe('Clip type'),
        fit: z
          .enum(['cover', 'contain', 'fill', 'none', 'scale-down'])
          .optional()
          .describe('How to fit the clip'),
        startOffset: z.number().optional().describe('Start offset in seconds'),
        duration: z.number().optional().describe('Duration in seconds'),
        loop: z.boolean().optional().describe('Loop the clip'),
        mute: z.boolean().optional().describe('Mute the clip'),
        volume: z.number().optional().describe('Volume level'),
        opacity: z.number().min(0).max(1).optional().describe('Opacity level'),
      }),
    )
    .min(1)
    .describe('Array of video/image clips to cut with beats'),
  minClipDuration: z
    .number()
    .optional()
    .describe('Minimum clip duration')
    .default(0.5),
  maxClipDuration: z
    .number()
    .optional()
    .describe('Maximum clip duration')
    .default(5),
  minTimeDiff: z
    .number()
    .min(0.1)
    .max(2)
    .optional()
    .describe('Minimum time between beats in seconds')
    .default(0.5),
  maxBeats: z
    .number()
    .min(0)
    .max(50)
    .optional()
    .describe(
      'Maximum number of beats to show (0 = auto-detect based on music)',
    )
    .default(0),
  isRepeatClips: z
    .boolean()
    .optional()
    .describe('Whether to repeat clips when there are more beats than clips')
    .default(true),
  hideBeatCount: z
    .boolean()
    .optional()
    .describe('Whether to hide the beat count')
    .default(false),
});

const presetExecution = async (
  params: z.infer<typeof presetParams>,
  props: {
    config: InputCompositionProps['config'];
    fetcher: (url: string, data: any) => Promise<any>;
  },
): Promise<Partial<PresetOutput>> => {
  const { audio, clips, minTimeDiff, maxBeats, isRepeatClips } = params;

  const { config, fetcher } = props;

  const { analysis, durationInSeconds, summary } = await fetcher(
    '/api/analyze-audio',
    {
      audioSrc: audio.src,
    },
  );

  if (!analysis || analysis.length === 0) {
    // Return an empty output or some indication of failure
    return {
      output: {
        childrenData: [],
      },
      options: {},
    };
  }

  // Smart calculation of optimal beat count based on musical characteristics
  const calculateOptimalBeatCount = (beats: any[], duration: number) => {
    if (beats.length === 0) return 10;

    // Analyze musical characteristics
    const avgIntensity =
      beats.reduce((sum, b) => sum + b.intensity, 0) / beats.length;
    const avgFrequency =
      beats.reduce((sum, b) => sum + b.frequency, 0) / beats.length;

    // Calculate tempo (beats per minute)
    const totalBeats = beats.length;
    const tempo = (totalBeats / duration) * 60; // BPM

    // Calculate intensity variance (how dynamic the music is)
    const intensityVariance =
      beats.reduce(
        (sum, b) => sum + Math.pow(b.intensity - avgIntensity, 2),
        0,
      ) / beats.length;

    // Calculate frequency diversity (how varied the frequencies are)
    const frequencyVariance =
      beats.reduce(
        (sum, b) => sum + Math.pow(b.frequency - avgFrequency, 2),
        0,
      ) / beats.length;

    // Smart calculation based on musical characteristics
    let optimalBeats = 10; // Base number

    // Tempo-based adjustment
    if (tempo > 140) {
      // Fast music - more frequent cuts
      optimalBeats = Math.min(25, Math.floor(duration * 1.5));
    } else if (tempo > 100) {
      // Medium tempo - balanced cuts
      optimalBeats = Math.min(20, Math.floor(duration * 1.2));
    } else {
      // Slow music - fewer, more impactful cuts
      optimalBeats = Math.min(15, Math.floor(duration * 0.8));
    }

    // Adjust based on intensity variance (more dynamic = more cuts)
    if (intensityVariance > 0.1) {
      optimalBeats = Math.min(optimalBeats + 5, 30);
    }

    // Adjust based on frequency diversity (more varied = more cuts)
    if (frequencyVariance > 100000) {
      optimalBeats = Math.min(optimalBeats + 3, 30);
    }

    // Ensure minimum and maximum bounds
    optimalBeats = Math.max(5, Math.min(optimalBeats, 30));

    return optimalBeats;
  };

  // Smart beat selection for clip changes - prioritize highest impact moments
  const selectImpactfulBeats = (
    beats: any[],
    maxBeatsCount: number = 30,
    minTimeDiff: number = 0.5,
  ) => {
    if (beats.length === 0) return [];

    // Calculate local intensity peaks (beats that are significantly higher than neighbors)
    const beatsWithLocalPeaks = beats.map((beat, index) => {
      const windowSize = 10; // Increased window for better musical context
      const start = Math.max(0, index - windowSize);
      const end = Math.min(beats.length, index + windowSize + 1);
      const neighbors = beats.slice(start, end);
      const avgNeighborIntensity =
        neighbors.reduce((sum, b) => sum + b.intensity, 0) / neighbors.length;

      const localPeakStrength = beat.intensity - avgNeighborIntensity;
      const isLocalPeak = localPeakStrength > 0.05; // More sensitive threshold

      return {
        ...beat,
        localPeakStrength,
        isLocalPeak,
        avgNeighborIntensity,
      };
    });

    // Score beats based on multiple factors
    const scoredBeats = beatsWithLocalPeaks.map(beat => {
      // Base intensity score (but not too dominant)
      const intensityScore = beat.intensity * 0.3;

      // Local peak bonus (most important for impact)
      const peakScore = beat.isLocalPeak ? beat.localPeakStrength * 0.4 : 0;

      // Frequency diversity (prefer varied frequencies)
      const frequencyScore = Math.min(beat.frequency / 3000, 1) * 0.2;

      // Spectral richness (more complex sounds)
      const spectralScore = (beat.spectralCentroid || 0) * 0.1;

      const totalScore =
        intensityScore + peakScore + frequencyScore + spectralScore;

      return {
        ...beat,
        totalScore,
        intensityScore,
        peakScore,
        frequencyScore,
        spectralScore,
      };
    });

    // Sort by total score (highest impact first)
    const sortedByImpact = scoredBeats.sort(
      (a, b) => b.totalScore - a.totalScore,
    );

    const selectedBeats: any[] = [];
    const usedTimestamps = new Set<number>();

    // Select beats ensuring minimum time difference

    for (const beat of sortedByImpact) {
      const tooClose = Array.from(usedTimestamps).some(
        usedTime => Math.abs(beat.timestamp - usedTime) < minTimeDiff,
      );

      if (!tooClose && selectedBeats.length < maxBeatsCount) {
        selectedBeats.push(beat);
        usedTimestamps.add(beat.timestamp);
      }
    }

    // If we need more beats, fill with remaining high-scoring ones that still respect minTimeDiff
    if (selectedBeats.length < maxBeatsCount) {
      const remainingBeats = sortedByImpact.filter(
        beat => !selectedBeats.includes(beat),
      );

      for (const beat of remainingBeats) {
        if (selectedBeats.length < maxBeatsCount) {
          // Still check minTimeDiff even in fallback
          const tooClose = Array.from(usedTimestamps).some(
            usedTime => Math.abs(beat.timestamp - usedTime) < minTimeDiff,
          );

          if (!tooClose) {
            selectedBeats.push(beat);
            usedTimestamps.add(beat.timestamp);
          }
        }
      }
    }

    const finalBeats = selectedBeats.sort((a, b) => a.timestamp - b.timestamp);

    return finalBeats;
  };

  // First, clip the analysis data based on audio start and duration
  const clipAnalysisData = (
    analysisData: any[],
    audioStart: number = 0,
    audioDuration?: number,
  ) => {
    let clippedData = analysisData.filter(beat => beat.timestamp >= audioStart);

    if (audioDuration) {
      const endTime = audioStart + audioDuration;
      clippedData = clippedData.filter(beat => beat.timestamp <= endTime);
    }

    // Adjust timestamps to be relative to the video start
    // If audio starts at 54s in the video, beats at 54.5s should appear at 0.5s in video
    const result = clippedData.map(beat => ({
      ...beat,
      timestamp: beat.timestamp - audioStart,
    }));

    return result;
  };

  const clippedAnalysis = clipAnalysisData(
    analysis,
    audio.start || 0,
    audio.duration,
  );

  // Smart beat selection based on musical characteristics
  let finalMaxBeats = maxBeats;

  if (maxBeats === 0) {
    finalMaxBeats = calculateOptimalBeatCount(
      clippedAnalysis,
      audio.duration || 20,
    );
  }

  const selectedBeats = selectImpactfulBeats(
    clippedAnalysis,
    finalMaxBeats,
    minTimeDiff,
  );

  // Smart transition effect selection based on musical characteristics
  const selectSmartTransitions = (beats: any[]) => {
    if (beats.length === 0) return [];

    const transitions = [];
    const avgIntensity =
      beats.reduce((sum, b) => sum + b.intensity, 0) / beats.length;
    const avgTimeDiff =
      beats.length > 1
        ? (beats[beats.length - 1].timestamp - beats[0].timestamp) /
          (beats.length - 1)
        : 1;

    for (let i = 0; i < beats.length; i++) {
      const beat = beats[i];
      const nextBeat = beats[i + 1];
      const timeDiff = nextBeat ? nextBeat.timestamp - beat.timestamp : 2;

      let selectedEffect = 'scale-in-cut'; // Default scale-in
      let transitionDuration = 0.4; // Default

      // Fast cuts (< 0.5s) get blur effects for smoothness
      if (timeDiff < 0.5) {
        selectedEffect = 'blur-in-cut';
        transitionDuration = 0.3;
      }
      // High intensity + close beats get shake for energy
      else if (beat.intensity > 0.8 && timeDiff < 1.0) {
        selectedEffect = 'shake-in-cut';
        transitionDuration = 0.3;
      }
      // High intensity beats get dramatic scale-in
      else if (beat.intensity > 0.8) {
        selectedEffect = 'scale-in-cut';
        transitionDuration = 0.6;
      }
      // Medium intensity gets standard scale-in
      else if (beat.intensity > 0.5) {
        selectedEffect = 'scale-in-cut';
        transitionDuration = 0.4;
      }
      // Low intensity gets subtle scale-in
      else {
        selectedEffect = 'scale-in-cut';
        transitionDuration = 0.3;
      }

      transitions.push({
        effect: selectedEffect,
        duration: transitionDuration,
        intensity: beat.intensity,
        timestamp: beat.timestamp,
        timeDiff: timeDiff,
      });
    }

    return transitions;
  };

  const smartTransitions = selectSmartTransitions(selectedBeats);

  // Debug: Show the relationship between audio timing and visual timing

  // Create clip components that sync with beats
  const clipComponents = [];

  // Add first clip that starts immediately at 0s (before first beat)
  if (selectedBeats.length > 0 && clips.length > 0) {
    const firstBeat = selectedBeats[0];
    const firstClip = clips[0];
    const firstClipDuration = firstBeat.timestamp; // Duration until first beat

    let firstClipType = firstClip.type;
    if (!firstClipType) {
      if (
        firstClip.src.endsWith('.png') ||
        firstClip.src.endsWith('.jpg') ||
        firstClip.src.endsWith('.jpeg') ||
        firstClip.src.endsWith('.gif') ||
        firstClip.src.endsWith('.webp') ||
        firstClip.src.endsWith('.svg') ||
        firstClip.src.endsWith('.avif')
      ) {
        firstClipType = 'image';
      } else {
        firstClipType = 'video';
      }
    }

    if (firstClipType === 'video') {
      clipComponents.push({
        id: `beat-clip-first`,
        componentId: 'VideoAtom',
        type: 'atom' as const,
        data: {
          src: firstClip.src,
          className: 'w-full h-full object-cover',
          fit: firstClip.fit || 'cover',
          loop: firstClip.loop || false,
          muted: firstClip.mute || true,
          volume: firstClip.volume || 0,
          startFrom: firstClip.startOffset || 0,
          style: {
            ...(firstClip.opacity !== undefined
              ? { opacity: firstClip.opacity }
              : {}),
          },
        },
        context: {
          timing: {
            start: 0,
            duration: firstClipDuration,
          },
        },
        effects: [], // Initialize effects array
      });
    } else if (firstClipType === 'image') {
      clipComponents.push({
        id: `beat-clip-first`,
        componentId: 'ImageAtom',
        type: 'atom' as const,
        data: {
          src: firstClip.src,
          className: 'w-full h-full object-cover',
          fit: firstClip.fit || 'cover',
          style: {
            ...(firstClip.opacity !== undefined
              ? { opacity: firstClip.opacity }
              : {}),
          },
        },
        context: {
          timing: {
            start: 0,
            duration: firstClipDuration,
          },
        },
        effects: [], // Initialize effects array
      });
    }
  }

  // Add beat-synced clips starting from the first beat
  const beatSyncedClips = selectedBeats
    .map((beatData: any, index: number) => {
      const { timestamp, intensity, beatType, frequency } = beatData;

      // Calculate duration until next beat starts
      const nextBeat = selectedBeats[index + 1];
      const baseDuration = nextBeat ? nextBeat.timestamp - timestamp : 2;

      // Add overlap time to ensure clips intersect and prevent black screens
      const overlapTime = 0.3; // 0.3 seconds overlap
      const duration = baseDuration + overlapTime;

      // Start the next clip earlier to prevent black screens
      const startTime = index === 0 ? timestamp : timestamp - overlapTime;

      // Select clip based on beat index (starting from clip 2 since clip 1 is used for the intro)
      let clip;
      if (isRepeatClips) {
        // Cycle through available clips (starting from index 1)
        const clipIndex = (index + 1) % clips.length;
        clip = clips[clipIndex];
      } else {
        // Use clips sequentially, but don't exceed available clips (starting from index 1)
        const clipIndex = index + 1;
        if (clipIndex < clips.length) {
          clip = clips[clipIndex];
        } else {
          // No more clips available, skip this beat

          return undefined;
        }
      }

      const displayClipIndex = isRepeatClips
        ? (index + 1) % clips.length
        : index + 1;

      let clipType = clip.type;
      if (!clipType) {
        if (
          clip.src.endsWith('.png') ||
          clip.src.endsWith('.jpg') ||
          clip.src.endsWith('.jpeg') ||
          clip.src.endsWith('.gif') ||
          clip.src.endsWith('.webp') ||
          clip.src.endsWith('.svg') ||
          clip.src.endsWith('.avif')
        ) {
          clipType = 'image';
        } else {
          clipType = 'video';
        }
      }
      // Create clip component based on type
      if (clipType === 'video') {
        return {
          id: `beat-clip-${index}`,
          componentId: 'VideoAtom',
          type: 'atom' as const,
          data: {
            src: clip.src,
            className: 'w-full h-full object-cover',
            fit: clip.fit || 'cover',
            loop: clip.loop || false,
            muted: clip.mute || true, // Mute by default for beat sync
            volume: clip.volume || 0,
            startFrom: clip.startOffset || 0,
            style: {
              ...(clip.opacity !== undefined ? { opacity: clip.opacity } : {}),
            },
          },
          context: {
            timing: {
              start: startTime,
              duration: duration,
            },
          },
          effects: [], // Initialize effects array
        };
      } else if (clipType === 'image') {
        return {
          id: `beat-clip-${index}`,
          componentId: 'ImageAtom',
          type: 'atom' as const,
          data: {
            src: clip.src,
            className: 'w-full h-full object-cover',
            fit: clip.fit || 'cover',
            style: {
              ...(clip.opacity !== undefined ? { opacity: clip.opacity } : {}),
            },
          },
          context: {
            timing: {
              start: startTime,
              duration: duration,
            },
          },
          effects: [], // Initialize effects array
        };
      }
    })
    .filter(component => component !== undefined);

  // Combine first clip with beat-synced clips
  const allClipComponents = [...clipComponents, ...beatSyncedClips];

  // Create continuous transition effects that span across multiple clips
  const continuousEffects: any[] = [];

  // Add shake effects as component-level effects using map to avoid mutation
  const clipsWithShakeEffects = allClipComponents.map((clip, index) => {
    const effects = [...(clip.effects || [])];

    // Add shake effect for high-intensity beats
    if (index > 0 && index <= selectedBeats.length) {
      const beat = selectedBeats[index - 1];
      if (beat.intensity > 0.8) {
        const shakeEffect = {
          id: `shake-effect-${index}`,
          componentId: 'shake',
          data: {
            mode: 'provider',
            targetIds: [clip.id],
            type: 'linear',
            amplitude: 10,
            frequency: 0.75,
            decay: true,
            axis: 'both',
            duration: 0.8,
            start: 0,
          },
        };
        (effects as any[]).push(shakeEffect);
      }
      const continuousScaleEffect = {
        id: `continuous-scale-effect-${index}`,
        componentId: 'generic',
        data: {
          mode: 'provider',
          targetIds: [clip.id],
          type: 'spring',
          ranges: [
            { key: 'scale', val: 1, prog: 0 },
            { key: 'scale', val: 1.3, prog: 0.1 }, // More dramatic scale up
            { key: 'scale', val: 1.3, prog: 0.7 }, // Hold at 1.3 for middle 60%
            { key: 'scale', val: 1.5, prog: 1 }, // Final scale up to 1.5
          ],
          duration: clip.context.timing.duration, // Use actual total duration
          start: 0, // Start at video beginning
        },
      };
      (effects as any[]).push(continuousScaleEffect);
    }

    return {
      ...clip,
      effects,
    };
  });

  const clipsWithBlurEffects = clipsWithShakeEffects.map((clip, index) => {
    const effects = [...(clip.effects || [])];

    // Add blur effects for transitions
    if (index < clipsWithShakeEffects.length - 1) {
      const currentClip = clipsWithShakeEffects[index];
      const nextClip = clipsWithShakeEffects[index + 1];

      // Calculate intersection duration
      const currentClipEnd =
        currentClip.context.timing.start + currentClip.context.timing.duration;
      const nextClipStart = nextClip.context.timing.start;
      const intersectionDuration = Math.max(0, currentClipEnd - nextClipStart);

      if (intersectionDuration > 0.2) {
        const blurDuration = Math.max(0.3, Math.min(0.5, intersectionDuration));

        // Blur out effect for start of current clip
        const blurOutEffect = {
          id: `blur-out-${index}`,
          componentId: 'generic',
          data: {
            mode: 'provider',
            targetIds: [currentClip.id],
            type: 'ease-out',
            ranges: [
              { key: 'blur', val: '8px', prog: 0 },
              { key: 'blur', val: '0px', prog: 1 },
            ],
            duration: blurDuration,
            start: 0,
          },
        };

        // Blur in effect for end of current clip
        const blurInEffect = {
          id: `blur-in-${index}`,
          componentId: 'generic',
          data: {
            mode: 'provider',
            targetIds: [currentClip.id],
            type: 'ease-in',
            ranges: [
              { key: 'blur', val: '0px', prog: 0 },
              { key: 'blur', val: '8px', prog: 1 },
            ],
            duration: blurDuration,
            start:
              currentClip.context.timing.start +
              currentClip.context.timing.duration -
              blurDuration,
          },
        };

        (effects as any[]).push(blurOutEffect);
        (effects as any[]).push(blurInEffect);
      }
    }

    return {
      ...clip,
      effects,
    };
  });

  // Use clips with their individual effects (shake and blur are now component-level)
  const clipsWithTransitions = clipsWithBlurEffects;

  const textComponents = selectedBeats.map((beatData: any, index: number) => {
    const { timestamp, intensity, beatType, frequency } = beatData;

    // Calculate duration until next beat starts
    const nextBeat = selectedBeats[index + 1];
    const duration = nextBeat ? nextBeat.timestamp - timestamp : 2; // Default 2 seconds for the last beat

    // Debug: Log the timestamps being used
    // console.log(
    //   `Beat ${index + 1}: timestamp=${timestamp.toFixed(2)}s, duration=${duration.toFixed(2)}s, intensity=${intensity.toFixed(2)}, type=${beatType}`,
    // );

    // Determine color based on beat type
    let color = 'white';
    if (beatType === 'low')
      color = '#ff6b6b'; // Red for low beats
    else if (beatType === 'mid')
      color = '#4ecdc4'; // Teal for mid beats
    else color = '#45b7d1'; // Blue for high beats

    // Scale size based on intensity
    const fontSize = Math.max(50, 100 + intensity * 100);

    // Only add effects for higher intensity beats (above 0.6 threshold)
    const shouldAnimate = intensity > 0.6;

    const baseComponent = {
      id: `beat-text-${index}`,
      componentId: 'TextAtom',
      type: 'atom' as const,
      data: {
        text: `${index + 1}`,
        style: {
          fontSize,
          fontWeight: 'bold',
          color,
          textAlign: 'center',
          opacity: 0.7 + intensity * 0.3, // Opacity based on intensity
        },
      },
      context: {
        timing: {
          start: timestamp,
          duration: duration,
        },
      },
    };

    // Return component without effects for lower intensity beats
    return baseComponent;
  });

  return {
    output: {
      childrenData: [
        {
          id: `beatstitch-track`,
          componentId: 'BaseLayout',
          type: 'layout' as const,
          data: {
            containerProps: {
              className: 'absolute inset-0',
            },
            repeatChildrenProps: {
              className: 'absolute inset-0 flex items-center justify-center',
            },
          },
          context: {
            timing: {
              start: 0,
              duration: durationInSeconds,
            },
          },
          childrenData: [
            ...clipsWithTransitions,
            ...(params.hideBeatCount ? [] : textComponents),
          ],
          effects: continuousEffects, // Only the scale effect is continuous
        },
      ],
    },
    options: {
      attachedToId: `BaseScene`,
    },
  };
};

const presetMetadata: PresetMetadata = {
  id: 'beatstitch',
  title: 'BeatStitch',
  description: 'Analyzes audio to create beat-synced number animations.',
  type: 'predefined',
  presetType: 'children',
  tags: ['audio', 'beat-sync', 'animation'],
  defaultInputParams: {
    audio: {
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      start: 0,
      duration: 30,
    },
    clips: [
      {
        src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        type: 'video',
        fit: 'cover',
        opacity: 0.8,
      },
      {
        src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        type: 'video',
        fit: 'cover',
        opacity: 0.9,
      },
    ],
    minTimeDiff: 0.5,
    maxBeats: 0, // Auto-detect
    isRepeatClips: true,
    minClipDuration: 0.5,
    maxClipDuration: 5,
    hideBeatCount: true,
  },
};

const presetFunction = presetExecution.toString();
const presetParamsSchema = z.toJSONSchema(presetParams);

const beatstitchPreset = {
  metadata: presetMetadata,
  presetFunction: presetFunction,
  presetParams: presetParamsSchema,
};

export { beatstitchPreset };
