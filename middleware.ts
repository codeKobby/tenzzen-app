import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Public routes that don't require authentication
const publicPaths = [
  "/",
  "/sign-in",
  "/sign-up",
  "/test-auth",  // Add test route to public paths
  "/api/webhook/clerk",
  "/privacy",
  "/terms"
]

export default clerkMiddleware(async (auth, request) => {
  const isPublicPath = publicPaths.some(path => 
    request.url.includes(path)
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  try {
    // Get the resolved auth state
    const resolvedAuth = await auth()

    // If not authenticated, redirect to sign-in
    if (!resolvedAuth.userId) {
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('redirect_url', request.url)
      return NextResponse.redirect(signInUrl)
    }

    // Get token for Supabase
    const token = await resolvedAuth.getToken({
      template: "supabase"
    })

    // Create response with modified headers
    const requestHeaders = new Headers(request.headers)
    
    if (token) {
      // Add the Supabase token to the headers
      requestHeaders.set('Authorization', `Bearer ${token}`)
    }

    // Return response with the modified headers
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    return response
  } catch (error) {
    console.error('Error in middleware:', error)
    // If there's an error getting the token, continue without auth header
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)", // Match all paths except static files
    "/",                            // Include root path
    "/(api|trpc)(.*)"              // Include API routes
  ]
}
