# Supabase SQL Setup

This directory contains SQL files that need to be executed in the Supabase SQL editor to set up the database schema and stored procedures.

## Setup Instructions

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to the SQL Editor (left sidebar)
4. Create a new query
5. Copy and paste the contents of each SQL file in this directory into the SQL editor
6. Execute the queries in the following order:

### 1. Setup Tables

First, execute the `setup-tables.sql` file from the `public` directory. This will create the basic tables and RLS policies.

### 2. Create Stored Procedures

Execute the following SQL files to create the stored procedures:

- `sync_user.sql` - Creates the `sync_user` stored procedure for synchronizing users between Clerk and Supabase
- `video_transcripts.sql` - Creates the `video_transcripts` table for storing YouTube video transcripts
- `execute_sql_function.sql` - Creates a utility function for executing SQL queries from the client

## Stored Procedures

### sync_user

This stored procedure synchronizes a user between Clerk and Supabase. It takes the following parameters:

- `p_clerk_id` - The Clerk user ID
- `p_email` - The user's email address
- `p_name` - The user's name
- `p_image_url` - The user's profile image URL
- `p_auth_provider` - The authentication provider (e.g., 'clerk')
- `p_role` - The user's role (e.g., 'user')
- `p_status` - The user's status (e.g., 'active')
- `p_last_login` - A JSONB object with login information

It returns a JSONB object with the following fields:

- `user` - The user data
- `action` - The action taken ('created' or 'updated')
- `profile_created` - Whether a user profile was created
- `stats_created` - Whether user stats were created

### video_transcripts

This creates a table for storing YouTube video transcripts with the following columns:

- `id` - A unique identifier for the transcript
- `video_id` - The YouTube video ID
- `language` - The language of the transcript
- `transcript` - The transcript data as a JSONB object
- `cached_at` - The timestamp when the transcript was cached

## Troubleshooting

If you encounter any errors when executing the SQL files, check the following:

1. Make sure you have the necessary permissions to create tables and functions
2. Check for syntax errors in the SQL files
3. Make sure the tables and functions don't already exist
4. Check the Supabase logs for more detailed error messages

If you need to modify the SQL files, make the changes and re-execute them in the SQL editor.
