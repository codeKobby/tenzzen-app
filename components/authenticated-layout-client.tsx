"use client"

import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"
import { TRANSITION_DURATION, TRANSITION_TIMING } from "@/lib/constants"
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
import { Skeleton } from "@/components/ui/skeleton"

interface AuthenticatedLayoutClientProps {
  children: React.ReactNode
}

// Generic page skeleton for auth loading state
function AuthLoadingSkeleton() {
  return (
    <div className="h-full animate-pulse">
      {/* Header area placeholder */}
      <div className="sticky top-16 z-0 bg-background border-b mb-6">
        <div className="mx-auto px-4 max-w-6xl h-14 flex items-center justify-between gap-4">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-64 rounded-full flex-1 max-w-md" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>

      {/* Main content grid */}
      <div className="mx-auto space-y-6 w-full lg:w-[90%] px-4 sm:px-6 max-w-[1400px]">
        {/* Top title area */}
        <div className="flex items-center justify-between transition-none">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        {/* Content grid skeleton */}
        <div className="grid gap-6 md:grid-cols-3 h-full">
          <div className="space-y-6 md:col-span-2">
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
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
        <FullLayout>
          <AuthLoadingSkeleton />
        </FullLayout>
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
