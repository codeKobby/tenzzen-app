import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  
  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/signin?error=no-code', request.url)
    )
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', options)
        },
      },
    }
  )

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) throw error

    // Handle email verification success
    if (type === 'email_verification') {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email_confirmed_at) {
        return NextResponse.redirect(
          new URL('/auth/signin?message=email-verified', request.url)
        )
      }
    }

    // Default success redirect
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Error in auth callback:', error)
    
    // Handle verification errors
    if (type === 'email_verification') {
      return NextResponse.redirect(
        new URL('/auth/signin?error=verification-failed', request.url)
      )
    }

    // Default error redirect
    return NextResponse.redirect(
      new URL('/auth/signin?error=auth-error', request.url)
    )
  }
}
