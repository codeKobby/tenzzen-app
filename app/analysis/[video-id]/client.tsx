"use client";

<<<<<<< HEAD
import React, { useEffect, useState, useRef } from "react"; // Explicitly import React
import { CoursePanel } from "@/components/analysis/course-panel";
import { CoursePanelSkeleton } from "@/components/analysis/course-panel-skeleton";
import { VideoContent } from "@/components/analysis/video-content";
import { ResizablePanel } from "@/components/resizable-panel";
import { MobileSheet } from "@/components/analysis/mobile-sheet";
import { AnalysisHeader } from "@/components/analysis/header";
import { AnalysisProvider, useAnalysis } from "@/hooks/use-analysis-context";
import { CoursePanelProvider } from "@/components/analysis/course-panel-context";
=======
import * as React from "react"
import { AnalysisHeader } from '../../../components/analysis/header'
import { ResizablePanel } from '../../../components/resizable-panel'
import { AnalysisProvider, useAnalysis } from '../../../hooks/use-analysis-context'
import { VideoContent } from '../../../components/analysis/video-content'
import { MobileSheet } from '../../../components/analysis/mobile-sheet'
>>>>>>> master
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
<<<<<<< HEAD
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getYoutubeData } from "@/actions/getYoutubeData";
import type { ContentDetails } from "@/types/youtube";
import { GoogleAICourseGenerateButton } from "@/components/google-ai-course-generate-button";
import { XCircle, Loader2 } from "lucide-react"; // Import XCircle
=======
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
>>>>>>> master

interface ContentProps {
  initialContent: ContentDetails | null;
  initialError: string | null;
}

// Define Content component outside AnalysisClient
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
    generateCourse,
    courseGenerating,
    courseData,
    courseError,
    cancelGeneration,
    setCourseGenerating
  } = useAnalysis();

<<<<<<< HEAD
  const [mounted, setMounted] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [loading, setLoading] = useState(initialContent === null && !initialError);
  const [error, setError] = useState<string | null>(initialError);
  const initialOpenDoneRef = useRef(false);
=======
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
>>>>>>> master

  // Only open sheet on first load for mobile
  useEffect(() => {
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
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setHasMounted(true);
    }, 100);
    return () => {
      clearTimeout(timer);
      setMounted(false);
      setHasMounted(false);
    };
  }, []);

  // Set video data when initialContent changes
  useEffect(() => {
    if (initialContent) {
      setLoading(false);
      setVideoData(initialContent);
    } else if (initialError) {
      setLoading(false);
    }
  }, [initialContent, initialError, setVideoData]);

<<<<<<< HEAD
  // Debug log for courseData and courseGenerating
  useEffect(() => {
    console.log("[Content] CRITICAL STATE CHANGE:", {
      hasCourseData: !!courseData,
      courseGenerating,
      courseDataKeys: courseData ? Object.keys(courseData) : [],
      courseError: !!courseError
    });

    // Force re-render if we have course data but still showing generating
    if (courseData && courseGenerating) {
      console.log("[Content] CRITICAL FIX: Force setting courseGenerating to false because we have course data");
      // Use setTimeout to avoid state updates during render phase
      setTimeout(() => {
        setCourseGenerating(false);
      }, 0);
    }

    // Add additional debugging to check if courseData exists but is empty or invalid
    if (courseData) {
      console.log("[Content] DETAILED COURSE DATA CHECK:", {
        hasVideoId: !!courseData.videoId,
        hasTitle: !!courseData.title,
        hasSections: Array.isArray(courseData.sections) && courseData.sections.length > 0,
        courseDataType: typeof courseData,
        isObject: courseData !== null && typeof courseData === 'object'
      });
    }
  }, [courseData, courseGenerating, courseError, setCourseGenerating]);

  // Use initialError passed down for initial video loading error
  const initialVideoLoadError = error; // Rename state variable for clarity
