import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create a response to modify the cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Check if we're trying to access auth pages
  const isAuthPage = request.nextUrl.pathname.startsWith('/signin') ||
    request.nextUrl.pathname.startsWith('/signup')

  // Get the user's session
  const { data: { session } } = await supabase.auth.getSession()
  
  // If trying to access auth pages while already authenticated
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // If trying to access protected pages while not authenticated
  if (!isAuthPage && !session) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }
  
  return response
}

export const config = {
  matcher: [
    // Match all paths except static files, api routes, assets, and auth callback
    '/((?!api|_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
}
