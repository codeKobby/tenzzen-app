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

  // Define protected and public routes
  const protectedRoutes = ['/dashboard', '/courses', '/library', '/settings', '/report-bug']
  const publicAuthRoutes = ['/signin', '/signup']
  const publicRoutes = ['/explore', '/billing']

  // Check if current path starts with any protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Protected routes - redirect to signin if not authenticated
  if (isProtectedRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/signin', request.url))
    }
  }

  // Public auth routes (signin/signup) - redirect to dashboard if authenticated
  if (publicAuthRoutes.includes(request.nextUrl.pathname)) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Always allow access to public routes and verification routes
  if (
    publicRoutes.some(route => request.nextUrl.pathname.startsWith(route)) ||
    request.nextUrl.pathname.startsWith('/(auth)/verify-email') || 
    request.nextUrl.pathname.startsWith('/verify-email')
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
