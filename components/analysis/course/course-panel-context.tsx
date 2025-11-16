'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/custom-toast';
import { useAuth } from '@/hooks/use-auth';

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
    const [isEnrolling, setIsEnrolling] = useState(false);

    const handleEnroll = async (course: any) => {
        console.log("[CoursePanelContext] handleEnroll called with course:", course);

        if (!user) {
            // Use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.error('Authentication required', {
                    description: 'Please sign in to enroll in this course.'
                });
            }, 0);
            return;
        }

        const courseToUse = course || courseData;

        if (!courseToUse) {
            // Use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.error('Invalid course data', {
                    description: 'Cannot enroll in this course due to missing data.'
                });
            }, 0);
            return;
        }

        try {
            setIsEnrolling(true);
            // Show loading toast
            // Use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.info('Enrolling in course...', {
                    description: 'Please wait while we process your enrollment'
                });
            }, 0);

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

                // Save course to public database using Supabase
                const { data: publicCourse, error: saveError } = await supabase
                    .from('courses')
                    .insert({
                        title: courseToUse.title,
                        description: courseToUse.description || "",
                        video_id: courseToUse.videoId,
                        youtube_url: courseToUse.youtubeUrl || "",
                        thumbnail: courseToUse.image,
                        is_public: true,
                        created_by: user.id,
                        status: 'published',
                        difficulty: courseToUse.difficulty || 'beginner',
                        course_items: courseToUse.courseItems || [],
                        transcript: courseToUse.transcript || '',
                        metadata: courseToUse.metadata || {}
                    })
                    .select('id')
                    .single();

                if (saveError) {
                    throw saveError;
                }

                console.log("[CoursePanelContext] Course saved to public database successfully:", publicCourse);

                // Enroll user in the course
                console.log("[CoursePanelContext] Enrolling user in course:", courseToUse.title);

                const { error: enrollError } = await supabase
                    .from('user_courses')
                    .insert({
                        user_id: user.id,
                        course_id: publicCourse.id,
                        status: 'enrolled',
                        progress: 0,
                        enrolled_at: new Date().toISOString()
                    });

                if (enrollError) {
                    throw enrollError;
                }

                console.log("[CoursePanelContext] User enrolled in course successfully");

                // Store the result for logging
                const enrollmentResult = { success: true, courseId: publicCourse.id };
                console.log("[CoursePanelContext] Enrollment successful:", enrollmentResult);
            } catch (error) {
                console.error("[CoursePanelContext] Error saving to database or enrolling:", error);
                throw error; // Re-throw to be caught by the outer try/catch
            }

            // Handle success - use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.success('Successfully enrolled in course!');

                // Add a small delay to ensure the toast is visible before navigation
                setTimeout(() => {
                    // Redirect to courses page after enrollment
                    console.log("[CoursePanelContext] Redirecting to courses page");
                    router.push('/courses');
                }, 1000); // 1 second delay
            }, 0);
        } catch (error) {
            console.error("[CoursePanelContext] Error enrolling in course:", error);
            // Use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.error("Failed to enroll in course", {
                    description: "Please try again later."
                });
            }, 0);
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