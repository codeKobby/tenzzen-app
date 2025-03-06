"use client"

import { ThemeProvider as NextThemeProvider, type ThemeProviderProps } from "next-themes"
import { Toaster } from "@/components/ui/toaster"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ClerkProvider, useAuth } from "@clerk/nextjs"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function Providers({ children, ...props }: ThemeProviderProps) {
    return (
        <NextThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            {...props}
        >
            <ClerkProvider
                afterSignInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL}
                afterSignUpUrl="/onboarding"
                signInUrl="/sign-in"
                signUpUrl="/sign-up"
                appearance={{
                    baseTheme: undefined,
                    signIn: { baseTheme: undefined },
                    signUp: { baseTheme: undefined },
                }}
            >
                <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                    {children}
                    <Toaster />
                </ConvexProviderWithClerk>
            </ClerkProvider>
        </NextThemeProvider>
    )
}
