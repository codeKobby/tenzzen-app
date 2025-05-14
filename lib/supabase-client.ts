import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Creates a Supabase client with the Clerk session token for client-side usage
 *
 * This follows the official Supabase + Clerk integration pattern with added
 * token refresh handling
 */
export function useSupabaseClient() {
  const { session } = useSession();
  const [lastTokenRefresh, setLastTokenRefresh] = useState<number>(0);
  const tokenRefreshInProgress = useRef<boolean>(false);

  // Create initial client without auth
  const supabase = useRef<SupabaseClient>(
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

  // Function to refresh the token and update the client
  const refreshSupabaseToken = useCallback(async () => {
    if (!session || tokenRefreshInProgress.current) return;

    // Set flag to prevent multiple simultaneous refreshes
    tokenRefreshInProgress.current = true;

    try {
      console.log('Refreshing Supabase token...');
      const token = await session.getToken({ template: 'supabase' });

      // Create a new client with the fresh token
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
      setLastTokenRefresh(Date.now());
      console.log('Supabase token refreshed successfully');
    } catch (error) {
      console.error('Error refreshing Supabase token:', error);
    } finally {
      tokenRefreshInProgress.current = false;
    }
  }, [session]);

  // Update the Authorization header when the session changes
  useEffect(() => {
    const updateSupabaseAuth = async () => {
      if (session) {
        await refreshSupabaseToken();
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

    // Set up a token refresh interval (every 10 minutes)
    // This helps prevent JWT expiration issues
    // Reduced from 30 minutes to 10 minutes to avoid JWT expiration
    const refreshInterval = setInterval(() => {
      if (session) {
        refreshSupabaseToken();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      clearInterval(refreshInterval);
    };
  }, [session, refreshSupabaseToken]);

  // Add an error handler to refresh token on 401 errors
  const handleTokenError = useCallback(async (error: any) => {
    // Check if this is an auth error that might be fixed by refreshing the token
    if (
      error?.message?.includes('JWT expired') ||
      error?.message?.includes('invalid token') ||
      error?.message?.includes('Invalid JWT') ||
      error?.status === 401
    ) {
      console.log('Auth error detected, refreshing token...');
      await refreshSupabaseToken();
      return true; // Token was refreshed
    }
    return false; // Not an auth error or token wasn't refreshed
  }, [refreshSupabaseToken]);

  // Create a wrapped client that handles token refresh
  const wrappedClient = useCallback(async () => {
    // If it's been more than 45 minutes since the last refresh, refresh the token
    if (session && Date.now() - lastTokenRefresh > 45 * 60 * 1000) {
      await refreshSupabaseToken();
    }
    return supabase.current;
  }, [session, lastTokenRefresh, refreshSupabaseToken]);

  // Immediately refresh token if session exists but we don't have a recent refresh
  useEffect(() => {
    if (session && lastTokenRefresh === 0) {
      refreshSupabaseToken();
    }
  }, [session, lastTokenRefresh, refreshSupabaseToken]);

  // Return the client
  return supabase.current;
}
