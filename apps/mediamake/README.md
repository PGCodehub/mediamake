This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# HeyGen API Key for video generation
HEYGEN_API_KEY=your_heygen_api_key_here

# MongoDB connection
MONGODB_URI=your_mongodb_connection_string

# S3/Spaces configuration for file uploads
SPACES_ENDPOINT=your_spaces_endpoint
SPACES_ACCESS_KEY_ID=your_access_key_id
SPACES_SECRET_ACCESS_KEY=your_secret_access_key
SPACES_BUCKET=your_bucket_name
SPACES_CDN_ENDPOINT=your_cdn_endpoint

# Other API keys as needed
# ASSEMBLY_AI_KEY=your_assembly_ai_key
# ELEVENLABS_API_KEY=your_elevenlabs_key
```

### HeyGen Integration

To use the video generation feature in the transcription page:

1. Sign up for a HeyGen account at https://www.heygen.com/
2. Get your API key from the HeyGen dashboard
3. Add `HEYGEN_API_KEY` to your `.env.local` file
4. The Video tab will appear in the transcription editor where you can generate AI avatar videos from your audio files

**Features:**

- Dynamic avatar loading (fetches current available avatars from your account)
- Multiple resolution options (720p, 1080p, 4K)
- Custom backgrounds (solid colors or images)
- **Webhook support** for real-time video completion notifications
- Automatic polling fallback for development environments
- Video history and management

**Free Tier Limits:**

- 720p resolution with watermark
- 10 API credits per month
- 3 videos per month, max 3 minutes each
- Some avatars may require paid subscription

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
