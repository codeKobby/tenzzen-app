# Migrating from Convex to Supabase

This document outlines the process of migrating the Tenzzen application from Convex to Supabase while maintaining Clerk authentication.

## Overview

The migration follows a phased approach:

1. **Phase 1**: Set up Supabase and migrate user data
2. **Phase 2**: Migrate course and enrollment data
3. **Phase 3**: Migrate video and transcript data
4. **Phase 4**: Complete migration and remove Convex

During the transition period, both Convex and Supabase will be used, with new data being synchronized to both databases.

## Prerequisites

- Supabase account and project
- Clerk account with Supabase integration enabled
- Environment variables set up for both Convex and Supabase

## Environment Variables

Add the following environment variables to your `.env.local` file:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Database Schema

The Supabase database schema is defined in `supabase/schema.sql`. It includes:

- Users table
- User profiles table
- User stats table
- Courses table
- Enrollments table
- Videos table
- Transcripts table

Each table has Row Level Security (RLS) policies to ensure data security.

## Clerk Integration

Clerk is integrated with Supabase using JWT templates. In your Clerk dashboard:

1. Go to JWT Templates
2. Create a new template named "supabase"
3. Use the following claims:
   ```json
   {
     "sub": "{{user.id}}",
     "aud": "authenticated",
     "role": "authenticated",
     "email": "{{user.primary_email_address}}",
     "email_verified": "{{user.primary_email_address_verification.status}}"
   }
   ```
4. Set the template to be used with Supabase

## Migration Process

### Phase 1: User Data Migration

1. Access the migration tool at `/admin/migrate`
2. Click on the "Migrate Users to Supabase" button
3. Wait for the migration to complete
4. Verify the migration by checking the Supabase database

### Phase 2: Course Data Migration

1. Access the migration tool at `/admin/migrate`
2. Click on the "Migrate Courses to Supabase" button
3. Wait for the migration to complete
4. Verify the migration by checking the Supabase database

### Phase 3: Video Data Migration

1. Access the migration tool at `/admin/migrate`
2. Click on the "Migrate Videos to Supabase" button
3. Wait for the migration to complete
4. Verify the migration by checking the Supabase database

### Phase 4: Complete Migration

1. Update all code to use Supabase exclusively
2. Remove Convex dependencies
3. Update environment variables
4. Clean up migration scripts and components

## Testing

You can test the Supabase integration at `/admin/supabase-test`. This page allows you to verify that:

1. Supabase is properly connected
2. Clerk authentication is working with Supabase
3. Row Level Security policies are enforced

## Troubleshooting

### Common Issues

- **Authentication errors**: Ensure that the Clerk JWT template is correctly set up for Supabase
- **Permission errors**: Check the RLS policies in Supabase
- **Missing data**: Verify that the migration process completed successfully

### Logs

Check the browser console and server logs for error messages.

## Rollback Plan

If issues arise during the migration:

1. Continue using Convex for affected features
2. Fix the issues in the Supabase integration
3. Re-run the migration for the affected data

## Contact

For assistance with the migration process, contact the development team.
