"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { CourseData } from '@/tools/tools';
import { logger } from '@/lib/ai/debug-logger';
import { toast } from 'sonner';
import useSWR from 'swr';

// Define the context structure
interface CourseGenerationContextType {
    // Generation states
    isGenerating: boolean;
    progress: number;
    progressMessage: string;
    generationError: string | null;

    // Course data
    courseData: CourseData | null;

    // Actions
    generateCourse: (videoUrl: string) => Promise<void>;
    cancelGeneration: () => void;
    resetGeneration: () => void;
}

// Create the context with a default value
const CourseGenerationContext = createContext<CourseGenerationContextType | null>(null);

// Provider props
interface CourseGenerationProviderProps {
    children: ReactNode;
}

// Generation progress fetcher with SWR
const fetchGenerationProgress = async (url: string): Promise<any> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch generation progress');
    }
    return response.json();
};

export function CourseGenerationProvider({ children }: CourseGenerationProviderProps) {
    // Generation states
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [courseData, setCourseData] = useState<CourseData | null>(null);
    const [trackingId, setTrackingId] = useState<string | null>(null);

    // Use SWR to poll for progress updates
    const { data, error } = useSWR(
        trackingId ? `/api/course/generate?trackingId=${trackingId}` : null,
        fetchGenerationProgress,
        {
            refreshInterval: isGenerating ? 1000 : 0,
            revalidateOnFocus: isGenerating,
            onSuccess: (data) => {
                // Update progress and message
                setProgress(data.progress);
                setProgressMessage(data.message);

                // Handle completion - Fix: use setTimeout to prevent React update during render
                if (data.progress === 100 && data.result) {
                    setIsGenerating(false);
                    setCourseData(data.result);
                    setTrackingId(null);
                    // Fix: wrap toast in setTimeout to avoid React updates during render
                    setTimeout(() => {
                        toast.success('Course generated successfully');
                    }, 0);
                }

                // Handle errors - Fix: use setTimeout for toast
                if (data.progress === -1) {
                    setIsGenerating(false);
                    setGenerationError(data.error || 'Failed to generate course');
                    setTrackingId(null);
                    // Fix: wrap toast in setTimeout to avoid React updates during render
                    setTimeout(() => {
                        toast.error('Failed to generate course', {
                            description: data.error || 'An unexpected error occurred'
                        });
                    }, 0);
                }
            },
            onError: (err) => {
                setIsGenerating(false);
                setGenerationError(err.message);
                setTrackingId(null);
                // Fix: wrap toast in setTimeout
                setTimeout(() => {
                    toast.error('Error checking generation progress');
                }, 0);
            }
        }
    );

    // Generate course function
    const generateCourse = useCallback(async (videoUrl: string) => {
        try {
            setIsGenerating(true);
            setProgress(0);
            setProgressMessage('Preparing to generate course...');
            setGenerationError(null);
            setCourseData(null);

            logger.info('course-generation', 'Starting course generation', { videoUrl });

            // Call the API to start the generation
            const response = await fetch('/api/course/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ videoUrl })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to start course generation');
            }

            const data = await response.json();
            setTrackingId(data.trackingId);

        } catch (error) {
            setIsGenerating(false);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setGenerationError(errorMessage);
            logger.error('course-generation', 'Failed to start course generation', { error: errorMessage });
            // Fix: wrap toast in setTimeout
            setTimeout(() => {
                toast.error('Failed to start course generation', {
                    description: errorMessage
                });
            }, 0);
        }
    }, []);

    // Cancel generation
    const cancelGeneration = useCallback(() => {
        setIsGenerating(false);
        setTrackingId(null);
        // Fix: wrap toast in setTimeout
        setTimeout(() => {
            toast.info('Course generation cancelled');
        }, 0);
    }, []);

    // Reset generation state
    const resetGeneration = useCallback(() => {
        setIsGenerating(false);
        setProgress(0);
        setProgressMessage('');
        setGenerationError(null);
        setCourseData(null);
        setTrackingId(null);
    }, []);

    // Create context value
    const contextValue: CourseGenerationContextType = {
        isGenerating,
        progress,
        progressMessage,
        generationError,
        courseData,
        generateCourse,
        cancelGeneration,
        resetGeneration
    };

    return (
        <CourseGenerationContext.Provider value={contextValue}>
            {children}
        </CourseGenerationContext.Provider>
    );
}

// Custom hook to use the course generation context
export function useCourseGeneration() {
    const context = useContext(CourseGenerationContext);
    if (!context) {
        throw new Error('useCourseGeneration must be used within a CourseGenerationProvider');
    }
    return context;
}
