# HeyGen Webhook Setup

## Overview

The HeyGen integration supports **both webhooks and polling** for receiving video generation completion notifications.

## How It Works

### Architecture

```
┌─────────────┐     1. Generate     ┌──────────────┐
│   Your UI   │ ──────────────────> │  Your API    │
└─────────────┘                      └──────────────┘
                                              │
                                              │ 2. POST with webhook_url
                                              ▼
                                     ┌──────────────┐
                                     │  HeyGen API  │
                                     └──────────────┘
                                              │
                                              │ Processing...
                                              │
                     3. Webhook callback      │
                     (when complete)          │
                    ┌─────────────────────────┘
                    ▼
           ┌──────────────────┐
           │ Your Webhook     │
           │ Endpoint         │
           └──────────────────┘
                    │
                    │ 4. Update DB
                    ▼
           ┌──────────────────┐
           │    MongoDB       │
           └──────────────────┘
```

### Webhook (Default)

When you generate a video, the API automatically:

1. Constructs webhook URL: `https://your-domain.com/api/video/heygen/webhook`
2. Sends this URL to HeyGen in the generate request
3. HeyGen calls this endpoint when video is ready
4. Webhook handler updates the database
5. UI reflects changes automatically

**Endpoint**: `/api/video/heygen/webhook`

**Events received:**

- `avatar_video.success` - Video completed successfully
- `avatar_video.fail` - Video generation failed

**Payload example:**

```json
{
  "event_type": "avatar_video.success",
  "event_data": {
    "video_id": "868531e5780c4861bf21104f21f39bca",
    "video_url": "https://...",
    "thumbnail_url": "https://...",
    "duration": 30.5
  }
}
```

### Polling (Fallback)

Polling runs automatically in the background:

- Interval: Every 10 seconds (less frequent than before since webhook handles updates)
- Endpoint: `/api/video/heygen/status?videoId={id}`
- Checks HeyGen's status API
- Updates database when complete

**When polling is useful:**

- Local development without public URL
- Webhook endpoint not accessible
- As a safety net if webhook fails

## Production Setup

### 1. Ensure Your Domain is Publicly Accessible

Webhooks require a public URL. Your production deployment should have:

- HTTPS enabled (required by HeyGen)
- Domain accessible from internet
- No firewall blocking incoming requests to `/api/video/heygen/webhook`

### 2. Verify Webhook URL

Check server logs when generating a video:

```
Webhook URL configured: https://yourdomain.com/api/video/heygen/webhook
```

### 3. Test Webhook Endpoint

You can test the webhook endpoint directly:

```bash
curl https://yourdomain.com/api/video/heygen/webhook
```

Should return:

```json
{
  "message": "HeyGen webhook endpoint is active",
  "events": ["avatar_video.success", "avatar_video.fail"]
}
```

## Development Setup

### Option 1: Use Polling Only (Simple)

In local development, webhooks won't work unless you expose your localhost. That's fine! Polling will handle updates automatically.

**No configuration needed** - just develop as normal.

### Option 2: Expose Localhost (Advanced)

If you want to test webhooks in development:

#### Using ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3000
```

This gives you a public URL like: `https://abc123.ngrok.io`

Your webhook URL becomes: `https://abc123.ngrok.io/api/video/heygen/webhook`

#### Using Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://localhost:3000
```

## Monitoring Webhooks

### Check Server Logs

When HeyGen sends a webhook, you'll see:

```
Received HeyGen webhook: {
  "event_type": "avatar_video.success",
  "event_data": { ... }
}
Updated video 868531e5780c4861bf21104f21f39bca with status: completed
```

### Verify Database Updates

Check your MongoDB collection:

```javascript
db.transcriptions.find({
  'videos.id': '868531e5780c4861bf21104f21f39bca',
});
```

Should show video status as `completed` with `videoUrl` populated.

## Troubleshooting

### Webhook Not Receiving Calls

**Check:**

1. Is your domain publicly accessible?
2. Is HTTPS enabled?
3. Check HeyGen dashboard for webhook delivery status
4. Verify webhook URL in server logs
5. Check firewall/security group settings

**Fallback:**

- Polling will still work! Your video will complete, just takes a bit longer to reflect in UI.

### Webhook Receives Call But Fails

**Check server logs for:**

- Database connection errors
- Invalid payload from HeyGen
- MongoDB update failures

### Video Status Not Updating in UI

**Possible causes:**

1. Webhook failed (check logs)
2. Polling stopped (check browser console)
3. Database update failed
4. Frontend not refreshing

**Solution:**

- Click the refresh button on the transcription
- Check browser console for errors
- Verify database has been updated

## Best Practices

1. **Production**: Always use webhooks (enabled by default)
2. **Development**: Use polling (works automatically)
3. **Monitor**: Check server logs for webhook delivery
4. **Fallback**: Polling runs automatically as backup
5. **Security**: Consider adding webhook signature verification (future enhancement)

## Disabling Webhooks

If you want to use polling only, modify the generate request:

```typescript
// In heygen-ui.tsx, modify handleGenerate:
body: JSON.stringify({
  // ... other fields
  useWebhook: false, // Disable webhook
});
```

Or set default to false in the API schema.

## Future Enhancements

Possible improvements:

- [ ] Webhook signature verification for security
- [ ] Retry logic for failed webhook deliveries
- [ ] Webhook event history/logging
- [ ] Admin dashboard for webhook status
- [ ] Support for other HeyGen webhook events
