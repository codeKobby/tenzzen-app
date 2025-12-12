# Deployment Guide for Tenzzen App

This document provides detailed instructions for deploying the Tenzzen app to Vercel.

## Prerequisites

1.  **Vercel Account**: [Sign up here](https://vercel.com/signup).
2.  **GitHub Repository**: Ensure your code is pushed to a GitHub repository.
3.  **Convex Project**: You need a live Convex deployment.
4.  **Clerk Application**: You need a production Clerk instance.

## Environment Variables

Configure the following environment variables in your Vercel project settings:

| Variable                            | Description                                                                   |
| :---------------------------------- | :---------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your Clerk Publishable Key                                                    |
| `CLERK_SECRET_KEY`                  | Your Clerk Secret Key                                                         |
| `NEXT_PUBLIC_CONVEX_URL`            | Your Production Convex URL                                                    |
| `CONVEX_DEPLOYMENT`                 | Your Convex Deployment Name (automatically set by Vercel integration usually) |
| `YOUTUBE_API_KEY`                   | Google Cloud Console API Key for YouTube Data API v3                          |
| `GOOGLE_GENERATIVE_AI_API_KEY`      | API Key for Google Gemini (AI Studio)                                         |

## Deployment Steps

### 1. Prepare Your Project

Ensure your `package.json` scripts are correct:

```json
"scripts": {
  "build": "next build",
  "install": "pnpm install --no-frozen-lockfile"
}
```

### 2. Deploy to Vercel

1.  **Import Project**: Go to Vercel Dashboard -> Add New -> Project -> Import from GitHub.
2.  **Configure Build Settings**:
    - **Framework Preset**: Next.js
    - **Build Command**: `next build` (default)
    - **Output Directory**: `.next` (default)
    - **Install Command**: `pnpm install --no-frozen-lockfile`
3.  **Add Environment Variables**: Enter the variables listed above.
4.  **Deploy**: Click "Deploy".

### 3. Convex Production Deployment

Don't forget to deploy your Convex functions to production:

```bash
npx convex deploy
```

Or connect Vercel to Convex to handle this automatically.

## Vercel Configuration Files

The project includes configuration files to ensure smooth deployment:

- **vercel.json**:
  ```json
  {
    "framework": "nextjs",
    "buildCommand": "next build",
    "installCommand": "pnpm install --no-frozen-lockfile",
    "outputDirectory": ".next"
  }
  ```
- **.npmrc**: Ensures consistent package installation.
- **.nvmrc**: Specifies Node.js version (18).

## Important Notes

- **ADK & Supabase Removal**: This project previously used a Python ADK service and Supabase. These have been **completely removed**. Do not attempt to configure them. All AI logic is now handled via Vercel AI SDK and Server Actions.
- **Path Aliases**: The project uses `@/` aliases. Vercel handles this automatically via `tsconfig.json`.
