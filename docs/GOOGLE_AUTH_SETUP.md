# Setting Up Google Authentication in Supabase

Follow these steps to enable Google Sign-in for LearnFlow:

1. **Create Google OAuth Credentials**

   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     ```
     http://localhost:5173
     http://localhost:5174
     https://zbbmeoteadnjrawwjwtm.supabase.co
     ```
   - Add authorized redirect URIs:
     ```
     https://zbbmeoteadnjrawwjwtm.supabase.co/auth/v1/callback
     ```
   - Click "Create"
   - Copy the Client ID and Client Secret

2. **Configure Supabase Auth Settings**

   - Go to your Supabase project dashboard
   - Navigate to Authentication > Providers
   - Find Google in the list
   - Enable "Sign in with Google"
   - Paste your Google OAuth credentials:
     - Client ID from Google Cloud Console
     - Client Secret from Google Cloud Console
   - Save changes

3. **Additional Settings**

   - Ensure "Skip nonce checks" is disabled (for security)
   - The callback URL should already be set to:
     ```
     https://zbbmeoteadnjrawwjwtm.supabase.co/auth/v1/callback
     ```
   - This URL must match exactly what you added in Google Cloud Console

4. **Testing**

   - Start your frontend application
   - Click "Sign In"
   - Choose "Continue with Google"
   - You should be redirected to Google's login page
   - After successful login, you'll be redirected back to LearnFlow

5. **Troubleshooting**

   - If sign-in fails, check:
     - Client ID and Secret are correct
     - Authorized domains match exactly
     - Callback URLs match exactly
     - Google OAuth consent screen is configured
     - The Google Cloud project has OAuth enabled

6. **Security Notes**
   - Keep Client Secret secure
   - Use environment variables
   - Monitor sign-in attempts
   - Consider adding additional security measures:
     - Domain verification
     - User restrictions
     - Session management

Remember to never commit OAuth credentials to version control. Always use environment variables for sensitive information.
