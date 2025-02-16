# How to Get a YouTube API Key

Follow these steps to obtain a YouTube Data API v3 key:

1. **Go to Google Cloud Console**

   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create a New Project**

   - Click on the project dropdown at the top of the page
   - Click "New Project"
   - Name it "LearnFlow" (or your preferred name)
   - Click "Create"

3. **Enable YouTube Data API**

   - In the left sidebar, click "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click on it and click "Enable"

4. **Create Credentials**

   - Click "Create Credentials" at the top of the page
   - You'll be asked "Which API are you using?" - Select "YouTube Data API v3"
   - For "Where will you be calling the API from?" select "Web browser (JavaScript)"
   - For "What data will you be accessing?" select "Public data"
   - Click "Next"

5. **Get Your API Key**

   - Your API key will be created and displayed
   - Copy this key
   - Click "Done"

6. **Secure Your API Key**

   - Go to "APIs & Services" > "Credentials"
   - Find your API key in the list
   - Click the edit (pencil) icon
   - Add application restrictions if desired (e.g., HTTP referrers)
   - Click "Save"

7. **Add to Environment Variables**
   - Copy your API key
   - Open `backend/.env`
   - Replace `your_youtube_api_key_here` with your actual API key

**Important Security Notes:**

- Never commit your API key to version control
- Set appropriate restrictions on your key in the Google Cloud Console
- Monitor your API usage in the Google Cloud Console
- The free tier includes 10,000 queries per day

Once you have your API key, provide it to me and I'll update the `.env` file.
