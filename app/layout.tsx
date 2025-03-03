import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import { ThemeToggle } from "@/components/theme-toggle"
import { CookieConsent } from "@/components/cookie-consent"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeScript } from "@/components/theme-script"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tenzzen - Transform Videos into Structured Courses",
  description: "Use AI to turn YouTube videos into interactive learning experiences",
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <Providers>
          <ClerkProvider
            signInFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL}
            signUpFallbackRedirectUrl="/onboarding"
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            appearance={{
              baseTheme: undefined,
              signIn: { baseTheme: undefined },
              signUp: { baseTheme: undefined },
            }}
          >
            <div id="main">
              <AuthenticatedLayout>
                {children}
                <div className="fixed bottom-4 right-4 z-50">
                  <ThemeToggle />
                </div>
                <CookieConsent />
              </AuthenticatedLayout>
            </div>
          </ClerkProvider>
        </Providers>
      </body>
    </html>
  )
}
