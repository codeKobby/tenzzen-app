# Clerk + Supabase Integration Setup Guide

This guide explains how to properly set up the integration between Clerk (for authentication) and Supabase (for database).

## Environment Variables

First, ensure your `.env.local` file contains the correct Supabase configuration:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-publishable-key
CLERK_SECRET_KEY=your-secret-key
```

## Clerk JWT Template Setup

The most important step is to create a JWT template in Clerk that Supabase can understand:

1. Go to your [Clerk Dashboard](https://dashboard.clerk.dev/)
2. Navigate to your application
3. Go to "JWT Templates" in the sidebar
4. Click "New template"
5. Name the template `supabase`
6. Use the following claims:

```json
{
  "sub": "{{user.id}}",
  "aud": "authenticated",
  "role": "authenticated",
  "email": "{{user.primary_email_address}}",
  "email_verified": "{{user.primary_email_address_verification.status}}"
}
```

7. Save the template

## Supabase Row Level Security (RLS) Policies

Make sure your Supabase tables have the appropriate RLS policies:

1. Go to your [Supabase Dashboard](https://app.supabase.io/)
2. Navigate to your project
3. Go to "Authentication" > "Policies"
4. For each table, create policies that allow authenticated users to access their own data

Example policy for the `users` table:

```sql
CREATE POLICY "Users can view their own data"
ON users
FOR SELECT
USING (auth.uid()::text = clerk_id);
```

## Testing the Integration

To test if the integration is working:

1. Sign in to your application using Clerk
2. The middleware should automatically sync the user to Supabase
3. Check your Supabase database to see if the user was created

If you're experiencing issues:

1. Check the browser console for errors
2. Visit `/api/debug/env-check` to verify environment variables
3. Visit `/api/debug/jwt-template-check` to verify the JWT template

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**: 
   - Make sure your Supabase URL and anon key are correct
   - Check that the environment variables are properly loaded

2. **JWT template errors**:
   - Ensure the JWT template is named exactly "supabase"
   - Verify the claims match what Supabase expects

3. **User not syncing to Supabase**:
   - Check if the middleware is running
   - Verify that the Clerk token is being obtained successfully

### Debugging Steps

If you're still having issues:

1. Check the server logs for any errors related to Supabase or Clerk
2. Verify that the Clerk JWT template is correctly configured
3. Make sure your Supabase schema matches what the application expects
4. Test the Supabase connection directly using the Supabase client

## Additional Resources

- [Clerk Documentation](https://clerk.dev/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Clerk + Supabase Integration Guide](https://clerk.dev/docs/integrations/databases/supabase)
