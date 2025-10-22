# HeyGen Video Integration Troubleshooting

## Common Issues and Solutions

### Issue 1: "HeyGen API returned HTML" Error

**Cause**: The API is returning an HTML error page instead of JSON, usually indicating:

- Invalid API key
- Incorrect API endpoint
- Network/CORS issues

**Solutions**:

1. **Verify API Key**:
   - Check that `HEYGEN_API_KEY` is set in your `.env.local` file
   - Ensure the API key is valid and not expired
   - Get your API key from: https://app.heygen.com/settings?nav=API

2. **Check API Endpoints**:
   - Video Generation: `POST https://api.heygen.com/v2/video/generate`
   - Video Status: `GET https://api.heygen.com/v1/video_status.get?video_id={id}` (Note: v1, not v2!)

   If these have changed, update `heygen-config.ts`:

   ```typescript
   export const HEYGEN_API_BASE_URL = 'https://api.heygen.com';
   export const HEYGEN_API_VERSION = 'v2';
   ```

3. **Check Console Logs**:
   - Look for "Calling HeyGen API:" logs to see the exact URL being called
   - Check "Request payload:" to verify the request format
   - Review "HeyGen API error response:" for details

### Issue 2: Video Generation Fails

**Possible causes**:

- Invalid avatar ID
- Audio URL not accessible
- Audio format not supported
- Background configuration errors
- Subscription required for higher resolutions (1080p/4K)
- **Free tier credit limit reached** (10 API credits per month for free plan)
- **Specific avatar requires subscription** (some avatars are premium only)

**Debug steps**:

1. **Click "Refresh" button** in the Avatar section to fetch current available avatars from your HeyGen account
2. **Check avatar tier**: Look for the badge next to the avatar name - "✓ Free Tier" or "★ Premium Only"
3. **Use "Free Only" filter**: Click the "Free Only" button to show only free tier avatars
4. Check the console for the request payload
5. Verify audio URL is publicly accessible
6. Test avatar IDs manually via API:

   ```bash
   curl -X GET https://api.heygen.com/v2/avatars \
     -H "X-Api-Key: YOUR_API_KEY"
   ```

7. If no avatars load, check your HeyGen API key and account status

### Issue 3: Video Status Polling Not Working

**Solutions**:

1. Check video ID is being stored correctly in the database
2. Verify the status endpoint format matches HeyGen's API
3. Increase polling interval if rate-limited (currently 5 seconds)

### Issue 4: Avatar Not Found Error

**Error**: `"avatar_not_found"` or `"Avatar ... not found or no longer available"`

**Cause**: Avatar IDs change frequently on HeyGen

**Solutions**:

1. **Use the "Refresh" button** in the UI to fetch current available avatars
2. The UI will automatically load available avatars when you open the Video tab
3. Avatar IDs are specific to your HeyGen account - what works for one account may not work for another
4. Some avatars may require specific subscription tiers

### Issue 5: Invalid Video ID Error

**Cause**: Video ID format mismatch or video not found

**Solutions**:

- Check that video IDs are being saved correctly
- Verify the video exists in HeyGen's system
- Check for typos in video_id parameter

## Testing the Integration

### 1. Test API Key

```bash
curl -X GET https://api.heygen.com/v2/avatars \
  -H "X-Api-Key: YOUR_API_KEY"
```

Should return a list of available avatars.

### 2. Test Video Generation

Use the UI or call the API directly:

```bash
curl -X POST http://localhost:3000/api/video/heygen/generate \
  -H "Content-Type: application/json" \
  -d '{
    "transcriptionId": "YOUR_TRANSCRIPTION_ID",
    "avatarId": "Monica_inSleeveless_20220819",
    "avatarStyle": "normal",
    "background": {
      "type": "color",
      "value": "#008000"
    }
  }'
```

### 3. Check Server Logs

Monitor your Next.js server console for:

- API call URLs
- Request payloads
- Response status codes
- Error messages

## Webhook vs Polling

The integration supports **both webhooks and polling** for video status updates:

### Webhooks (Default - More Efficient)

- **Enabled by default** when generating videos
- HeyGen sends real-time notifications to `/api/video/heygen/webhook`
- Events: `avatar_video.success`, `avatar_video.fail`
- **No API rate limiting** concerns
- Instant updates when video is ready

**How it works:**

1. Generate video → webhook URL is registered with HeyGen
2. HeyGen completes video → calls your webhook endpoint
3. Webhook updates database → UI refreshes automatically

### Polling (Fallback)

- Runs automatically as a backup (every 10 seconds)
- Checks video status via `/api/video/heygen/status`
- Used if webhooks fail or in development without public URL

**When polling is needed:**

- Local development without ngrok/tunneling
- Webhook endpoint not publicly accessible
- Network issues preventing webhook delivery

## Video Resolution Options

The UI provides three resolution options:

1. **720p (HD)** - 1280x720
   - Available on free tier
   - **Limitations**: 10 API credits per month, watermark on videos
   - **Max**: 3 videos per month, 3 minutes per video
   - Good for testing and development

2. **1080p (Full HD)** - 1920x1080
   - Requires HeyGen subscription
   - Better quality for professional videos

3. **4K (Ultra HD)** - 3840x2160
   - Requires HeyGen subscription
   - Maximum quality for high-end productions

If you select 1080p or 4K without a subscription, the video generation may fail or fallback to 720p.

## HeyGen API Reference

Official documentation: https://docs.heygen.com/docs

Key endpoints used:

- Generate Video: https://docs.heygen.com/docs/generate-video
- Using Audio Source: https://docs.heygen.com/docs/using-audio-source-as-voice

## Need Help?

1. Check HeyGen's API status: https://status.heygen.com/
2. Review HeyGen documentation: https://docs.heygen.com/
3. Check your API usage limits in HeyGen dashboard
4. Verify your account has video generation credits

## Alternative: Test with cURL

If the integration isn't working, test directly with HeyGen's API:

```bash
curl -X POST https://api.heygen.com/v2/video/generate \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "video_inputs": [{
      "character": {
        "type": "avatar",
        "avatar_id": "Monica_inSleeveless_20220819",
        "avatar_style": "normal"
      },
      "voice": {
        "type": "audio",
        "audio_url": "YOUR_AUDIO_URL"
      },
      "background": {
        "type": "color",
        "value": "#008000"
      }
    }]
  }'
```

This should return a video_id if successful.
