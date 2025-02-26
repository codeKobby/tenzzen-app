import { createClient } from "@supabase/supabase-js"
import { type useSession } from "@clerk/nextjs"

export type SupabaseClient = ReturnType<typeof createClient>
type ClerkSession = NonNullable<ReturnType<typeof useSession>["session"]>

export function createClerkSupabaseClient(clerkSession?: ClerkSession | null) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          try {
            let authHeader: string | undefined

            if (clerkSession) {
              // Get the Clerk-generated Supabase JWT
              const token = await clerkSession.getToken({
                template: "supabase"
              })
              
              if (token) {
                authHeader = `Bearer ${token}`
              }
            }

            const headers = new Headers(options?.headers)
            if (authHeader) {
              headers.set("Authorization", authHeader)
            }

            return fetch(url, {
              ...options,
              headers
            })
          } catch (error) {
            console.error("Error getting Clerk token:", error)
            // Proceed with request without auth header
            return fetch(url, options)
          }
        }
      },
      auth: {
        // Disable Supabase auth in favor of Clerk
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  )
}

// Helper function for admin operations
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  )
}