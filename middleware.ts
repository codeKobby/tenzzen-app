import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define our route matchers
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook'
])

const isSemiPublicRoute = createRouteMatcher([
  '/explore'
])

const isOnboardingRoute = createRouteMatcher([
  '/onboarding'
])

export default clerkMiddleware((auth, request) => {
  return auth().then(({ userId, sessionClaims }) => {
    // Public routes are always accessible
    if (isPublicRoute(request)) {
      return NextResponse.next()
    }

    // Semi-public routes are accessible but may show different content
    if (isSemiPublicRoute(request)) {
      return NextResponse.next()
    }

    // Handle onboarding route
    if (isOnboardingRoute(request)) {
      // If they're not logged in, redirect to sign-in
      if (!userId) {
        return NextResponse.redirect(new URL('/sign-in', request.url))
      }
      // If they've completed onboarding, redirect to dashboard
      if (sessionClaims?.metadata?.onboardingComplete) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return NextResponse.next()
    }

    // For all other routes:
    // 1. Must be authenticated
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    // 2. Must have completed onboarding
    if (!sessionClaims?.metadata?.onboardingComplete) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Allow access to protected routes
    return NextResponse.next()
  })
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
}
