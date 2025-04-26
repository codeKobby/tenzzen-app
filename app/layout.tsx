import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { RootLayoutClient } from "./root-layout-client"
import NextTopLoader from "nextjs-toploader"
import { Providers } from "@/app/providers"
import { ToastContainer } from '@/components/custom-toast'
import { ClerkProvider } from "@clerk/nextjs"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tenzzen",
  description: "Transform YouTube videos into structured learning experiences",
}

// Validate Clerk publishable key is set
if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClerkProvider>
          <NextTopLoader
            color="#FF0000"
            height={2}
            showSpinner={false}
            crawlSpeed={200}
            speed={200}
          />
          <Providers>
            <RootLayoutClient>
              {children}
              <ToastContainer />
            </RootLayoutClient>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
