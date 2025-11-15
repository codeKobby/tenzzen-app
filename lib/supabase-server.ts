import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

/**
 * Creates a Supabase client with the Clerk session token for server-side usage
 */
export async function createServerSupabaseClient() {
  const authData = await auth();
  const userId = authData.userId;
  const getToken = authData.getToken;

  // Log Supabase configuration for debugging
  console.log('Server: Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Server: Supabase Anon Key set:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log('Server: Clerk user authenticated:', !!userId);

  // Get the token if the user is authenticated
  let token = '';
  if (userId) {
    try {
      const clerkToken = await getToken({ template: 'supabase' });
      // Handle the case where getToken returns null
      token = clerkToken || '';
      console.log('Server: Clerk token obtained:', !!token);
    } catch (error) {
      console.error('Server: Error getting Clerk token:', error);
    }
  }

  // Create the Supabase client with the token in the headers
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      },
      auth: {
        persistSession: false, // We're using Clerk for auth, so we don't need Supabase to persist the session
      },
    }
  );

  return client;
}
