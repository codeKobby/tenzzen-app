"use client";

import * as React from "react"
import { AnalysisHeader } from '../../../components/analysis/header'
import { ResizablePanel } from '../../../components/resizable-panel'
import { AnalysisProvider, useAnalysis } from '../../../hooks/use-analysis-context'
import { VideoContent } from '../../../components/analysis/video-content'
import { MobileSheet } from '../../../components/analysis/mobile-sheet'
import dynamic from "next/dynamic"
import { CoursePanelSkeleton } from '@/components/analysis/course-panel-skeleton'
import { CoursePanelProvider } from '@/components/analysis/course-panel-context'
import { useMediaQuery } from "@/hooks/use-media-query"
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
import { generateCourseFromYoutube } from '../../../actions/generateCourseFromYoutube'
import { useAuth } from '../../../hooks/use-auth'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Id } from '@/convex/_generated/dataModel'
import { toast } from '@/components/custom-toast'

const CoursePanel = dynamic(
  () => import('@/components/analysis/course-panel').then((mod) => mod.CoursePanel),
  {
    ssr: false,
    loading: () => <CoursePanelSkeleton />,
  }
)

// Improve the type guard to be more specific
const isPlaylist = (content: ContentDetails | null): content is PlaylistDetails => {
  return content !== null && content.type === "playlist";
}

