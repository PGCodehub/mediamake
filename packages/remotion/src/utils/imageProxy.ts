/**
 * Image Proxy Utilities
 *
 * Helper functions for working with image proxying in Remotion components
 */

/**
 * Creates a proxy URL for an external image
 * @param imageUrl - The original image URL
 * @param proxyEndpoint - The proxy endpoint (defaults to local API)
 * @returns The proxied URL
 */
export const createImageProxyUrl = (
  imageUrl: string,
  proxyEndpoint: string = '/api/proxy/image'
): string => {
  return `${proxyEndpoint}?url=${encodeURIComponent(imageUrl)}`;
};

/**
 * Creates image data with proxy fallback
 * @param src - The original image source
 * @param proxyEndpoint - Optional custom proxy endpoint
 * @returns Image data object with proxySrc configured
 */
export const createImageDataWithProxy = (
  src: string,
  proxyEndpoint?: string
) => {
  return {
    src,
    proxySrc: proxyEndpoint || '/api/proxy/image',
    style: {},
    className: '',
  };
};

/**
 * Checks if a URL needs proxying (external HTTP/HTTPS URLs)
 * @param url - The URL to check
 * @returns True if the URL needs proxying
 */
export const needsProxying = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};
