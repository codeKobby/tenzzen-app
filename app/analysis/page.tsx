"use client"

import * as React from "react"
import { AnalysisHeader } from "@/components/analysis/header"
import { cn } from "@/lib/utils"
import { ResizablePanel } from "@/components/resizable-panel"
import { AnalysisProvider, useAnalysis } from "@/hooks/use-analysis-context"
import { VideoContent } from "@/components/analysis/video-content"
import { MobileSheet } from "@/components/analysis/mobile-sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function AnalysisContent() {
  const {
    width,
    minWidth,
    maxWidth,
    isOpen,
    showAlert,
    setWidth,
    toggle,
    setShowAlert,
    confirmBack
  } = useAnalysis()

  const [mounted, setMounted] = React.useState(false)
  const [hasMounted, setHasMounted] = React.useState(false)

  React.useEffect(() => {
    // Two-phase mounting to ensure smoother transitions
    setMounted(true)
    const timer = setTimeout(() => {
      setHasMounted(true)
    }, 100)
    return () => {
      clearTimeout(timer)
      setMounted(false)
      setHasMounted(false)
    }
  }, [])

  return (
    <>
      <main className="flex-1 relative">
        <div className="flex h-[calc(100vh-64px)]">
          {/* Left panel - converts to bottom sheet on small screens */}
          <div className="hidden sm:block relative border-r bg-background">
            <ResizablePanel
              defaultWidth={width}
              minWidth={minWidth}
              maxWidth={maxWidth}
              onWidthChange={setWidth}
              className="h-full"
            >
              <div className="h-full p-6">
                <VideoContent />
              </div>
            </ResizablePanel>
          </div>

          {/* Mobile bottom sheet */}
          {mounted && hasMounted && (
            <MobileSheet
              isOpen={isOpen}
              onClose={() => toggle(false)}
            />
          )}

          {/* Main content area */}
          <div className="flex-1 min-w-0">
            <div className="p-6">
              {/* Main content will go here */}
              <div className="h-[200vh]">Temporary content for scrolling test</div>
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent className="rounded-lg border">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
            <AlertDialogDescription>
              Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBack}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function AnalysisPage() {
  return (
    <AnalysisProvider>
      <div id="main" className="min-h-screen flex flex-col bg-background overflow-hidden">
        <AnalysisHeader />
        <AnalysisContent />
      </div>
    </AnalysisProvider>
  )
}
