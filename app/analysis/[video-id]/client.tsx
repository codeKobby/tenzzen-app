"use client"

import * as React from "react"
import { AnalysisHeader } from '../../../components/analysis/header'
import { ResizablePanel } from '../../../components/resizable-panel'
import { AnalysisProvider, useAnalysis } from '../../../hooks/use-analysis-context'
import { VideoContent } from '../../../components/analysis/video-content'
import { MobileSheet } from '../../../components/analysis/mobile-sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog'
import type { ContentDetails, PlaylistDetails, VideoDetails, VideoItem } from '../../../types/youtube'
import { Sparkles } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { TranscriptDisplay } from '../../../components/analysis/transcript-display'
import { getYoutubeTranscript, TranscriptSegment } from '../../../actions/getYoutubeTranscript'
import { Loader2 } from 'lucide-react'

// Improve the type guard to be more specific
const isPlaylist = (content: ContentDetails | null): content is PlaylistDetails => {
  return content !== null && content.type === "playlist";
}

// Add a proper type guard for video content
const isVideo = (content: ContentDetails | null): content is VideoDetails => {
  return content !== null && content.type === "video";
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
    videoData
  } = useAnalysis()

  const [mounted, setMounted] = React.useState(false)
  const [hasMounted, setHasMounted] = React.useState(false)
  const [loading, setLoading] = React.useState(initialContent === null && !initialError)
  const [error, setError] = React.useState<string | null>(initialError)
  const [showingTranscript, setShowingTranscript] = React.useState(false)
  const [transcriptLoading, setTranscriptLoading] = React.useState(false)
  const [transcriptError, setTranscriptError] = React.useState<string | null>(null)
  const [videoTranscript, setVideoTranscript] = React.useState<TranscriptSegment[]>([])
  const [playlistTranscripts, setPlaylistTranscripts] = React.useState<{
    [videoId: string]: TranscriptSegment[]
  }>({})
  const [currentLoadingVideoId, setCurrentLoadingVideoId] = React.useState<string | null>(null)
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

  const handleGenerateCourse = React.useCallback(async () => {
    if (!videoData) return;

    setShowingTranscript(true);
    setTranscriptLoading(true);
    setTranscriptError(null);

    try {
      if (isPlaylist(videoData)) {
        // Load first video transcript for playlists
        const firstVideo = videoData.videos[0];
        if (firstVideo) {
          setCurrentLoadingVideoId(firstVideo.videoId);
          try {
            const transcript = await getYoutubeTranscript(firstVideo.videoId);
            setPlaylistTranscripts({ [firstVideo.videoId]: transcript });
          } catch (error) {
            console.error(`Error fetching transcript for video ${firstVideo.videoId}:`, error);
          }
        }
      } else {
        // For single video
        const transcript = await getYoutubeTranscript(videoData.id);
        setVideoTranscript(transcript);
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      setTranscriptError(error instanceof Error ? error.message : 'Failed to load transcript');
    } finally {
      setTranscriptLoading(false);
      setCurrentLoadingVideoId(null);
    }
  }, [videoData]);

  // Create formatted video data for transcript display
  const formattedPlaylistVideos = React.useMemo(() => {
    if (!videoData || !isPlaylist(videoData)) return [];

    return videoData.videos
      .map((video: VideoItem) => ({
        videoId: video.videoId,
        title: video.title,
        transcript: playlistTranscripts[video.videoId] || null,
        loading: currentLoadingVideoId === video.videoId
      }));
  }, [videoData, playlistTranscripts, currentLoadingVideoId]);

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

          {/* Main content area with course generation button and transcript display */}
          <div className="flex-1 min-w-0">
            <div className="p-6 h-full flex flex-col items-center justify-center">
              {!showingTranscript ? (
                <div className="text-center max-w-md">
                  <h3 className="text-xl font-semibold mb-2">Ready to analyze content?</h3>
                  <p className="text-muted-foreground mb-6">
                    Generate a transcript and analyze the content structure.
                  </p>

                  <Button
                    onClick={handleGenerateCourse}
                    disabled={!videoData}
                    size="lg"
                    className="gap-2 px-6 py-6 h-auto text-base font-medium transition-all hover:scale-105 hover:shadow-md"
                  >
                    <Sparkles className="h-5 w-5" />
                    Get Transcript
                  </Button>

                  <p className="text-sm text-muted-foreground mt-6">
                    {!videoData
                      ? "Select content from the left panel to begin"
                      : `Using ${isPlaylist(videoData) ? "playlist" : "video"}: ${videoData.title.slice(0, 50)}${videoData.title.length > 50 ? '...' : ''}`
                    }
                  </p>
                </div>
              ) : (
                <div className="w-full h-full overflow-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Transcript</h2>
                    <Button
                      variant="outline"
                      onClick={() => setShowingTranscript(false)}
                      size="sm"
                    >
                      Back
                    </Button>
                  </div>

                  {transcriptLoading && videoData && !isPlaylist(videoData) ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                      <p className="text-muted-foreground">Loading transcript...</p>
                    </div>
                  ) : transcriptError ? (
                    <div className="p-6 border rounded-lg bg-destructive/10 text-center">
                      <p className="text-destructive font-medium mb-2">Failed to load transcript</p>
                      <p className="text-sm text-muted-foreground">{transcriptError}</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={handleGenerateCourse}
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : videoData && (
                    <div className="border rounded-lg p-4 bg-card">
                      <TranscriptDisplay
                        videoId={isPlaylist(videoData) ? undefined : videoData.id}
                        title={isPlaylist(videoData) ? undefined : videoData.title}
                        transcript={isPlaylist(videoData) ? undefined : videoTranscript}
                        isPlaylist={isPlaylist(videoData)}
                        videos={isPlaylist(videoData) ? formattedPlaylistVideos : []}
                        loading={transcriptLoading}
                      />
                    </div>
                  )}
                </div>
              )}
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
  // Debug log to see what's being passed in
  React.useEffect(() => {
    console.log("Initial content:", initialContent ? {
      type: initialContent.type,
      id: initialContent.id,
      title: initialContent.title,
      videoCount: initialContent.type === 'playlist' ? initialContent.videoCount : 'N/A',
      videosLength: initialContent.type === 'playlist' ? initialContent.videos?.length : 'N/A'
    } : null);
    console.log("Initial error:", initialError);
  }, [initialContent, initialError]);

  return (
    <div id="main" className="h-full w-full flex flex-col bg-background">
      {/* Remove the standalone Toaster - we're using the global one from providers.tsx */}

      <AnalysisProvider initialContent={initialContent}>
        <AnalysisHeader />
        <Content initialContent={initialContent} initialError={initialError} />
      </AnalysisProvider>
    </div>
  )
}