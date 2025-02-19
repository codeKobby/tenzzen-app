"use client"

import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth()

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
    <div className={cn("relative flex min-h-screen bg-background justify-center")}>
      <Sidebar>{children}</Sidebar>
    </div>
  )
}
