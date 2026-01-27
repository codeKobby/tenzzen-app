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
// Generic page skeleton for auth loading state
function AuthLoadingSkeleton() {
  const pathname = usePathname()
  const isDashboard = pathname === "/dashboard"
  const isExplore = pathname?.startsWith("/explore")
  const isCourses = pathname?.startsWith("/courses")
  const isProjects = pathname?.startsWith("/projects")

  if (isDashboard) {
    return (
      <div className="mx-auto space-y-6 pt-6 w-full lg:w-[90%] px-4 sm:px-6 max-w-[1400px] animate-pulse">
        {/* Header area placeholder - matched to DashboardHero */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-4 sm:p-6 shadow-sm h-64">
          <Skeleton className="h-10 w-64 bg-primary/20" />
          <div className="mt-8 flex gap-4">
            <Skeleton className="h-10 flex-1 rounded-md bg-white/20" />
            <Skeleton className="h-10 flex-1 rounded-md bg-white/20" />
          </div>
        </div>

        {/* Main content grid */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // Skeleton for grid-based pages (Explore, Courses, Projects)
  if (isExplore || isCourses || isProjects) {
    return (
      <div className="h-full animate-pulse">
        {/* Sticky Header Skeleton Area */}
        <div className="sticky top-16 z-0 bg-background border-b mb-6">
          <div className="mx-auto px-4 w-[95%] lg:w-[90%] h-14 flex items-center justify-between gap-4">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-full rounded-full flex-1 max-w-[620px]" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="mx-auto space-y-8 pt-4 pb-12 w-[95%] lg:w-[90%]">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Very generic fallback
  return (
    <div className="mx-auto space-y-6 pt-6 w-full lg:w-[90%] px-4 sm:px-6 max-w-[1400px] animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-xl" />
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
