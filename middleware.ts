import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.getSession()

  // Auth routes protection
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/signin', request.url))
    }
  }

  // Public routes protection
  const publicRoutes = ['/signin', '/signup']
  if (publicRoutes.includes(request.nextUrl.pathname)) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Allow access to verification routes
  if (request.nextUrl.pathname.startsWith('/(auth)/verify-email') || 
      request.nextUrl.pathname.startsWith('/verify-email')) {
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/signin',
    '/signup',
    '/(auth)/verify-email',
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
