"use client";

import { CoursePanel } from "@/components/analysis/course-panel";
import { CourseGeneration } from "@/components/analysis/course-generation";
import { VideoContent } from "@/components/analysis/video-content";
import { ResizablePanel } from "@/components/resizable-panel";
import { MobileSheet } from "@/components/analysis/mobile-sheet";
import { AnalysisHeader } from "@/components/analysis/header";
import { AnalysisProvider, useAnalysis } from "@/hooks/use-analysis-context";
import { CourseGenerationProvider } from "@/hooks/use-course-generation";
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
import { useEffect, useState, useRef } from "react";
import { getYoutubeData } from "@/actions/getYoutubeData";
import type { ContentDetails } from "@/types/youtube";

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

  return (
    <>
      <main className="flex-1 relative overflow-hidden">
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
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

          {/* Right side - Either course panel, generation UI, or generate button */}
          {courseData || courseGenerating ? (
            <CoursePanel className="flex-1 z-10" />
          ) : (
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              <div className="h-full overflow-auto hover:scrollbar scrollbar-thin">
                <CourseGeneration />
              </div>
            </div>
          )}
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

interface ContentProps {
  initialContent: ContentDetails | null;
  initialError: string | null;
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
      <CourseGenerationProvider>
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
      </CourseGenerationProvider>
    </div>
  );
}
