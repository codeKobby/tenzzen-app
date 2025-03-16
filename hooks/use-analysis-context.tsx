"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();
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
    if (progress > generationProgress) {
      const message = getProgressMessage(progress);
      startTransition(() => {
        setGenerationProgress(progress);
        setProgressMessage(message);
      });
      console.log(`Progress Update: ${progress}%`, { message });
    }
  }, [generationProgress]);

  const cancelGeneration = useCallback(() => {
    console.log('🛑 Cancelling course generation...');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    startTransition(() => {
      setCourseGenerating(false);
      setGenerationProgress(0);
      setProgressMessage(PROGRESS_PHASES[0].message);
      setCourseError(ERROR_MESSAGES.cancelled);
    });

    setTimeout(() => {
      toast.error('Generation cancelled');
    }, 0);
  }, []);

  const handleCourseData = useCallback((rawData: any) => {
    try {
      const validatedData = validateCourseData(rawData);
      if (!validatedData) {
        throw new Error('Invalid course data received');
      }
      
      const summary = getSummary(validatedData);
      console.log('Course Summary:', summary);

      startTransition(() => {
        setCourseData(validatedData);
      });

      setTimeout(() => {
        toast.success('Course generated successfully!', {
          description: `Created ${summary.lessons} lessons with ${summary.resources} resources`
        });
      }, 0);

      return validatedData;
    } catch (error) {
      console.error('Failed to validate course data:', error);
      setTimeout(() => {
        toast.error('Failed to validate course data');
      }, 0);
      throw error;
    }
  }, []);

  const handleGeneration = async () => {
    if (!videoData) {
      console.error('No video data available');
      setTimeout(() => {
        toast.error('No video data available');
      }, 0);
      return;
    }

    // First, ensure we're not already generating
    if (courseGenerating) {
      console.warn('Course generation already in progress');
      return;
    }

    // Reset state before starting
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      // Initialize state
      startTransition(() => {
        setCourseError(null);
        setCourseGenerating(true);
        setCourseData(null);
        setGenerationProgress(5);
        setProgressMessage(PROGRESS_PHASES[0].message);
      });

      // Ensure state updates are applied
      await new Promise(resolve => setTimeout(resolve, 0));
      
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
        const error = await response.json().catch(() => ({ error: ERROR_MESSAGES.unknown }));
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

          const events = parseStreamChunk(value);
          for (const event of events) {
            try {
              const part = validateStreamResult(event);
              switch (part.type) {
                case 'error':
                  throw new Error(part.error);
                
                case 'progress':
                  updateProgress(part.progress);
                  break;

                case 'tool-result':
                  if (part.toolName === 'generateCourse') {
                    courseResult = await handleCourseData(part.result);
                    startTransition(() => {
                      setCourseData(courseResult);
                      setGenerationProgress(80);
                    });
                  }
                  break;

                case 'finish':
                  startTransition(() => {
                    setGenerationProgress(100);
                  });
                  break;
              }
            } catch (streamError) {
              console.warn('Failed to process stream event:', streamError);
              toast.error('Failed to process stream event');
              // Continue processing other events
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
      
      const errorMessage = error instanceof Error && error.name === 'AbortError' 
        ? ERROR_MESSAGES.cancelled 
        : formatErrorMessage(error);

      startTransition(() => {
        setCourseError(errorMessage);
      });

      if (errorMessage !== ERROR_MESSAGES.cancelled) {
        setTimeout(() => {
          toast.error('Generation failed', {
            description: errorMessage
          });
        }, 0);
      }

    } finally {
      abortControllerRef.current = null;
      startTransition(() => {
        setCourseGenerating(false);
        setProgressMessage(PROGRESS_PHASES[0].message);
      });
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
