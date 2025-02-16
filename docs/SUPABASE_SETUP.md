# Supabase Setup Guide

This guide will help you set up Supabase for the YouTube Course Generator project.

## Prerequisites

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Install the Supabase CLI (optional, for local development)

## Steps

1. Create a new Supabase project from the dashboard
2. Copy your project URL and anon/public key from:
   - Settings -> API
   - Look for `Project URL` and `anon/public` key

3. Create a `.env` file in the `frontend` directory:
   ```bash
   cp .env.example .env
   ```

4. Add your Supabase credentials to the `.env` file:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Database Setup

Run the following SQL commands in your Supabase SQL editor:

```sql
-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- Create extension for generating UUIDs
create extension if not exists "uuid-ossp";

-- Create tables
create table if not exists public.courses (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text,
    status text not null default 'draft',
    created_by uuid references auth.users not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    difficulty_level text not null default 'beginner',
    estimated_duration interval,
    tags text[],
    category text,
    generated_summary text
);

create table if not exists public.lessons (
    id uuid primary key default uuid_generate_v4(),
    course_id uuid references public.courses on delete cascade not null,
    title text not null,
    video_url text not null,
    "order" integer not null,
    video_duration interval,
    transcript text,
    ai_generated_notes text,
    video_metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

## Enable Row Level Security (RLS)

Add these policies to secure your tables:

```sql
-- Courses RLS
alter table public.courses enable row level security;

create policy "Users can view all published courses"
on public.courses for select
to authenticated
using (status = 'published');

create policy "Users can manage their own courses"
on public.courses for all
to authenticated
using (created_by = auth.uid());

-- Lessons RLS
alter table public.lessons enable row level security;

create policy "Users can view lessons of published courses"
on public.lessons for select
to authenticated
using (
    exists (
        select 1 from public.courses
        where courses.id = lessons.course_id
        and courses.status = 'published'
    )
);

create policy "Users can manage lessons of their courses"
on public.lessons for all
to authenticated
using (
    exists (
        select 1 from public.courses
        where courses.id = lessons.course_id
        and courses.created_by = auth.uid()
    )
);
```

## Authentication Setup

1. Go to Authentication -> Settings in your Supabase dashboard
2. Configure your site URL and redirect URLs
3. Enable Email provider
4. (Optional) Configure additional providers like Google, GitHub

## Testing

Test the setup by:
1. Creating a user account
2. Attempting to sign in
3. Creating a course
4. Viewing courses

## Additional Configuration

- Set up storage buckets for course materials if needed
- Configure email templates for authentication
- Set up edge functions if required
- Configure database backups

## Troubleshooting

If you encounter issues:
1. Check your environment variables
2. Verify RLS policies
3. Check the Supabase dashboard logs
4. Ensure your database schema is correct
