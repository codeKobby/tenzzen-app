"use client"

import React, { createContext, useContext, useState, useRef } from "react"
import type { ContentDetails } from "@/types/youtube"
import type { CourseGenerationResult } from "@/types/ai"
import { GENERATION_PHASES } from "@/lib/ai/config"

interface AnalysisContextType {
  videoData: ContentDetails | null;
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
  setVideoData: (data: ContentDetails | null) => void;
  generateCourse: () => Promise<void>;
  cancelGeneration: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

interface AnalysisProviderProps {
  children: React.ReactNode;
  initialContent?: ContentDetails | null;
}

export function AnalysisProvider({ children, initialContent = null }: AnalysisProviderProps) {
  const [videoData, setVideoData] = useState<ContentDetails | null>(initialContent);
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
    let currentPhase = 0;
    
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
        
        // Move to next phase when reaching current phase's progress
        if (prev >= GENERATION_PHASES[currentPhase].progress) {
          currentPhase++;
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
          id: videoData.id,
          type: videoData.type,
          details: videoData.type === "video" 
            ? {
                title: videoData.title,
                duration: videoData.duration,
                description: videoData.description
              }
            : {
                title: videoData.title,
                description: videoData.description,
                videos: videoData.videos
              }
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate course");
      }

      const result = await response.json();
      setGenerationProgress(100);
      setCourseData(result.course);

    } catch (error) {
      console.error("Course generation error:", error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return; // Don't set error for user cancellation
        }
        // Handle rate limit errors specifically
        if (error.message.includes("Rate limit")) {
          setCourseError("Rate limit reached. Please wait a moment and try again.");
          return;
        }
        setCourseError(error.message);
      } else {
        setCourseError("Failed to generate course");
      }
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
