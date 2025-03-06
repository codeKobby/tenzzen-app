import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// List of public routes that don't require authentication
const publicRoutes = new Set(["/", "/sign-in", "/sign-up", "/explore"]);
const onboardingRoute = "/onboarding";

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const path = new URL(req.url).pathname;

  // For users on the onboarding page, don't redirect
  if (userId && path === onboardingRoute) {
    return NextResponse.next();
  }

  // If the user isn't signed in and the route is private, redirect to sign-in
  if (!userId && !publicRoutes.has(path)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect users who haven't completed onboarding to the onboarding page
  if (userId && !sessionClaims?.metadata?.onboardingComplete && path !== onboardingRoute) {
    const onboardingUrl = new URL("/onboarding", req.url);
    return NextResponse.redirect(onboardingUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
