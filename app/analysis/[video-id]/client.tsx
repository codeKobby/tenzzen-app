"use client"

import * as React from "react"
import { AnalysisHeader } from '@/components/analysis/header'
import { ResizablePanel } from '@/components/resizable-panel'
import { AnalysisProvider, useAnalysis } from '@/hooks/use-analysis-context'
import { VideoContent } from '@/components/analysis/video-content'
import { MobileSheet } from '@/components/analysis/mobile-sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { ContentDetails, PlaylistDetails, VideoDetails } from '@/types/youtube'
import { CourseDisplay } from '@/components/analysis/course-display'

// Type guards
const isPlaylist = (content: ContentDetails | null): content is PlaylistDetails => {
  return content !== null && content.type === "playlist";
}

const isVideo = (content: ContentDetails | null): content is VideoDetails => {
  return content !== null && content.type === "video";
}

interface ContentProps {
  initialContent: ContentDetails | null;
  initialError: string | null;
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
  } = useAnalysis()

  const [mounted, setMounted] = React.useState(false)
  const [hasMounted, setHasMounted] = React.useState(false)
  const [loading, setLoading] = React.useState(initialContent === null && !initialError)
  const [error, setError] = React.useState<string | null>(initialError)
  const initialOpenDoneRef = React.useRef(false);

  // Only open sheet on first load
  React.useEffect(() => {
    if (initialOpenDoneRef.current) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    if (isMobile && !isOpen && mounted && hasMounted) {
      const timer = setTimeout(() => {
        toggle(true);
        initialOpenDoneRef.current = true;
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
      if (isVideo(initialContent)) {
        setVideoData(initialContent)
      } else {
        // Handle playlist by taking first video if available
        if (isPlaylist(initialContent) && initialContent.videos?.length > 0) {
          const firstVideo = initialContent.videos[0];
          if (firstVideo && isVideo(firstVideo)) {
            setVideoData(firstVideo);
          }
        }
      }
    } else if (initialError) {
      setLoading(false)
    }
  }, [initialContent, initialError, setVideoData])

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
            <CourseDisplay />
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
  initialContent: ContentDetails | null;
  initialError: string | null;
}

export function AnalysisClient({ initialContent, initialError }: AnalysisClientProps) {
  return (
    <div id="main" className="h-full w-full flex flex-col bg-background">
      <AnalysisProvider initialContent={isVideo(initialContent) ? initialContent : null}>
        <AnalysisHeader />
        <Content initialContent={initialContent} initialError={initialError} />
      </AnalysisProvider>
    </div>
  )
}