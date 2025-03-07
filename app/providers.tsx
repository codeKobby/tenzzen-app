"use client"

import { ThemeProvider as NextThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/toaster"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/nextjs"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key")
}

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        afterSignInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL}
        afterSignUpUrl="/onboarding"
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
        <ConvexProviderWithClerk client={convex} useAuth={useClerkAuth}>
          {children}
          <Toaster />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </NextThemeProvider>
  )
}
