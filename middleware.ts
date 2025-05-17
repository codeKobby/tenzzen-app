import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { syncUserToSupabase } from './lib/user-sync';

const isOnboardingRoute = createRouteMatcher(['/onboarding']);
const isPublicRoute = createRouteMatcher(['/', '/sign-in', '/sign-up', '/explore']);
const isAnalysisRoute = createRouteMatcher([
  '/analysis/:videoId',
  '/api/ai/v1/generate/course',
  '/api/ai/v1/segments',
  '/api/ai/v1/course'
]);

export default clerkMiddleware(async (auth, req) => {
  const authData = await auth();
  const userId = authData.userId;

  // Sync user to Supabase if they're signed in
  if (userId && authData.user) {
    try {
      // Use the user object directly from auth() instead of calling currentUser()
      await syncUserToSupabase(authData.user);
    } catch (error) {
      console.error('Error syncing user to Supabase:', error);
    }
  }

  // For analysis routes, require authentication but skip onboarding check
  if (isAnalysisRoute(req)) {
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next({
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  }

  // For users on the onboarding page, redirect to dashboard since we're removing onboarding
  if (userId && isOnboardingRoute(req)) {
    const dashboardUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // If the user isn't signed in and the route is private, redirect to sign-in
  if (!userId && !isPublicRoute(req)) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // For users who just signed in, redirect to dashboard (always, removed onboarding check)
  if (userId && req.nextUrl.pathname === '/sign-in') {
    const dashboardUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Skip onboarding redirect and send all authenticated users directly to their destination
  // (Removed the onboarding redirect logic)

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all request paths except static files and Next.js internals
    '/((?!_next|favicon.ico|.*\\.[^/]*$).*)',
    // Always run for API routes (even if they match the above exclusion)
    '/(api|trpc)(.*)',
    // Explicitly include courses routes
    '/courses/:path*',
  ],
};