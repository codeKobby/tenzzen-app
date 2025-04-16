/**
 * This is a wrapper around Convex API calls to handle errors gracefully
 * and provide fallbacks to localStorage when Convex is not available
 */

import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { getLocalEnrollments, getUserEnrollments as getLocalUserEnrollments, saveEnrollment } from "./local-storage";
import { toast } from "sonner";
import { mockSources } from "@/lib/mock/sources";

/**
 * Safely enrolls a user in a course, with fallback to localStorage
 * @param param0 Course data, user ID, and options
 * @returns Enrollment result with status information
 */
export async function safelyEnrollInCourse({
  courseData,
  userId,
  useConvex = true
}: {
  courseData: any;
  userId: string;
  useConvex?: boolean;
}): Promise<{ success: boolean; courseId?: string; newEnrollment?: boolean }> {
  try {
    // If using Convex and we have a valid URL
    if (useConvex && process.env.NEXT_PUBLIC_CONVEX_URL) {
      const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

      // Check if course already exists for this video
      const existingCourses = await convexClient.query(api.courses.getByVideoId, { 
        videoId: courseData.videoId,
        userId 
      });

      // If course exists, restore access
      if (existingCourses && existingCourses.length > 0) {
        // Update existing course with latest data
        const courseId = existingCourses[0]._id;
        await convexClient.mutation(api.courses.updateCourseContent, {
          courseId,
          content: courseData
        });

        return { 
          success: true,
          courseId, 
          newEnrollment: false
        };
      }

      // Create new course and enrollment
      const result = await convexClient.mutation(api.courses.createCourse, {
        title: courseData.title,
        description: courseData.description || "",
        videoId: courseData.videoId,
        thumbnail: courseData.thumbnail || `/course-thumbnails/default.jpg`,
        content: courseData,
        userId
      });

      return { 
        success: true,
        courseId: result.courseId,
        newEnrollment: true
      };
    } else {
      // Fallback to localStorage
      const storageKey = `course_enrollment_${courseData.videoId}_${userId}`;
      
      // Store course data in localStorage
      localStorage.setItem(storageKey, JSON.stringify({
        courseData,
        userId,
        enrolledAt: new Date().toISOString()
      }));
      
      // Also store in enrolled courses list for quick access
      const enrolledCourses = JSON.parse(localStorage.getItem('enrolled_courses') || '[]');
      const existingIndex = enrolledCourses.findIndex((c: any) => c.videoId === courseData.videoId);
      
      if (existingIndex >= 0) {
        // Update existing entry
        enrolledCourses[existingIndex] = {
          videoId: courseData.videoId,
          title: courseData.title,
          enrolledAt: new Date().toISOString(),
          thumbnail: courseData.thumbnail || `/course-thumbnails/default.jpg`,
        };
      } else {
        // Add new entry
        enrolledCourses.push({
          videoId: courseData.videoId,
          title: courseData.title,
          enrolledAt: new Date().toISOString(),
          thumbnail: courseData.thumbnail || `/course-thumbnails/default.jpg`,
        });
      }
      
      localStorage.setItem('enrolled_courses', JSON.stringify(enrolledCourses));
      
      return { 
        success: true,
        courseId: courseData.videoId,
        newEnrollment: existingIndex < 0
      };
    }
  } catch (error) {
    console.error("Course enrollment error:", error);
    throw error;
  }
}

/**
 * Gets course data from Convex or localStorage
 */
export async function getCourseData({
  courseId,
  userId,
  useConvex = true
}: {
  courseId: string;
  userId: string;
  useConvex?: boolean;
}) {
  try {
    if (useConvex && process.env.NEXT_PUBLIC_CONVEX_URL) {
      const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
      
      const course = await convexClient.query(api.courses.getById, {
        courseId,
        userId
      });
      
      return course;
    } else {
      // Fallback to localStorage
      const storageKey = `course_enrollment_${courseId}_${userId}`;
      const courseData = localStorage.getItem(storageKey);
      
      if (courseData) {
        return JSON.parse(courseData).courseData;
      }
      
      return null;
    }
  } catch (error) {
    console.error("Error fetching course data:", error);
    throw error;
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
