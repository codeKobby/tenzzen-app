import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}/signin?error=Failed%20to%20verify%20email`
      )
    }
  }

  // URL to redirect to after verification
  const redirectTo = requestUrl.searchParams.get('next') || '/dashboard'
  return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`)
}
