#!/bin/bash
# Script to deploy the ADK service to Google Cloud Run

# Configuration
PROJECT_ID="tenzzen"
REGION="us-central1"
SERVICE_NAME="tenzzen-adk-service"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
  local color=$1
  local message=$2
  echo -e "${color}${message}${NC}"
}

# Load API keys from .env file
print_message "$GREEN" "Loading API keys from .env file..."
GOOGLE_API_KEY=$(grep GOOGLE_API_KEY .env | cut -d'=' -f2)
YOUTUBE_API_KEY=$(grep YOUTUBE_API_KEY .env | cut -d'=' -f2)

# Check if API keys were loaded successfully
if [ -z "$GOOGLE_API_KEY" ]; then
  print_message "$RED" "Error: Could not load GOOGLE_API_KEY from .env file."
  exit 1
fi

if [ -z "$YOUTUBE_API_KEY" ]; then
  print_message "$RED" "Error: Could not load YOUTUBE_API_KEY from .env file."
  exit 1
fi

print_message "$GREEN" "API keys loaded successfully."

# Step 1: Authenticate with Google Cloud (if not already authenticated)
print_message "$GREEN" "Step 1: Authenticating with Google Cloud..."
gcloud auth login

# Step 2: Set the project
print_message "$GREEN" "Step 2: Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Step 3: Enable necessary APIs
print_message "$GREEN" "Step 3: Enabling necessary Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com

# Step 4: Deploy to Cloud Run
print_message "$GREEN" "Step 4: Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars=GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=$REGION,GOOGLE_GENAI_USE_VERTEXAI=TRUE,GOOGLE_API_KEY=$GOOGLE_API_KEY,GOOGLE_GENERATIVE_AI_API_KEY=$GOOGLE_API_KEY,YOUTUBE_API_KEY=$YOUTUBE_API_KEY,ALLOWED_ORIGINS="https://tenzzen-app.vercel.app,http://localhost:3000"

# Step 5: Get the service URL
print_message "$GREEN" "Step 5: Getting the service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")

# Print the service URL
print_message "$GREEN" "Deployment complete!"
print_message "$GREEN" "Service URL: $SERVICE_URL"
print_message "$YELLOW" "Important: Update your frontend environment variable NEXT_PUBLIC_ADK_SERVICE_URL to point to this URL."
