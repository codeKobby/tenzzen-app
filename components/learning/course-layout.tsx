"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CourseLayoutProps {
  children: ReactNode
  className?: string
}

export function CourseLayout({ children, className }: CourseLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {children}
    </div>
  )
}

interface CourseLayoutGridProps {
  sidebar?: ReactNode
  videoContent: ReactNode
  rightPanel?: ReactNode
}

export function CourseLayoutGrid({ sidebar, videoContent, rightPanel }: CourseLayoutGridProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Sidebar - Course Navigation */}
      {sidebar && (
        <aside className="hidden lg:flex lg:w-80 lg:flex-col lg:border-r lg:bg-muted/30">
          <div className="flex-1 overflow-y-auto p-4">
            {sidebar}
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Video/Content Section */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto max-w-4xl px-4 py-6 lg:px-8">
            {videoContent}
          </div>
        </div>
      </main>

      {/* Right Panel - Notes/Resources */}
      {rightPanel && (
        <aside className="hidden xl:flex xl:w-80 xl:flex-col xl:border-l xl:bg-muted/30">
          <div className="flex-1 overflow-y-auto p-4">
            {rightPanel}
          </div>
        </aside>
      )}
    </div>
  )
}
