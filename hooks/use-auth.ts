import { useState, useEffect } from "react"
import { User, Session } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true
  })

  useEffect(() => {
    // Check current session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setAuthState({
          user: session?.user ?? null,
          session: session,
          loading: false
        })
      } catch {
        // Handle error silently and set to unauthenticated state
        setAuthState({
          user: null,
          session: null,
          loading: false
        })
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        user: session?.user ?? null,
        session: session,
        loading: false
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // Log the attempt first for rate limiting
      await supabase.rpc('track_login_attempt', {
        attempt_email: email,
        attempt_ip: '', // IP is handled server-side
        was_successful: false
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      // Update attempt as successful
      await supabase.rpc('track_login_attempt', {
        attempt_email: email,
        attempt_ip: '',
        was_successful: true
      });

      return { data, error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        data: null, 
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      };
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            signup_ip: '' // IP is handled server-side
          }
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        data: null, 
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      };
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Signout error:', error);
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');
      
      return { data, error: null };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { 
        data: null, 
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      };
    }
  }

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle
  }
}
