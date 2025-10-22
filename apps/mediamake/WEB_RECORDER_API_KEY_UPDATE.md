# Web Recorder API Key Authentication - Update

## ✅ Changes Applied

Added Bearer token authentication for the WebAction Recorder API as specified in the OpenAPI specification.

## 🔐 What Changed

### Code Updates

**File: `lib/web-recorder.ts`**

Added API key authentication to two functions:

1. **`createRecordingJob()`** - When creating a new recording
2. **`getRecordingJobStatus()`** - When checking job status

Both now send the Authorization header:

```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`,
}
```

### Documentation Updates

Updated the following files:

- `docs/web-recorder-quickstart.md`
- `docs/web-recorder-integration.md`

## 📝 Required Environment Variables

You now need **TWO** environment variables:

```env
# WebAction Recorder API Base URL
WebActionRecoder=http://localhost:8080

# WebAction Recorder API Key (Bearer Token) - NEW!
WEBACTION_RECORDER_API_KEY=your-api-key-here
```

## 🔑 How to Get Your API Key

Contact your WebAction Recorder service provider or check your dashboard to obtain the API key.

## ⚙️ Setup Instructions

1. **Add both environment variables to your `.env` file:**

   ```env
   WebActionRecoder=http://localhost:8080
   WEBACTION_RECORDER_API_KEY=sk_test_1234567890abcdef
   ```

2. **Restart your development server:**

   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   cd apps/mediamake
   npm run dev
   ```

3. **Test the integration:**
   - Go to `http://localhost:3000/media`
   - Click the Web Recorder dropzone
   - Submit a test recording
   - Check for any authentication errors

## 🔒 Security Notes

### ✅ Good Practices

- **Never commit** `.env` file to git
- Store API keys securely
- Use different API keys for development and production
- Rotate keys regularly

### ❌ Don't Do This

- Don't hardcode API keys in your code
- Don't share API keys in public repositories
- Don't use production keys in development

## 🧪 Error Handling

The code now provides clear error messages:

### Missing API Key

```
Error: WEBACTION_RECORDER_API_KEY environment variable not set
```

**Solution:** Add the API key to your `.env` file

### Invalid API Key

```
API request failed: 401 - Unauthorized
```

**Solution:** Check that your API key is correct and valid

### Missing Base URL

```
Error: WebActionRecoder environment variable not set
```

**Solution:** Add the base URL to your `.env` file

## 📊 API Request Flow

### Before (No Authentication)

```
POST https://api.example.com/api/record
Content-Type: application/json

{ "url": "...", "actions": [...] }
```

❌ **Result:** 401 Unauthorized

### After (With Authentication)

```
POST https://api.example.com/api/record
Content-Type: application/json
Authorization: Bearer sk_test_1234567890abcdef

{ "url": "...", "actions": [...] }
```

✅ **Result:** 202 Accepted

## 🔍 Verification

To verify the setup is correct:

1. **Check environment variables are loaded:**

   ```typescript
   console.log('Base URL:', process.env.WebActionRecoder);
   console.log('API Key exists:', !!process.env.WEBACTION_RECORDER_API_KEY);
   ```

2. **Try a test recording:**
   - The error message will indicate if the API key is missing or invalid
   - A successful submission means authentication is working

3. **Check the API logs:**
   - Look for the Authorization header in outgoing requests
   - Verify the Bearer token is being sent

## 📋 Checklist

Before testing:

- [ ] Added `WebActionRecoder` to `.env`
- [ ] Added `WEBACTION_RECORDER_API_KEY` to `.env`
- [ ] Restarted development server
- [ ] Verified no linting errors
- [ ] API key is valid and not expired

## 🎯 What's Protected

With Bearer token authentication, the following endpoints are now secured:

1. **POST /api/record** - Creating recording jobs
2. **GET /api/record/{id}** - Checking job status

**Note:** The webhook endpoint (`/api/video/webhook`) does NOT require authentication, as per the OpenAPI spec. The webhook is called by the WebAction Recorder API, not by your app.

## 🔄 Migration from Old Setup

If you were using the Web Recorder without API key:

1. Add the new `WEBACTION_RECORDER_API_KEY` variable
2. Restart your server
3. No code changes needed in your application
4. Existing functionality remains the same

## ✨ Summary

- ✅ Bearer token authentication implemented
- ✅ Error handling for missing/invalid keys
- ✅ Documentation updated
- ✅ No linting errors
- ✅ Backward compatible (just needs new env var)

**The Web Recorder now properly authenticates with the API using Bearer tokens!** 🎉
