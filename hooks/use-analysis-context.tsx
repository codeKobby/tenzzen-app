"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import type { ContentDetails } from "@/types/youtube";
import type { CourseGeneratorResult } from "@/tools/courseGenerator";
import { getProgressMessage, PROGRESS_PHASES, ERROR_MESSAGES } from "@/lib/ai/config";
import { validateCourseData, getSummary } from "@/components/analysis/course/validate";
import { parseStreamChunk, validateStreamResult, formatErrorMessage } from "@/lib/ai/stream-parser";
import { toast } from "sonner";

interface AnalysisContextType {
  videoData: ContentDetails | null;
  courseData: CourseGeneratorResult | null;
  courseError: string | null;
  courseGenerating: boolean;
  generationProgress: number;
  progressMessage: string;
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
  const [courseData, setCourseData] = useState<CourseGeneratorResult | null>(null);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [courseGenerating, setCourseGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string>(PROGRESS_PHASES[0].message);
  
  // Layout state
  const [width, setWidth] = useState(340);
  const [isOpen, setIsOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const minWidth = 280;
  const maxWidth = 500;

  // Generation control
  const abortControllerRef = useRef<AbortController | null>(null);

  const toggle = useCallback((open?: boolean) => {
    setIsOpen(prev => typeof open !== 'undefined' ? open : !prev);
  }, []);

  const confirmBack = () => {
    setShowAlert(false);
    window.history.back();
  };

  const updateProgress = useCallback((progress: number) => {
    setGenerationProgress(progress);
    const message = getProgressMessage(progress);
    setProgressMessage(message);
    console.log(`Progress Update: ${progress}%`, { message });
  }, []);

  const cancelGeneration = useCallback(() => {
    console.log('🛑 Cancelling course generation...');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setCourseGenerating(false);
    setGenerationProgress(0);
    setProgressMessage(PROGRESS_PHASES[0].message);
    setCourseError(ERROR_MESSAGES.cancelled);
    toast.error('Generation cancelled');
  }, []);

  const handleCourseData = useCallback((rawData: any) => {
    try {
      const validatedData = validateCourseData(rawData);
      if (!validatedData) {
        throw new Error('Invalid course data received');
      }
      
      const summary = getSummary(validatedData);
      console.log('Course Summary:', summary);
      
      setCourseData(validatedData);
      toast.success('Course generated successfully!', {
        description: `Created ${summary.lessons} lessons with ${summary.resources} resources`
      });

      return validatedData;
    } catch (error) {
      console.error('Failed to validate course data:', error);
      toast.error('Failed to validate course data');
      throw error;
    }
  }, []);

  const handleGeneration = async () => {
    if (!videoData) {
      console.error('No video data available');
      toast.error('No video data available');
      return;
    }

    try {
      // Cancel any existing generation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Reset state
      setCourseError(null);
      setCourseGenerating(true);
      setCourseData(null);
      updateProgress(5);
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      console.log('🚀 Starting course generation...', {
        video: videoData.title
      });

      const response = await fetch('/api/ai/v1/generate/course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        const error = await response.json();
        throw new Error(error.error || ERROR_MESSAGES.unknown);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      updateProgress(10);
      let courseResult: CourseGeneratorResult | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Parse and validate stream events
          const events = parseStreamChunk(value);

          for (const event of events) {
            try {
              const validatedEvent = validateStreamResult(event);

              switch (validatedEvent.type) {
                case 'error':
                  throw new Error(validatedEvent.error);

                case 'tool-result':
                  if (validatedEvent.toolName === 'generateCourse') {
                    courseResult = handleCourseData(validatedEvent.result);
                    updateProgress(80);
                  }
                  break;

                case 'finish':
                  updateProgress(100);
                  break;

                case 'progress':
                  if (validatedEvent.progress) {
                    updateProgress(validatedEvent.progress);
                  }
                  break;
              }
            } catch (e) {
              console.warn('Failed to handle event:', e);
              toast.error('Failed to process stream event');
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (!courseResult) {
        throw new Error(ERROR_MESSAGES.unknown);
      }

      console.log('✅ Course generated successfully');

    } catch (error) {
      console.error('Course generation error:', error);
      
      // Handle user cancellation
      if (error instanceof Error && error.name === 'AbortError') {
        setCourseError(ERROR_MESSAGES.cancelled);
        return;
      }

      // Set user-friendly error message
      const message = formatErrorMessage(error);
      setCourseError(message);
      toast.error('Generation failed', {
        description: message
      });

    } finally {
      abortControllerRef.current = null;
      setCourseGenerating(false);
      setProgressMessage(PROGRESS_PHASES[0].message);
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
        progressMessage,
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
        generateCourse: handleGeneration,
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
