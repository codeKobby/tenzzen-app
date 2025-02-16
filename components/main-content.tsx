"use client"

import { cn } from "@/lib/utils"
import { useSidebar } from "@/hooks/use-sidebar"

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <main 
      className={cn(
        "min-h-screen transition-[padding] duration-300 ease-in-out",
        "lg:pt-4", // Add top padding for the toggle button
        isCollapsed ? "lg:pl-16" : "lg:pl-[256px]" // Account for toggle button width
      )}
    >
      <div className="container max-w-6xl p-6">
        {children}
      </div>
    </main>
  )
}
