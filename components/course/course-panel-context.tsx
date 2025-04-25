'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from "@/components/custom-toast";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useAuth } from "@/hooks/use-auth"; // Corrected import path for the custom hook

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
    const enrollMutation = useMutation(api.courses.enrollUserInCourse);
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

            // Prepare the course data for the mutation
            const result = await enrollMutation({
                courseData: {
                    title: courseData.title,
                    description: courseData.description || "",
                    videoId: courseData.videoId,
                    thumbnail: courseData.image,
                    metadata: courseData.metadata,
                    sections: courseData.courseItems || [] // Ensure we're using the right field
                },
                userId: user.id
            });

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