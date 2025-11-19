# Deployment Guide for Tenzzen App

This document provides instructions for deploying the Tenzzen app to Vercel and setting up the ADK service.

## Deploying to Vercel

1. Push your code to GitHub.
2. Connect your GitHub repository to Vercel.
3. Configure the following environment variables in Vercel:

   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
   - `CLERK_SECRET_KEY`: Your Clerk secret key
   - `YOUTUBE_API_KEY`: Your YouTube API key

4. Deploy the application.

## Vercel Deployment Configuration

The project includes the following configuration files for Vercel deployment:

1. **vercel.json**: Configures the build process for Vercel

   ```json
   {
     "framework": "nextjs",
     "buildCommand": "next build",
     "installCommand": "pnpm install --no-frozen-lockfile",
     "outputDirectory": ".next"
   }
   ```

2. **.npmrc**: Ensures consistent package installation behavior

   ```
   auto-install-peers=true
   node-linker=hoisted
   strict-peer-dependencies=false
   shamefully-hoist=true
   ```

3. **.nvmrc**: Specifies the Node.js version to use
   ```
   18
   ```

## Notes about ADK & Supabase

This repository no longer uses the ADK Python service or Supabase. The codebase now relies on Convex and built-in server actions under `actions/` for AI-driven workflows and data management.

If you are migrating from a legacy deployment that used ADK or Supabase, extract any necessary configuration or SQL manually — the previous ADK and Supabase integrations are deprecated and removed from this project.
