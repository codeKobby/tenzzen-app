"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAnalysis } from "@/hooks/use-analysis-context"
import { ChevronLeft, SidebarOpen } from "lucide-react"

export function AnalysisHeader() {
  const router = useRouter()
  const { toggle, setShowAlert } = useAnalysis()

  const handleBackClick = () => {
    setShowAlert(true)
  }

  return (
    <header className="h-16 border-b flex items-center px-6 sticky top-0 bg-background z-10">
      <div className="flex items-center gap-4 w-full">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            className="rounded-full"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Link href="/dashboard" className="font-semibold">
            Tenzzen
          </Link>
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div>
            {/* Page title can go here */}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggle()}
              className="sm:hidden rounded-full"
              aria-label="Toggle sidebar"
            >
              <SidebarOpen className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
