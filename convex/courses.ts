import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";

import { CourseContent, generateCourseStructure } from "@/lib/ai/tools/course-generator";

// Generate a new course from video content
export const generateCourse = mutation({
  args: {
    videoId: v.string(),
    options: v.optional(v.object({
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number())
    }))
  },
  async handler({ db }, { videoId, options }) {
    console.log("Starting course generation for video:", videoId);

    try {
      // First, store a placeholder course
      const now = Date.now();
      const courseId = await db.insert("courses", {
        title: "Generating Course...",
        subtitle: "Please wait while we analyze the content",
        overview: {
          description: "Generating course content...",
          prerequisites: [],
          learningOutcomes: [],
          totalDuration: "TBD",
          difficultyLevel: "intermediate",
          skills: [],
          tools: []
        },
        sections: [],
        createdAt: now,
        updatedAt: now,
        status: "generating"
      });

      // Generate course content
      const courseContent = await generateCourseStructure({
        videoId,
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 2048
      });

      // Update the course with generated content
      await db.patch(courseId, {
        title: courseContent.title,
        subtitle: courseContent.subtitle,
        overview: {
          description: courseContent.overview.description,
          prerequisites: courseContent.overview.prerequisites,
          learningOutcomes: courseContent.overview.learningOutcomes,
          totalDuration: courseContent.overview.totalDuration,
          difficultyLevel: courseContent.overview.difficultyLevel,
          skills: courseContent.overview.skills,
          tools: courseContent.overview.tools
        },
        sections: courseContent.sections.map((section, index) => ({
          id: `section-${index + 1}`,
          ...section,
          lessons: section.lessons.map((lesson, lessonIndex) => ({
            id: `lesson-${index + 1}-${lessonIndex + 1}`,
            ...lesson
          })),
          assessments: section.assessments.map((assessment, assessmentIndex) => ({
            id: `assessment-${index + 1}-${assessmentIndex + 1}`,
            ...assessment,
            contentGenerated: false,
            isLocked: true
          }))
        })),
        status: "ready",
        updatedAt: Date.now()
      });

      // Return the generated course
      const course = await db.get(courseId);
      return course;
      
    } catch (err) {
      console.error("Course generation failed:", err);
      throw new Error("Failed to generate course");
    }
  }
});

// Get a course by ID
export const getCourse = query({
  args: { courseId: v.id("courses") },
  async handler({ db }, { courseId }) {
    const course = await db.get(courseId);
    return course;
  }
});

// List all courses
export const listCourses = query({
  args: {},
  async handler({ db }) {
    return await db.query("courses")
      .filter(q => q.eq(q.field("status"), "ready"))
      .collect();
  }
});

