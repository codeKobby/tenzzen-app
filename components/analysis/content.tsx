"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useAnalysis } from "@/hooks/use-analysis-context"
import { ResizablePanel } from "@/components/resizable-panel"
import { VideoContent } from "@/components/analysis/video-content"
import { MobileSheet } from "@/components/analysis/mobile-sheet"
import { getVideoDetails, getPlaylistDetails } from "@/actions/getYoutubeData"
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
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function AnalysisContent() {
  const params = useParams()
  const videoId = params["video-id"] as string
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
    videoData
  } = useAnalysis()

  const [mounted, setMounted] = React.useState(false)
  const [hasMounted, setHasMounted] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch video/playlist data
  React.useEffect(() => {
    const fetchContent = async () => {
      if (!videoId) {
        setError("No video or playlist ID provided")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Try to fetch as video first, then as playlist if that fails
      try {
        const data = await getVideoDetails(videoId)
        setVideoData(data)
        setLoading(false)
      } catch (videoError) {
        console.log("Video fetch failed, trying as playlist:", videoError)

        try {
          const data = await getPlaylistDetails(videoId)
          setVideoData(data)
          setLoading(false)
        } catch (playlistError) {
          console.error("Error fetching content:", playlistError)
          setError(
            playlistError instanceof Error
              ? playlistError.message
              : "Failed to fetch content details"
          )
          setLoading(false)
        }
      }
    }

    fetchContent()

    return () => {
      setVideoData(null)
    }
  }, [videoId, setVideoData])

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

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden">
      <main className="h-full overflow-hidden">
        <div className="flex h-full overflow-hidden">
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
            />
          )}

          {/* Main content area */}
          <div className="flex-1 min-w-0">
            <div className="h-full p-6">
              <div className="h-full flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Content
                  </h2>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border">
                  {!videoData ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-lg text-muted-foreground">
                        Select content on the left to analyze
                      </p>
                    </div>
                  ) : videoData.type === 'playlist' ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-lg text-muted-foreground">
                        Select a video from the playlist to view its details
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-lg text-muted-foreground">
                        Video details will be displayed here
                      </p>
                    </div>
                  )}
                </div>
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
    </div>
  )
}
