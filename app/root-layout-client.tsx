"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import { ThemeToggle } from "@/components/theme-toggle"
import { CookieConsent } from "@/components/cookie-consent"
import { UserInitializer } from "@/components/user-initializer"

interface RootLayoutClientProps {
  children: React.ReactNode
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname() || ''
  const isAuthPage = ['/sign-in', '/sign-up'].includes(pathname)

  // Critical: This ensures proper client-side hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't show anything until the component is mounted
  // This avoids hydration errors and blank pages
  if (!mounted) {
    return (
      <div id="main">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Include UserInitializer here to sync user data on all pages */}
      <UserInitializer />

      <div id="main">
        {isAuthPage ? (
          // For auth pages, render directly without authenticated layout
          children
        ) : (
          // For all other pages, use authenticated layout
          <AuthenticatedLayout>
            {children}
          </AuthenticatedLayout>
        )}

        <div className="fixed bottom-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <CookieConsent />
      </div>
    </>
  )
}
