import { z } from 'zod';
import { AI_ANALYSIS_CONFIG } from './sparkbaord/config';

// Request body schema for AI analysis
const RequestBodySchema = z.object({
  imageUrl: z.string().url('Must be a valid URL'),
  platform: z.string().optional(),
  platformId: z.string().optional(),
  platformUrl: z.string().optional(),
  pageLink: z.string().optional(),
  imageLink: z.string().optional(),
  indexingId: z.string().optional(),
  promptUsed: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Response schema for AI analysis
const ResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string().optional(),
  doc: z
    .object({
      id: z.string(),
      metadata: z.any(),
      doc: z.string(),
    })
    .optional(),
});

// RAG Image Metadata type
export type RagImageMetadata = {
  indexingId?: string;
  src: string | null;
  responsiveImages: { url: string; size: string }[] | null;
  description: string | null;
  altText: string | null;
  imgPermalink: string | null;
  pagePermalink: string;
  width: number | null;
  height: number | null;
  palette?: string[] | null;
  dominantColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  aspectRatioType: string | null; // 4:3, 16:9, 1:1, etc.
  aspectRatio: number | null; // 4:3, 16:9, 1:1, etc.
  platform: string | null; // instagram, pinterest, etc.
  platformId: string | null; // instagram, pinterest, etc.
  platformUrl: string | null; // https://www.instagram.com, https://www.pinterest.com, etc.
  keywords: string[] | null;
  artStyle: string[] | null; // abstract, surrealism, etc.
  audienceKeywords: string[] | null; // abstract, surrealism, etc.
  mediaType: string | null; // image, video, etc.
  mimeType: string | null; // image/jpeg, image/png, video/mp4, etc.
  promptUsed?: string | null; // prompt used to generate the image
  userTags?: string[] | null; // tags used to generate the image
};

export type AnalysisRequestBody = z.infer<typeof RequestBodySchema>;
export type AnalysisResponse = z.infer<typeof ResponseSchema>;

/**
 * Analyzes an image using the AI analysis endpoint
 * @param imageUrl - URL of the image to analyze
 * @param clientId - Client ID to use as indexingId
 * @param additionalData - Optional additional data for the analysis
 * @returns Promise with analysis result or null if analysis fails
 */
export async function analyzeImage(
  imageUrl: string,
  clientId: string,
  additionalData?: Partial<AnalysisRequestBody>,
): Promise<RagImageMetadata | null> {
  try {
    if (!AI_ANALYSIS_CONFIG.apiKey) {
      console.warn('AI_ANALYSIS_API_KEY not configured, skipping analysis');
      return null;
    }

    const requestBody: AnalysisRequestBody = {
      imageUrl,
      indexingId: clientId,
      ...additionalData,
    };

    // Validate request body
    const validatedBody = RequestBodySchema.parse(requestBody);

    const response = await fetch(
      `${AI_ANALYSIS_CONFIG.baseUrl}/images/index/single`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_ANALYSIS_CONFIG.apiKey}`,
        },
        body: JSON.stringify(validatedBody),
      },
    );

    if (!response.ok) {
      console.error(
        `AI analysis failed with status ${response.status}:`,
        await response.text(),
      );
      return null;
    }

    const responseData = await response.json();
    const validatedResponse = ResponseSchema.parse(responseData);

    if (validatedResponse.status === 'error') {
      console.error('AI analysis returned error:', validatedResponse.message);
      return null;
    }

    if (validatedResponse.doc?.metadata) {
      return validatedResponse.doc.metadata as RagImageMetadata;
    }

    return null;
  } catch (error) {
    console.error('Error during AI analysis:', error);
    return null;
  }
}

/**
 * Checks if metadata already has a description field
 * @param metadata - Current metadata object
 * @returns boolean indicating if description exists
 */
export function hasDescription(metadata: any): boolean {
  return (
    metadata &&
    typeof metadata === 'object' &&
    'description' in metadata &&
    metadata.description
  );
}
