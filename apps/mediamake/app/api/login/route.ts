import { Redis } from '@upstash/redis';
import { CrudHash } from '@microfox/db-upstash';
import { ApiKeyInfo } from '@/app/types/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const sessionStore = new CrudHash<any>(redis, 'sessions');

export async function POST(request: Request) {
  try {
    const { clientId, clientKey } = await request.json();

    // 1. Validate credentials
    const apiKeyStore = new CrudHash<ApiKeyInfo>(redis, 'apiKeys');
    const apiKeyInfo = await apiKeyStore.get(clientKey);

    if (
      !apiKeyInfo ||
      !apiKeyInfo.isValid ||
      apiKeyInfo.clientId !== clientId
    ) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 },
      );
    }

    // 2. Create session
    const sessionId = randomBytes(32).toString('hex');
    const sessionExpiry = 60 * 60 * 24 * 7; // 7 days in seconds

    await sessionStore.set(
      sessionId,
      {
        clientId: apiKeyInfo.clientId,
        expires: Date.now() + sessionExpiry * 1000,
      },
      { ttl: sessionExpiry }, // Use the ttl option from CrudHash
    );

    // 3. Set cookie
    (await cookies()).set('session_token', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionExpiry,
      path: '/',
    });

    return NextResponse.json({ message: 'Logged in successfully' });
  } catch (error) {
    return NextResponse.json(
      { message: 'An internal error occurred' },
      { status: 500 },
    );
  }
}
