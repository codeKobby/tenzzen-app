"use client"

import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"
import { TRANSITION_DURATION, TRANSITION_TIMING } from "@/lib/constants"
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"

interface AuthenticatedLayoutClientProps {
  children: React.ReactNode
}

function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      {children}
    </div>
  )
}

// Simple layout for pages without navigation
function SimpleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <main>
        {children}
      </main>
    </div>
  )
}

// Full layout with navigation
function FullLayout({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar()

  return (
    <div className="relative min-h-screen bg-background">
      <Sidebar />
      <div className={cn(
        "min-h-screen",
        `transition-transform duration-[${TRANSITION_DURATION}ms] ${TRANSITION_TIMING} ease-in-out`,
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

function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAnalysisPage = pathname.startsWith('/analysis/')

  if (isAnalysisPage) {
    return <SimpleLayout>{children}</SimpleLayout>
  }

  return <FullLayout>{children}</FullLayout>
}

export function AuthenticatedLayoutClient({ children }: AuthenticatedLayoutClientProps) {
  const pathname = usePathname()
  const publicPages = ['/', '/sign-in', '/sign-up', '/onboarding']
  const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up'

  // Always render auth pages directly
  if (isAuthPage) {
    return <>{children}</>
  }

  // Public pages always render with base layout
  if (publicPages.includes(pathname)) {
    return <BaseLayout>{children}</BaseLayout>
  }

  // For protected pages, show loading/auth states
  return (
    <>
      <AuthLoading>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AuthLoading>
      <Authenticated>
        <AuthenticatedContent>{children}</AuthenticatedContent>
      </Authenticated>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <p className="text-lg mb-4">Please sign in to continue</p>
          </div>
        </div>
      </Unauthenticated>
    </>
  )
}
