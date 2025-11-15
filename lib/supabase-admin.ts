import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with the service role key for admin operations
 * This bypasses RLS policies and should only be used in server-side code
 */
export function createAdminSupabaseClient() {
  // Log Supabase configuration for debugging
  console.log('Admin: Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Admin: Supabase Anon Key set:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // Create the Supabase client with the anon key
  // In a production environment, you would use a service role key here
  // But for now, we'll use the anon key with direct SQL queries
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );

  return client;
}
