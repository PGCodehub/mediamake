import { NextRequest, NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Enhanced audio analysis with comprehensive data for advanced audio visualization
interface AudioAnalysisResult {
  timestamp: number; // Time in seconds when this analysis window occurs
  intensity: number; // RMS intensity normalized to 0-1 scale
  frequency: number; // Dominant frequency in Hz
  beatType: 'low' | 'mid' | 'high'; // Frequency-based classification
  spectralCentroid: number; // "Brightness" of the sound (0-1)
  spectralRolloff: number; // Frequency below which 85% of energy lies (0-1)
  zeroCrossingRate: number; // Rate of sign changes (indicates noise vs tone)
  mfcc: number[]; // Mel-frequency cepstral coefficients for timbre analysis
}

// FFT implementation for frequency analysis
const fft = (
  real: number[],
  imag: number[] = [],
): { real: number[]; imag: number[] } => {
  const N = real.length;
  if (N <= 1) return { real, imag };

  const evenReal = real.filter((_, i) => i % 2 === 0);
  const oddReal = real.filter((_, i) => i % 2 === 1);
  const evenImag = imag.filter((_, i) => i % 2 === 0);
  const oddImag = imag.filter((_, i) => i % 2 === 1);

  const even = fft(evenReal, evenImag);
  const odd = fft(oddReal, oddImag);

  const resultReal = new Array(N);
  const resultImag = new Array(N);

  for (let i = 0; i < N / 2; i++) {
    const angle = (-2 * Math.PI * i) / N;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const tempReal = cos * odd.real[i] - sin * odd.imag[i];
    const tempImag = cos * odd.imag[i] + sin * odd.real[i];

    resultReal[i] = even.real[i] + tempReal;
    resultImag[i] = even.imag[i] + tempImag;
    resultReal[i + N / 2] = even.real[i] - tempReal;
    resultImag[i + N / 2] = even.imag[i] - tempImag;
  }

  return { real: resultReal, imag: resultImag };
};

// Calculate spectral centroid
const calculateSpectralCentroid = (magnitude: number[]): number => {
  let weightedSum = 0;
  let magnitudeSum = 0;

  for (let i = 0; i < magnitude.length; i++) {
    weightedSum += i * magnitude[i];
    magnitudeSum += magnitude[i];
  }

  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
};

// Calculate spectral rolloff
const calculateSpectralRolloff = (
  magnitude: number[],
  threshold = 0.85,
): number => {
  const totalEnergy = magnitude.reduce((sum, val) => sum + val, 0);
  const targetEnergy = totalEnergy * threshold;

  let cumulativeEnergy = 0;
  for (let i = 0; i < magnitude.length; i++) {
    cumulativeEnergy += magnitude[i];
    if (cumulativeEnergy >= targetEnergy) {
      return i / magnitude.length;
    }
  }

  return 1;
};

// Calculate zero crossing rate
const calculateZeroCrossingRate = (signal: number[]): number => {
  let crossings = 0;
  for (let i = 1; i < signal.length; i++) {
    if (signal[i] >= 0 !== signal[i - 1] >= 0) {
      crossings++;
    }
  }
  return crossings / (signal.length - 1);
};

// Calculate MFCC (simplified version)
const calculateMFCC = (magnitude: number[], numCoeffs = 13): number[] => {
  const mfcc = new Array(numCoeffs).fill(0);

  // Simplified mel-scale filter bank
  const numFilters = 26;
  const melFilters = new Array(numFilters);

  for (let i = 0; i < numFilters; i++) {
    melFilters[i] = new Array(magnitude.length).fill(0);
    const start = Math.floor((i / numFilters) * magnitude.length);
    const end = Math.floor(((i + 2) / numFilters) * magnitude.length);

    for (let j = start; j < end && j < magnitude.length; j++) {
      melFilters[i][j] = 1;
    }
  }

  // Apply filters and calculate coefficients
  for (let i = 0; i < numCoeffs; i++) {
    let sum = 0;
    for (let j = 0; j < numFilters; j++) {
      let filterSum = 0;
      for (let k = 0; k < magnitude.length; k++) {
        filterSum += magnitude[k] * melFilters[j][k];
      }
      sum +=
        Math.log(Math.max(filterSum, 1e-10)) *
        Math.cos((Math.PI * i * (j + 0.5)) / numFilters);
    }
    mfcc[i] = sum;
  }

  return mfcc;
};

// Enhanced beat detection with comprehensive analysis
const analyzeAudio = (
  channelWaveform: number[],
  sampleRate: number,
  windowSize = 2048,
  hopSize = 512,
): AudioAnalysisResult[] => {
  const results: AudioAnalysisResult[] = [];
  const numWindows = Math.floor(
    (channelWaveform.length - windowSize) / hopSize,
  );

  // First pass: calculate global RMS statistics for proper normalization
  const allRMS: number[] = [];
  for (let i = 0; i < numWindows; i++) {
    const start = i * hopSize;
    const window = channelWaveform.slice(start, start + windowSize);
    const windowed = window.map(
      (sample, idx) =>
        sample * (0.5 - 0.5 * Math.cos((2 * Math.PI * idx) / (windowSize - 1))),
    );
    const rms = Math.sqrt(
      windowed.reduce((sum, sample) => sum + sample * sample, 0) / windowSize,
    );
    allRMS.push(rms);
  }

  // Find dynamic range for proper normalization
  const minRMS = Math.min(...allRMS);
  const maxRMS = Math.max(...allRMS);
  const rmsRange = maxRMS - minRMS;

  console.log(
    `🎵 Audio analysis: minRMS=${minRMS.toFixed(4)}, maxRMS=${maxRMS.toFixed(4)}, range=${rmsRange.toFixed(4)}`,
  );

  for (let i = 0; i < numWindows; i++) {
    const start = i * hopSize;
    const window = channelWaveform.slice(start, start + windowSize);
    const timestamp = start / sampleRate;

    // Apply windowing function (Hanning window)
    const windowed = window.map(
      (sample, idx) =>
        sample * (0.5 - 0.5 * Math.cos((2 * Math.PI * idx) / (windowSize - 1))),
    );

    // Calculate intensity (RMS)
    const rms = Math.sqrt(
      windowed.reduce((sum, sample) => sum + sample * sample, 0) / windowSize,
    );

    // Dynamic range normalization - much better intensity distribution
    const intensity = rmsRange > 0 ? (rms - minRMS) / rmsRange : 0;

    // Skip if intensity is too low (adjusted threshold for better filtering)
    if (intensity < 0.05) continue;

    // FFT analysis
    const fftResult = fft(windowed);
    const magnitude = fftResult.real.map((real, idx) =>
      Math.sqrt(real * real + fftResult.imag[idx] * fftResult.imag[idx]),
    );

    // Find dominant frequency
    let maxMagnitude = 0;
    let dominantFreq = 0;
    for (let j = 0; j < magnitude.length / 2; j++) {
      if (magnitude[j] > maxMagnitude) {
        maxMagnitude = magnitude[j];
        dominantFreq = (j * sampleRate) / windowSize;
      }
    }

    // Classify beat type based on frequency
    let beatType: 'low' | 'mid' | 'high';
    if (dominantFreq < 250) {
      beatType = 'low';
    } else if (dominantFreq < 2000) {
      beatType = 'mid';
    } else {
      beatType = 'high';
    }

    // Calculate spectral features
    const spectralCentroid = calculateSpectralCentroid(magnitude);
    const spectralRolloff = calculateSpectralRolloff(magnitude);
    const zeroCrossingRate = calculateZeroCrossingRate(window);

    // Calculate MFCC
    const mfcc = calculateMFCC(magnitude);

    results.push({
      timestamp,
      intensity,
      frequency: dominantFreq,
      beatType,
      spectralCentroid,
      spectralRolloff,
      zeroCrossingRate,
      mfcc,
    });
  }

  return results;
};

const downloadFile = (url: string, dest: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        return response.arrayBuffer();
      })
      .then(buffer => {
        fs.writeFileSync(dest, Buffer.from(buffer));
        resolve();
      })
      .catch(error => {
        reject(error);
      });
  });
};

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Audio analysis endpoint - use POST with audioSrc',
  });
}

