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
            toast.info('Sign in required', {
                description: 'Please sign in to enroll in this course'
            });
            // Optionally redirect to sign-in page
            return;
        }

        if (!courseData) {
            toast.error('Course data missing', {
                description: 'Cannot enroll in course with missing data'
            });
            return;
        }

        try {
            setIsEnrolling(true);
            toast.info('Enrolling in course...', {
                description: 'Please wait while we process your enrollment'
            });

            // First, save the course to the courses table if it doesn't exist
            const { data: existingCourse, error: checkError } = await supabase
                .from('courses')
                .select('id')
                .eq('video_id', courseData.videoId)
                .single();

            let courseId;

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error('Error checking if course exists:', checkError);
                throw new Error('Failed to check if course exists');
            }

            if (!existingCourse) {
                // Course doesn't exist, create it
                const { data: newCourse, error: insertError } = await supabase
                    .from('courses')
                    .insert({
                        title: courseData.title,
                        description: courseData.description || "",
                        video_id: courseData.videoId,
                        thumbnail: courseData.image || courseData.thumbnail,
                        metadata: courseData.metadata || {},
                        course_items: courseData.courseItems || []
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating course:', insertError);
                    throw new Error('Failed to create course');
                }

                courseId = newCourse.id;
            } else {
                courseId = existingCourse.id;
            }

            // Now enroll the user in the course
            const { error: enrollError } = await supabase
                .from('user_courses')
                .insert({
                    user_id: user.id,
                    course_id: courseId,
                    status: 'in_progress',
                    enrolled_at: new Date().toISOString()
                });

            if (enrollError) {
                console.error('Error enrolling in course:', enrollError);
                throw new Error('Failed to enroll in course');
            }

            toast.success('Successfully enrolled in course!');

            // Redirect to courses page
            router.push('/courses');
        } catch (error) {
            console.error('Error enrolling in course:', error);
            toast.error('Failed to enroll in course', {
                description: 'Please try again later'
            });
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