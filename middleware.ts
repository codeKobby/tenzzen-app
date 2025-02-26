import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const publicRoutes = [
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook/clerk",
  "/privacy",
  "/terms",
  "/about",
  "/pricing",
  "/features(.*)"
]

const isPublicRoute = createRouteMatcher(publicRoutes)

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
  return NextResponse.next()
})

// Stop Middleware running on static files
export const config = {
  matcher: [
    // Skip static files
    "/((?!.+\\.[\\w]+$|_next).*)",
    // Route all API routes
    "/(api|trpc)(.*)"
  ]
}
