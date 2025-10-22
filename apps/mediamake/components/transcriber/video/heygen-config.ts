// HeyGen Avatar Configuration

export interface HeyGenAvatar {
  id: string;
  name: string;
  gender: 'male' | 'female';
  style: 'professional' | 'casual' | 'formal';
  preview_image_url?: string;
  isPremium?: boolean; // True if requires paid subscription
  tier?: string; // free, plus, pro, enterprise
}

// Default HeyGen Avatars
// Note: These are placeholder avatars. Use the "Refresh Avatars" button in the UI to fetch
// the actual available avatars from your HeyGen account, or manually update this list.
// Avatar IDs change frequently, so it's best to fetch them dynamically.
export const POPULAR_AVATARS: HeyGenAvatar[] = [
  {
    id: 'default_avatar', // Placeholder - will be replaced when fetching from API
    name: 'Default Avatar',
    gender: 'female',
    style: 'professional',
  },
];

// Avatar Styles
export const AVATAR_STYLES = [
  { value: 'normal', label: 'Normal' },
  { value: 'circle', label: 'Circle' },
] as const;

// Video Resolution Options
export const VIDEO_RESOLUTIONS = [
  { value: '720p', label: '720p (HD)', description: 'Free tier - 10 credits/month, watermark' },
  { value: '1080p', label: '1080p (Full HD)', description: 'Requires paid subscription' },
  { value: '4k', label: '4K (Ultra HD)', description: 'Requires paid subscription' },
] as const;

// Background Types
export const BACKGROUND_TYPES = [
  { value: 'color', label: 'Solid Color' },
  { value: 'image', label: 'Image' },
] as const;

// Default Colors
export const DEFAULT_COLORS = [
  '#FFFFFF', // White
  '#000000', // Black
  '#008000', // Green
  '#0000FF', // Blue
  '#FF0000', // Red
  '#FFFF00', // Yellow
  '#FFA500', // Orange
  '#800080', // Purple
  '#FFC0CB', // Pink
  '#808080', // Gray
];

// Default Configuration
export const DEFAULT_CONFIG = {
  avatarId: '', // Will be set to first available avatar
  avatarStyle: 'normal',
  resolution: '720p',
  background: {
    type: 'color' as const,
    value: '#008000',
  },
};

// HeyGen API Configuration
export const HEYGEN_API_BASE_URL = 'https://api.heygen.com';
export const HEYGEN_API_VERSION = 'v2'; // Note: video/generate uses v2, but video_status uses v1!

// Video Generation Status
export type VideoGenerationStatus = 'processing' | 'completed' | 'failed';

// Helper function to build HeyGen API request
export function buildHeyGenVideoRequest(
  audioUrl: string,
  avatarId: string,
  avatarStyle: string,
  background: { type: 'color' | 'image'; value: string },
  resolution?: string
) {
  const request: any = {
    video_inputs: [
      {
        character: {
          type: 'avatar',
          avatar_id: avatarId,
          avatar_style: avatarStyle,
        },
        voice: {
          type: 'audio',
          audio_url: audioUrl,
        },
        background: {
          type: background.type,
          value: background.value,
        },
      },
    ],
  };

  // Add resolution if specified (for 1080p or 4k)
  if (resolution && resolution !== '720p') {
    request.dimension = {
      width: resolution === '1080p' ? 1920 : 3840,
      height: resolution === '1080p' ? 1080 : 2160,
    };
  }

  return request;
}

// Helper function to get avatar by ID
export function getAvatarById(avatarId: string): HeyGenAvatar | undefined {
  return POPULAR_AVATARS.find(avatar => avatar.id === avatarId);
}

// Helper function to get avatars by gender
export function getAvatarsByGender(gender: 'male' | 'female'): HeyGenAvatar[] {
  return POPULAR_AVATARS.filter(avatar => avatar.gender === gender);
}

// Helper function to get avatars by style
export function getAvatarsByStyle(style: 'professional' | 'casual' | 'formal'): HeyGenAvatar[] {
  return POPULAR_AVATARS.filter(avatar => avatar.style === style);
}

