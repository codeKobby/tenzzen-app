"use client";

import React, { useEffect, useState, useRef } from "react"; // Explicitly import React
import { CoursePanel } from "@/components/analysis/course-panel";
import { VideoContent } from "@/components/analysis/video-content";
import { VideoContentSkeleton } from "@/components/analysis/video-content-skeleton";
import { ResizablePanel } from "@/components/resizable-panel";
import { MobileSheet } from "@/components/analysis/mobile-sheet";
import { AnalysisHeader } from "@/components/analysis/header";
import { AnalysisProvider, useAnalysis } from "@/hooks/use-analysis-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { getYoutubeData } from "@/actions/getYoutubeData";
import type { ContentDetails } from "@/types/youtube";
import { GoogleAICourseGenerateButton } from "@/components/google-ai-course-generate-button";
import { XCircle } from "lucide-react"; // Import XCircle
import { useVideoQuery } from "@/hooks/use-convex"; // Import useVideoQuery to check if course exists
import { toast } from "@/components/custom-toast"; // Import toast from custom-toast

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
    courseGenerating,
    courseData,
    courseError, // Get error state from context
    setCourseData, // Add setCourseData from context
  } = useAnalysis();

  const [mounted, setMounted] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [loading, setLoading] = useState(initialContent === null && !initialError);
  // Use error state without destructuring setError since it's not being used
  const error = useState<string | null>(initialError)[0];
  const initialOpenDoneRef = useRef(false);

  // Check if a course exists for this video
  const existingCourse = useVideoQuery(videoData?.id || '');

  // Type guard for expired video objects
  function isExpiredVideo(video: any): video is { _id: string; expired: true } {
    return video && 'expired' in video && video.expired === true;
  }

  // Type guard for full video documents with details
  function isFullVideoDoc(video: any): video is { details: any; _id: string; _creationTime: number; courseData?: any } {
    return video && 'details' in video;
  }

  // Helper function to check if a video object has valid course data
  function hasValidCourseData(video: any): boolean {
    return video && 'courseData' in video && !!video.courseData;
  }

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

  // Use initialError passed down for initial video loading error
  const initialVideoLoadError = error; // Rename state variable for clarity

  // Check if a course exists in existingCourse and set it if available
  useEffect(() => {
    if (existingCourse && videoData && !courseData && !courseGenerating) {
      // First check if the course is expired using our type guard
      const isExpired = isExpiredVideo(existingCourse);

      // If not expired and has valid course data, use it
      if (!isExpired && isFullVideoDoc(existingCourse) && hasValidCourseData(existingCourse)) {
        console.log("[Content] Found existing course data for video:", videoData.id);
        // Set the course data directly without calling generateCourse
        setCourseData(existingCourse.courseData);
        // Add toast notification with "Okay" button and extended duration
        toast.infoWithAction("Course loaded from database", {
          description: "Using previously generated course data for this video"
        });
      }
    }
  }, [existingCourse, videoData, courseData, courseGenerating, setCourseData]);

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
              // Pass loading/error state related to initial video fetch
              loading={loading}
              error={initialVideoLoadError}
            />
          )}

          {/* Right side - Course Panel or Initial Button/State */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {/* State 1: Initial Loading or Error for videoData */}
            {(loading || initialVideoLoadError) && !videoData && !courseGenerating && !courseData && (
              <div className="flex-1">
                {loading && <VideoContentSkeleton />}
                {initialVideoLoadError && (
                  <div className="flex items-center justify-center p-4 text-center">
                    <p className="text-destructive">Error loading video details: {initialVideoLoadError}</p>
                  </div>
                )}
              </div>
            )}

            {/* State 2: videoData loaded, ready for generation (Show Button) */}
            {videoData && !courseGenerating && !courseData && !courseError && (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <p className="text-muted-foreground mb-4">Video details loaded. Ready to generate course structure.</p>
                <GoogleAICourseGenerateButton />
              </div>
            )}

            {/* State 3: Generation in Progress (Show CoursePanel loading state) */}
            {courseGenerating && (
              <CoursePanel className="flex-1 z-10" />
            )}

            {/* State 4: Generation Failed */}
            {courseError && !courseGenerating && !courseData && (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <XCircle className="h-8 w-8 text-destructive mb-4" />
                <p className="font-medium text-destructive mb-1">Course Generation Failed</p>
                <p className="text-sm text-muted-foreground mb-4">{courseError}</p>
                <GoogleAICourseGenerateButton buttonText="Retry Generation" />
              </div>
            )}

            {/* State 5: Generation Successful (Show CoursePanel with data) */}
            {courseData && !courseGenerating && !courseError && (
              <CoursePanel className="flex-1 z-10" />
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
  videoId: string;
}

export function AnalysisClient({ videoId }: AnalysisClientProps) {
  const [initialContent, setInitialContent] = useState<ContentDetails | null>(null);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Use the query to check if a course exists for this video
  const existingVideo = useVideoQuery(videoId);

  // Type guard for expired video objects
  function isExpiredVideo(video: any): video is { _id: string; expired: true } {
    return video && 'expired' in video && video.expired === true;
  }

  // Helper function to type check if the video has details
  function isFullVideoDoc(video: any): video is { details: any; expired?: boolean } {
    return video && 'details' in video;
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // If we already have cached data in the database, use it directly
        if (existingVideo) {
          // Check if video is not expired using our type guard
          const isExpired = isExpiredVideo(existingVideo);

          // Only use the cached data if it's not expired and has full details
          if (!isExpired && isFullVideoDoc(existingVideo)) {
            console.log("[AnalysisClient] Using cached video data:", existingVideo);

            // Create a ContentDetails object from the database record
            const cachedContent: ContentDetails = {
              id: videoId,
              type: existingVideo.details.type,
              title: existingVideo.details.title || "Untitled Video",
              description: existingVideo.details.description || "",
              duration: existingVideo.details.duration || "",
              thumbnail: existingVideo.details.thumbnail || "",
              channelId: existingVideo.details.channelId || "",
              channelName: existingVideo.details.channelName || "",
              channelAvatar: existingVideo.details.channelAvatar || "",
              views: existingVideo.details.views || "",
              likes: existingVideo.details.likes || "",
              publishDate: existingVideo.details.publishDate || ""
            };

            setInitialContent(cachedContent);
          } else {
            // Video is expired or doesn't have full details, fetch fresh data
            await fetchFreshData();
          }
        } else {
          // No existing video, fetch fresh data
          await fetchFreshData();
        }
      } catch (err) {
        setInitialError(err instanceof Error ? err.message : "Failed to load video");
      } finally {
        setIsLoading(false);
      }
    };

    // Helper function to fetch fresh video data
    async function fetchFreshData() {
      const data = await getYoutubeData(videoId);

      // Ensure the data has a valid id
      if (data) {
        console.log("[AnalysisClient] Fetched initial video data:", data);
        const contentWithId = {
          ...data,
          id: videoId || data.id,
        };
        setInitialContent(contentWithId);
      } else {
        setInitialError("Could not load video data");
      }
    }

    if (videoId) {
      loadData();
    }
  }, [videoId, existingVideo]);

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
      <AnalysisProvider initialContent={initialContent}>
        <AnalysisHeader />
        {isLoading ? (
          <div className="flex-1">
            <VideoContentSkeleton />
          </div>
        ) : (
          <Content initialContent={initialContent} initialError={initialError} />
        )}
      </AnalysisProvider>
    </div>
  );
}
