"use client";

import React, { createContext, useContext, useState, useCallback, useTransition } from "react";
import type { ContentDetails } from "@/types/youtube";
import type { Course } from "@/types/course";
import { logger } from "@/lib/ai/debug-logger";
import { formatErrorMessage } from "@/lib/ai/stream-parser";
import { toast } from "sonner";
import { useCourseGeneration } from '@/hooks/use-course-generation';

// Define the StreamEvent type since it appears to be missing from imports
interface StreamEvent {
  type: 'progress' | 'error' | 'tool' | 'finish';
  progress?: number;
  text?: string;
  error?: string;
  toolName?: string;
  result?: string;
}

// Event type checking functions
const isProgressEvent = (event: StreamEvent): boolean => {
  return event.type === 'progress';
};

const isErrorEvent = (event: StreamEvent): boolean => {
  return event.type === 'error';
};

const isToolResultEvent = (event: StreamEvent): boolean => {
  return event.type === 'tool' && event.toolName === 'generateCourse' && !!event.result;
};

interface AnalysisContextType {
  // Video content state
  videoData: ContentDetails | null;
  setVideoData: (data: ContentDetails | null) => void;

  // Course generation state
  courseData: Course | null;
  courseError: string | null;
  courseGenerating: boolean;
  generationProgress: number;
  progressMessage: string;
  generateCourse: () => Promise<void>;
  setCourseData: (data: Course | null) => void;
  cancelGeneration: () => void;

  // Panel state
  width: number;
  minWidth: number;
  maxWidth: number;
  setWidth: (width: number) => void;

  // Navigation state
  isOpen: boolean;
  showAlert: boolean;
  toggle: (open?: boolean) => void;
  setShowAlert: (show: boolean) => void;
  confirmBack: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

interface AnalysisProviderProps {
  children: React.ReactNode;
  initialContent?: ContentDetails | null;
}

interface CourseGenerationProgress {
  step: 'initializing' | 'fetching_transcript' | 'analyzing' | 'generating' | 'structuring' | 'finalizing' | 'completed';
  progress: number; // 0-100
  message: string;
}

export function AnalysisProvider({ children, initialContent = null }: AnalysisProviderProps) {
  const [isPending, startTransition] = useTransition();
  const [videoData, setVideoData] = useState<ContentDetails | null>(initialContent);

  // Panel state
  const [width, setWidth] = useState(340);
  const [isOpen, setIsOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const minWidth = 280;
  const maxWidth = 500;

  // The toggle function needs to work predictably
  const toggle = useCallback((open?: boolean) => {
    setIsOpen(prev => typeof open !== "undefined" ? open : !prev);
  }, []);

  const confirmBack = useCallback(() => {
    setShowAlert(false);
    window.history.back();
  }, []);

  // Use course generation context - with renamed variables to avoid conflicts
  const {
    isGenerating,
    progress,
    progressMessage,
    generationError,
    courseData: generatedCourseData,
    generateCourse: startCourseGeneration,
    cancelGeneration
  } = useCourseGeneration();

  // Generate course from current video
  const generateCourse = useCallback(() => {
    if (!videoData) return;

    // Get the video URL from the current video data
    const videoUrl = `https://youtube.com/watch?v=${videoData.id}`;
    startCourseGeneration(videoUrl);
  }, [videoData, startCourseGeneration]);

  // Update context value to use the variables from useCourseGeneration
  return (
    <AnalysisContext.Provider
      value={{
        // Video content state
        videoData,
        setVideoData,

        // Course generation state - now coming from useCourseGeneration
        courseData: generatedCourseData,
        courseError: generationError,
        courseGenerating: isGenerating,
        generationProgress: progress,
        progressMessage,
        generateCourse,
        // Update to use new method name
        setCourseData: () => { }, // This is now a no-op as course data is managed by useCourseGeneration
        cancelGeneration,

        // Panel state
        width,
        minWidth,
        maxWidth,
        setWidth,

        // Navigation state
        isOpen,
        showAlert,
        toggle,
        setShowAlert,
        confirmBack,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}

// Export the event checker functions for use in other files
export { isProgressEvent, isErrorEvent, isToolResultEvent };
