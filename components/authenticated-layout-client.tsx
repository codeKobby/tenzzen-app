"use client"

import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { useAuth } from "@/hooks/use-auth"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"
import { TRANSITION_DURATION, TRANSITION_TIMING } from "@/lib/constants"

interface AuthenticatedLayoutClientProps {
  children: React.ReactNode
}

export function AuthenticatedLayoutClient({ children }: AuthenticatedLayoutClientProps) {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const { isOpen } = useSidebar()

  // Return children without layout for homepage, auth pages, onboarding, and analysis
  if (pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up' || pathname === '/onboarding' || pathname.startsWith('/analysis/')) {
    return <div className="relative min-h-screen bg-background">{children}</div>
  }

  // Return children while loading to prevent flash
  if (loading) {
    return (
      <div className="relative min-h-screen bg-background">
        {children}
      </div>
    )
  }

  // If not authenticated, just render children
  if (!user) {
    return (
      <div className="relative min-h-screen bg-background">
        {children}
      </div>
    )
  }

  // If authenticated and not loading, render with sidebar (except for analysis page)
  return (
    <div className="relative min-h-screen bg-background">
      {!pathname.startsWith('/analysis/') && <Sidebar />}
      <div className={cn(
        "min-h-screen",
        `transition-transform duration-&lsqb;${TRANSITION_DURATION}ms&rsqb; ${TRANSITION_TIMING} ease-in-out`,
        !pathname.startsWith('/analysis/') && (isOpen ? "lg:pl-[280px]" : "lg:pl-0")
      )}>
        <PageHeader />
        <main>
          {children}
        </main>
      </div>
    </div>
  )
}
