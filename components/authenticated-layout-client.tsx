"use client"

import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"
import { TRANSITION_DURATION, TRANSITION_TIMING } from "@/lib/constants"
<<<<<<< HEAD
import { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/hooks/use-auth"
=======
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
>>>>>>> master

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
<<<<<<< HEAD
        `transition-transform duration-[${TRANSITION_DURATION}ms] ${TRANSITION_TIMING} ease-in-out`,
=======
        `transition-transform duration-&lsqb;${TRANSITION_DURATION}ms&rsqb; ${TRANSITION_TIMING} ease-in-out`,
>>>>>>> master
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
<<<<<<< HEAD
  const pathname = usePathname() || ""
=======
  const pathname = usePathname()
>>>>>>> master
  const isAnalysisPage = pathname.startsWith('/analysis/')

  if (isAnalysisPage) {
    return <SimpleLayout>{children}</SimpleLayout>
  }

  return <FullLayout>{children}</FullLayout>
}

<<<<<<< HEAD
// Loading fallback component
function LoadingFallback() {
  return (
    <BaseLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    </BaseLayout>
  )
}

// Authentication check component
function AuthenticatedCheck({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <LoadingFallback />;
  }

  return <>{children}</>;
}

export function AuthenticatedLayoutClient({ children }: AuthenticatedLayoutClientProps) {
  const pathname = usePathname() || ""
  const publicPages = ['/', '/sign-in', '/sign-up', '/onboarding']
  const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up'
  const [mounted, setMounted] = useState(false)

  // Force page content to render after a timeout
  const [forceRender, setForceRender] = useState(false)

  // Ensure proper client-side rendering
  useEffect(() => {
    setMounted(true)

    // Force render after a short timeout to prevent indefinite loading
    const timer = setTimeout(() => {
      setForceRender(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Don't render anything until client-side hydration is complete
  if (!mounted) {
    return <LoadingFallback />
  }

  // Auth pages don't need the layout wrapper
  if (isAuthPage) {
    return <>{children}</>
  }

  // Public pages use the base layout
=======
export function AuthenticatedLayoutClient({ children }: AuthenticatedLayoutClientProps) {
  const pathname = usePathname()
  const publicPages = ['/', '/sign-in', '/sign-up', '/onboarding']
  const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up'

  if (isAuthPage) {
    return children
  }

>>>>>>> master
  if (publicPages.includes(pathname)) {
    return <BaseLayout>{children}</BaseLayout>
  }

<<<<<<< HEAD
  // Use Suspense to handle loading states better
  return (
    <Suspense fallback={<LoadingFallback />}>
      {forceRender ? (
        // Force render after timeout to prevent indefinite loading
        <AuthenticatedContent>{children}</AuthenticatedContent>
      ) : (
        <AuthenticatedCheck>
          <AuthenticatedContent>{children}</AuthenticatedContent>
        </AuthenticatedCheck>
      )}
    </Suspense>
=======
  return (
    <Authenticated>
      <AuthenticatedContent>{children}</AuthenticatedContent>
    </Authenticated>
>>>>>>> master
  )
}
