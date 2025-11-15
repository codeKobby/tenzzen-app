"use client"

import { usePathname } from "next/navigation"
<<<<<<< HEAD
import { useEffect, useState } from "react"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import { ThemeToggle } from "@/components/theme-toggle"
import { CookieConsent } from "@/components/cookie-consent"
import { useTopLoaderEvents } from "@/lib/utils/navigation"
=======
import { Providers } from "./providers"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import { ThemeToggle } from "@/components/theme-toggle"
import { CookieConsent } from "@/components/cookie-consent"
>>>>>>> master

interface RootLayoutClientProps {
  children: React.ReactNode
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
<<<<<<< HEAD
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname() || ''
  const isAuthPage = ['/sign-in', '/sign-up'].includes(pathname)

  // Use the top loader events hook to listen for custom top loader events
  useTopLoaderEvents()

  // Critical: This ensures proper client-side hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't show anything until the component is mounted
  // This avoids hydration errors and blank pages
  if (!mounted) {
    return (
      <div className="root-layout-loading">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* User data is initialized in providers.tsx */}

      <main>
        {isAuthPage ? (
          // For auth pages, render directly without authenticated layout
          children
        ) : (
          // For all other pages, use authenticated layout
          <AuthenticatedLayout>
            {children}
          </AuthenticatedLayout>
        )}

=======
  return (
    <Providers>
      <RootLayoutContent>
        {children}
      </RootLayoutContent>
    </Providers>
  )
}

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = ['/sign-in', '/sign-up'].includes(pathname)

  if (isAuthPage) {
    return children
  }

  return (
    <div id="main">
      <AuthenticatedLayout>
        {children}
>>>>>>> master
        <div className="fixed bottom-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <CookieConsent />
<<<<<<< HEAD
      </main>
    </>
=======
      </AuthenticatedLayout>
    </div>
>>>>>>> master
  )
}