// Add a proper type guard for video content
const isVideo = (content: ContentDetails | null): content is VideoDetails => {
  return content !== null && content.type === "video";
}

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
    courseData,
    showCoursePanel,
    setCourseData,
    setShowCoursePanel,
  } = useAnalysis();

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
  const [courseGenerationProgress, setCourseGenerationProgress] = React.useState<{
    step: string;
    progress: number;
    message: string;
  } | null>(null)
  const [isGeneratingCourse, setIsGeneratingCourse] = React.useState(false)
  const [generatedCourseId, setGeneratedCourseId] = React.useState<Id<"courses"> | null>(null)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const isMobile = useMediaQuery("(max-width: 640px)")
  const initialOpenDoneRef = React.useRef(false)
  const initialVideoLoadError = error

  // Only open sheet on first load for mobile
  React.useEffect(() => {
    if (!isMobile && isOpen) {
      toggle(false)
    }
  }, [isMobile, isOpen, toggle])

  React.useEffect(() => {
    if (!isMobile) return;
    if (initialOpenDoneRef.current) return;
    if (!mounted || !hasMounted) return;

    if (isOpen) {
      initialOpenDoneRef.current = true;
      return;
    }

    const timer = setTimeout(() => {
      toggle(true);
      initialOpenDoneRef.current = true;
    }, 300);

    return () => clearTimeout(timer);
  }, [isMobile, isOpen, mounted, hasMounted, toggle]);

  // Regular mounting logic
  React.useEffect(() => {
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
  React.useEffect(() => {
    if (initialContent) {
      setLoading(false);
      setVideoData(initialContent);
    } else if (initialError) {
      setLoading(false);
    }
  }, [initialContent, initialError, setVideoData]);

  const handleGenerateCourse = React.useCallback(async () => {
    // Early validation checks
    if (!videoData) {
      setTranscriptError("No video data available. Please select a video first.");
      return;
    }

    if (!isAuthenticated || !user?.id) {
      setTranscriptError("Please sign in to generate courses");
      return;
    }

    // Additional safety check for video data structure
    if (!videoData.id || !videoData.type) {
      setTranscriptError("Invalid video data. Please try selecting the content again.");
      return;
    }

    setIsGeneratingCourse(true);
    setTranscriptError(null); // Clear any previous errors
    setCourseGenerationProgress({
      step: "Preparing",
      progress: 10,
      message: "Getting ready to analyze your content..."
    });

    try {
      // Step 1: Construct YouTube URL
      const youtubeUrl = videoData.type === "playlist"
        ? `https://www.youtube.com/playlist?list=${videoData.id}`
        : `https://www.youtube.com/watch?v=${videoData.id}`;

      setCourseGenerationProgress({
        step: "Fetching Transcript",
        progress: 20,
        message: "Extracting video transcript..."
      });

      // Step 2: Generate course with AI (this handles transcript fetching internally)
      setCourseGenerationProgress({
        step: "Analyzing Content",
        progress: 40,
        message: "AI is analyzing the content and extracting key concepts..."
      });

      const result = await generateCourseFromYoutube(youtubeUrl, {
        userId: user.id,
        isPublic: false,
      });

      if (!result.success || !result.courseId) {
        throw new Error(result.error || "Failed to generate course");
      }

      setCourseGenerationProgress({
        step: "Generating Structure",
        progress: 70,
        message: "Creating modules and lessons..."
      });

      // Small delay for UX
      await new Promise(r => setTimeout(r, 1000));

      setCourseGenerationProgress({
        step: "Finalizing",
        progress: 90,
        message: "Saving your personalized course..."
      });

      await new Promise(r => setTimeout(r, 500));

      // Step 3: Success! Fetch the generated course data
      setGeneratedCourseId(result.courseId);
      setCourseGenerationProgress({
        step: "Complete",
        progress: 100,
        message: "Your course is ready!"
      });

      // Fetch the course data and show in panel
      setTimeout(async () => {
        if (result.courseId) {
          try {
            const { ConvexHttpClient } = await import('convex/browser');
            const { api } = await import('@/convex/_generated/api');

            // Use the public Convex URL from environment variable
            const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
            if (!convexUrl) {
              throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');
            }

            const convex = new ConvexHttpClient(convexUrl);

            // Fetch the full course with modules and lessons
            const courseWithContent = await convex.query(api.courses.getCourseWithContent, {
              courseId: result.courseId
            });

            if (courseWithContent) {
              // Set course data and show panel
              setCourseData(courseWithContent);
              setShowCoursePanel(true);
            } else {
              console.error('No course content returned from query');
            }
          } catch (error) {
            console.error('Error fetching course data:', error);
            toast.error("Failed to load course", {
              description: "Your course was created but couldn't be loaded. You can find it in your courses page."
            });
          } finally {
            setIsGeneratingCourse(false);
            setCourseGenerationProgress(null);
          }
        }
      }, 1500);

    } catch (error) {
      console.error('Error generating course:', error);
      setTranscriptError(error instanceof Error ? error.message : 'Something went wrong while creating your course. Please try again.');
      setCourseGenerationProgress(null);
      setIsGeneratingCourse(false);
    } finally {
      setCurrentLoadingVideoId(null);
    }
  }, [videoData, isAuthenticated, user, router]);

  // Create formatted video data for transcript display
  const formattedPlaylistVideos = React.useMemo(() => {
    if (!videoData || !isPlaylist(videoData)) return [];

    // Add defensive checks for videos array
    if (!Array.isArray(videoData.videos)) return [];

    return videoData.videos
      .filter((video): video is VideoItem =>
        video != null &&
        typeof video === 'object' &&
        'videoId' in video &&
        'title' in video
      ) // Filter out invalid entries
      .slice(0, 5) // Limit to first 5 videos for performance
      .map((video: VideoItem) => ({
        videoId: video.videoId,
        title: video.title || 'Untitled Video',
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
                <VideoContent loading={loading} error={initialVideoLoadError} />
              </div>
            </ResizablePanel>
          </div>

          {/* Mobile bottom sheet */}
          {isMobile && mounted && hasMounted && (
            <MobileSheet
              isOpen={isOpen}
              onClose={() => toggle(false)}
              loading={loading}
              error={initialVideoLoadError}
            />
          )}

          {/* Main content area with course generation button, transcript display, or course panel */}
          <div className="flex-1 min-w-0">
            {showCoursePanel ? (
              courseData ? (
                <CoursePanelProvider courseData={courseData}>
                  <CoursePanel />
                </CoursePanelProvider>
              ) : (
                <CoursePanelSkeleton className="h-full" />
              )
            ) : (
              <div className="p-6 h-full flex flex-col items-center justify-center">
                {courseGenerationProgress ? (
                  <div className="relative w-full max-w-5xl">
                    <CoursePanelSkeleton
                      showOverlay={false}
                      className="h-full rounded-2xl border shadow-sm"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/80 p-4 backdrop-blur-sm">
                      <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-lg">
                        <div className="mx-auto mb-6 h-16 w-16">
                          <div className="relative h-full w-full">
                            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                            {/* eslint-disable-next-line no-inline-styles */}
                            <div
                              className="absolute inset-0 rounded-full border-4 border-primary transition-all duration-500 ease-out"
                              style={{
                                clipPath: `polygon(0 0, ${courseGenerationProgress.progress}% 0, ${courseGenerationProgress.progress}% 100%, 0 100%)`
                              }}
                            ></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                            </div>
                          </div>
                        </div>

                        <h3 className="text-lg font-semibold mb-2">{courseGenerationProgress.step}</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          {courseGenerationProgress.message}
                        </p>

                        <div className="w-full bg-secondary rounded-full h-2 mb-2">
                          {/* eslint-disable-next-line no-inline-styles */}
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${courseGenerationProgress.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground">{courseGenerationProgress.progress}% complete</p>

                        {courseGenerationProgress.step === "Complete" && generatedCourseId && (
                          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-left dark:border-green-800 dark:bg-green-950">
                            <p className="text-sm font-medium text-green-700 dark:text-green-300">
                              🎉 Course created successfully! Redirecting...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : transcriptError ? (
                  <div className="text-center max-w-md">
                    <div className="p-6 border rounded-lg bg-destructive/10 mb-4">
                      <p className="text-destructive font-medium mb-2">⚠️ Generation Failed</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {transcriptError}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTranscriptError(null);
                        setIsGeneratingCourse(false);
                      }}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : !showingTranscript ? (
                  <div className="text-center max-w-md">
                    <h3 className="text-xl font-semibold mb-2">Ready to generate course?</h3>
                    <p className="text-muted-foreground mb-6">
                      We'll analyze your content and create a personalized learning course just for you.
                    </p>

                    {!isAuthenticated && (
                      <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-amber-700 dark:text-amber-300 text-sm">
                          Please sign in to generate courses
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleGenerateCourse}
                      disabled={!videoData || isGeneratingCourse || !isAuthenticated}
                      size="lg"
                      className="gap-2 px-6 py-6 h-auto text-base font-medium transition-all hover:scale-105 hover:shadow-md"
                    >
                      <Sparkles className="h-5 w-5" />
                      {isGeneratingCourse ? "Generating..." : "Generate Course"}
                    </Button>

                    <p className="text-sm text-muted-foreground mt-6">
                      {!videoData
                        ? "Select content from the left panel to begin"
                        : `Using ${videoData.type === "playlist" ? "playlist" : "video"}: ${videoData.title?.slice(0, 50) || "Unknown"}${videoData.title && videoData.title.length > 50 ? '...' : ''}`
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
                        <p className="text-destructive font-medium mb-2">Oops! Something went wrong</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          We couldn't process your content right now. This might be because the video doesn't have captions available, or there was a temporary issue.
                        </p>
                        <p className="text-xs text-muted-foreground/70 mb-4">
                          Error: {transcriptError}
                        </p>
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
            )}
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
  initialContent: ContentDetails | null;
  initialError: string | null;
}

export function AnalysisClient({ initialContent, initialError }: AnalysisClientProps) {
  // Debug log to see what's being passed in
  React.useEffect(() => {
    console.log("Initial content:", initialContent ? {
      type: initialContent.type,
      id: initialContent.id,
      title: initialContent.title,
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
  );
}