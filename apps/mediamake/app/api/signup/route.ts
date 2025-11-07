import { Redis } from '@upstash/redis';
import { CrudHash } from '@microfox/db-upstash';
import { ApiKeyInfo } from '@/app/types/db';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const apiKeyStore = new CrudHash<ApiKeyInfo>(redis, 'apiKeys');

export async function POST(request: Request) {
  try {
    const { clientId, clientName } = await request.json();

    if (!clientId || !clientName) {
      return NextResponse.json(
        { message: 'clientId and clientName are required' },
        { status: 400 },
      );
    }

    // Check if clientId already exists by scanning all keys
    const allApiKeys = Object.values((await redis.hgetall('apiKeys')) || {});
    const existingUser = allApiKeys.find(
      (key: any) => key.clientId === clientId,
    );

    if (existingUser) {
      return NextResponse.json(
        { message: 'A user with this Client ID already exists' },
        { status: 409 }, // Conflict
      );
    }

    // Generate a new, unique 32-character alphanumeric (hex) API key
    const newApiKey = randomBytes(16).toString('hex');

    const newApiKeyInfo: ApiKeyInfo = {
      id: newApiKey,
      isValid: true,
      apiKey: newApiKey,
      clientId: clientId,
      clientName: clientName,
    };

    // Store the new key in Redis, with the key itself being the hash field
    await apiKeyStore.set(newApiKey, newApiKeyInfo);

    // Return the new key to the user so they can use it to log in
    return NextResponse.json(
      {
        message: 'Sign-up successful! Please save your new Client Key (password).',
        apiKey: newApiKey,
      },
      { status: 201 }, // Created
    );
  } catch (error) {
    console.error('Sign-up error:', error);
    return NextResponse.json(
      { message: 'An internal error occurred' },
      { status: 500 },
    );
  }
}
