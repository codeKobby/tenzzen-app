import { clerkMiddleware, createRouteMatcher, currentUser } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { syncUserToSupabase } from './lib/user-sync';
import { updateSession } from './lib/supabase/middleware';

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

  // First, update the Supabase session if needed
  // This handles refreshing auth tokens for routes that use Supabase auth
  const updatedResponse = await updateSession(req as NextRequest);

  // Sync user to Supabase if they're signed in
  if (userId) {
    try {
      // Get the full user object using currentUser()
      const clerkUser = await currentUser();
      if (clerkUser) {
        await syncUserToSupabase(clerkUser);
      }
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