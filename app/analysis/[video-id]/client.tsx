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
  const [partialCourseData, setPartialCourseData] = React.useState<any>(null)
  const [isStreamingCourse, setIsStreamingCourse] = React.useState(false)
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
      progress: 5,
      message: "Getting ready to analyze your content..."
    });

    try {
      // Construct YouTube URL
      const youtubeUrl = videoData.type === "playlist"
        ? `https://www.youtube.com/playlist?list=${videoData.id}`
        : `https://www.youtube.com/watch?v=${videoData.id}`;

      // Helper: fetch with retries, exponential backoff, and per-attempt timeout
      const fetchWithRetries = async (input: RequestInfo, init: RequestInit, attempts = 3, timeoutMs = 30000) => {
        let lastErr: any = null;
        for (let attempt = 1; attempt <= attempts; attempt++) {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeoutMs);
          try {
            const mergedInit = { ...init, signal: controller.signal } as RequestInit;
            const resp = await fetch(input, mergedInit);
            clearTimeout(id);
            if (!resp.ok) {
              lastErr = new Error(`Server error: ${resp.status}`);
              // For 5xx errors we may retry; for 4xx do not
              if (resp.status >= 500 && attempt < attempts) {
                const backoff = Math.pow(2, attempt) * 250;
                await new Promise((r) => setTimeout(r, backoff));
                continue;
              }
              throw lastErr;
            }
            return resp;
          } catch (e: any) {
            clearTimeout(id);
            lastErr = e;
            // If abort caused by controller, treat as timeout and retry
            const isAbort = e?.name === 'AbortError' || e?.message?.includes('The user aborted a request');
            const shouldRetry = attempt < attempts && (isAbort || /ECONNRESET|ECONNREFUSED|Failed to fetch|network/i.test(String(e)));
            if (shouldRetry) {
              const backoff = Math.pow(2, attempt) * 300;
              console.warn(`Fetch attempt ${attempt} failed, retrying after ${backoff}ms:`, e?.message || e);
              await new Promise((r) => setTimeout(r, backoff));
              continue;
            }
            throw e;
          }
        }
        throw lastErr;
      };

      // Use streaming API for course generation with retries
      const response = await fetchWithRetries('/api/course-generation/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl, isPublic: false }),
      }, 3, 30000);

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6);

                // Check if the JSON string is suspiciously long (possible malformed timestamp issue)
                if (jsonStr.length > 100000) {
                  console.warn(`⚠️ Unusually large JSON payload detected (${jsonStr.length} chars), possible malformed data`);
                }

                const message = JSON.parse(jsonStr);

                if (message.type === 'progress') {
                  setCourseGenerationProgress({
                    step: message.step || "Processing",
                    progress: message.progress || 0,
                    message: message.message || "Processing..."
                  });
                } else if (message.type === 'partial') {
                  setCourseGenerationProgress({
                    step: "Generating",
                    progress: message.progress || 50,
                    message: message.message || "Building course structure..."
                  });

                  if (message.data) {
                    setPartialCourseData(message.data);
                    setIsStreamingCourse(true);
                    setCourseData(message.data);
                    setShowCoursePanel(true);
                  }
                } else if (message.type === 'complete') {
                  setGeneratedCourseId(message.data.courseId);
                  setCourseGenerationProgress({ step: "Complete", progress: 100, message: "Your course is ready!" });

                  setIsStreamingCourse(false);
                  setPartialCourseData(null);

                  setTimeout(async () => {
                    if (message.data.courseId) {
                      try {
                        const { ConvexHttpClient } = await import('convex/browser');
                        const { api } = await import('@/convex/_generated/api');

                        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
                        if (!convexUrl) throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');

                        const convex = new ConvexHttpClient(convexUrl);
                        const courseWithContent = await convex.query(api.courses.getCourseWithContent, { courseId: message.data.courseId });

                        if (courseWithContent) {
                          setCourseData(courseWithContent);
                          setShowCoursePanel(true);
                          toast.success("Course generated successfully!");
                        }
                      } catch (fetchError) {
                        console.error('Error fetching generated course:', fetchError);
                        toast.error("Course generated but failed to load details");
                      }
                    }
                  }, 500);
                } else if (message.type === 'error') {
                  throw new Error(message.error || 'Unknown error occurred');
                }
              } catch (parseError) {
                if (parseError instanceof SyntaxError) {
                  const jsonStr = line.slice(6);
                  console.error('JSON parse error details:', {
                    error: parseError.message,
                    lineLength: jsonStr.length,
                    linePreview: jsonStr.substring(0, 200),
                    position: parseError.message.match(/position (\d+)/)?.[1]
                  });

                  if (jsonStr.length > 50000) {
                    console.error('⚠️ CRITICAL: Detected overly large JSON payload - likely malformed timestamp data');
                    toast.error("AI generated invalid data. Please try again.");
                    setIsGeneratingCourse(false);
                    setCourseGenerationProgress(null);
                    try { reader.cancel(); } catch { };
                    return; // Stop processing this stream
                  }
                } else {
                  console.error('Error parsing stream message:', parseError);
                }
              }
            }
          }
        }
      } catch (streamErr: any) {
        // Handle mid-stream errors (e.g., ECONNRESET)
        console.error('Stream read error:', streamErr);
        if (/ECONNRESET|ECONNREFUSED|socket hang up/i.test(String(streamErr))) {
          toast.error('Connection was reset during generation. Please try again.');
        } else if (streamErr?.name === 'AbortError') {
          toast.error('Request timed out. Please try again.');
        } else {
          toast.error('An error occurred while streaming the course generation.');
        }
        setIsStreamingCourse(false);
        setCourseGenerationProgress(null);
        try { reader.cancel(); } catch { }
      }
    } catch (err: any) {
      console.error("Error generating course:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setTranscriptError(msg);
      if (/ECONNRESET/i.test(msg)) {
        toast.error('Network connection reset. Please retry.');
      } else if (/timed out|AbortError/i.test(msg)) {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error("Failed to generate course");
      }
    } finally {
      setIsGeneratingCourse(false);
    }
  }, [videoData, isAuthenticated, user?.id, setCourseGenerationProgress, setGeneratedCourseId, setCourseData, setShowCoursePanel]);

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
                <CoursePanelProvider courseData={courseData} isStreaming={false}>
                  <CoursePanel />
                </CoursePanelProvider>
              ) : isStreamingCourse && partialCourseData ? (
                <CoursePanelProvider courseData={partialCourseData} isStreaming={true}>
                  <div className="relative h-full">
                    <CoursePanel />
                    {/* Streaming overlay indicator */}
                    <div className="absolute top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 backdrop-blur-sm shadow-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-primary">Building course...</span>
                          {courseGenerationProgress && (
                            <span className="text-[10px] text-primary/70">{courseGenerationProgress.progress}% complete</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CoursePanelProvider>
              ) : (
                <CoursePanelSkeleton className="h-full" />
              )
            ) : (
              <div className="p-6 h-full flex flex-col items-center justify-center">
                {courseGenerationProgress && !showCoursePanel ? (
                  <div className="relative w-full max-w-6xl h-full">
                    {/* Enhanced Progressive Loading UI */}
                    <div className="h-full flex flex-col gap-6 overflow-auto">
                      {/* Header with Progress */}
                      <div className="sticky top-0 z-10 rounded-2xl border bg-card/95 backdrop-blur-sm p-6 shadow-lg">
                        <div className="flex items-start gap-4">
                          {/* Animated Icon */}
                          <div className="relative h-14 w-14 flex-shrink-0">
                            <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                            <div
                              className="absolute inset-0 rounded-full border-4 border-primary transition-all duration-700 ease-out"
                              style={{
                                clipPath: `polygon(0 0, 100% 0, 100% ${courseGenerationProgress.progress}%, 0 ${courseGenerationProgress.progress}%)`
                              }}
                            ></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Sparkles className="h-6 w-6 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                            </div>
                          </div>

                          {/* Progress Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <h3 className="text-xl font-bold truncate">{courseGenerationProgress.step}</h3>
                              <span className="text-2xl font-bold text-primary tabular-nums">
                                {courseGenerationProgress.progress}%
                              </span>
                            </div>
                            <p className="text-muted-foreground text-sm mb-3">
                              {courseGenerationProgress.message}
                            </p>

                            {/* Progress Bar */}
                            <div className="relative w-full bg-secondary rounded-full h-3 overflow-hidden">
                              <div
                                className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${courseGenerationProgress.progress}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                              </div>
                            </div>

                            {/* Stage Indicators */}
                            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                              <div className={`flex items-center gap-1 ${courseGenerationProgress.progress >= 5 ? 'text-primary' : ''}`}>
                                <div className={`w-2 h-2 rounded-full ${courseGenerationProgress.progress >= 5 ? 'bg-primary' : 'bg-muted'}`}></div>
                                <span>Parse</span>
                              </div>
                              <div className="w-8 h-px bg-border"></div>
                              <div className={`flex items-center gap-1 ${courseGenerationProgress.progress >= 40 ? 'text-primary' : ''}`}>
                                <div className={`w-2 h-2 rounded-full ${courseGenerationProgress.progress >= 40 ? 'bg-primary' : 'bg-muted'}`}></div>
                                <span>Analyze</span>
                              </div>
                              <div className="w-8 h-px bg-border"></div>
                              <div className={`flex items-center gap-1 ${courseGenerationProgress.progress >= 70 ? 'text-primary' : ''}`}>
                                <div className={`w-2 h-2 rounded-full ${courseGenerationProgress.progress >= 70 ? 'bg-primary' : 'bg-muted'}`}></div>
                                <span>Structure</span>
                              </div>
                              <div className="w-8 h-px bg-border"></div>
                              <div className={`flex items-center gap-1 ${courseGenerationProgress.progress >= 90 ? 'text-primary' : ''}`}>
                                <div className={`w-2 h-2 rounded-full ${courseGenerationProgress.progress >= 90 ? 'bg-primary' : 'bg-muted'}`}></div>
                                <span>Finalize</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Success Message */}
                        {courseGenerationProgress.step === "Complete" && generatedCourseId && (
                          <div className="mt-4 rounded-lg border border-green-500/50 bg-green-500/10 p-4 animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                                  🎉 Course Generated Successfully!
                                </p>
                                <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-0.5">
                                  Loading your personalized course content...
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progressive Content Preview */}
                      {courseGenerationProgress.progress >= 40 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                          {/* AI Processing Steps */}
                          <div className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm">AI Analysis</h4>
                                <p className="text-xs text-muted-foreground">Content breakdown</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs">
                                <div className={`w-1.5 h-1.5 rounded-full ${courseGenerationProgress.progress >= 40 ? 'bg-green-500 animate-pulse' : 'bg-muted'}`}></div>
                                <span className={courseGenerationProgress.progress >= 40 ? 'text-foreground' : 'text-muted-foreground'}>Transcript processed</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <div className={`w-1.5 h-1.5 rounded-full ${courseGenerationProgress.progress >= 50 ? 'bg-green-500 animate-pulse' : 'bg-muted'}`}></div>
                                <span className={courseGenerationProgress.progress >= 50 ? 'text-foreground' : 'text-muted-foreground'}>Key concepts identified</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <div className={`w-1.5 h-1.5 rounded-full ${courseGenerationProgress.progress >= 60 ? 'bg-green-500 animate-pulse' : 'bg-muted'}`}></div>
                                <span className={courseGenerationProgress.progress >= 60 ? 'text-foreground' : 'text-muted-foreground'}>Learning path mapped</span>
                              </div>
                            </div>
                          </div>

                          {/* Course Structure */}
                          <div className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm">Structure</h4>
                                <p className="text-xs text-muted-foreground">Course organization</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs">
                                <div className={`w-1.5 h-1.5 rounded-full ${courseGenerationProgress.progress >= 60 ? 'bg-green-500 animate-pulse' : 'bg-muted'}`}></div>
                                <span className={courseGenerationProgress.progress >= 60 ? 'text-foreground' : 'text-muted-foreground'}>Modules created</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <div className={`w-1.5 h-1.5 rounded-full ${courseGenerationProgress.progress >= 70 ? 'bg-green-500 animate-pulse' : 'bg-muted'}`}></div>
                                <span className={courseGenerationProgress.progress >= 70 ? 'text-foreground' : 'text-muted-foreground'}>Lessons organized</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <div className={`w-1.5 h-1.5 rounded-full ${courseGenerationProgress.progress >= 80 ? 'bg-green-500 animate-pulse' : 'bg-muted'}`}></div>
                                <span className={courseGenerationProgress.progress >= 80 ? 'text-foreground' : 'text-muted-foreground'}>Objectives defined</span>
                              </div>
                            </div>
                          </div>

                          {/* Content Enhancement */}
                          <div className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm">Enhancement</h4>
                                <p className="text-xs text-muted-foreground">Resources & polish</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs">
                                <div className={`w-1.5 h-1.5 rounded-full ${courseGenerationProgress.progress >= 75 ? 'bg-green-500 animate-pulse' : 'bg-muted'}`}></div>
                                <span className={courseGenerationProgress.progress >= 75 ? 'text-foreground' : 'text-muted-foreground'}>Resources linked</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <div className={`w-1.5 h-1.5 rounded-full ${courseGenerationProgress.progress >= 85 ? 'bg-green-500 animate-pulse' : 'bg-muted'}`}></div>
                                <span className={courseGenerationProgress.progress >= 85 ? 'text-foreground' : 'text-muted-foreground'}>Content polished</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <div className={`w-1.5 h-1.5 rounded-full ${courseGenerationProgress.progress >= 90 ? 'bg-green-500 animate-pulse' : 'bg-muted'}`}></div>
                                <span className={courseGenerationProgress.progress >= 90 ? 'text-foreground' : 'text-muted-foreground'}>Quality validated</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Development Tips */}
                      {courseGenerationProgress.progress >= 20 && courseGenerationProgress.progress < 90 && (
                        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mt-0.5">
                              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-1.5">Development Insight</h4>
                              <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
                                {courseGenerationProgress.progress < 40 && "Our AI is analyzing the video transcript using advanced NLP to extract key concepts, identify learning patterns, and understand the content structure. This ensures high-quality course generation."}
                                {courseGenerationProgress.progress >= 40 && courseGenerationProgress.progress < 70 && "The course structure is being intelligently organized into modules and lessons. We're mapping timestamps, creating learning objectives, and ensuring logical content flow for optimal learning experience."}
                                {courseGenerationProgress.progress >= 70 && "Final touches are being applied: enriching content with external resources, validating lesson coherence, and ensuring all components meet quality standards before delivery."}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
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