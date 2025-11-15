/**
 * Re-export of the Supabase server client creation function
 * This file exists to maintain compatibility with imports using @/lib/supabase/server
 */

import { createServerSupabaseClient } from '../supabase-server';

/**
 * Creates a Supabase client for server-side usage
 * This is a re-export of createServerSupabaseClient from lib/supabase-server.ts
 */
export function createClient() {
  return createServerSupabaseClient();
}

// Also export the original function for direct usage
export { createServerSupabaseClient };
