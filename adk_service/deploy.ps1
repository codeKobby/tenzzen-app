# PowerShell script to deploy the ADK service to Google Cloud Run

# Configuration
$PROJECT_ID = "tenzzen"
$REGION = "us-central1"
$SERVICE_NAME = "tenzzen-adk-service"

# Function to print colored output
function Write-ColoredMessage {
    param (
        [string]$Color,
        [string]$Message
    )
    
    switch ($Color) {
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        "Red" { Write-Host $Message -ForegroundColor Red }
        default { Write-Host $Message }
    }
}

# Check if required environment variables are set
if (-not $env:GOOGLE_API_KEY) {
    Write-ColoredMessage "Red" "Error: GOOGLE_API_KEY environment variable is not set."
    Write-ColoredMessage "Yellow" "Please set it using: `$env:GOOGLE_API_KEY = 'your_api_key'"
    exit 1
}

if (-not $env:YOUTUBE_API_KEY) {
    Write-ColoredMessage "Red" "Error: YOUTUBE_API_KEY environment variable is not set."
    Write-ColoredMessage "Yellow" "Please set it using: `$env:YOUTUBE_API_KEY = 'your_api_key'"
    exit 1
}

# Step 1: Authenticate with Google Cloud (if not already authenticated)
Write-ColoredMessage "Green" "Step 1: Authenticating with Google Cloud..."
gcloud auth login

# Step 2: Set the project
Write-ColoredMessage "Green" "Step 2: Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Step 3: Enable necessary APIs
Write-ColoredMessage "Green" "Step 3: Enabling necessary Google Cloud APIs..."
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable aiplatform.googleapis.com

# Step 4: Deploy to Cloud Run
Write-ColoredMessage "Green" "Step 4: Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME `
  --source . `
  --region $REGION `
  --allow-unauthenticated `
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=$REGION,GOOGLE_GENAI_USE_VERTEXAI=TRUE,GOOGLE_API_KEY=$env:GOOGLE_API_KEY,GOOGLE_GENERATIVE_AI_API_KEY=$env:GOOGLE_API_KEY,YOUTUBE_API_KEY=$env:YOUTUBE_API_KEY,ALLOWED_ORIGINS=https://tenzzen-app.vercel.app,http://localhost:3000"

# Step 5: Get the service URL
Write-ColoredMessage "Green" "Step 5: Getting the service URL..."
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"

# Print the service URL
Write-ColoredMessage "Green" "Deployment complete!"
Write-ColoredMessage "Green" "Service URL: $SERVICE_URL"
Write-ColoredMessage "Yellow" "Important: Update your frontend environment variable NEXT_PUBLIC_ADK_SERVICE_URL to point to this URL."
