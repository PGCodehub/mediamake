import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 },
      );
    }

    // Only allow HTTP/HTTPS URLs
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS URLs are allowed' },
        { status: 400 },
      );
    }

    // Check for common video platform URLs that might not work
    const hostname = parsedUrl.hostname.toLowerCase();
    const problematicDomains = [
      'youtube.com',
      'youtu.be',
      'vimeo.com',
      'dailymotion.com',
      'twitch.tv',
    ];

    if (problematicDomains.some(domain => hostname.includes(domain))) {
      return NextResponse.json(
        {
          error: 'Streaming platform URLs are not supported',
          details: `The URL appears to be from a streaming platform (${hostname}). These platforms typically don't allow direct download of their content. Please use a direct video file URL instead.`,
        },
        { status: 400 },
      );
    }

    // Download the media from the URL with CORS bypass and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    // Try direct fetch first
    let response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
    } catch (error) {
      // If direct fetch fails (likely CORS), try CORS proxy
      console.log('Direct fetch failed, trying CORS proxy:', error);

      try {
        // Try first CORS proxy service
        const proxyUrl1 = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

        response = await fetch(proxyUrl1, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Accept: '*/*',
          },
          redirect: 'follow',
          signal: controller.signal,
        });
      } catch (proxyError) {
        console.log(
          'First CORS proxy failed, trying second proxy:',
          proxyError,
        );

        try {
          // Try second CORS proxy service
          const proxyUrl2 = `https://cors-anywhere.herokuapp.com/${url}`;

          response = await fetch(proxyUrl2, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              Accept: '*/*',
              'X-Requested-With': 'XMLHttpRequest',
            },
            redirect: 'follow',
            signal: controller.signal,
          });
        } catch (secondProxyError) {
          console.log(
            'Second CORS proxy failed, trying third proxy:',
            secondProxyError,
          );

          try {
            // Try third CORS proxy service
            const proxyUrl3 = `https://thingproxy.freeboard.io/fetch/${url}`;

            response = await fetch(proxyUrl3, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Accept: '*/*',
              },
              redirect: 'follow',
              signal: controller.signal,
            });
          } catch (thirdProxyError) {
            console.log('All CORS proxies failed:', thirdProxyError);
            throw new Error(
              'All download methods failed. The URL may be blocked by CORS policies or the server may be unreachable.',
            );
          }
        }
      }
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `Download failed for URL: ${url}, Status: ${response.status}, StatusText: ${response.statusText}`,
      );
      return NextResponse.json(
        {
          error: `Failed to download media: ${response.statusText} (Status: ${response.status})`,
          details: `The server at ${parsedUrl.hostname} returned a ${response.status} error. This might be due to CORS restrictions, authentication requirements, or the URL being a streaming link that doesn't support direct download.`,
        },
        { status: response.status },
      );
    }

    // Get the content type and size
    const contentType =
      response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');

    // Check if it's a supported media type
    const supportedTypes = ['image/', 'video/', 'audio/', 'application/pdf'];

    const isSupportedMedia = supportedTypes.some(type =>
      contentType.startsWith(type),
    );

    if (!isSupportedMedia) {
      return NextResponse.json(
        {
          error:
            'Unsupported media type. Only images, videos, audio, and PDFs are supported.',
        },
        { status: 400 },
      );
    }

    // Check file size (limit to 100MB)
    if (contentLength && parseInt(contentLength) > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 },
      );
    }

    // Convert response to blob
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: contentType });

    // Return the blob as a response
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error downloading media:', error);
    return NextResponse.json(
      {
        error: 'Failed to download media',
        details:
          error instanceof Error ? error.message : 'Unknown error occurred',
        suggestion:
          'Please ensure the URL is a direct link to a media file (not a streaming platform URL) and that the file is publicly accessible.',
      },
      { status: 500 },
    );
  }
}
