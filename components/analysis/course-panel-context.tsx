'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { toast } from '@/components/custom-toast';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

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
    const enrollMutation = useMutation(api.enrollments.enrollInCourse);

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
            const targetCourseId = (courseData?._id || courseData?.id || courseData?.courseId) as Id<'courses'> | undefined;
            if (!targetCourseId) {
                console.error('[CoursePanelContext] Missing course identifier in courseData');
                setTimeout(() => {
                    toast.error('Unable to start course', {
                        description: 'Missing course identifier. Please regenerate the course and try again.'
                    });
                }, 0);
                return;
            }

            setIsEnrolling(true);
            console.log('[CoursePanelContext] Enrolling user via Convex mutation', {
                courseId: targetCourseId,
                userId: user.id,
            });

            setTimeout(() => {
                toast.info('Preparing your course...', {
                    description: 'Just a moment while we open your workspace.',
                });
            }, 0);

            await enrollMutation({ userId: user.id, courseId: targetCourseId });

            const targetPath = `/courses/${targetCourseId}`;
            console.log('[CoursePanelContext] Enrollment successful, navigating to', targetPath);

            setTimeout(() => {
                toast.success('Course ready!');
                setTimeout(() => {
                    router.push(targetPath);
                }, 1200);
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
