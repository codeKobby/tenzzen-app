import { ScrollArea } from "@/components/ui/scroll-area"
import { Sidebar } from "@/components/sidebar"
import type { ReactNode } from "react"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar className="hidden lg:block" />
      <ScrollArea className="flex-1">
        <main className="h-full">
          {children}
        </main>
      </ScrollArea>
    </div>
  )
}