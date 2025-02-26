"use client"

import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { useAuth } from "@/hooks/use-auth"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"
import { SIDEBAR_WIDTH, TRANSITION_DURATION, TRANSITION_TIMING } from "@/lib/constants"

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const { isOpen } = useSidebar()

  // Return children without layout for homepage and auth pages
  if (pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up') {
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

  // If authenticated and not loading, render with sidebar
  return (
    <div className="relative min-h-screen bg-background">
      <Sidebar />
      <div className={cn(
        "min-h-screen",
        `transition-transform duration-&lsqb;${TRANSITION_DURATION}ms&rsqb; ${TRANSITION_TIMING}`,
        isOpen ? "lg:pl-[280px]" : "lg:pl-0"
      )}>
        <PageHeader />
        <main>
          {children}
        </main>
      </div>
    </div>
  )
}
