import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isOnboardingRoute = createRouteMatcher(['/onboarding']);
const isPublicRoute = createRouteMatcher(['/', '/sign-in', '/sign-up', '/explore']);
const isAnalysisRoute = createRouteMatcher([
  '/analysis/:videoId',
  '/api/ai/v1/generate/course',
  '/api/ai/v1/segments',
  '/api/ai/v1/course'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

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

  // For users on the onboarding page, don't redirect
  if (userId && isOnboardingRoute(req)) {
    return NextResponse.next();
  }

  // If the user isn't signed in and the route is private, redirect to sign-in
  if (!userId && !isPublicRoute(req)) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // For users who just signed in, redirect to dashboard if they've completed onboarding
  // But only redirect from sign-in page, not from homepage
  if (userId && sessionClaims?.metadata?.onboardingComplete && req.nextUrl.pathname === '/sign-in') {
    const dashboardUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Redirect users who haven't completed onboarding to the onboarding page
  if (userId && !sessionClaims?.metadata?.onboardingComplete && !isOnboardingRoute(req) && !isPublicRoute(req)) {
    const onboardingUrl = new URL('/onboarding', req.url);
    return NextResponse.redirect(onboardingUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.[^?]*$).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ],
};
