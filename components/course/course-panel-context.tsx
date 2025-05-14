'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from "@/components/custom-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSupabase } from "@/contexts/supabase-context";

interface CoursePanelContextType {
    enrollUserInCourse: (courseData: any) => Promise<void>;
    cancelGeneration: () => void; // For cancelling the generation process
    handleCancel: () => void; // Add the missing definition for general cancel/back
    isEnrolling: boolean;
}

// Export the context object directly
export const CoursePanelContext = createContext<CoursePanelContextType | undefined>(undefined);

export function CoursePanelProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user } = useAuth();
    const supabase = useSupabase();
    const [isEnrolling, setIsEnrolling] = useState(false);

    // Enroll user in a course
    const enrollUserInCourse = async (courseData: any) => {
        if (!user) {
            // Use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.info('Sign in required', {
                    description: 'Please sign in to enroll in this course'
                });
            }, 0);
            // Optionally redirect to sign-in page
            return;
        }

        if (!courseData) {
            // Use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.error('Course data missing', {
                    description: 'Cannot enroll in course with missing data'
                });
            }, 0);
            return;
        }

        try {
            setIsEnrolling(true);
            console.log("[CoursePanelContext] Enrolling in course...");

            // Use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.info('Enrolling in course...', {
                    description: 'Please wait while we process your enrollment'
                });
            }, 0);

            console.log("[CoursePanelContext] Saving course to Supabase...");
            // First, save the course to Supabase using the API route
            const saveResponse = await fetch('/api/supabase/courses/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    courseData: {
                        title: courseData.title,
                        description: courseData.description || "",
                        videoId: courseData.videoId,
                        thumbnail: courseData.image || courseData.thumbnail || null,
                        metadata: courseData.metadata || {},
                        courseItems: courseData.courseItems || []
                    }
                }),
            });

            if (!saveResponse.ok) {
                const errorData = await saveResponse.json();
                console.error('[CoursePanelContext] Failed to save course to Supabase:', errorData);
                throw new Error(errorData.error || 'Failed to save course');
            }

            const saveResult = await saveResponse.json();
            console.log('[CoursePanelContext] Course saved to Supabase:', saveResult);

            // Now enroll the user in the course using the API route
            console.log("[CoursePanelContext] Enrolling user in Supabase course:", saveResult.courseId);
            const enrollResponse = await fetch('/api/supabase/courses/enroll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ courseId: saveResult.courseId }),
            });

            if (!enrollResponse.ok) {
                const errorData = await enrollResponse.json();
                console.error('[CoursePanelContext] Failed to enroll in Supabase course:', errorData);
                throw new Error(errorData.error || 'Failed to enroll in course');
            }

            const enrollResult = await enrollResponse.json();
            console.log('[CoursePanelContext] Enrolled in Supabase course:', enrollResult);

            // Use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.success('Successfully enrolled in course!');
            }, 0);

            // Add a small delay to ensure the toast is visible before navigation
            setTimeout(() => {
                // Redirect to courses page after enrollment
                console.log("[CoursePanelContext] Navigating to courses page");
                router.push('/courses');
            }, 1000); // 1 second delay
        } catch (error) {
            console.error('Error enrolling in course:', error);
            // Use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.error('Failed to enroll in course', {
                    description: 'Please try again later'
                });
            }, 0);
        } finally {
            setIsEnrolling(false);
        }
    };

    // Function specifically for cancelling generation (might involve API calls later)
    const cancelGenerationProvider = () => {
        console.log("Generation cancellation logic from provider");
        router.back(); // Simple back navigation for now
    };

    // Function for general cancel/back action
    const handleCancelProvider = () => {
        router.back();
    };

    return (
        <CoursePanelContext.Provider
            value={{
                enrollUserInCourse,
                cancelGeneration: cancelGenerationProvider, // Provide the generation cancel function
                handleCancel: handleCancelProvider, // Provide the general cancel function
                isEnrolling
            }}
        >
            {children}
        </CoursePanelContext.Provider>
    );
}

export function useCoursePanelContext() {
    const context = useContext(CoursePanelContext);
    if (context === undefined) {
        throw new Error('useCoursePanelContext must be used within a CoursePanelProvider');
    }
    return context;
}