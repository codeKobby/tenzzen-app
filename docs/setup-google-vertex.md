# Setting up Google Vertex AI

This guide explains how to set up Google Vertex AI for the application.

## 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "New Project" in the top right
3. Enter a project name and click "Create"

## 2. Enable Required APIs

1. In your project, go to "APIs & Services" > "Library"
2. Search for and enable these APIs:
   - Vertex AI API
   - Cloud Storage API
   - IAM Service Account Credentials API

## 3. Create a Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Enter a name (e.g., "vertex-ai-service")
4. Click "Create and Continue"
5. Add these roles:
   - Vertex AI User
   - Service Account User
   - Storage Object Viewer
6. Click "Done"

## 4. Create Service Account Key

1. Click on your new service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Choose "JSON" format
5. Click "Create"
   - The key file will download automatically
   - Keep this file secure and never commit it to version control

## 5. Set Up Environment Variables

1. Create a `.env.local` file in your project root
2. Open the downloaded JSON key file
3. Add these variables to `.env.local`:

```bash
GOOGLE_CLIENT_EMAIL=<client_email from JSON>
GOOGLE_PRIVATE_KEY="<private_key from JSON>"
GOOGLE_PRIVATE_KEY_ID=<private_key_id from JSON>
GOOGLE_CLOUD_PROJECT_ID=<project_id from JSON>
GOOGLE_CLOUD_LOCATION=us-central1
```

Note: For `GOOGLE_PRIVATE_KEY`, make sure to:
- Keep the quotation marks
- Replace `\n` with actual newlines in the key
- Maintain the BEGIN and END markers

## 6. Vercel Deployment

If deploying to Vercel:

1. Go to your project settings in Vercel
2. Under "Environment Variables"
3. Add each variable from your `.env.local`
4. For `GOOGLE_PRIVATE_KEY`:
   - Copy the entire private key including BEGIN/END markers
   - Keep any newlines (`\n`) as is

## 7. Testing Setup

Verify your setup:

1. Run the development server
2. Try generating course content
3. Check logs for any authentication errors

## Security Notes

- Never commit `.env.local` or service account keys
- Rotate keys regularly
- Set up proper IAM roles and permissions
- Monitor API usage and set quotas
- Keep environment variables secure

## Troubleshooting

Common issues:

1. "Permission denied" errors:
   - Check IAM roles are correctly assigned
   - Verify service account has required permissions

2. Authentication failures:
   - Check GOOGLE_PRIVATE_KEY format
   - Verify all required environment variables are set

3. API not enabled:
   - Enable required APIs in Google Cloud Console
   - Wait a few minutes for changes to propagate