import { ThemeScript } from "@/components/theme-script"
import { ThemeToggle } from "@/components/theme-toggle"
import { Providers } from "@/components/providers"
import type { ReactNode } from "react"

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <Providers>
          <div className="min-h-screen flex items-center justify-center bg-background">
            {children}
            <div className="fixed bottom-4 right-4 z-50">
              <ThemeToggle />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
