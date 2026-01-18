"use client"

import { usePathname } from "next/navigation"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
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
        <CookieConsent />
      </AuthenticatedLayout>
    </div>
  )
}
