"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useTransition } from "react";
import type { ContentDetails } from "@/types/youtube";
import type { Course } from "@/types/course";
import type { StreamEvent } from "@/lib/ai/types/stream";
import type { VideoInput, PlaylistInput } from "@/lib/ai/types/api";
import { logger } from "@/lib/ai/debug-logger";
import { parseStreamChunk, validateStreamResult, formatErrorMessage } from "@/lib/ai/stream-parser";
import { toast } from "sonner";
import { isProgressEvent, isToolResultEvent, isErrorEvent } from "@/lib/ai/types/stream";

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

export function AnalysisProvider({ children, initialContent = null }: AnalysisProviderProps) {
  const [isPending, startTransition] = useTransition();
  const [videoData, setVideoData] = useState<ContentDetails | null>(initialContent);
  const [courseData, setCourseData] = useState<Course | null>(null);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [courseGenerating, setCourseGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Initializing...");

  // Panel state
  const [width, setWidth] = useState(340);
  const [isOpen, setIsOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const minWidth = 280;
  const maxWidth = 500;

  // Generation control
  const abortControllerRef = useRef<AbortController | null>(null);

  // The toggle function needs to work predictably
  const toggle = useCallback((open?: boolean) => {
    setIsOpen(prev => typeof open !== "undefined" ? open : !prev);
  }, []);

  const confirmBack = useCallback(() => {
    setShowAlert(false);
    window.history.back();
  }, []);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setCourseGenerating(false);
    setGenerationProgress(0);
    setProgressMessage("Generation cancelled");
    setCourseError("Generation cancelled by user");
  }, []);

  const handleStreamEvent = useCallback((part: StreamEvent) => {
    if (isErrorEvent(part) && part.error) {
      throw new Error(part.error);
    }

    if (isProgressEvent(part)) {
      startTransition(() => {
        setGenerationProgress(part.progress || 0);
        setProgressMessage(part.text || "Generating course...");
      });
      return;
    }

    if (isToolResultEvent(part) && part.toolName === "generateCourse" && part.result) {
      const courseData = JSON.parse(part.result);
      startTransition(() => {
        setCourseData(courseData);
      });
      return;
    }

    if (part.type === "finish") {
      startTransition(() => {
        setGenerationProgress(100);
        setProgressMessage("Course generation complete!");
      });
    }
  }, []);

  // Modified generateCourse function to use mock data with simulated loading
  const generateCourse = useCallback(async () => {
    if (!videoData) {
      toast.error("No video data available");
      return;
    }

    if (courseGenerating) {
      console.warn("Course generation already in progress");
      return;
    }

    // Reset state
    startTransition(() => {
      setCourseError(null);
      setCourseGenerating(true);
      setCourseData(null);
      setGenerationProgress(5);
      setProgressMessage("Starting course generation...");
    });

    try {
      // Simulate generation process with intervals
      let progress = 5;
      const interval = setInterval(() => {
        progress += 15;
        startTransition(() => {
          if (progress <= 90) {
            setGenerationProgress(progress);
            setProgressMessage(`Generating course... ${progress}%`);
          } else {
            clearInterval(interval);
          }
        });
      }, 800);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 4000));

      // Import mock data dynamically to simulate final result
      const { mockCourseData } = await import("@/lib/mock/course-data");

      // Final update
      clearInterval(interval);
      startTransition(() => {
        setGenerationProgress(100);
        setProgressMessage("Course generation complete!");
        setCourseData(mockCourseData);
        setCourseGenerating(false);
      });

      toast.success("Course successfully generated!");

    } catch (error) {
      logger.error("state", "Course generation error", error);

      const errorMessage = formatErrorMessage(error);

      startTransition(() => {
        setCourseError(errorMessage);
        setCourseGenerating(false);
      });

      toast.error("Generation failed", {
        description: errorMessage
      });
    }
  }, [videoData]);

  // Safe way to set course data directly if needed
  const setCourseDataSafe = useCallback((data: Course | null) => {
    startTransition(() => {
      setCourseData(data);
      if (data) {
        setGenerationProgress(100);
        setProgressMessage("Course loaded");
      }
    });
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        // Video content state
        videoData,
        setVideoData,

        // Course generation state
        courseData,
        courseError,
        courseGenerating,
        generationProgress,
        progressMessage,
        generateCourse,
        setCourseData: setCourseDataSafe,
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
