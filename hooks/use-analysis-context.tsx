'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  videoData: ContentDetails | null; // Ensure this holds the full data
  transcript: string[];
  courseGenerating: boolean;
  courseData: Course | null;
  courseError: string | null;
  setWidth: (width: number) => void;
  toggle: (open?: boolean) => void;
  setShowAlert: (show: boolean) => void;
  confirmBack: () => void;
  setVideoData: (data: ContentDetails | null) => void; // Ensure setter is included
  setTranscript: (transcript: string[]) => void;
  generateCourse: () => void;
  setCourseGenerating: (generating: boolean) => void;
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

  // --- Update videoData when initialContent changes ---
  useEffect(() => {
    // Only update if initialContent is valid and different from current videoData
    // This prevents resetting videoData if initialContent becomes null during navigation/re-renders
    if (initialContent && initialContent.id !== videoData?.id) {
      console.log("[AnalysisProvider] Setting videoData from initialContent:", initialContent);
      setVideoData(initialContent);
    }
  }, [initialContent, videoData?.id]); // Depend on initialContent and videoData.id
  // --- End Update ---

  // Transcript state
  const [transcript, setTranscript] = useState<string[]>([]);

  // Course generation state - simplified
  const [courseGenerating, setCourseGenerating] = useState(false);
  const [courseData, setCourseData] = useState<Course | null>(null);
  const [courseError, setCourseError] = useState<string | null>(null);

  // --- Add Logging to setCourseData ---
  const updateCourseData = useCallback((data: Course | null) => {
    console.log("[AnalysisProvider] setCourseData called with:", data ? `Data with videoId: ${data.videoId}` : "null"); // Log the data being set
    setCourseData(data);
  }, []);
  // --- End Logging ---

  // Navigation
  const router = useRouter();

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

  // Ultra simplified course generation - just make the API call and set the data
  const generateCourse = useCallback(async () => {
    if (!videoData || !videoData.id) {
      toast.error("Video data is missing", { description: "Cannot generate course without video details." });
      return;
    }

    // Set generating state
    setCourseGenerating(true);
    updateCourseData(null);
    setCourseError(null);

    try {
      // Make the API request - this is the only thing that matters
      const response = await fetch('/api/course-generation/google-adk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId: videoData.id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the response
      const data = await response.json();

      // Add videoId to course data if needed
      const courseData = {
        ...data,
        videoId: videoData.id,
      };

      // Set the course data
      updateCourseData(courseData);

      // Save the course to Supabase
      try {
        // Log the course data structure for debugging
        console.log("[AnalysisProvider] Course data structure:", {
          hasTitle: !!courseData.title,
          hasDescription: !!courseData.description,
          hasVideoId: !!courseData.videoId,
          hasCourseItems: Array.isArray(courseData.courseItems) && courseData.courseItems.length > 0,
          courseItemsCount: Array.isArray(courseData.courseItems) ? courseData.courseItems.length : 0,
          hasMetadata: !!courseData.metadata,
          metadataKeys: courseData.metadata ? Object.keys(courseData.metadata) : []
        });

        console.log("[AnalysisProvider] Saving course to Supabase...");
        const saveResponse = await fetch('/api/supabase/courses/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ courseData }),
        });

        if (!saveResponse.ok) {
          const saveError = await saveResponse.json();
          console.error('[AnalysisProvider] Failed to save course to Supabase:', saveError);

          // Show a toast notification to the user
          toast.error('Course saved locally but not to database', {
            description: 'The course was generated successfully but could not be saved to the database. You can still view and use it in this session.'
          });
        } else {
          const saveResult = await saveResponse.json();
          console.log('[AnalysisProvider] Course saved to Supabase:', saveResult);

          // Show a success toast
          toast.success('Course saved successfully', {
            description: 'The course has been generated and saved to the database.'
          });
        }
      } catch (saveError) {
        console.error('[AnalysisProvider] Error saving to Supabase:', saveError);

        // Show a toast notification to the user
        toast.error('Course saved locally but not to database', {
          description: 'The course was generated successfully but could not be saved to the database. You can still view and use it in this session.'
        });
      }

    } catch (error) {
      console.error('Course generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setCourseError(errorMessage);
      toast.error(`Failed to generate course: ${errorMessage}`);
    } finally {
      // Always set generating to false when done
      setCourseGenerating(false);
    }
  }, [videoData, updateCourseData, setCourseError, setCourseGenerating]);

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      console.log("User requested cancellation.");
      abortControllerRef.current.abort();
      // State updates (like progressMessage) will be handled in the generateCourse catch block
    }
  }, []);

  // Create context value - simplified
  const value = {
    width,
    minWidth,
    maxWidth,
    isOpen,
    showAlert,
    sidebarWidth: width,
    videoData,
    setVideoData,
    transcript,
    courseGenerating,
    courseData,
    courseError,
    setWidth,
    toggle,
    setShowAlert,
    confirmBack,
    setTranscript,
    generateCourse,
    setCourseGenerating,
    setCourseData: updateCourseData,
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