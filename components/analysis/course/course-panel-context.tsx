'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from '@/components/custom-toast';
import { useAuth } from '@/hooks/use-auth';
import { useSaveGeneratedCourseToPublic } from '@/hooks/use-convex';

// Define the shape of the context
interface CoursePanelContextType {
    handleEnroll: (course: any) => Promise<void>;
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
    courseData
}: {
    children: React.ReactNode,
    courseData?: any
}) => {
    const router = useRouter();
    const { user } = useAuth();
    const enrollMutation = useMutation(api.courses.enrollUserInCourse);
    const saveGeneratedCourseToPublic = useSaveGeneratedCourseToPublic();
    const [isEnrolling, setIsEnrolling] = useState(false);

    const handleEnroll = async (course: any) => {
        console.log("[CoursePanelContext] handleEnroll called with course:", course);

        if (!user) {
            toast.error('Authentication required', {
                description: 'Please sign in to enroll in this course.'
            });
            return;
        }

        const courseToUse = course || courseData;

        if (!courseToUse) {
            toast.error('Invalid course data', {
                description: 'Cannot enroll in this course due to missing data.'
            });
            return;
        }

        try {
            setIsEnrolling(true);
            // Show loading toast
            toast.info('Enrolling in course...', {
                description: 'Please wait while we process your enrollment'
            });

            // First, ensure the course is saved to the public database
            console.log("[CoursePanelContext] Saving course to public database:", courseToUse.title);

            try {
                console.log("[CoursePanelContext] Course data being saved:", {
                    title: courseToUse.title,
                    videoId: courseToUse.videoId,
                    hasCourseItems: Array.isArray(courseToUse.courseItems) && courseToUse.courseItems.length > 0
                });

                // Log the course data structure for debugging
                console.log("[CoursePanelContext] Course data structure for public database:", {
                    hasTitle: !!courseToUse.title,
                    hasDescription: !!courseToUse.description,
                    hasVideoId: !!courseToUse.videoId,
                    hasCourseItems: Array.isArray(courseToUse.courseItems) && courseToUse.courseItems.length > 0,
                    courseItemsCount: Array.isArray(courseToUse.courseItems) ? courseToUse.courseItems.length : 0,
                    hasMetadata: !!courseToUse.metadata
                });

                await saveGeneratedCourseToPublic({
                    courseData: {
                        title: courseToUse.title,
                        description: courseToUse.description || "",
                        videoId: courseToUse.videoId,
                        thumbnail: courseToUse.image,
                        courseItems: courseToUse.courseItems || [],
                        metadata: courseToUse.metadata || {}
                    },
                    userId: user.id
                });
                console.log("[CoursePanelContext] Course saved to public database successfully");
            } catch (saveError) {
                console.error("[CoursePanelContext] Error saving to public database:", saveError);
                // Continue with enrollment even if public save fails
            }

            // Call the enrollment mutation
            console.log("[CoursePanelContext] Enrolling user in course:", courseToUse.title);
            console.log("[CoursePanelContext] Course data for enrollment:", {
                title: courseToUse.title,
                videoId: courseToUse.videoId,
                hasCourseItems: Array.isArray(courseToUse.courseItems) && courseToUse.courseItems.length > 0
            });

            // Log the course data structure for debugging
            console.log("[CoursePanelContext] Course data structure for enrollment:", {
                hasTitle: !!courseToUse.title,
                hasDescription: !!courseToUse.description,
                hasVideoId: !!courseToUse.videoId,
                hasCourseItems: Array.isArray(courseToUse.courseItems) && courseToUse.courseItems.length > 0,
                courseItemsCount: Array.isArray(courseToUse.courseItems) ? courseToUse.courseItems.length : 0,
                hasMetadata: !!courseToUse.metadata
            });

            // Make sure we're using the correct data structure for enrollment
            // The enrollUserInCourse mutation accepts either sections or courseItems
            const result = await enrollMutation({
                courseData: {
                    title: courseToUse.title,
                    description: courseToUse.description || "",
                    videoId: courseToUse.videoId,
                    thumbnail: courseToUse.image,
                    metadata: courseToUse.metadata,
                    // Pass courseItems as both sections and courseItems to ensure compatibility
                    sections: courseToUse.courseItems || [],
                    courseItems: courseToUse.courseItems || []
                },
                userId: user.id
            });

            console.log("[CoursePanelContext] Enrollment successful:", result);

            // Handle success
            toast.success('Successfully enrolled in course!');

            // Redirect to courses page after enrollment
            console.log("[CoursePanelContext] Redirecting to courses page");
            router.push('/courses');
        } catch (error) {
            console.error("[CoursePanelContext] Error enrolling in course:", error);
            toast.error("Failed to enroll in course", {
                description: "Please try again later."
            });
        } finally {
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