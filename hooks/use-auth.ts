"use client"

import { useAuth as useClerkAuth, useUser, useSession } from "@clerk/nextjs"
import { createClerkSupabaseClient } from "@/lib/supabase-client"
import { useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"

interface AuthState {
  user: ReturnType<typeof useUser>["user"]
  session: ReturnType<typeof useSession>["session"]
  loading: boolean
  supabase: SupabaseClient | null
}

export function useAuth() {
  const { isLoaded, signOut } = useClerkAuth()
  const { user } = useUser()
  const { session } = useSession()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize Supabase client when session changes
  useEffect(() => {
    const initializeSupabase = () => {
      try {
        const client = createClerkSupabaseClient(session)
        setSupabase(client)
      } catch (error) {
        console.error("Error initializing Supabase client:", error)
      }
      setLoading(false)
    }

    if (isLoaded) {
      initializeSupabase()
    }

    return () => {
      // Cleanup Supabase connections
      if (supabase) {
        supabase.realtime.disconnect()
      }
    }
  }, [isLoaded, session])

  return {
    user,
    session,
    supabase,
    loading: !isLoaded || loading,
    signIn: () => {
      window.location.href = "/sign-in"
    },
    signUp: () => {
      window.location.href = "/sign-up"
    },
    signOut: async () => {
      if (supabase) {
        // Clean up Supabase session
        supabase.realtime.disconnect()
      }
      // Sign out from Clerk
      await signOut()
      // Create new anonymous Supabase client
      const client = createClerkSupabaseClient(null)
      setSupabase(client)
    }
  }
}
