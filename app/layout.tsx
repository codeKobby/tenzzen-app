import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import { ThemeScript } from "@/components/theme-script"
import { ThemeToggle } from "@/components/theme-toggle"
import { CookieConsent } from "@/components/cookie-consent"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tenzzen - Transform Videos into Structured Courses",
  description: "Use AI to turn YouTube videos into interactive learning experiences",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <Providers>
          <div id="main">
            <AuthenticatedLayout>
              {children}
              <div className="fixed bottom-4 right-4 z-50">
                <ThemeToggle />
              </div>
              <CookieConsent />
            </AuthenticatedLayout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
