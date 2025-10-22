# Web Recorder - Final Setup & Configuration

## ✅ All Updates Complete

The Web Recorder integration now uses the updated environment variable names.

## 🔑 Required Environment Variables

Add these **4 environment variables** to your `.env` file:

```env
# 1. Media Helper API Base URL
MEDIA_HELPER_URL=http://localhost:8080

# 2. Media Helper API Key (for calling their API)
MEDIA_HELPER_API_KEY=your-media-helper-api-key

# 3. JWT Secret (for encrypting webhook secrets)
MEDIA_HELPER_SECRET=my-secret-key-for-jwt-encryption

# 4. Your MediaMake API Key (for webhook authentication)
DEV_API_KEY=your-mediamake-api-key

# Optional: App URL (defaults to localhost:3000)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📋 Variable Breakdown

### 1. `MEDIA_HELPER_URL`

**Purpose:** Base URL for the Media Helper (WebAction Recorder) API

**Examples:**

- Local: `http://localhost:8080`
- Production: `https://api.mediahelper.com`

**Used for:** Making requests to create recordings and check status

### 2. `MEDIA_HELPER_API_KEY`

**Purpose:** Authenticate TO the Media Helper API

**Format:** Bearer token provided by Media Helper service

**Used in:**

```typescript
Authorization: Bearer ${MEDIA_HELPER_API_KEY}
```

### 3. `MEDIA_HELPER_SECRET`

**Purpose:** Encrypt webhook secrets using JWT

**Format:** Any secret string (e.g., `my-super-secret-key-123`)

**Security:** Keep this secret! Both systems need the same value to encrypt/decrypt.

**Used for:**

```typescript
jwt.sign({ apiKey }, MEDIA_HELPER_SECRET, { expiresIn: '7d' });
```

### 4. `DEV_API_KEY`

**Purpose:** Your MediaMake API key (for webhook to authenticate back to you)

**Format:** Your API key (can be any string in development)

**Used in:** Webhook authentication when Media Helper calls back

## 🔄 Complete Authentication Flow

```
1. User Submits Recording
   ↓
2. MediaMake API (/api/video/record)
   - Uses: MEDIA_HELPER_API_KEY → calls Media Helper
   - Encrypts: DEV_API_KEY with MEDIA_HELPER_SECRET → JWT
   - Sends: webhookUrl + webhookSecret to Media Helper
   ↓
3. Media Helper API
   - Receives: webhookUrl + webhookSecret (JWT)
   - Processes recording...
   - Decrypts: webhookSecret with MEDIA_HELPER_SECRET → DEV_API_KEY
   - Calls webhook: Authorization: Bearer ${DEV_API_KEY}
   ↓
4. MediaMake Webhook (/api/video/webhook)
   - Receives: Authorization header with DEV_API_KEY
   - Validates: DEV_API_KEY matches expected value
   - Creates media file ✅
```

## 🔐 Security Summary

| Variable               | Visibility  | Purpose                      | Shared?               |
| ---------------------- | ----------- | ---------------------------- | --------------------- |
| `MEDIA_HELPER_URL`     | Server-only | API endpoint                 | No                    |
| `MEDIA_HELPER_API_KEY` | Server-only | Authenticate to Media Helper | No                    |
| `MEDIA_HELPER_SECRET`  | Server-only | Encrypt/decrypt webhooks     | ✅ Yes (both systems) |
| `DEV_API_KEY`          | Server-only | Authenticate webhooks        | No                    |

## 📝 .env File Example

Create `apps/mediamake/.env` with:

```env
# ============================================
# Media Helper (WebAction Recorder) API
# ============================================
MEDIA_HELPER_URL=http://localhost:8080
MEDIA_HELPER_API_KEY=sk_live_abc123xyz789

# ============================================
# Webhook Authentication
# ============================================
# Shared secret for JWT encryption (must match on both systems)
MEDIA_HELPER_SECRET=random-secret-key-for-jwt-12345

# Your MediaMake API key (for webhook callbacks)
DEV_API_KEY=dev-key-67890

# ============================================
# App Configuration (Optional)
# ============================================
# Use localhost for local development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Or use ngrok for external API testing
# NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

# ============================================
# Other existing variables...
# ============================================
MONGODB_URI=mongodb://...
# ... etc
```

## 🚀 Quick Start

1. **Add all 4 variables** to `apps/mediamake/.env`
2. **Restart your server:**
   ```bash
   cd apps/mediamake
   npm run dev
   ```
3. **Test the integration:**
   - Go to `http://localhost:3000/media`
   - Click Web Recorder dropzone
   - Submit a test recording
   - Check for success!

## ✅ Checklist

Before testing:

- [ ] Added `MEDIA_HELPER_URL` to `.env`
- [ ] Added `MEDIA_HELPER_API_KEY` to `.env`
- [ ] Added `MEDIA_HELPER_SECRET` to `.env`
- [ ] Added `DEV_API_KEY` to `.env`
- [ ] Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` (or commented out)
- [ ] Restarted development server
- [ ] Media Helper API is running on the specified URL

## 🧪 Test Recording

Use this simple test:

**Simple Mode:**

- URL: `https://example.com`
- Highlight: "Example Domain" (Yellow)
- Tag: "test"

**Expected Logs:**

```
✓ Sending recording request to Media Helper API
✓ Target URL: http://localhost:8080/api/record
✓ Job created with jobId: xxx
✓ Webhook authenticated successfully
✓ Created media file with ID: xxx
```

## 📊 What Changed

| Old Variable Name            | New Variable Name           |
| ---------------------------- | --------------------------- |
| `WebActionRecoder`           | `MEDIA_HELPER_URL`          |
| `WEBACTION_RECORDER_API_KEY` | `MEDIA_HELPER_API_KEY`      |
| N/A                          | `MEDIA_HELPER_SECRET` (NEW) |
| (existing)                   | `DEV_API_KEY`               |

## 🎯 Summary

- ✅ All code updated to use new variable names
- ✅ Documentation updated
- ✅ JWT authentication implemented
- ✅ Webhook validates properly
- ✅ No linting errors
- ✅ Ready to test!

**The integration is complete with the new environment variable names!** 🎉
