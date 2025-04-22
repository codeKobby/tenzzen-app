'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import type { ContentDetails } from '@/types/youtube';
import type { Course } from '@/types/course'; // Corrected import path
import { toast } from '@/components/custom-toast';

// Define the context shape
interface AnalysisContextType {
  width: number;
  minWidth: number;
  maxWidth: number;
  isOpen: boolean;
  showAlert: boolean;
  sidebarWidth: number;
  videoData: ContentDetails | null;
  transcript: string[];
  courseGenerating: boolean;
  progressMessage: string;
  generationProgress: number;
  courseData: Course | null;
  courseError: string | null;
  setWidth: (width: number) => void;
  toggle: (open?: boolean) => void;
  setShowAlert: (show: boolean) => void;
  confirmBack: () => void;
  setVideoData: (data: ContentDetails | null) => void; // Allow null
  setTranscript: (transcript: string[]) => void;
  generateCourse: () => void;
  setCourseGenerating: (generating: boolean) => void;
  setProgressMessage: (message: string) => void;
  setGenerationProgress: (progress: number) => void;
  setCourseData: (data: Course | null) => void;
  setCourseError: (error: string | null) => void;
  cancelGeneration: () => void;
}

// Create context with default values
const AnalysisContext = createContext<AnalysisContextType>({
  width: 350,
  minWidth: 300,
  maxWidth: 600,
  isOpen: false,
  showAlert: false,
  sidebarWidth: 350,
  videoData: null,
  transcript: [],
  courseGenerating: false,
  progressMessage: '',
  generationProgress: 0,
  courseData: null,
  courseError: null,
  setWidth: () => { },
  toggle: () => { },
  setShowAlert: () => { },
  confirmBack: () => { },
  setVideoData: () => { }, // Default function remains the same
  setTranscript: () => { },
  generateCourse: () => { },
  setCourseGenerating: () => { },
  setProgressMessage: () => { },
  setGenerationProgress: () => { },
  setCourseData: () => { },
  setCourseError: () => { },
  cancelGeneration: () => { },
});

