import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { CrudHash } from '@microfox/db-upstash';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const sessionStore = new CrudHash<any>(redis, 'sessions');

export async function POST() {
  const sessionId = (await cookies()).get('session_token')?.value;

  if (sessionId) {
    await sessionStore.del(sessionId);
  }

  (await cookies()).set('session_token', '', { expires: new Date(0), path: '/' });

  return NextResponse.json({ message: 'Logged out successfully' });
}
