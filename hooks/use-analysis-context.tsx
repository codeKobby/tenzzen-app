"use client"

import React, { createContext, useContext, useState, useRef } from "react"
import type { VideoDetails } from "@/types/youtube"
import type { CourseGenerationResult } from "@/types/ai"
import { GENERATION_PHASES, DEFAULT_PROGRESS_STATE } from "@/lib/ai/config"

interface AnalysisContextType {
  videoData: VideoDetails | null;
  courseData: CourseGenerationResult | null;
  courseError: string | null;
  courseGenerating: boolean;
  generationProgress: number;
  width: number;
  minWidth: number;
  maxWidth: number;
  isOpen: boolean;
  showAlert: boolean;
  toggle: (open?: boolean) => void;
  setShowAlert: (show: boolean) => void;
  confirmBack: () => void;
  setWidth: (width: number) => void;
  setVideoData: (data: VideoDetails | null) => void;
  generateCourse: () => Promise<void>;
  cancelGeneration: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

interface AnalysisProviderProps {
  children: React.ReactNode;
  initialContent?: VideoDetails | null;
}

export function AnalysisProvider({ children, initialContent = null }: AnalysisProviderProps) {
  const [videoData, setVideoData] = useState<VideoDetails | null>(initialContent);
  const [courseData, setCourseData] = useState<CourseGenerationResult | null>(null);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [courseGenerating, setCourseGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // Layout state
  const [width, setWidth] = useState(340);
  const [isOpen, setIsOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const minWidth = 280;
  const maxWidth = 500;

  // Generation control
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const toggle = React.useCallback((open?: boolean) => {
    setIsOpen(prev => typeof open !== 'undefined' ? open : !prev);
  }, []);

  const confirmBack = () => {
    setShowAlert(false);
    window.history.back();
  };

  const resetProgress = () => {
    setGenerationProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setCourseGenerating(false);
    resetProgress();
    setCourseError("Course generation cancelled");
  };

  const simulateProgress = () => {
    resetProgress();
    progressIntervalRef.current = setInterval(() => {
      setGenerationProgress(prev => {
        const nextPhase = GENERATION_PHASES.find(phase => phase.progress > prev);
        if (!nextPhase || prev >= 95) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return prev;
        }
        return prev + 1;
      });
    }, 500);
  };

  const generateCourse = async () => {
    if (!videoData) return;

    try {
      // Cancel any existing generation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Reset state
      setCourseError(null);
      setCourseGenerating(true);
      setCourseData(null);
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      // Start progress simulation
      simulateProgress();
      
      const response = await fetch("/api/ai/v1/generate/course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId: videoData.id,
          videoDetails: {
            title: videoData.title,
            duration: videoData.duration,
            description: videoData.description
          }
        }),
        signal: abortControllerRef.current.signal
      });

      setGenerationProgress(95);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate course");
      }

      const result = await response.json();
      setGenerationProgress(100);
      setCourseData(result.course);

    } catch (error) {
      console.error("Course generation error:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Don't set error for user cancellation
      }
      setCourseError(error instanceof Error ? error.message : "Failed to generate course");
    } finally {
      abortControllerRef.current = null;
      setCourseGenerating(false);
      resetProgress();
    }
  };

  return (
    <AnalysisContext.Provider
      value={{
        videoData,
        courseData,
        courseError,
        courseGenerating,
        generationProgress,
        width,
        minWidth,
        maxWidth,
        isOpen,
        showAlert,
        toggle,
        setShowAlert,
        confirmBack,
        setWidth,
        setVideoData,
        generateCourse,
        cancelGeneration
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
