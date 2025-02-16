# LearnFlow Configuration Guide

This guide explains how to configure both the frontend and backend components of LearnFlow.

## Backend Configuration

1. **Environment Variables**
   Create/edit `backend/.env`:

   ```
   YOUTUBE_API_KEY=your_youtube_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

2. **Python Environment**

   ```bash
   # Create and activate virtual environment
   cd backend
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   source venv/bin/activate # Linux/Mac

   # Install dependencies
   pip install fastapi uvicorn python-dotenv google-api-python-client python-jose[cryptography] ratelimit openai youtube_transcript_api
   ```

3. **Start Backend Server**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
   Server will run on http://localhost:8000

## Frontend Configuration

1. **Environment Variables**
   Create/edit `frontend/.env`:

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Node.js Dependencies**

   ```bash
   cd frontend
   bun install
   ```

3. **Start Frontend Server**
   ```bash
   cd frontend
   bun run dev
   ```
   Server will run on http://localhost:5173

## Supabase Configuration

1. **Database Schema**
   Run these SQL commands in your Supabase SQL editor:

   ```sql
   -- Create profiles table
   create table public.profiles (
     id uuid references auth.users on delete cascade,
     username text unique,
     full_name text,
     avatar_url text,
     created_at timestamp with time zone default timezone('utc'::text, now()),
     primary key (id)
   );

   -- Enable RLS
   alter table public.profiles enable row level security;

   -- Create policies
   create policy "Public profiles are viewable by everyone"
     on public.profiles for select using ( true );

   create policy "Users can insert their own profile"
     on public.profiles for insert with check ( auth.uid() = id );

   create policy "Users can update their own profile"
     on public.profiles for update using ( auth.uid() = id );
   ```

2. **Authentication Settings**
   - Enable Email auth provider
   - Configure OAuth providers (optional):
     - Google
     - GitHub
   - Set redirect URLs:
     - http://localhost:5173 (development)
     - Your production URL

## API Keys Required

1. **YouTube Data API v3**

   - Get from Google Cloud Console
   - Enable YouTube Data API
   - Create credentials
   - Add to `backend/.env`

2. **OpenAI API**

   - Get from OpenAI platform
   - Add to `backend/.env`

3. **Supabase**
   - Get URL and anon key from project settings
   - Add to `frontend/.env`

## Security Considerations

1. **Environment Variables**

   - Never commit .env files
   - Keep API keys secure
   - Use different keys for development/production

2. **Rate Limiting**

   - YouTube API: 10,000 units per day
   - OpenAI API: Monitor usage
   - Implement user quotas if needed

3. **Authentication**
   - Enable email verification
   - Set password policies
   - Configure OAuth carefully

## Troubleshooting

1. **Backend Issues**

   - Check Python virtual environment is activated
   - Verify all environment variables are set
   - Check API keys are valid

2. **Frontend Issues**

   - Clear browser cache
   - Check console for errors
   - Verify Supabase configuration

3. **Database Issues**
   - Check Supabase connection
   - Verify RLS policies
   - Monitor query performance

## Monitoring

1. **API Usage**

   - Monitor YouTube API quota
   - Track OpenAI API costs
   - Watch Supabase usage

2. **Error Tracking**
   - Check application logs
   - Monitor API responses
   - Track authentication failures
