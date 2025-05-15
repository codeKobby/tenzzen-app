# Vercel Deployment Guide for Tenzzen App

This document provides detailed instructions for deploying the Tenzzen app to Vercel.

## Prerequisites

1. A Vercel account
2. A GitHub account with the repository pushed
3. Node.js 18 or later installed locally

## Deployment Steps

### 1. Prepare Your Project

Before deploying, ensure your project is properly configured:

```bash
# Run the cleanup script to ensure a clean state
bash cleanup.sh

# Or manually:
rm -rf node_modules
rm -f pnpm-lock.yaml
pnpm install --no-frozen-lockfile
pnpm run build
```

### 2. Configure Environment Variables

Make sure to set the following environment variables in Vercel:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `CLERK_SECRET_KEY`: Your Clerk secret key
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `NEXT_PUBLIC_ADK_SERVICE_URL`: URL to your deployed ADK service
- `NEXT_PUBLIC_ADK_SERVICE_TIMEOUT`: Timeout for ADK service requests (300000 for 5 minutes)
- `YOUTUBE_API_KEY`: Your YouTube API key

### 3. Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Configure the build settings:
   - Build Command: `pnpm run build`
   - Output Directory: `.next`
   - Install Command: `pnpm install --no-frozen-lockfile`
   - Node.js Version: 18.x

3. Deploy the application

### 4. Troubleshooting

If you encounter deployment issues:

1. **Lock file issues**: If you see errors related to the pnpm-lock.yaml file, try:
   - Regenerating the lock file locally with `pnpm install --no-frozen-lockfile`
   - Committing the updated lock file
   - Redeploying

2. **ESLint errors**: The project is configured to ignore ESLint errors during build. If you still see ESLint errors:
   - Check that the `next.config.js` file has `eslint.ignoreDuringBuilds: true`
   - Run `pnpm lint --fix` locally to fix any issues

3. **TypeScript errors**: The project is configured to ignore TypeScript errors during build. If you still see TypeScript errors:
   - Check that the `next.config.js` file has `typescript.ignoreBuildErrors: true`
   - Run `pnpm tsc --noEmit` locally to check for errors

4. **Missing dependencies**: If you see errors about missing dependencies:
   - Check the `package.json` file for any missing dependencies
   - Add them with `pnpm add <package-name>`
   - Regenerate the lock file with `pnpm install --no-frozen-lockfile`

### 5. ADK Service Deployment

The ADK service is a separate Python service that needs to be deployed separately. See the `DEPLOYMENT.md` file for instructions on deploying the ADK service.

## Important Notes

1. The project uses pnpm as the package manager. Make sure to use pnpm for all package management tasks.
2. The project is configured to use Node.js 18. Make sure to set the Node.js version to 18 in Vercel.
3. The project uses Next.js 15.2.3. Make sure to use this version for compatibility.
4. The ADK service is a separate service that needs to be deployed separately.

## Vercel Configuration

The project includes a `vercel.json` file with the following configuration:

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "installCommand": "pnpm install --no-frozen-lockfile",
  "outputDirectory": ".next"
}
```

This configuration tells Vercel how to build and deploy the application.
