import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Configure auth protection settings
const AUTH_PROTECTION = {
  MAX_LOGIN_ATTEMPTS: 5, // Maximum failed login attempts before temporary block
  BLOCK_DURATION: 15 * 60, // Block duration in seconds (15 minutes)
  SIGNUP_COOLDOWN: 24 * 60 * 60 // Cooldown between signups from same IP (24 hours)
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing required Supabase environment variables')
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions = {}) {
          // Enforce secure cookie options
          const secureOptions: CookieOptions = {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 week
          }
          request.cookies.set({
            name,
            value,
            ...secureOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...secureOptions,
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

  // Strict path matching for routes
  const protectedRoutes = ['^/dashboard/?.*$', '^/courses/?.*$', '^/library/?.*$', '^/settings/?.*$', '^/report-bug/?.*$'].map(r => new RegExp(r))
  const publicAuthRoutes = ['^/signin/?$', '^/signup/?$'].map(r => new RegExp(r))
  const publicRoutes = ['^/explore/?.*$', '^/billing/?.*$'].map(r => new RegExp(r))

  // For auth routes, apply additional security headers
  if (publicAuthRoutes.some(route => route.test(request.nextUrl.pathname))) {
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none';")
  }

  // Strict path matching for protected routes
  const isProtectedRoute = protectedRoutes.some(route => 
    route.test(request.nextUrl.pathname)
  )

  // Protected routes - redirect to signin if not authenticated
  if (isProtectedRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/signin', request.url))
    }
  }

  // Public auth routes with strict matching
  if (publicAuthRoutes.some(route => route.test(request.nextUrl.pathname))) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Always allow access to public routes and verification routes
  if (
    publicRoutes.some(route => route.test(request.nextUrl.pathname)) ||
    /^\/(auth\/)?verify-email\/?.*$/.test(request.nextUrl.pathname)
  ) {
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/courses/:path*',
    '/library/:path*',
    '/settings/:path*',
    '/report-bug/:path*',
    '/signin',
    '/signup',
    '/(auth)/verify-email',
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
