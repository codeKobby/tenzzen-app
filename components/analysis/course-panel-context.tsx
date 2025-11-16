'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/custom-toast';
import { useAuth } from '@/hooks/use-auth';

// Define the shape of the context
interface CoursePanelContextType {
    handleEnroll: (courseData: any) => Promise<void>;
    handleCancel: () => void;
    isEnrolling: boolean;
}

// Create the context with default values
export const CoursePanelContext = createContext<CoursePanelContextType>({
    handleEnroll: async () => { },
    handleCancel: () => { },
    isEnrolling: false,
});

// Define the provider component
export const CoursePanelProvider = ({
    children,
    courseData,
}: {
    children: React.ReactNode,
    courseData?: any,
}) => {
    const router = useRouter();
    const { user } = useAuth();
    const [isEnrolling, setIsEnrolling] = useState(false);

    const handleEnroll = async (courseData: any) => {
        console.log("[CoursePanelContext] handleEnroll called with courseData:", courseData);

        if (!user) {
            console.log("[CoursePanelContext] No user found, showing authentication required toast");
            // Use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.error('Authentication required', {
                    description: 'Please sign in to enroll in this course.'
                });
            }, 0);
            return;
        }
        console.log("[CoursePanelContext] User authenticated:", user.id);

        if (!courseData) {
            console.log("[CoursePanelContext] No course data provided");
            // Use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.error('Invalid course data', {
                    description: 'Cannot enroll in this course due to missing data.'
                });
            }, 0);
            return;
        }
        console.log("[CoursePanelContext] Course data validated:", {
            title: courseData.title,
            videoId: courseData.videoId
        });

        try {
            setIsEnrolling(true);
            // Show loading toast
            console.log("[CoursePanelContext] Setting isEnrolling to true and showing loading toast");
            // Use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.info('Enrolling in course...', {
                    description: 'Please wait while we process your enrollment'
                });
            }, 0);

            console.log("[CoursePanelContext] Enrolling user in course:", {
                title: courseData.title,
                videoId: courseData.videoId,
                userId: user.id
            });

            // First try to save the course to Supabase
            console.log("[CoursePanelContext] Saving course to Supabase...");
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
                        thumbnail: courseData.image || null,
                        metadata: courseData.metadata || {},
                        courseItems: courseData.courseItems || []
                    }
                }),
            });

            if (!saveResponse.ok) {
                console.error('[CoursePanelContext] Failed to save course to Supabase:', await saveResponse.json());
                throw new Error('Failed to save course to Supabase');
            }

            const saveResult = await saveResponse.json();
            console.log('[CoursePanelContext] Course saved to Supabase:', saveResult);

            // Now enroll the user in the course
            console.log("[CoursePanelContext] Enrolling user in Supabase course:", saveResult.courseId);
            const enrollResponse = await fetch('/api/supabase/courses/enroll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ courseId: saveResult.courseId }),
            });

            if (!enrollResponse.ok) {
                console.error('[CoursePanelContext] Failed to enroll in Supabase course:', await enrollResponse.json());
                throw new Error('Failed to enroll in course');
            }

            const enrollResult = await enrollResponse.json();
            console.log('[CoursePanelContext] Enrolled in Supabase course:', enrollResult);

            // Handle success - use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.success('Successfully enrolled in course!');

                // Add a small delay to ensure the toast is visible before navigation
                console.log("[CoursePanelContext] Setting timeout for navigation");
                setTimeout(() => {
                    // Redirect to courses page after enrollment
                    console.log("[CoursePanelContext] Navigating to courses page");
                    router.push('/courses');
                }, 1500); // 1.5 second delay
            }, 0);
        } catch (error) {
            console.error("[CoursePanelContext] Error enrolling in course:", error);

            // Get a more descriptive error message if available
            let errorMessage = "Please try again later.";
            if (error instanceof Error) {
                errorMessage = error.message || errorMessage;
                console.error("[CoursePanelContext] Error details:", {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
            } else {
                console.error("[CoursePanelContext] Non-Error object thrown:", error);
            }

            // Use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.error("Failed to enroll in course", {
                    description: errorMessage
                });
            }, 0);
        } finally {
            console.log("[CoursePanelContext] Setting isEnrolling back to false");
            setIsEnrolling(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <CoursePanelContext.Provider value={{ handleEnroll, handleCancel, isEnrolling }}>
            {children}
        </CoursePanelContext.Provider>
    );
};

// Optional: Create a hook to use this context
export const useCoursePanelContext = () => {
    const context = useContext(CoursePanelContext);
    if (!context) {
        throw new Error('useCoursePanelContext must be used within a CoursePanelProvider');
    }
    return context;
};
