import { NextResponse, NextRequest } from 'next/server';
import { ApiKeyInfo } from './app/types/db';
import { Redis } from '@upstash/redis';
import { CrudHash } from '@microfox/db-upstash';

// This function can be marked `async` if using `await` inside
export default async function middleware(request: NextRequest) {
  // Check for api key validity
  const apiKey = request.headers.get('Authorization');
  let bearer = apiKey?.split(' ')[1];

  if (
    (process.env.NODE_ENV === 'development' ||
      process.env.DEV_API_KEY != undefined) &&
    !bearer
  ) {
    // In development, use the API key from environment variables
    const devApiKey = process.env.DEV_API_KEY;
    if (devApiKey) {
      bearer = devApiKey;
    }
    const response = NextResponse.next();
    response.headers.set(
      'x-client-id',
      process.env.NEXT_PUBLIC_DEV_CLIENT_ID ?? 'dev',
    );
    return response;
    //return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  // Only allow api/remotion, api/transcribe & api/transcriptions routes
  if (
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/transcribe') &&
    !pathname.startsWith('/api/transcriptions') &&
    !pathname.startsWith('/api/studio') &&
    !pathname.startsWith('/api/presets') &&
    !pathname.startsWith('/api/preset-data') &&
    process.env.NODE_ENV === 'production'
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!bearer) {
    return NextResponse.json(
      { error: 'Unauthorized ( No API Key provided )' },
      { status: 401 },
    );
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? 'https://ignore',
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? 'ignore',
  });
  const apiKeyStore = new CrudHash<ApiKeyInfo>(redis, 'apiKeys');

  const apiKeyInfo = await apiKeyStore.get(bearer);
  if (!apiKeyInfo) {
    return NextResponse.json(
      { error: 'Unauthorized ( Invalid API Key provided )' },
      { status: 401 },
    );
  }
  if (!apiKeyInfo.isValid) {
    return NextResponse.json(
      { error: 'Unauthorized ( API Key is not valid anymore )' },
      { status: 401 },
    );
  }

  // Pass the clientId as a header to the next request
  const response = NextResponse.next();
  response.headers.set('x-client-id', apiKeyInfo.clientId);

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
