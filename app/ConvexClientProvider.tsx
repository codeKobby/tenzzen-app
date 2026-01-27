"use client"

import { ClerkProvider, useAuth } from "@clerk/clerk-react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ReactNode, useEffect } from "react"
import { convex } from "@/hooks/use-convex"

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey || publishableKey === 'pk_placeholder_for_build_only') {
  // During build time, this might occur if env vars aren't set.
  // We log a critical error to help debugging.
  console.error("CRITICAL: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing or invalid.");
  if (typeof window === 'undefined') {
    console.error("Ensure this environment variable is set in your Vercel Project Settings.");
  }
}

/**
 * Provider component that wraps the app with Clerk auth and Convex
 */
export function ConvexClientProvider({
  children,
}: {
  children: ReactNode
}) {
  useEffect(() => {
    console.log('ConvexClientProvider mounted')
    console.log('Convex URL:', process.env.NEXT_PUBLIC_CONVEX_URL)
    console.log('Clerk Key:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...')
  }, [])

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
