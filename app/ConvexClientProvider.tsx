"use client"

import { ClerkProvider, useAuth } from "@clerk/clerk-react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ConvexReactClient } from "convex/react"
import { ReactNode } from "react"

// Create Convex client
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!
const convex = new ConvexReactClient(convexUrl)

if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key")
}

/**
 * Provider component that wraps the app with Clerk auth and Convex
 */
export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      signInFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? "/dashboard"}
      signUpFallbackRedirectUrl="/onboarding"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        baseTheme: undefined,
        elements: {
          card: "bg-background",
          formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
          formFieldInput:
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        },
        variables: {
          borderRadius: "0.5rem",
          colorPrimary: "#0ea5e9",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
