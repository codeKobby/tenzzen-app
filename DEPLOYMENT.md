# Deployment Guide for Tenzzen App

This document provides instructions for deploying the Tenzzen app to Vercel and setting up the ADK service.

## Deploying to Vercel

1. Push your code to GitHub.
2. Connect your GitHub repository to Vercel.
3. Configure the following environment variables in Vercel:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
   - `CLERK_SECRET_KEY`: Your Clerk secret key
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `NEXT_PUBLIC_ADK_SERVICE_URL`: URL to your deployed ADK service
   - `NEXT_PUBLIC_ADK_SERVICE_TIMEOUT`: Timeout for ADK service requests (300000 for 5 minutes)
   - `YOUTUBE_API_KEY`: Your YouTube API key

4. Deploy the application.

## Setting Up the ADK Service

The ADK service is a Python FastAPI application that needs to be deployed separately. You have several options:

### Option 1: Deploy to a Separate Vercel Project

1. Create a new Vercel project for the ADK service.
2. Configure the following environment variables:
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google Generative AI API key
   - `YOUTUBE_API_KEY`: Your YouTube API key

3. Add a `vercel.json` file to the `adk_service` directory with the following content:
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "server.py", "use": "@vercel/python" }
     ],
     "routes": [
       { "src": "/(.*)", "dest": "server.py" }
     ]
   }
   ```

### Option 2: Deploy to a Separate Service (Recommended)

For better performance and reliability, deploy the ADK service to a dedicated hosting service:

1. **Railway.app**: Easy deployment with Python support.
2. **Render.com**: Good for Python applications with free tier.
3. **Google Cloud Run**: Excellent for AI workloads, especially with Google's Gemini models.
4. **Heroku**: Simple deployment with Python support.

#### Deployment Steps for Google Cloud Run (Recommended)

1. Install Google Cloud SDK.
2. Authenticate with Google Cloud: `gcloud auth login`.
3. Create a new project or select an existing one: `gcloud config set project YOUR_PROJECT_ID`.
4. Enable necessary APIs: `gcloud services enable run.googleapis.com`.
5. Build and deploy the container:
   ```bash
   cd adk_service
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/adk-service
   gcloud run deploy adk-service --image gcr.io/YOUR_PROJECT_ID/adk-service --platform managed --region us-central1 --allow-unauthenticated
   ```
6. Set environment variables in Google Cloud Run:
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google Generative AI API key
   - `YOUTUBE_API_KEY`: Your YouTube API key

7. Update the `NEXT_PUBLIC_ADK_SERVICE_URL` in your Vercel project to point to the Google Cloud Run service URL.

## Important Notes

1. The ADK service requires Python 3.9+ and the dependencies listed in `adk_service/requirements.txt`.
2. Make sure CORS is properly configured in the ADK service to allow requests from your Vercel deployment.
3. The ADK service uses Gemini 2.5 Pro Experimental model for course generation and Gemini 1.5 for video recommendations.
4. Set appropriate timeouts for API calls to the ADK service (5 minutes recommended).

## Troubleshooting

If you encounter deployment issues:

1. Check the Vercel deployment logs for errors.
2. Verify that all environment variables are correctly set.
3. Ensure the ADK service is running and accessible from your Vercel deployment.
4. Check CORS settings if you're getting cross-origin errors.
5. Verify that the pnpm-lock.yaml file is in sync with package.json.
