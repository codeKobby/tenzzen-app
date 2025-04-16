'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import type { ContentDetails } from '@/types/youtube';
import { Course } from '@/tools/googleAiCourseSchema';
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
  setVideoData: (data: ContentDetails) => void;
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
  setVideoData: () => { },
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

  // Toggle mobile sheet
  const toggle = useCallback((open?: boolean) => {
    setIsOpen(open !== undefined ? open : !isOpen);
  }, [isOpen]);

  // Handle back navigation
  const confirmBack = useCallback(() => {
    setShowAlert(false);
    router.back();
  }, [router]);

  // Generate course
  const generateCourse = useCallback(async () => {
    try {
      // Set generating state
      setCourseGenerating(true);
      setProgressMessage('Initializing course generation...');
      setGenerationProgress(5);

      if (!videoData) {
        throw new Error("No video data available");
      }

      // Simulate course generation progress
      const progressSteps = [
        { message: "Analyzing video content...", progress: 10, delay: 1000 },
        { message: "Extracting key topics...", progress: 20, delay: 1000 },
        { message: "Creating course structure...", progress: 40, delay: 1500 },
        { message: "Designing lessons...", progress: 60, delay: 1500 },
        { message: "Adding assessments...", progress: 80, delay: 1000 },
        { message: "Finalizing course content...", progress: 90, delay: 1000 },
      ];

      for (const step of progressSteps) {
        setProgressMessage(step.message);
        setGenerationProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, step.delay));
      }

      // This is a placeholder - in the actual implementation we're using the
      // Google AI to generate the course through our API
      // This manual object creation will be replaced by the API call's response
      const mockCourse: Course = {
        title: videoData.title || "Untitled Course",
        description: videoData.description || "No description available.",
        videoId: videoData.id,
        category: "Programming",
        tags: ["javascript", "web development"],
        difficulty: "Beginner",
        prerequisites: ["Basic understanding of programming concepts"],
        objectives: [
          "Understand key concepts covered in the video",
          "Apply learned techniques in practical scenarios",
          "Build a project using the knowledge gained"
        ],
        overviewText: "This course provides a structured learning experience based on the video content.",
        resources: [
          {
            title: "Official Documentation",
            url: "https://example.com/docs",
            description: "Reference documentation for concepts covered",
            type: "documentation"
          }
        ],
        sections: [
          {
            id: "section1",
            title: "Introduction",
            description: "Overview of the main concepts",
            startTime: 0,
            endTime: 300,
            objective: "Understand the foundations",
            keyPoints: ["Basic concepts", "Core principles"],
            lessons: [
              {
                id: "lesson1",
                title: "Getting Started",
                description: "Introduction to the basics",
                startTime: 0,
                endTime: 120,
                keyPoints: ["Setup environment", "Initial concepts"]
              },
              {
                id: "lesson2",
                title: "Core Principles",
                description: "Understanding fundamental ideas",
                startTime: 121,
                endTime: 300,
                keyPoints: ["Key principle 1", "Key principle 2"]
              }
            ],
            assessment: "test"
          }
        ],
        project: {
          id: "project",
          title: "Capstone Project",
          description: "Apply what you've learned in a practical project",
          Instructions: ["Step 1: Planning", "Step 2: Implementation", "Step 3: Testing"],
          "Evaluation criteria": ["Code quality", "Functionality", "Documentation"],
          "Required deliverables": ["Source code", "Documentation", "Demo video"]
        }
      };

      // Complete generation
      setProgressMessage('Course generation complete!');
      setGenerationProgress(100);

      // Set course data - this will be replaced by actual API response
      setTimeout(() => {
        setCourseData(mockCourse);
        setCourseGenerating(false);
        toast.success("Course generated successfully!");
      }, 500);

    } catch (error) {
      console.error('Course generation error:', error);
      setCourseError(error instanceof Error ? error.message : 'An unknown error occurred');
      setCourseGenerating(false);
      toast.error(`Failed to generate course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [videoData]);

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    setCourseGenerating(false);
    setProgressMessage('');
    setGenerationProgress(0);
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
