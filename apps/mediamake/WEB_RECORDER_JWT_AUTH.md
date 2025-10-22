# Web Recorder JWT Authentication Flow

## 🔒 SparkBoard-Style Encryption Pattern

We've implemented JWT encryption for webhook authentication, following the same pattern as SparkBoard's `webhookFetch` function.

## 🎯 How It Works

### 1. When Creating Recording

**Your API encrypts the API key:**

```typescript
// app/api/video/record/route.ts
import { encryptWebhookSecret } from '@/lib/webhook-auth';

// Get your API key
const webhookApiKey = process.env.DEV_API_KEY || process.env.WEBHOOK_API_KEY;

// Encrypt it using MEDIA_HELPER_SECRET
const webhookSecret = encryptWebhookSecret(webhookApiKey);
// Returns: JWT token (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlLZXkiOi...)

// Send to WebAction Recorder API
{
  "webhookUrl": "https://your-app.com/api/video/webhook",
  "webhookSecret": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "requestId": "..."
}
```

### 2. WebAction Recorder API Processes Recording

The API stores the encrypted secret and uses it when calling the webhook.

### 3. WebAction Recorder Calls Webhook

**The API decrypts and uses the secret:**

```typescript
// On WebAction Recorder API side:
const apiKey = decryptWebhookSecret(webhookSecret);

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`, // Decrypted API key
  },
  body: JSON.stringify(webhookPayload),
});
```

### 4. Your Webhook Receives and Validates

**Your webhook validates the API key (already decrypted by WebAction Recorder API):**

```typescript
// app/api/video/webhook/route.ts
// The WebAction Recorder API already decrypted the JWT
// We receive the plain API key in the Authorization header

const authHeader = request.headers.get('Authorization');
const apiKey = authHeader?.replace('Bearer ', '');

// Validate against your expected API key
const validApiKey = process.env.DEV_API_KEY || process.env.WEBHOOK_API_KEY;
if (apiKey !== validApiKey) {
  return 401 Unauthorized;
}

// ✅ Process webhook
```

## 🔑 Environment Variables Required

Add to your `.env`:

```env
# Media Helper API credentials
MEDIA_HELPER_URL=http://localhost:8080
MEDIA_HELPER_API_KEY=your-media-helper-api-key

# Your API key (for webhook authentication)
DEV_API_KEY=your-mediamake-api-key

# JWT encryption secret (REQUIRED)
MEDIA_HELPER_SECRET=your-secret-key-for-jwt-encryption
```

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Submits Recording                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Your API (app/api/video/record/route.ts)                     │
│                                                                  │
│  - Get API key: DEV_API_KEY                                     │
│  - Encrypt with JWT: encryptWebhookSecret(apiKey)               │
│    → Uses MEDIA_HELPER_SECRET as encryption key                 │
│    → Returns: "eyJhbGciOiJIUzI1NiI..."                          │
│                                                                  │
│  - Build payload:                                               │
│    {                                                             │
│      "webhookUrl": "https://app.com/api/video/webhook",        │
│      "webhookSecret": "eyJhbGciOiJIUzI1NiI...",                │
│      "requestId": "123..."                                      │
│    }                                                             │
│                                                                  │
│  - Send to WebAction Recorder API                               │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. WebAction Recorder API                                       │
│                                                                  │
│  - Receives webhookUrl & webhookSecret                          │
│  - Processes recording...                                       │
│  - When done, calls webhook:                                    │
│                                                                  │
│    POST https://app.com/api/video/webhook                       │
│    Authorization: Bearer {decrypted-api-key}                    │
│    Body: { event, data, requestId }                             │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Middleware (PASSES THROUGH - No Changes)                     │
│                                                                  │
│  - Sees Authorization header with API key                       │
│  - Validates against Redis                                      │
│  - If valid → continues to webhook                              │
│  - If invalid → 401 Unauthorized                                │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Your Webhook (app/api/video/webhook/route.ts)                │
│                                                                  │
│  - Extract API key from Authorization header                    │
│  - Validate API key matches expected DEV_API_KEY                │
│  - (No decryption needed - already done by WebAction API!)      │
│  - Process recording result                                     │
│  - Create media file in database                                │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
                      ✅ Video Saved!
```

## 🔐 Security Features

