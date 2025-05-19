import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { RootLayoutClient } from "./root-layout-client"
import NextTopLoader from "nextjs-toploader"
import { Providers } from "@/app/providers"
import { ClerkProvider } from "@clerk/nextjs"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tenzzen",
  description: "Transform YouTube videos into structured learning experiences",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the publishable key from environment variables
  // Use a placeholder during build if the key is not available
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

  // Check if we're in a build environment and the key is a placeholder
  const isBuildWithPlaceholder =
    process.env.NODE_ENV === 'production' &&
    publishableKey === 'pk_placeholder_for_build_only';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClerkProvider
          publishableKey={publishableKey}
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/dashboard"
          // Skip static optimization during build with placeholder keys
          isSatellite={isBuildWithPlaceholder}
        >
          <NextTopLoader
            color="#FF0000"
            height={3}
            showSpinner={false}
            crawlSpeed={200}
            speed={200}
            initialPosition={0.08}
            easing="ease"
            shadow="0 0 10px #FF0000,0 0 5px #FF0000"
            showForHashAnchor={true}
            zIndex={1600}
          />
          <Providers>
            <RootLayoutClient>
              {children}
            </RootLayoutClient>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
