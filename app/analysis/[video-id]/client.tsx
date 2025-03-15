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
import type { ContentDetails, PlaylistDetails } from "@/types/youtube"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

// Add the isPlaylist helper function
const isPlaylist = (content: ContentDetails): content is PlaylistDetails => {
  return content?.type === "playlist"
}

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
    setVideoData,
    videoData,
    generateCourse
  } = useAnalysis()

  const [mounted, setMounted] = React.useState(false)
  const [hasMounted, setHasMounted] = React.useState(false)
  const [loading, setLoading] = React.useState(initialContent === null && !initialError)
  const [error, setError] = React.useState<string | null>(initialError)

  // Add a ref to track whether we've already opened the sheet
  const initialOpenDoneRef = React.useRef(false);

  // Only open sheet on first load
  React.useEffect(() => {
    if (initialOpenDoneRef.current) {
      // Skip if we've already done the initial open
      return;
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    // Only open on initial mount for mobile
    if (isMobile && !isOpen && mounted && hasMounted) {
      const timer = setTimeout(() => {
        toggle(true); // Open the sheet
        initialOpenDoneRef.current = true; // Mark as done
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isOpen, mounted, hasMounted, toggle]);

  // Regular mounting logic
  React.useEffect(() => {
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
      setLoading(false)
      setVideoData(initialContent)
    } else if (initialError) {
      setLoading(false)
    }
  }, [initialContent, initialError, setVideoData])

  const handleGenerateCourse = React.useCallback(() => {
    if (videoData) {
      generateCourse();
    }
  }, [videoData, generateCourse]);

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
              onClose={() => toggle(false)} // Make sure we're explicitly calling toggle(false)
              loading={loading}
              error={error}
            />
          )}

          {/* Main content area with course generation button */}
          <div className="flex-1 min-w-0">
            <div className="p-6 h-full flex flex-col items-center justify-center">
              <div className="text-center max-w-md">
                <h3 className="text-xl font-semibold mb-2">Ready to create a course?</h3>
                <p className="text-muted-foreground mb-6">
                  Generate a structured learning experience from the selected content.
                </p>

                <Button
                  onClick={handleGenerateCourse}
                  disabled={!videoData}
                  size="lg"
                  className="gap-2 px-6 py-6 h-auto text-base font-medium transition-all hover:scale-105 hover:shadow-md"
                >
                  <Sparkles className="h-5 w-5" />
                  Generate Course
                </Button>

                <p className="text-sm text-muted-foreground mt-6">
                  {!videoData
                    ? "Select content from the left panel to begin"
                    : `Using ${isPlaylist(videoData) ? "playlist" : "video"}: ${videoData.title.slice(0, 50)}${videoData.title.length > 50 ? '...' : ''}`
                  }
                </p>
              </div>
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
    <div id="main" className="h-full w-full flex flex-col bg-background">
      <AnalysisProvider>
        <AnalysisHeader />
        <Content initialContent={initialContent} initialError={initialError} />
      </AnalysisProvider>
    </div>
  )
}
