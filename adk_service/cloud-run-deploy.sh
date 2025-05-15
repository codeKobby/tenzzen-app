#!/bin/bash
# Script to deploy the ADK service to Google Cloud Run

# Exit on error
set -e

# Configuration - Change these values as needed

PROJECT_ID="tenzzen"
REGION="us-central1"
SERVICE_NAME="tenzzen-adk-service"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed. Please install it from https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "You need to log in to Google Cloud first."
    gcloud auth login
fi

# Set the project
echo "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com

# Build and push the Docker image
echo "Building and pushing Docker image to Google Container Registry..."
gcloud builds submit --tag $IMAGE_NAME .

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 1 \
    --timeout 5m \
    --set-env-vars="ALLOWED_ORIGINS=http://localhost:3000,https://tenzzen-app.vercel.app"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo "Deployment complete!"
echo "Your ADK service is now running at: $SERVICE_URL"
echo ""
echo "IMPORTANT: You need to set the following environment variables in your Vercel project:"
echo "NEXT_PUBLIC_ADK_SERVICE_URL=$SERVICE_URL"
echo "NEXT_PUBLIC_ADK_SERVICE_TIMEOUT=300000"
echo ""
echo "Don't forget to set these secret environment variables in Google Cloud Run:"
echo "GOOGLE_GENERATIVE_AI_API_KEY - Your Google Generative AI API key"
echo "YOUTUBE_API_KEY - Your YouTube API key"
echo ""
echo "You can set them using the following command:"
echo "gcloud run services update $SERVICE_NAME --platform managed --region $REGION \\"
echo "  --set-env-vars=\"GOOGLE_GENERATIVE_AI_API_KEY=your-api-key,YOUTUBE_API_KEY=your-api-key\""