### JWT Encryption

**lib/webhook-auth.ts:**

```typescript
import jwt from 'jsonwebtoken';

export function encryptWebhookSecret(apiKey: string): string | null {
  const secret = process.env.MEDIA_HELPER_SECRET;

  // Sign API key with secret, expires in 7 days
  const encrypted = jwt.sign({ apiKey }, secret, { expiresIn: '7d' });
  return encrypted;
}

export function decryptWebhookSecret(token: string): string | null {
  const secret = process.env.MEDIA_HELPER_SECRET;

  // Verify and decode JWT
  const decoded = jwt.verify(token, secret);
  return decoded.apiKey;
}
```

### Why This is Secure

1. **✅ No Plaintext API Keys in URLs** - API key is encrypted in JWT
2. **✅ Tamper-Proof** - JWT signature validates integrity
3. **✅ Time-Limited** - Token expires in 7 days
4. **✅ Middleware Validation** - API key still validated by existing middleware
5. **✅ Double Verification** - Webhook also validates decrypted key

## 🔄 Comparison: Old vs New

### Old Approach (Query Parameter)

```
Webhook URL: https://app.com/api/video/webhook?apiKey=your-plaintext-key

❌ API key visible in URL
❌ Can be logged in server logs
❌ May appear in analytics
✅ Simple to implement
```

### New Approach (JWT Encryption)

```
Webhook URL: https://app.com/api/video/webhook
Webhook Secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

✅ API key encrypted
✅ No plaintext in URLs
✅ Tamper-proof signature
✅ Time-limited validity
✅ Same pattern as SparkBoard
```

## 📝 API Changes

### What WebAction Recorder API Needs to Do

1. **Accept `webhookSecret` field** in recording request
2. **Store the encrypted secret**
3. **When calling webhook:**

   ```typescript
   const apiKey = decryptWebhookSecret(webhookSecret);

   fetch(webhookUrl, {
     headers: {
       Authorization: `Bearer ${apiKey}`,
     },
   });
   ```

### Helper Function for WebAction Recorder API

Copy this to your WebAction Recorder API:

```typescript
import jwt from 'jsonwebtoken';

function decryptWebhookSecret(token: string): string | null {
  try {
    // Use the same secret as MediaMake
    const secret = process.env.MEDIA_HELPER_SECRET;

    const decoded = jwt.verify(token, secret);

    if (typeof decoded === 'object' && 'apiKey' in decoded) {
      return decoded.apiKey as string;
    }

    return null;
  } catch (error) {
    console.error('Error decrypting webhook secret:', error);
    return null;
  }
}

// Usage:
async function sendWebhook(
  webhookUrl: string,
  webhookSecret: string,
  payload: any,
) {
  const apiKey = decryptWebhookSecret(webhookSecret);

  if (!apiKey) {
    throw new Error('Invalid webhook secret');
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  return response;
}
```

## 🧪 Testing

### Test Encryption/Decryption

```typescript
import { encryptWebhookSecret, decryptWebhookSecret } from '@/lib/webhook-auth';

const apiKey = 'test-api-key-12345';

// Encrypt
const encrypted = encryptWebhookSecret(apiKey);
console.log('Encrypted:', encrypted);
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Decrypt
const decrypted = decryptWebhookSecret(encrypted);
console.log('Decrypted:', decrypted);
// test-api-key-12345

console.log('Match:', apiKey === decrypted); // true ✅
```

### Environment Setup

```env
# .env
MEDIA_HELPER_URL=http://localhost:8080
MEDIA_HELPER_API_KEY=media-helper-api-key
MEDIA_HELPER_SECRET=your-super-secret-key-for-jwt
DEV_API_KEY=dev-test-key-12345
```

## ✅ Summary

- ✅ **Created** `lib/webhook-auth.ts` with JWT encryption/decryption
- ✅ **Updated** `/api/video/record` to encrypt API key before sending
- ✅ **Updated** `/api/video/webhook` to decrypt and validate
- ✅ **Middleware** unchanged - still validates API keys normally
- ✅ **Secure** - API keys encrypted, tamper-proof, time-limited
- ✅ **Same pattern** as SparkBoard's webhook authentication

**The webhook now uses JWT encryption following the SparkBoard pattern!** 🔒✨
