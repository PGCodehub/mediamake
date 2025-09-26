import { ObjectId } from 'mongodb';

export interface CaptionWord {
  id: string;
  text: string;
  start: number;
  absoluteStart: number;
  absoluteEnd: number;
  end: number;
  confidence: number;
  duration: number;
}

export interface Caption {
  id: string;
  text: string;
  absoluteStart: number;
  absoluteEnd: number;
  start: number;
  end: number;
  words: CaptionWord[];
  duration: number;
  metadata?: Record<string, any>;
}

export interface Sequence {
  id: string;
  text?: string;
  absoluteStart: number;
  absoluteEnd: number;
  duration: number;
  isEmpty?: boolean;
  metadata: Record<string, any>;
}

export interface ProcessingData {
  step1?: {
    humanCorrectedText?: string;
    [key: string]: any;
  };
  step2?: {
    [key: string]: any;
  };
  step3?: {
    [key: string]: any;
  };
  step4?: {
    metadata?: any;
    generatedAt?: string;
    updatedAt?: string;
    [key: string]: any;
  };
  [key: string]: any; // Expandable for future steps
}

export interface Transcription {
  _id?: ObjectId;
  clientId?: string;
  assemblyId: string;
  audioUrl: string;
  language?: string;
  status:
    | 'processing'
    | 'completed'
    | 'failed'
    | 'step1'
    | 'step2'
    | 'step3'
    | 'step4';
  tags: string[];
  captions: Caption[];
  processingData: ProcessingData;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

export interface CreateTranscriptionRequest {
  clientId?: string;
  assemblyId: string;
  audioUrl: string;
  language?: string;
  status:
    | 'processing'
    | 'completed'
    | 'failed'
    | 'step1'
    | 'step2'
    | 'step3'
    | 'step4';
  tags?: string[];
  captions?: Caption[];
  processingData?: ProcessingData;
}

export interface UpdateTranscriptionRequest {
  status?: 'processing' | 'completed' | 'failed' | 'step1' | 'step2' | 'step3';
  tags?: string[];
  captions?: Caption[];
  processingData?: ProcessingData;
  error?: string;
}

export interface TranscriptionListResponse {
  transcriptions: Transcription[];
  total: number;
  page: number;
  limit: number;
}

export interface TranscriptionFilters {
  clientId?: string;
  status?: string;
  tags?: string[];
  language?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