// Get all enrollments for a user
export const getUserEnrollments = query({
  args: {
    userId: v.string()
  },
  async handler({ db }, { userId }) {
    // Return empty array if no userId provided
    if (!userId) return [];
    
    // Get the user's enrollments
    const enrollments = await db
      .query("enrollments")
      .filter(q => q.eq(q.field("userId"), userId))
      .collect();
    
    // Add course data to each enrollment
    return Promise.all(enrollments.map(async (enrollment) => {
      const course = await db.get(enrollment.courseId);
      return {
        ...enrollment,
        course
      };
    }));
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
      metadata: v.optional(v.object({
        difficulty: v.optional(v.string()),
        duration: v.optional(v.string()),
        prerequisites: v.optional(v.array(v.string())),
        objectives: v.optional(v.array(v.string())),
        category: v.optional(v.string()),
        sources: v.optional(v.array(v.any())),
      })),
      sections: v.array(v.any())
    }),
    userId: v.string()
  },
  async handler({ db }, { courseData, userId }) {
    try {
      // First, check if the course already exists by title
      const existingCourses = await db
        .query("courses")
        .filter(q => q.eq(q.field("title"), courseData.title))
        .collect();

      let courseId;
      
      const now = Date.now();
      
      if (existingCourses.length === 0) {
        // Create a new course if one doesn't already exist
        courseId = await db.insert("courses", {
          title: courseData.title,
          description: courseData.description,
          videoId: courseData.videoId,
          thumbnail: courseData.thumbnail,
          overview: {
            description: courseData.description,
            prerequisites: courseData.metadata?.prerequisites || [],
            learningOutcomes: courseData.metadata?.objectives || [],
            totalDuration: courseData.metadata?.duration || "Unknown",
            difficultyLevel: courseData.metadata?.difficulty || "beginner",
            skills: [],
            tools: []
          },
          sections: courseData.sections,
          metadata: {
            ...courseData.metadata,
            category: courseData.metadata?.category || "Programming"
          },
          status: "ready",
          createdAt: now,
          updatedAt: now,
          enrollmentCount: 0,
        });
      } else {
        // Use the existing course
        courseId = existingCourses[0]._id;
      }

      // Check if enrollment already exists
      const existingEnrollment = await db
        .query("enrollments")
        .filter(q => q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("courseId"), courseId)
        ))
        .first();

      // If not already enrolled, create enrollment
      if (!existingEnrollment) {
        const enrollmentId = await db.insert("enrollments", {
          userId,
          courseId,
          enrolledAt: now,
          lastAccessedAt: now,
          progress: 0,
          isActive: true,
          completedLessons: []
        });

        // Update the enrollment count
        const enrollmentCount = (existingCourses[0]?.enrollmentCount || 0) + 1;
        await db.patch(courseId, { enrollmentCount });

        return { 
          success: true, 
          courseId, 
          enrollmentId, 
          newEnrollment: true 
        };
      }

      return { 
        success: true, 
        courseId, 
        enrollmentId: existingEnrollment._id, 
        newEnrollment: false 
      };
    } catch (error) {
      console.error("Error in enrollUserInCourse:", error);
      throw error;
    }
  }
});

// Get recently added courses for a user 
export const getRecentlyAddedCourses = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number())
  },
  async handler({ db }, { userId, limit = 4 }) {
    if (!userId) return [];
    
    try {
      // Get the user's enrollments, sorted by most recent first
      const enrollments = await db
        .query("enrollments")
        .filter(q => q.eq(q.field("userId"), userId))
        .order("desc", q => q.field("enrolledAt"))
        .take(limit);

      if (enrollments.length === 0) {
        return [];
      }

      // Get the corresponding courses
      const courses = await Promise.all(
        enrollments.map(async enrollment => {
          const course = await db.get(enrollment.courseId);
          if (!course) return null;
          
          return {
            _id: course._id,
            title: course.title,
            description: course.description || course.overview?.description,
            videoId: course.videoId,
            thumbnail: course.thumbnail,
            sections: course.sections || [],
            metadata: course.metadata || {},
            overview: course.overview || {},
            status: course.status,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
            enrolledAt: enrollment.enrolledAt,
            lastAccessedAt: enrollment.lastAccessedAt,
            progress: enrollment.progress || 0,
            completedLessons: enrollment.completedLessons || []
          };
        })
      );

      // Return only courses that exist (in case any were deleted)
      return courses.filter(Boolean);
    } catch (error) {
      console.error("Error in getRecentlyAddedCourses:", error);
      return [];
    }
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
    // Get the user's enrollment
    const enrollment = await db
      .query("enrollments")
      .filter(q => q.and(
        q.eq(q.field("userId"), userId),
        q.eq(q.field("courseId"), courseId)
      ))
      .first();
    
    if (!enrollment) {
      throw new Error("User is not enrolled in this course");
    }
    
    // Update the enrollment
    const now = Date.now();
    let updateData: any = {
      progress,
      lastAccessedAt: now
    };
    
    if (completedLessons) {
      updateData.completedLessons = completedLessons;
    }
    
    await db.patch(enrollment._id, updateData);
    
    return { success: true };
  }
});