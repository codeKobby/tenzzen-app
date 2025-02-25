import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export const createClient = async (cookieStore = cookies()) => {
  const cookieData = await cookieStore
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return cookieData.get(name)?.value ?? ''
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            await cookieData.set({ name, value, ...options })
          } catch (error) {
            // Handle cookies in edge functions
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            await cookieData.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookies in edge functions
          }
        },
      },
    }
  )
}
