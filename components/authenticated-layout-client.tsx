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

function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isOpen } = useSidebar()

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

export function AuthenticatedLayoutClient({ children }: AuthenticatedLayoutClientProps) {
  const pathname = usePathname()

  // Return children without layout for homepage, auth pages, onboarding, and analysis
  if (pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up' || pathname === '/onboarding' || pathname.startsWith('/analysis/')) {
    return <BaseLayout>{children}</BaseLayout>
  }

  return (
    <>
      <AuthLoading>
        <BaseLayout>{children}</BaseLayout>
      </AuthLoading>
      <Unauthenticated>
        <BaseLayout>{children}</BaseLayout>
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedContent>{children}</AuthenticatedContent>
      </Authenticated>
    </>
  )
}
