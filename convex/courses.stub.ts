// This is a stub file to be used if the Convex deployment is not available yet
// It provides mock implementations that match the API shape

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all enrollments for a user
export const getUserEnrollments = query({
  args: {
    userId: v.string()
  },
  async handler({ db }, { userId }) {
    console.log("Using stub getUserEnrollments");
    return [];
  }
});

// Get recently added courses for a user
export const getRecentlyAddedCourses = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number())
  },
  async handler({ db }, { userId, limit = 4 }) {
    console.log("Using stub getRecentlyAddedCourses");
    return [];
  }
});

// List all courses
export const listCourses = query({
  args: {},
  async handler({ db }) {
    console.log("Using stub listCourses");
    return [];
  }
});

// Enroll a user in a course
export const enrollUserInCourse = mutation({
  args: {
    courseData: v.object({
      title: v.string(),
      description: v.string(),
      videoId: v.optional(v.string()),
      thumbnail: v.optional(v.string()),
      metadata: v.optional(v.any()),
      sections: v.array(v.any())
    }),
    userId: v.string()
  },
  async handler({ db }, { courseData, userId }) {
    console.log("Using stub enrollUserInCourse", { courseData, userId });
    
    // Simulate success
    return { 
      success: true, 
      courseId: "mock-course-id", 
      enrollmentId: "mock-enrollment-id",  
      newEnrollment: true 
    };
  }
});

// Update user's course progress
export const updateCourseProgress = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    progress: v.number(),
    completedLessons: v.optional(v.array(v.string()))
  },
  async handler({ db }, { userId, courseId, progress, completedLessons }) {
    console.log("Using stub updateCourseProgress", { userId, courseId, progress, completedLessons });
    return { success: true };
  }
});
