import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server"; // Removed QueryBuilder
import { Id, Doc } from "./_generated/dataModel"; // Added Doc
import { Section, Lesson, Assessment, Course } from "../types/course"; // Added types
import { api } from "./_generated/api"; // Import api

// Define a placeholder type for the context in actions if needed, adjust if api.courses.generateStructureAction exists
// type ActionCtx = { runMutation: Function, runQuery: Function, runAction: Function, db: DatabaseReader };

// Generate a new course from video content
export const generateCourse = mutation({
  args: {
    videoId: v.string(),
    options: v.optional(v.object({
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number())
    }))
  },
  async handler(ctx, { videoId, options }) { // Added ctx
    console.log("Starting course generation for video:", videoId);

    try {
      // First, store a placeholder course
      const now = Date.now();
      const courseId = await ctx.db.insert("courses", { // Use ctx.db
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

      // TODO: Implement course generation logic.
      // Mutations cannot call actions directly (ctx.runAction is invalid here).
      // Generation should likely happen in an action called by the client,
      // which then calls a mutation like 'updateGeneratedCourse' with the results.
      // OR this mutation could call an external API directly if configured.
      // For now, skipping generation and patching.

      // Placeholder for where generated content would be used
      const courseContent: Course | null = null; // Replace null with actual generated content
      if (!courseContent) {
         console.warn("Course content generation skipped/failed.");
         // Decide how to handle this - maybe keep status as 'generating' or set to 'failed'
         // For now, just returning the placeholder course ID
         return await ctx.db.get(courseId);
         // throw new Error("Course generation failed or returned null"); // Original error handling
      }


      // TODO: Uncomment and use actual courseContent data once generation is implemented correctly.
      /*
      // Assuming courseContent has a structure matching the 'courses' table schema
      await ctx.db.patch(courseId, {
        title: courseContent.title, // Assumes courseContent has title
        subtitle: courseContent.subtitle, // Assumes courseContent has subtitle
        overview: courseContent.overview, // Assumes courseContent has overview object
        // Map sections, removing explicit IDs and incorrect assessment mapping
        sections: (courseContent.sections ?? []).map((section: any) => ({ // Use 'any' for now, aligning with schema
          ...section, // Spread section content (assuming it includes lessons)
          // Remove explicit id: `section-${index + 1}`,
          lessons: (section.lessons ?? []).map((lesson: any) => ({ // Use 'any'
             ...lesson // Spread lesson content
             // Remove explicit id: `lesson-${index + 1}-${lessonIndex + 1}`,
          })),
          // Removed incorrect assessments mapping:
          // assessments: (section.assessments ?? []).map(...)
        })),
        metadata: courseContent.metadata, // Assumes courseContent has metadata object
        status: "ready",
        updatedAt: Date.now()
      });
      */

      // Return the placeholder course for now
      const course = await ctx.db.get(courseId); // Use ctx.db
      return course;


    } catch (err) {
      console.error("Course generation failed:", err);
      // Optionally patch the status to failed here as well if not already done
      // await ctx.db.patch(courseId, { status: "failed", updatedAt: Date.now() });
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
      .filter((q) => q.eq(q.field("status"), "ready")) // Removed explicit type
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
    // Assuming Doc<'enrollments'> is the correct type for the query builder context
    const enrollments = await db
      .query("enrollments")
      .filter((q) => q.eq(q.field("userId"), userId)) // Removed explicit type
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
      sections: v.array(v.any()) // Keep as any for now, matches schema
    }),
    userId: v.string()
  },
  async handler({ db }, { courseData, userId }) {
    try {
      // First, check if the course already exists by title
      const existingCourses = await db
        .query("courses")
        .filter((q) => q.eq(q.field("title"), courseData.title)) // Removed explicit type
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
            skills: [], // Assuming skills/tools are not part of courseData input
            tools: []
          },
          sections: courseData.sections, // Keep as any
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
        .filter((q) => q.and( // Removed explicit type
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
        // Need to fetch the course again to safely increment
        const courseToUpdate = await db.get(courseId);
        const enrollmentCount = (courseToUpdate?.enrollmentCount || 0) + 1;
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
      // Assuming an index "by_user_enrolledAt" exists on enrollments table: .index("by_user_enrolledAt", q => q.eq("userId", userId))
      // If not, use filter: .filter((q) => q.eq(q.field("userId"), userId))
      const enrollments = await db
        .query("enrollments")
        .filter((q) => q.eq(q.field("userId"), userId)) // Removed explicit type
        .order("desc") // Corrected order syntax
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
      .filter((q) => q.and( // Removed explicit type
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
