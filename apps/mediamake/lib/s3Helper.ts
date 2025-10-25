import { S3Space } from '@microfox/s3-space';

const s3 = new S3Space({
  forcePathStyle: false,
  endpoint: process.env.SPACES_ENDPOINT ?? '',
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY ?? '',
  },
  bucket: process.env.SPACES_BUCKET ?? '',
  cdnEndpoint: process.env.SPACES_CDN_ENDPOINT ?? '',
});

export interface S3UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Downloads a file from a URL and uploads it to S3
 * @param audioUrl - The URL of the audio file to download and upload
 * @param clientId - The client ID for folder organization
 * @returns Promise with upload result
 */
export async function uploadAudioToS3(
  audioUrl: string,
  clientId: string = 'default',
): Promise<S3UploadResult> {
  try {
    console.log('📤 Starting S3 upload for audio URL:', audioUrl);

    // Download the file from the URL
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer]);

    // Extract filename from URL or create a default one
    const urlPath = new URL(audioUrl).pathname;
    const originalFileName = urlPath.split('/').pop() || 'audio-file';
    const fileExtension = originalFileName.split('.').pop() || 'mp3';
    const uniqueName = `${Date.now()}-${originalFileName}`;

    // Create a File object from the blob
    const file = new File([blob], uniqueName, {
      type: response.headers.get('content-type') || `audio/${fileExtension}`,
    });

    // Determine folder name
    const folderName = `mediamake/${clientId.replaceAll(' ', '')}`;

    console.log('📤 Uploading to S3:', {
      fileName: uniqueName,
      folder: folderName,
      fileSize: file.size,
      fileType: file.type,
    });

    // Upload to S3
    const s3Response = await s3.uploadFile({
      file: file,
      folder: folderName,
    });

    if (!s3Response || s3Response.$metadata.httpStatusCode !== 200) {
      throw new Error('Failed to upload file to S3');
    }

    // Get the public URL
    const publicUrl = s3.getPublicFileUrl({
      file: file,
      folder: folderName,
    });

    console.log('✅ S3 upload successful:', {
      originalUrl: audioUrl,
      s3Url: publicUrl,
      httpStatusCode: s3Response.$metadata.httpStatusCode,
    });

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('❌ S3 upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Checks if a URL should be uploaded to S3
 * @param url - The URL to check
 * @returns boolean indicating if upload is needed
 */
export function shouldUploadToS3(url: string): boolean {
  // Upload to S3 if the URL doesn't start with the expected CDN pattern
  return !url.startsWith('https://aidev.blr1.cdn.digitaloceanspaces.com');
}

/**
 * Processes an audio URL - uploads to S3 if needed, otherwise returns original URL
 * @param audioUrl - The original audio URL
 * @param clientId - The client ID for folder organization
 * @returns Promise with the final URL to use
 */
export async function processAudioUrl(
  audioUrl: string,
  clientId: string = 'default',
): Promise<{ url: string; wasUploaded: boolean }> {
  if (shouldUploadToS3(audioUrl)) {
    console.log('📤 Audio URL needs S3 upload:', audioUrl);
    const uploadResult = await uploadAudioToS3(audioUrl, clientId);

    if (uploadResult.success && uploadResult.url) {
      return {
        url: uploadResult.url,
        wasUploaded: true,
      };
    } else {
      throw new Error(`Failed to upload to S3: ${uploadResult.error}`);
    }
  } else {
    console.log('✅ Audio URL already on S3, using original URL:', audioUrl);
    return {
      url: audioUrl,
      wasUploaded: false,
    };
  }
}
