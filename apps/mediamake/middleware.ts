import { NextResponse, NextRequest } from 'next/server';
import { ApiKeyInfo } from './app/types/db';
import { Redis } from '@upstash/redis';
import { CrudHash } from '@microfox/db-upstash';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const sessionStore = new CrudHash<any>(redis, 'sessions');

export default async function middleware(request: NextRequest) {
  // --- New: Session Authentication Pre-Check ---
  const sessionId = request.cookies.get('session_token')?.value;
  if (sessionId) {
    const session = await sessionStore.get(sessionId);
    if (session && session.expires > Date.now()) {
      // If a valid session exists, authenticate the request and bypass the old logic.
      const response = NextResponse.next();
      response.headers.set('x-client-id', session.clientId);
      return response;
    }
  }

  // Check for api key validity
  const apiKey = request.headers.get('Authorization');
  let bearer = apiKey?.split(' ')[1];

  if (
    (process.env.NODE_ENV === 'development' &&
      !!process.env.DEV_API_KEY &&
      process.env.DEV_API_KEY !== '') &&
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

  // Define protected UI routes
  const protectedUiRoutes = [
    '/dashboard',
    '/agents',
    '/api-keys',
    '/history',
    '/media',
    '/player',
    '/presets',
    '/transcriber',
  ];
  const isProtectedUiRoute = protectedUiRoutes.some(route => pathname.startsWith(route));

  // If a user has no valid auth and tries to access a protected UI route, redirect.
  if (!bearer && isProtectedUiRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Only allow api/remotion, api/transcribe & api/transcriptions routes
  // if (
  //   !pathname.startsWith('/api/') &&
  //   !pathname.startsWith('/api/transcribe') &&
  //   !pathname.startsWith('/api/transcriptions') &&
  //   !pathname.startsWith('/api/studio') &&
  //   !pathname.startsWith('/api/presets') &&
  //   !pathname.startsWith('/api/preset-data') &&
  //   process.env.NODE_ENV === 'production'
  // ) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  
  const publicApiRoutes = [
    '/api/login',
    '/api/signup',
  ];

  if (!bearer) {
    // For API routes, if there's no auth at all, fail.
    if (pathname.startsWith('/api/') && !publicApiRoutes.some(route => pathname == route)) {
      return NextResponse.json(
        { error: 'Unauthorized ( No API Key provided )' },
        { status: 401 },
      );
    }
  } else {
    // If there's a bearer token, validate it for any protected route.
    const apiKeyStore = new CrudHash<ApiKeyInfo>(redis, 'apiKeys');
    const apiKeyInfo = await apiKeyStore.get(bearer);
    if (!apiKeyInfo || !apiKeyInfo.isValid) {
      // If the key is invalid, block API routes and redirect UI routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized ( Invalid API Key provided )' }, { status: 401 });
      }
      if (isProtectedUiRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } else {
      // If the key is valid, proceed.
      const response = NextResponse.next();
      response.headers.set('x-client-id', apiKeyInfo.clientId);
      return response;
    }
  }

  // If none of the above, it's a public route, so just continue.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (the login page itself)
     * - signup (the signup page itself)
     */
    '/((?!_next/static|_next/image|favicon.ico|login|signup).*)',
  ],
};
