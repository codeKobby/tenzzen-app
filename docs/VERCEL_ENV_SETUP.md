# Vercel Environment Variables Setup Guide

This guide explains how to properly set up environment variables for the Tenzzen app deployment on Vercel.

## Required Environment Variables

The following environment variables must be set in your Vercel project settings:

### Authentication (Clerk)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `CLERK_SECRET_KEY`: Your Clerk secret key

### Database (Supabase)

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL (e.g., https://your-project-id.supabase.co)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### ADK Service

- `NEXT_PUBLIC_ADK_SERVICE_URL`: URL to your deployed ADK service
- `NEXT_PUBLIC_ADK_SERVICE_TIMEOUT`: Timeout for ADK service requests (300000 for 5 minutes)

### External APIs

- `YOUTUBE_API_KEY`: Your YouTube API key
- `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google Generative AI API key (if used in the frontend)

## Setting Up Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Navigate to "Settings" > "Environment Variables"
4. Add each of the required variables with their corresponding values
5. Make sure to select the appropriate environments (Production, Preview, Development)
6. Click "Save" to apply the changes

## Environment Variables for Different Deployment Environments

You can configure different values for different deployment environments:

- **Production**: Used for your main deployment
- **Preview**: Used for preview deployments (e.g., pull request previews)
- **Development**: Used for local development

## Troubleshooting

If you encounter the error `@clerk/clerk-react: Missing publishableKey` during deployment:

1. Verify that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is correctly set in your Vercel project settings
2. Make sure the key is valid and active in your Clerk dashboard
3. Check that the key is set for the correct environments (Production, Preview, Development)
4. Redeploy your application after updating the environment variables

## Important Notes

- Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Keep your secret keys (like `CLERK_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY`) secure and never expose them to the client
- After updating environment variables, you need to redeploy your application for the changes to take effect
- The `.env.production` file in the repository provides fallback values for the build process only and should not contain actual secrets
