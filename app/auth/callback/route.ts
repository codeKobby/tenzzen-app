import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            const cookie = await cookieStore.get(name);
            return cookie?.value ?? '';
          },
          async set(name: string, value: string, options: CookieOptions) {
            await cookieStore.set(name, value, options);
          },
          async remove(name: string, options: CookieOptions) {
            await cookieStore.set(name, '', options);
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Error exchanging code for session:', error);
      
      // Check for specific error types
      if (error.message?.includes('email') || error.message?.toLowerCase().includes('invalid')) {
        return NextResponse.redirect(new URL('/auth/invalid-email', request.url));
      }
      
      return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
    }

    // Validate the session data
    if (!data?.session?.user?.email) {
      console.error('No email in session data');
      return NextResponse.redirect(new URL('/auth/invalid-email', request.url));
    }

    return NextResponse.redirect(new URL(next, request.url));
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
}
