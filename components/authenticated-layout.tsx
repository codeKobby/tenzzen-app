"use client"

import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { useAuth } from "@/hooks/use-auth"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth()
  const { isOpen, toggle } = useSidebar()

  // Return children while loading to prevent flash
  if (loading) {
    return <div className="relative min-h-screen bg-background">{children}</div>
  }

  // If not authenticated, just render children
  if (!user) {
    return <div className="relative min-h-screen bg-background">{children}</div>
  }

  // If authenticated and not loading, render with sidebar
  return (
    <div className="h-screen flex flex-col bg-background">
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/10 transition-opacity duration-200 lg:hidden z-40"
          onClick={toggle}
        />
      )}
      <PageHeader />
      <div className="flex-1 flex">
        <Sidebar />
        <main className={cn(
          "flex-1 relative transition-all duration-200 ease-out",
          isOpen ? "lg:ml-[280px]" : "ml-0"
        )}>
          <div className="absolute inset-0 overflow-y-auto">
            <div className="px-8 py-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
