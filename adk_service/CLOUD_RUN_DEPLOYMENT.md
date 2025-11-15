# Deploying ADK Service to Google Cloud Run

This guide explains how to deploy the Tenzzen ADK Service to Google Cloud Run.

## Prerequisites

1. **Google Cloud Account**: You need a Google Cloud account with billing enabled.
2. **Google Cloud CLI**: Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install).
3. **API Keys**: You need the following API keys:
   - Google Generative AI API key
   - YouTube API key

## Deployment Steps

### 1. Set Environment Variables

Set the required API keys as environment variables:

#### For Linux/macOS:

```bash
export GOOGLE_API_KEY=your_google_api_key
export YOUTUBE_API_KEY=your_youtube_api_key
```

#### For Windows (PowerShell):

```powershell
$env:GOOGLE_API_KEY = "your_google_api_key"
$env:YOUTUBE_API_KEY = "your_youtube_api_key"
```

### 2. Run the Deployment Script

#### For Linux/macOS:

```bash
cd adk_service
chmod +x deploy.sh
./deploy.sh
```

#### For Windows (PowerShell):

```powershell
cd adk_service
.\deploy.ps1
```

The script will:
1. Authenticate with Google Cloud
2. Set the project to "tenzzen"
3. Enable necessary Google Cloud APIs
4. Deploy the service to Cloud Run
5. Output the service URL

### 3. Update Frontend Environment Variables

After deployment, update the frontend environment variable to point to the new Cloud Run service URL:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Update `NEXT_PUBLIC_ADK_SERVICE_URL` to the Cloud Run service URL
4. Redeploy your frontend application

## Manual Deployment (Alternative)

If you prefer to deploy manually:

1. Authenticate with Google Cloud:
   ```bash
   gcloud auth login
   ```

2. Set the project:
   ```bash
   gcloud config set project tenzzen
   ```

3. Enable necessary APIs:
   ```bash
   gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com aiplatform.googleapis.com
   ```

4. Deploy to Cloud Run:
   ```bash
   gcloud run deploy tenzzen-adk-service \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="GOOGLE_CLOUD_PROJECT=tenzzen,GOOGLE_CLOUD_LOCATION=us-central1,GOOGLE_GENAI_USE_VERTEXAI=TRUE,GOOGLE_API_KEY=your_api_key,GOOGLE_GENERATIVE_AI_API_KEY=your_api_key,YOUTUBE_API_KEY=your_youtube_api_key,ALLOWED_ORIGINS=https://tenzzen-app.vercel.app,http://localhost:3000"
   ```

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Make sure you're logged in with `gcloud auth login`.
2. **API Enablement**: Ensure all required APIs are enabled.
3. **Environment Variables**: Check that all environment variables are set correctly.
4. **CORS Issues**: If you encounter CORS errors, update the `ALLOWED_ORIGINS` environment variable.

### Checking Logs

To view logs for your deployed service:

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tenzzen-adk-service" --limit=50
```

## Updating the Deployment

To update the deployed service:

1. Make your changes to the code
2. Run the deployment script again
3. The service will be updated with the new code

## Cleaning Up

To delete the deployed service:

```bash
gcloud run services delete tenzzen-adk-service --region us-central1
```
