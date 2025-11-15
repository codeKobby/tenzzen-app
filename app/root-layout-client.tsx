"use client"

import { usePathname } from "next/navigation"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import { ThemeToggle } from "@/components/theme-toggle"
import { CookieConsent } from "@/components/cookie-consent"

interface RootLayoutClientProps {
  children: React.ReactNode
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <RootLayoutContent>
      {children}
    </RootLayoutContent>
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
        <div className="fixed bottom-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <CookieConsent />
      </AuthenticatedLayout>
    </div>
  )
}
