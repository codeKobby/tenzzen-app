'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from '@/components/custom-toast';
import { useAuth } from '@/hooks/use-auth';

// Define the shape of the context
interface CoursePanelContextType {
    handleEnroll: () => Promise<void>;
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
    courseData: any
}) => {
    const router = useRouter();
    const { user } = useAuth();
    const enrollMutation = useMutation(api.courses.enrollUserInCourse);
    const [isEnrolling, setIsEnrolling] = useState(false);

    const handleEnroll = async () => {
        if (!user) {
            toast.error('Authentication required', {
                description: 'Please sign in to enroll in this course.'
            });
            return;
        }

        if (!courseData) {
            toast.error('Invalid course data', {
                description: 'Cannot enroll in this course due to missing data.'
            });
            return;
        }

        try {
            setIsEnrolling(true);
            // Show loading toast
            toast.infoWithAction('Enrolling in course...', {
                description: 'Please wait while we process your enrollment'
            });

            // Call the mutation
            const result = await enrollMutation({
                courseData: {
                    title: courseData.title,
                    description: courseData.description || "",
                    videoId: courseData.videoId,
                    thumbnail: courseData.image,
                    metadata: courseData.metadata,
                    sections: courseData.courseItems || []
                },
                userId: user.id
            });

            // Handle success
            toast.success('Successfully enrolled in course!');
            // Redirect to courses page after enrollment
            router.push('/courses');
        } catch (error) {
            console.error("Error enrolling in course:", error);
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