// Provider component
export function AnalysisProvider({
  children,
  initialContent,
}: {
  children: React.ReactNode;
  initialContent?: ContentDetails | null;
}) {
  // Panel width state
  const [width, setWidth] = useState(350);
  const minWidth = 300;
  const maxWidth = 600;

  // Mobile sheet state
  const [isOpen, setIsOpen] = useState(false);

  // Navigation alert state
  const [showAlert, setShowAlert] = useState(false);

  // Video data state
  const [videoData, setVideoData] = useState<ContentDetails | null>(initialContent || null);

  // Transcript state
  const [transcript, setTranscript] = useState<string[]>([]);

  // Course generation state
  const [courseGenerating, setCourseGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [courseData, setCourseData] = useState<Course | null>(null);
  const [courseError, setCourseError] = useState<string | null>(null);

  // Navigation
  const router = useRouter();
  const pathname = usePathname();

  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);


  // Toggle mobile sheet
  const toggle = useCallback((open?: boolean) => {
    setIsOpen(open !== undefined ? open : !isOpen);
  }, [isOpen]);

  // Handle back navigation
  const confirmBack = useCallback(() => {
    setShowAlert(false);
    router.back();
  }, [router]);

  // Generate course using the Google ADK API route with streaming
  const generateCourse = useCallback(async () => {
    if (!videoData || !videoData.id) {
      toast.error("Video data is missing", { description: "Cannot generate course without video details." });
      return;
    }

    // Abort previous request if any
    if (abortControllerRef.current) {
        console.log("Aborting previous generation request...");
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;


    setCourseGenerating(true);
    setCourseData(null);
    setCourseError(null);
    setProgressMessage('Initializing course generation...');
    setGenerationProgress(5); // Small initial progress

    try {
      const response = await fetch('/api/course-generation/google-adk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/x-ndjson', // Expecting newline-delimited JSON stream
        },
        body: JSON.stringify({ videoId: videoData.id }),
        signal: signal, // Pass the abort signal
      });

      if (!response.ok) {
        // Handle non-streaming errors (e.g., 400, 503)
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `Service returned status ${response.status}: ${await response.text()}` };
        }
         throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is null, cannot process stream.");
      }

      // Process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalCourse: Course | null = null;
      let lastErrorMessage: string | null = null;

      while (true) {
         // Check for abort signal before reading next chunk
         if (signal.aborted) {
            console.log("Generation cancelled by user.");
            // Close the reader if possible (depends on browser support)
            if (reader.cancel) {
                await reader.cancel("User cancelled generation");
            }
            throw new Error("Generation cancelled"); // Throw specific error or handle differently
         }

        const { done, value } = await reader.read();
        if (done) {
          console.log("Stream finished.");
          // Process any remaining buffer content if necessary
          if (buffer.trim()) {
             try {
                const update = JSON.parse(buffer.trim());
                 if (update.status === 'completed') {
                    finalCourse = update.data as Course;
                    setProgressMessage(update.message || 'Completed');
                    setGenerationProgress(100);
                 } else if (update.status === 'error') {
                    lastErrorMessage = update.message || 'Unknown error from stream end';
                 }
             } catch (e) {
                console.error("Error parsing final buffer chunk:", e, "Chunk:", buffer);
                lastErrorMessage = "Failed to parse final stream data.";
             }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last potentially incomplete line

        for (const line of lines) {
          if (line.trim() === '') continue;
          try {
            const update = JSON.parse(line);
            console.log("Received stream update:", update); // Log updates for debugging

            // Update progress based on stream events
            if (update.status === 'running' || update.status === 'starting') {
              setProgressMessage(update.message || 'Processing...');
              // Ensure progress doesn't go backwards or over 100
              setGenerationProgress(prev => Math.min(Math.max(prev, update.progress || prev), 99));
            } else if (update.status === 'completed') {
              setProgressMessage(update.message || 'Completed');
              setGenerationProgress(100);
              finalCourse = update.data as Course; // Assume final data is in 'data' field
              console.log("Final course data received from stream.");
              // Don't break here, let the stream finish naturally
            } else if (update.status === 'error') {
               console.error("Error received from stream:", update.message);
               lastErrorMessage = update.message || 'Unknown error from stream';
               setGenerationProgress(0); // Reset progress on error
               setProgressMessage('Generation failed.');
               // Optionally break the loop on error if desired
               // break;
            }
          } catch (e) {
            console.error("Error parsing stream line:", e, "Line:", line);
            // Decide how to handle parsing errors - maybe set a generic error?
            lastErrorMessage = "Failed to parse stream update.";
          }
        } // end for loop over lines
      } // end while loop

      // After stream finishes
      if (finalCourse) {
         // TODO: Add validation here if needed: CourseSchema.parse(finalCourse);
         setCourseData(finalCourse);
         toast.success("Course generated successfully!");
      } else {
         // If stream finished but no final course data was set, it's an error
         throw new Error(lastErrorMessage || "Stream finished without providing course data.");
      }

    } catch (error) {
      // Catch errors from fetch, stream processing, or cancellation
      console.error('Course generation error:', error);
      // Don't show toast/set error if it was a user cancellation
      if ((error as Error).message !== "Generation cancelled") {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          setCourseError(errorMessage);
          toast.error(`Failed to generate course: ${errorMessage}`);
          setGenerationProgress(0); // Reset progress on error
          setProgressMessage('Generation failed.');
      } else {
          // Handle cancellation state if needed (e.g., different message)
          setProgressMessage('Generation cancelled.');
          setGenerationProgress(0);
      }
    } finally {
      setCourseGenerating(false); // Ensure loading state is turned off
      abortControllerRef.current = null; // Clear the ref
    }
  }, [videoData, setCourseData, setCourseError, setCourseGenerating, setProgressMessage, setGenerationProgress, generationProgress]); // Added generationProgress to deps

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      console.log("User requested cancellation.");
      abortControllerRef.current.abort();
      // State updates (like progressMessage) will be handled in the generateCourse catch block
    }
  }, []);

  // Create context value
  const value = {
    width,
    minWidth,
    maxWidth,
    isOpen,
    showAlert,
    sidebarWidth: width,
    videoData,
    transcript,
    courseGenerating,
    progressMessage,
    generationProgress,
    courseData,
    courseError,
    setWidth,
    toggle,
    setShowAlert,
    confirmBack,
    setVideoData,
    setTranscript,
    generateCourse,
    setCourseGenerating,
    setProgressMessage,
    setGenerationProgress,
    setCourseData,
    setCourseError,
    cancelGeneration,
  };

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

// Hook to use the context
export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}
