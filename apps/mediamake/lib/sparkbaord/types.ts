import { z } from 'zod';
import { RagImageMetadata } from '@/app/types/media';

// Search query parameters schema
export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  artStyle: z.string().optional(),
  keywords: z.string().optional(),
  audienceKeywords: z.string().optional(),
  aspectRatioType: z.string().optional(),
  mediaType: z.string().optional(),
  mimeType: z.string().optional(),
  platformId: z.string().optional(),
  searchType: z
    .enum(['clientFiles', 'mediaFiles', 'allFiles'])
    .default('allFiles'),
  topK: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 10))
    .refine(val => val >= 1 && val <= 100, {
      message: 'topK must be between 1 and 100',
    }),
});

// Search result schema using existing RagImageMetadata
export const SearchResultSchema = z.object({
  id: z.union([z.string(), z.number()]),
  score: z.number(),
  metadata: z.custom<RagImageMetadata>().optional(),
  data: z.record(z.string(), z.any()).optional(),
});

// Search response schema
export const SearchResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    results: z.array(SearchResultSchema),
    total: z.number(),
  }),
});

// Error response schema
export const ErrorResponseSchema = z.object({
  success: z.boolean(),
  error: z.string(),
});

// TypeScript types derived from schemas
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Indexing request schema
export const IndexingRequestSchema = z.object({
  siteLinks: z.array(z.string().url('Must be a valid URL')),
  indexingLimit: z.number().min(1).max(100).default(10),
  tags: z.array(z.string()).optional().default([]),
  crawlVideos: z.boolean().default(true),
  dbFolder: z.string().default('mediamake/scraped/default'),
});

// Indexing response schema
export const IndexingResponseSchema = z.object({
  indexingId: z.string(),
  message: z.string().optional(),
  processedCount: z.number().optional(),
});

// Indexing status schema
export const IndexingStatusSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      indexing: z.object({
        progress: z.number(),
        isFullyIndexed: z.boolean(),
      }),
      results: z.array(z.any()).optional(),
    })
    .optional(),
  error: z.string().optional(),
});

// TypeScript types for indexing
export type IndexingRequest = z.infer<typeof IndexingRequestSchema>;
export type IndexingResponse = z.infer<typeof IndexingResponseSchema>;
export type IndexingStatus = z.infer<typeof IndexingStatusSchema>;
