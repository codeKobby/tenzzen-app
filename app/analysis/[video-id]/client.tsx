"use client";

import React, { useEffect, useState, useRef } from "react"; // Explicitly import React
import { CoursePanel } from "@/components/analysis/course-panel";
import { VideoContent } from "@/components/analysis/video-content";
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
import { Button } from "@/components/ui/button";
import { getYoutubeData } from "@/actions/getYoutubeData";
import type { ContentDetails } from "@/types/youtube";
import { GoogleAICourseGenerateButton } from "@/components/google-ai-course-generate-button";
import { XCircle } from "lucide-react"; // Import XCircle

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
    courseError, // Get error state from context
  } = useAnalysis();

  const [mounted, setMounted] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [loading, setLoading] = useState(initialContent === null && !initialError);
  const [error, setError] = useState<string | null>(initialError);
  const initialOpenDoneRef = useRef(false);

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
              <div className="flex-1 flex items-center justify-center p-4 text-center">
                {loading && <p className="text-muted-foreground">Loading video details...</p>}
                {initialVideoLoadError && <p className="text-destructive">Error loading video details: {initialVideoLoadError}</p>}
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
