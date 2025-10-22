import { ObjectId } from 'mongodb';

export interface Tag {
  _id?: ObjectId;
  id: string; // shortformcapless like hashtag
  displayName: string;
  clientId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// RAG Image Metadata type for AI analysis
export interface RagImageMetadata {
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
  segmentation?: {
    foreground: {
      url: string;
      width: number;
      height: number;
      content_type: string;
      file_name: string;
    };
    background: {
      url: string;
      width: number;
      height: number;
      content_type: string;
      file_name: string;
    };
    mask: {
      url: string;
      width: number;
      height: number;
      content_type: string;
      file_name: string;
    };
  };
}

export interface MediaFile {
  _id?: ObjectId;
  tags: string[]; // Array of tag IDs
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
  contentType: 'video' | 'audio' | 'image' | 'document' | 'unknown';
  contentMimeType: string;
  contentSubType: string; // Changed from enum to string
  contentSource: string; // Changed from enum to string, default 'upload'
  contentSourceUrl?: string;
  metadata: RagImageMetadata | any; // AI analysis metadata or flexible metadata object
  fileName?: string;
  fileSize?: number;
  filePath?: string; // Path to the actual file
}

export interface CreateTagRequest {
  id: string;
  displayName: string;
  clientId?: string;
}

export interface CreateMediaFileRequest {
  tags: string[];
  clientId?: string;
  contentType: 'video' | 'audio' | 'image' | 'document' | 'unknown';
  contentMimeType: string;
  contentSubType: string;
  contentSource: string;
  contentSourceUrl?: string;
  metadata?: any;
  fileName?: string;
  fileSize?: number;
  filePath?: string;
}

export interface UpdateMediaFileRequest {
  tags?: string[];
  contentType?: 'video' | 'audio' | 'image' | 'document' | 'unknown';
  contentMimeType?: string;
  contentSubType?: string;
  contentSource?: string;
  contentSourceUrl?: string;
  metadata?: any;
  fileName?: string;
  fileSize?: number;
  filePath?: string;
}
