@echo off
REM Script to deploy the ADK service to Google Cloud Run

echo Starting deployment of ADK service to Google Cloud Run...

REM Configuration - Change these values as needed
set PROJECT_ID=tenzzen
set REGION=us-central1
set SERVICE_NAME=tenzzen-adk-service
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

REM Check if gcloud is installed
where gcloud >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: gcloud CLI is not installed. Please install it from https://cloud.google.com/sdk/docs/install
    exit /b 1
)

REM Check if user is logged in
gcloud auth list --filter=status:ACTIVE --format="value(account)" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo You need to log in to Google Cloud first.
    gcloud auth login
)

REM Set the project
echo Setting project to %PROJECT_ID%...
gcloud config set project %PROJECT_ID%

REM Enable required APIs
echo Enabling required APIs...
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com

REM Build and push the Docker image
echo Building and pushing Docker image to Google Container Registry...
gcloud builds submit --tag %IMAGE_NAME% .

REM Deploy to Cloud Run
echo Deploying to Cloud Run...
gcloud run deploy %SERVICE_NAME% ^
    --image %IMAGE_NAME% ^
    --platform managed ^
    --region %REGION% ^
    --allow-unauthenticated ^
    --memory 2Gi ^
    --cpu 1 ^
    --timeout 5m ^
    --set-env-vars="ALLOWED_ORIGINS=http://localhost:3000,https://tenzzen-app.vercel.app"

REM Get the service URL
for /f "tokens=*" %%a in ('gcloud run services describe %SERVICE_NAME% --platform managed --region %REGION% --format "value(status.url)"') do set SERVICE_URL=%%a

echo Deployment complete!
echo Your ADK service is now running at: %SERVICE_URL%
echo.
echo IMPORTANT: You need to set the following environment variables in your Vercel project:
echo NEXT_PUBLIC_ADK_SERVICE_URL=%SERVICE_URL%
echo NEXT_PUBLIC_ADK_SERVICE_TIMEOUT=300000
echo.
echo Don't forget to set these secret environment variables in Google Cloud Run:
echo GOOGLE_GENERATIVE_AI_API_KEY - Your Google Generative AI API key
echo YOUTUBE_API_KEY - Your YouTube API key
echo.
echo You can set them using the following command:
echo gcloud run services update %SERVICE_NAME% --platform managed --region %REGION% ^
echo   --set-env-vars="GOOGLE_GENERATIVE_AI_API_KEY=your-api-key,YOUTUBE_API_KEY=your-api-key"

pause