=======
  const handleGenerateCourse = React.useCallback(async () => {
    if (!videoData) return;

    setShowingTranscript(true);
    setTranscriptLoading(true);
    setTranscriptError(null);

    try {
      if (isPlaylist(videoData)) {
        // For playlists, load first few videos' transcripts sequentially
        const videoIds = videoData.videos.slice(0, 5).map(v => v.videoId); // Limit to 5 videos for performance

        // Fix: Use traditional for loop instead of entries() iterator
        for (let index = 0; index < videoIds.length; index++) {
          const videoId = videoIds[index];
          setCurrentLoadingVideoId(videoId);

          try {
            const transcript = await getYoutubeTranscript(videoId);
            setPlaylistTranscripts(prev => ({
              ...prev,
              [videoId]: transcript
            }));
          } catch (error) {
            console.error(`Error fetching transcript for video ${videoId}:`, error);
            // Continue with next video even if one fails
          }

          // Small delay to prevent rate limiting
          if (index < videoIds.length - 1) {
            await new Promise(r => setTimeout(r, 500));
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
>>>>>>> master

  // Create formatted video data for transcript display
  const formattedPlaylistVideos = React.useMemo(() => {
    if (!videoData || !isPlaylist(videoData)) return [];

    return videoData.videos
      .slice(0, 5) // Limit to first 5 videos for performance
      .map((video: VideoItem) => ({
        videoId: video.videoId,
        title: video.title,
        transcript: playlistTranscripts[video.videoId] || null,
        loading: currentLoadingVideoId === video.videoId
      }));
  }, [videoData, playlistTranscripts, currentLoadingVideoId]);

  return (
    <>
      <main className="flex-1 relative overflow-hidden">
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
          {/* Left panel - VideoContent */}
          <div className="hidden sm:block relative border-r bg-background">
            <ResizablePanel
              defaultWidth={width}
              minWidth={minWidth}
              maxWidth={maxWidth}
              onWidthChange={setWidth}
              className="h-full"
            >
              <div className="h-full overflow-auto hover:scrollbar scrollbar-thin">
                {/* Pass loading/error state related to initial video fetch */}
                <VideoContent loading={loading} error={initialVideoLoadError} videoData={videoData} />
              </div>
            </ResizablePanel>
          </div>

          {/* Mobile bottom sheet */}
          {mounted && hasMounted && (
            <MobileSheet
              isOpen={isOpen}
              onClose={() => toggle(false)}
<<<<<<< HEAD
              // Pass loading/error state related to initial video fetch
=======
>>>>>>> master
              loading={loading}
              error={initialVideoLoadError}
            />
          )}

<<<<<<< HEAD
          {/* Right side - Course Panel or Initial Button/State */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {/* State 1: Initial Loading or Error for videoData - REMOVED, now handled by the simplified logic below */}

            {/* State 2: videoData loaded, ready for generation (Show Button) - REMOVED, now handled by the simplified logic below */}

            {/* ULTRA SIMPLIFIED RENDERING LOGIC - ONLY THREE STATES */}
            {courseData ? (
              // Priority 1: Show course panel when we have data from API
              <div className="flex-1 z-10 w-full h-full">
                <CoursePanelProvider courseData={courseData}>
                  <CoursePanel className="w-full h-full" />
                </CoursePanelProvider>
              </div>
            ) : courseGenerating ? (
              // Priority 2: Show skeleton when course is generating
              <div className="flex-1 z-10 w-full h-full">
                <CoursePanelSkeleton className="w-full h-full" />
              </div>
            ) : videoData ? (
              // Priority 3: Show generate button if we have video data but nothing else
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <p className="text-muted-foreground mb-4">Video details loaded. Ready to generate course structure.</p>
                <GoogleAICourseGenerateButton />
              </div>
            ) : loading ? (
              // Priority 4: Show loading state
              <div className="flex-1 flex items-center justify-center p-4 text-center">
                <p className="text-muted-foreground">Loading video details...</p>
              </div>
            ) : initialVideoLoadError ? (
              // Priority 5: Show error state
              <div className="flex-1 flex items-center justify-center p-4 text-center">
                <p className="text-destructive">Error loading video details: {initialVideoLoadError}</p>
              </div>
            ) : (
              // Priority 6: Fallback - should never reach here
              <div className="flex-1 flex items-center justify-center p-4 text-center">
                <p className="text-muted-foreground">Waiting for video data...</p>
              </div>
            )}
=======
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
>>>>>>> master
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
  );
}

interface AnalysisClientProps {
  videoId: string;
}

<<<<<<< HEAD
export function AnalysisClient({ videoId }: AnalysisClientProps) {
  const [initialContent, setInitialContent] = useState<ContentDetails | null>(null);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await getYoutubeData(videoId);

        // Ensure the data has a valid id
        if (data) {
          console.log("[AnalysisClient] Fetched initial video data:", data); // Log fetched data
          const contentWithId = {
            ...data,
            id: videoId || data.id,
          };
          setInitialContent(contentWithId);
        } else {
          setInitialError("Could not load video data");
        }
      } catch (err) {
        setInitialError(err instanceof Error ? err.message : "Failed to load video");
      } finally {
        setIsLoading(false);
      }
    };

    if (videoId) {
      loadData();
    }
  }, [videoId]);

  // Apply overflow hidden to the html and body for this page
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div id="main" className="h-full w-full flex flex-col bg-background overflow-hidden">
=======
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

>>>>>>> master
      <AnalysisProvider initialContent={initialContent}>
        <AnalysisHeader />
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Loading video data...</p>
          </div>
        ) : (
          <Content initialContent={initialContent} initialError={initialError} />
        )}
      </AnalysisProvider>
    </div>
  );
}