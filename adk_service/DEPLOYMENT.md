# ADK Service Deployment Guide

This guide explains how to deploy the Tenzzen ADK service to Google Cloud Run.

## Agent Structure

The ADK service includes the following agents:

1. **Course Generator Agent** - Generates structured course outlines from YouTube videos
2. **Video Recommendation Agent** - Recommends educational videos based on learning goals
3. **YouTube Video Finder Agent** - Finds relevant YouTube videos based on search criteria

## Prerequisites

1. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed
2. A Google Cloud project with billing enabled
3. Google Generative AI API key
4. YouTube API key

## Deployment Steps

### 1. Configuration

The deployment script is already configured with your project details:

- Project ID: `tenzzen`
- Region: `us-central1`
- Service Name: `tenzzen-adk-service`

### 2. Run the Deployment Script

```bash
cd adk_service
deploy-agents.bat
```

The script will:

- Enable required Google Cloud APIs
- Deploy the service directly from source to Google Cloud Run
- Output the service URL

### 3. Set Environment Variables in Google Cloud Run

After deployment, set the following environment variables in Google Cloud Run:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your-google-generative-ai-api-key
YOUTUBE_API_KEY=your-youtube-api-key
ALLOWED_ORIGINS=http://localhost:3000,https://tenzzen-app.vercel.app
```

You can set them using the Google Cloud Console or with this command:

```bash
gcloud run services update tenzzen-adk-service \
  --platform managed \
  --region us-central1 \
  --set-env-vars="GOOGLE_GENERATIVE_AI_API_KEY=your-api-key,YOUTUBE_API_KEY=your-api-key"
```

### 4. Update Vercel Environment Variables

In your Vercel project settings, add or update these environment variables:

```
NEXT_PUBLIC_ADK_SERVICE_URL=https://tenzzen-adk-service-abcdef123-uc.a.run.app
NEXT_PUBLIC_ADK_SERVICE_TIMEOUT=300000
```

Replace the URL with the actual URL of your deployed Cloud Run service.

## Troubleshooting

### CORS Issues

If you encounter CORS errors, make sure your Vercel app's domain is included in the `ALLOWED_ORIGINS` environment variable.

### API Key Issues

If the service returns errors about missing API keys, verify that the environment variables are correctly set in Google Cloud Run.

### Timeout Issues

The default timeout for Cloud Run is 5 minutes. If your course generation takes longer, you may need to increase the timeout:

```bash
gcloud run services update tenzzen-adk-service \
  --platform managed \
  --region us-central1 \
  --timeout=10m
```

### Memory Issues

If the service runs out of memory, you can increase the allocated memory:

```bash
gcloud run services update tenzzen-adk-service \
  --platform managed \
  --region us-central1 \
  --memory=4Gi
```

## Monitoring

You can monitor your service using Google Cloud Console:

- Logs: https://console.cloud.google.com/logs
- Monitoring: https://console.cloud.google.com/monitoring
