'use client';

import { InputCompositionProps } from '@microfox/remotion';
import z from 'zod';

import { ObjectId } from 'mongodb';

export interface PresetMetadata {
  id: string;
  title: string;
  description?: string;
  type: 'predefined' | 'database';
  presetType: 'children' | 'data' | 'context' | 'effects' | 'full';
  targetId?: string; // For inserting into specific component
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  defaultInputParams?: any;
}

export interface Preset {
  metadata: PresetMetadata;
  presetFunction: string; // Stringified function
  presetParams: any; // JSON schema
}

export interface PresetInputData {
  [key: string]: any;
}

export interface PresetPassedProps {
  config: InputCompositionProps['config'];
  style?: InputCompositionProps['style'];
  clip?: {
    start?: number;
    duration?: number;
  };
  fetcher?: (url: string, data?: any) => Promise<any>;
  baseData?: Record<string, any>; // Base data containing references for data:[key] replacement
}

export interface PresetOutput {
  output: Partial<InputCompositionProps>;
  options?: Partial<{
    attachedToId?: string;
    attachedContainers?: any;
    clip?: {
      start?: number;
      duration?: number;
    };
  }>;
}

export interface PresetConfiguration {
  style?: any;
  config?: any;
  [key: string]: any;
}

export interface PresetEditorState {
  selectedPreset: Preset | null;
  inputData: PresetInputData;
  configuration: PresetConfiguration;
  generatedOutput: InputCompositionProps | null;
  activeTab: 'input' | 'config' | 'output';
}

export interface PresetTab {
  id: 'input' | 'config' | 'output';
  label: string;
  description: string;
}

// MongoDB-specific types
export interface DatabasePreset {
  _id?: ObjectId;
  clientId?: string;
  metadata: PresetMetadata;
  presetFunction: string;
  presetParams: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePresetRequest {
  clientId?: string;
  metadata: Omit<PresetMetadata, 'id' | 'type' | 'createdAt' | 'updatedAt'>;
  presetFunction: string;
  presetParams: any;
}

export interface UpdatePresetRequest {
  metadata?: Partial<
    Omit<PresetMetadata, 'id' | 'type' | 'createdAt' | 'updatedAt'>
  >;
  presetFunction?: string;
  presetParams?: any;
}

export interface PresetListResponse {
  presets: DatabasePreset[];
  total: number;
  page: number;
  limit: number;
}

export interface PresetFilters {
  clientId?: string;
  type?: 'predefined' | 'database';
  presetType?: 'children' | 'data' | 'context' | 'effects' | 'full';
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface AppliedPreset {
  id: string;
  preset: Preset | DatabasePreset;
  inputData: PresetInputData;
  isExpanded: boolean;
  disabled?: boolean;
}

export interface AppliedPresetsState {
  presets: AppliedPreset[];
  activePresetId: string | null;
}
// --- Transcription Schemas ---

export const TranscriptionWordSchema = z.object({
  id: z.string(),
  text: z.string(),
  start: z.number(),
  absoluteStart: z.number(),
  end: z.number(),
  absoluteEnd: z.number(),
  duration: z.number(),
  confidence: z.number(),
});

export type TranscriptionWord = z.infer<typeof TranscriptionWordSchema>;

export const TranscriptionSentenceSchema = z.object({
  id: z.string(),
  text: z.string(),
  start: z.number(),
  absoluteStart: z.number(),
  end: z.number(),
  absoluteEnd: z.number(),
  duration: z.number(),
  words: z.array(TranscriptionWordSchema),
});

export type TranscriptionSentence = z.infer<typeof TranscriptionSentenceSchema>;

// --- Reference Types for Data Mutation ---

export interface ReferenceItem {
  key: string;
  type:
    | 'media'
    | 'medias'
    | 'captions'
    | 'string'
    | 'number'
    | 'boolean'
    | 'object'
    | 'objects';
  value: any;
}

export interface DefaultPresetData {
  references: ReferenceItem[];
}
