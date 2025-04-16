'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface CourseGenerationContextType {
  generateCourse: (videoId: string, videoTitle?: string, videoDescription?: string, transcript?: string) => Promise<any>;
  cancelGeneration: () => void;
  isGenerating: boolean;
  progress: number;
  progressMessage: string;
  error: string | null;
}

const CourseGenerationContext = createContext<CourseGenerationContextType | undefined>(undefined);

export function CourseGenerationProvider({ children }: { children: React.ReactNode }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isCancelledRef = React.useRef(false);

  const cancelGeneration = useCallback(() => {
    isCancelledRef.current = true;
    setIsGenerating(false);
    setProgress(0);
    setProgressMessage('');
  }, []);

  const generateCourse = useCallback(async (
    videoId: string,
    videoTitle?: string,
    videoDescription?: string,
    transcript?: string
  ) => {
    try {
      // Reset state
      setError(null);
      setProgress(0);
      setProgressMessage('Starting course generation...');
      setIsGenerating(true);
      isCancelledRef.current = false;

      // Placeholder for future AI implementation
      // This simulates progress for UI testing purposes
      const progressInterval = setInterval(() => {
        if (isCancelledRef.current) {
          clearInterval(progressInterval);
          return;
        }

        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }

          const newProgress = prev + (1 + Math.random() * 3);
          const cappedProgress = Math.min(95, newProgress);

          // Update progress message based on progress
          if (cappedProgress < 20) {
            setProgressMessage('Processing video...');
          } else if (cappedProgress < 40) {
            setProgressMessage('Analyzing content...');
          } else if (cappedProgress < 60) {
            setProgressMessage('Creating outline...');
          } else if (cappedProgress < 80) {
            setProgressMessage('Generating materials...');
          } else {
            setProgressMessage('Finalizing...');
          }

          return cappedProgress;
        });
      }, 1000);

      // Simulate course generation delay
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Clear the progress interval
      clearInterval(progressInterval);

      // Check if operation was cancelled
      if (isCancelledRef.current) {
        return null;
      }

      // TODO: Implement actual course generation here
      const mockResult = {
        success: true,
        data: {
          title: "Sample Course",
          sections: [],
          // Add other course data structure here
        }
      };

      // Complete the progress
      setProgress(100);
      setProgressMessage('Course generated successfully!');

      return mockResult.data;
    } catch (error) {
      if (isCancelledRef.current) {
        return null;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      if (!isCancelledRef.current) {
        setIsGenerating(false);
      }
    }
  }, []);

  return (
    <CourseGenerationContext.Provider
      value={{
        generateCourse,
        cancelGeneration,
        isGenerating,
        progress,
        progressMessage,
        error
      }}
    >
      {children}
    </CourseGenerationContext.Provider>
  );
}

export function useCourseGeneration() {
  const context = useContext(CourseGenerationContext);

  if (context === undefined) {
    throw new Error('useCourseGeneration must be used within a CourseGenerationProvider');
  }

  return context;
}