export async function POST(req: NextRequest) {
  try {
    const { audioSrc } = await req.json();
    if (!audioSrc) {
      return NextResponse.json(
        { error: 'audioSrc is required' },
        { status: 400 },
      );
    }

    const tempInputPath = path.join(os.tmpdir(), `audio-input-${Date.now()}`);
    await downloadFile(audioSrc, tempInputPath);

    // Get audio metadata first
    const audioMetadata = await new Promise<ffmpeg.FfprobeData>(
      (resolve, reject) => {
        ffmpeg.ffprobe(audioSrc, (err, metadata) => {
          if (err) {
            return reject(err);
          }
          resolve(metadata);
        });
      },
    );

    const sampleRate = audioMetadata.streams[0].sample_rate || 44100;
    const durationInSeconds = audioMetadata.format.duration || 0;

    // Convert audio to raw PCM data for analysis
    const tempOutputPath = path.join(
      os.tmpdir(),
      `audio-output-${Date.now()}.raw`,
    );

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInputPath)
        .audioChannels(1) // Mono
        .audioFrequency(sampleRate)
        .format('s16le') // 16-bit signed little-endian
        .output(tempOutputPath)
        .on('end', () => resolve())
        .on('error', err => reject(err))
        .run();
    });

    // Read the raw audio data
    const audioBuffer = fs.readFileSync(tempOutputPath);
    const audioData = new Int16Array(audioBuffer.buffer);

    // Convert to normalized float array for beat detection
    const normalizedData = Array.from(audioData).map(
      sample => sample / 32768.0,
    );

    // Cleanup temporary files
    fs.unlinkSync(tempInputPath);
    fs.unlinkSync(tempOutputPath);

    const analysisResults = analyzeAudio(normalizedData, sampleRate);

    const response = NextResponse.json({
      analysis: analysisResults,
      durationInSeconds,
      summary: {
        totalBeats: analysisResults.length,
        averageIntensity:
          analysisResults.reduce((sum, r) => sum + r.intensity, 0) /
          analysisResults.length,
        lowBeats: analysisResults.filter(r => r.beatType === 'low').length,
        midBeats: analysisResults.filter(r => r.beatType === 'mid').length,
        highBeats: analysisResults.filter(r => r.beatType === 'high').length,
      },
    });

    // Add cache headers
    response.headers.set('Cache-Control', 'public, max-age=86400'); // 24 hours
    response.headers.set('ETag', `"${Date.now()}-${audioSrc.length}"`);
    response.headers.set('Last-Modified', new Date().toUTCString());

    return response;
  } catch (error) {
    console.error('Error analyzing audio:', error);
    return NextResponse.json(
      { error: 'Failed to analyze audio' },
      { status: 500 },
    );
  }
}
