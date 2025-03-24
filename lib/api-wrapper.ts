/**
 * This is a wrapper around Convex API calls to handle errors gracefully
 * and provide fallbacks to localStorage when Convex is not available
 */

import { api } from "@/convex/_generated/api";
import { getLocalEnrollments, getUserEnrollments as getLocalUserEnrollments, saveEnrollment } from "./local-storage";
import { toast } from "sonner";
import { mockSources } from "@/lib/mock/sources";

// Helper to safely execute Convex mutations with localStorage fallback
export async function safelyEnrollInCourse({ 
  courseData, 
  userId, 
  useConvex = true 
}: { 
  courseData: any; 
  userId: string;
  useConvex?: boolean;
}) {
  try {
    if (!useConvex) {
      throw new Error("Convex is disabled");
    }

    // Try using Convex
    console.log("Trying Convex enrollment...");
    
    // Try to use the Convex API
    const result = await api.courses.enrollUserInCourse({
      courseData,
      userId
    });
    
    return result;
  } catch (error) {
    console.log("Falling back to localStorage for enrollment", error);
    
    // Prepare course data with necessary UI fields
    const enrichedCourseData = {
      ...courseData,
      metadata: {
        ...courseData.metadata,
        sources: courseData.metadata?.sources || mockSources
      }
    };
    
    // Use localStorage fallback
    saveEnrollment({
      userId,
      courseTitle: courseData.title,
      courseData: enrichedCourseData,
      enrolledAt: Date.now(),
      lastAccessedAt: Date.now(),
      progress: 0,
      completedLessons: []
    });
    
    return {
      success: true,
      courseId: `local-${courseData.title.replace(/\s+/g, '-').toLowerCase()}`,
      enrollmentId: `local-enrollment-${Date.now()}`,
      newEnrollment: true,
      usingLocalStorage: true
    };
  }
}

// Helper to safely get user enrollments with localStorage fallback
export async function safelyGetUserEnrollments(userId: string, useConvex = true) {
  try {
    if (!useConvex) {
      throw new Error("Convex is disabled");
    }

    // Try using Convex
    console.log("Trying Convex getUserEnrollments...");
    
    const enrollments = await api.courses.getUserEnrollments({
      userId
    });
    
    return enrollments;
  } catch (error) {
    console.log("Falling back to localStorage for user enrollments", error);
    
    // Use localStorage fallback
    const localEnrollments = getLocalUserEnrollments(userId);
    return localEnrollments;
  }
}
