import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';

/**
 * Creates a Supabase client with the Clerk session token for client-side usage
 *
 * This follows the official Supabase + Clerk integration pattern
 */
export function useSupabaseClient() {
  const { session } = useSession();
  const supabase = useRef(
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false, // We're using Clerk for auth, so we don't need Supabase to persist the session
        },
      }
    )
  );

  // Update the Authorization header when the session changes
  useEffect(() => {
    const updateSupabaseAuth = async () => {
      if (session) {
        try {
          const token = await session.getToken({ template: 'supabase' });

          // Create a new client with the token
          const newClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              global: {
                headers: {
                  Authorization: `Bearer ${token || ''}`,
                },
              },
              auth: {
                persistSession: false,
              },
            }
          );

          // Update the reference
          supabase.current = newClient;
          console.log('Clerk token set for Supabase:', !!token);
        } catch (error) {
          console.error('Error getting Clerk token for Supabase:', error);
        }
      } else {
        // Reset to a client without auth
        supabase.current = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              persistSession: false,
            },
          }
        );
      }
    };

    updateSupabaseAuth();
  }, [session]);

  return supabase.current;
}
