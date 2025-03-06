"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useAnalysis } from "@/hooks/use-analysis-context"
import { ResizablePanel } from "@/components/resizable-panel"
import { VideoContent } from "@/components/analysis/video-content"
import { MobileSheet } from "@/components/analysis/mobile-sheet"
import { getVideoDetails, getPlaylistDetails } from "@/app/actions/getYoutubeData"
import { getYoutubeTranscript, type TranscriptSegment } from "@/app/actions/getYoutubeTranscript"
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
import { Loader2, Sparkles, PlayCircle } from "lucide-react"
import { toast } from "sonner"
import { startUrl } from "@/lib/utils"

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
  const [transcript, setTranscript] = React.useState<TranscriptSegment[]>([])
  const [transcriptLoading, setTranscriptLoading] = React.useState(false)
  const [transcriptError, setTranscriptError] = React.useState<string | null>(null)

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

  const handleTranscriptClick = (timestamp: number) => {
    if (!videoData || videoData.type !== 'video') return

    const url = `https://youtube.com/watch?v=${videoData.id}&t=${Math.floor(timestamp)}`
    startUrl(url, '_blank', 'noopener,noreferrer')
  }

  const handleGenerateClick = async () => {
    if (!videoData || videoData.type !== 'video') {
      toast.error("Please select a video first")
      return
    }

    setTranscriptLoading(true)
    setTranscriptError(null)

    try {
      const data = await getYoutubeTranscript(videoData.id)
      setTranscript(data)
      
      toast.success("Transcript generated!", {
        description: "Click on any segment to jump to that point in the video.",
      })
    } catch (err) {
      console.error("Error fetching transcript:", err)
      setTranscriptError(err instanceof Error ? err.message : "Failed to fetch transcript")
      
      let errorMessage = "Failed to generate transcript"
      let description = "Something went wrong"
      
      // Try to extract more meaningful error messages
      if (err instanceof Error) {
        if (err.message.includes("subtitles are disabled")) {
          errorMessage = "Subtitles are disabled for this video"
          description = "The video owner has not enabled subtitles or transcripts"
        } else if (err.message.includes("not available")) {
          errorMessage = "Transcript not available"
          description = "This video does not have an available transcript"
        }
      }
      
      toast.error(errorMessage, { description })
    } finally {
      setTranscriptLoading(false)
    }
  }

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
              {/* Transcript Display */}
              <div className="h-full flex flex-col space-y-4">
                {/* Generate button and header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Transcript
                  </h2>
                  {videoData?.type === 'video' && (
                    <Button 
                      onClick={handleGenerateClick}
                      disabled={transcriptLoading}
                      className="flex items-center gap-2"
                    >
                      {transcriptLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Content area */}
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
                        Select a video from the playlist to view its transcript
                      </p>
                    </div>
                  ) : transcriptLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">
                          Generating transcript...
                        </p>
                      </div>
                    </div>
                  ) : transcriptError ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <p className="text-lg text-destructive text-center">{transcriptError}</p>
                      <Button 
                        variant="outline"
                        onClick={handleGenerateClick}
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Try Again
                      </Button>
                    </div>
                  ) : transcript.length > 0 ? (
                    <div className="p-4 space-y-4">
                      {transcript.map((segment, index) => (
                        <div 
                          key={index} 
                          className="group p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => handleTranscriptClick(segment.timestamp)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm text-muted-foreground">
                              {new Date(segment.timestamp * 1000).toISOString().substr(11, 8)}
                            </div>
                            <PlayCircle className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-base">{segment.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-2">
                        <p className="text-lg text-muted-foreground">
                          No transcript generated yet
                        </p>
                        <p className="text-sm text-muted-foreground/60">
                          Click the generate button to create a transcript
                        </p>
                      </div>
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
