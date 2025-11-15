import { createServerClient, createBrowserClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type CookieOptions } from '@supabase/ssr'

/**
 * Creates a Supabase client for server-side usage with cookie handling
 * For use in Server Components, Route Handlers, and Server Actions
 */
export function createClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // This can happen when attempting to set cookies in a Server Component.
            // We can safely ignore this error since cookies will be set by the middleware.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // This can happen when attempting to delete cookies in a Server Component.
            // We can safely ignore this error since cookies will be set by the middleware.
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase client for client-side usage
 * For use in Client Components
 */
export function createClientComponentClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
