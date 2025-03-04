"use client"

import * as React from "react"
import { AnalysisHeader } from "@/components/analysis/header"
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
import type { ContentDetails } from "@/types/youtube"

interface ContentProps {
  initialContent: ContentDetails | null
  initialError: string | null
}

function Content({ initialContent, initialError }: ContentProps) {
  const {
    width,
    minWidth,
    maxWidth,
    isOpen,
    showAlert,
    setWidth,
    toggle,
    setShowAlert,
    confirmBack,
    setVideoData
  } = useAnalysis()

  const [mounted, setMounted] = React.useState(false)
  const [hasMounted, setHasMounted] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(initialError)

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

  React.useEffect(() => {
    if (initialContent) {
      setVideoData(initialContent)
    }
  }, [initialContent, setVideoData])

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
              <div className="h-full overflow-auto hover:scrollbar scrollbar-thin">
                <VideoContent loading={loading} error={error} />
              </div>
            </ResizablePanel>
          </div>

          {/* Mobile bottom sheet */}
          {mounted && hasMounted && (
            <MobileSheet
              isOpen={isOpen}
              onClose={() => toggle(false)}
              loading={loading}
              error={error}
            />
          )}

          {/* Main content area */}
          <div className="flex-1 min-w-0">
            <div className="p-6 h-full overflow-auto hover:scrollbar scrollbar-thin">
              {/* Main content will go here */}
              <div className="h-[200vh]">Analysis content will go here</div>
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

interface AnalysisClientProps {
  initialContent: ContentDetails | null
  initialError: string | null
}

export function AnalysisClient({ initialContent, initialError }: AnalysisClientProps) {
  return (
    <div id="main" className="min-h-screen flex flex-col bg-background overflow-hidden">
      <AnalysisProvider>
        <AnalysisHeader />
        <Content initialContent={initialContent} initialError={initialError} />
      </AnalysisProvider>
    </div>
  )
}