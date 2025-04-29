import { v } from "convex/values";
import { mutation, query } from "./_generated/server"; // Removed action, QueryBuilder
import { Id, Doc } from "./_generated/dataModel"; // Added Doc
// Removed unused specific types: import { Section, Lesson, Assessment, Course } from "../types/course";
import { api } from "./_generated/api"; // Import api
import { DifficultyLevel, difficultyLevelValidator } from "./validation"; // Import difficultyLevelValidator

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
    
    // Define courseId at function level so it's accessible in the catch block
    let courseId: Id<"courses"> | null = null;

    try {
      // First, store a placeholder course
      const now = Date.now();
      courseId = await ctx.db.insert("courses", { // Use ctx.db
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
        isPublic: false, // Added required field, default to false
        createdAt: now,
        updatedAt: now,
        status: "generating",
        enrollmentCount: 0, // Initialize enrollment count
      });

      // TODO: Implement course generation logic.
      // Mutations cannot call actions directly (ctx.runAction is invalid here).
      // Generation should likely happen in an action called by the client,
      // which then calls a mutation like 'updateGeneratedCourse' with the results.
      // OR this mutation could call an external API directly if configured.
      // For now, skipping generation and patching.

      // Placeholder for where generated content would be used
      // const courseContent: Course | null = null; // Replace null with actual generated content
      // For now, generation logic is skipped/commented out.

      // Return the placeholder course
      const course = await ctx.db.get(courseId);
      if (!course) {
        // This should not happen if insert succeeded
        throw new Error("Failed to retrieve placeholder course after creation.");
      }
      return course;

    } catch (err) {
      console.error("Course generation mutation failed:", err);
      // Now courseId is properly in scope for the catch block
      if (courseId) {
        await ctx.db.patch(courseId, { status: "failed", updatedAt: Date.now() });
      }
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

// List all ready courses (consider pagination for large datasets)
export const listCourses = query({
  args: {},
  async handler({ db }) {
    // Fetch only courses marked as ready and public? Or just ready? Assuming ready for now.
    return await db.query("courses")
      .filter((q) => q.eq(q.field("status"), "ready"))
      .order("desc") // Default order by creation time or popularity? Let's use creation time.
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
        // Add the missing fields
        overviewText: v.optional(v.string()),
        resources: v.optional(v.array(v.object({
          title: v.string(),
          description: v.optional(v.string()),
          type: v.string(),
          url: v.string()
        }))),
        tags: v.optional(v.array(v.string()))
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
          // subtitle: courseData.subtitle, // Assuming subtitle is not in courseData args
          description: courseData.description,
          videoId: courseData.videoId,
          thumbnail: courseData.thumbnail,
          overview: {
            description: courseData.description,
            prerequisites: courseData.metadata?.prerequisites || [],
            learningOutcomes: courseData.metadata?.objectives || [],
            totalDuration: courseData.metadata?.duration || "Unknown",
            difficultyLevel: (courseData.metadata?.difficulty || "beginner") as DifficultyLevel,
            skills: [], // Assuming skills/tools are not part of courseData input
            tools: []
          },
          sections: courseData.sections, // Keep as any
          metadata: {
            ...courseData.metadata,
            category: courseData.metadata?.category || "Programming",
            sources: courseData.metadata?.sources || [],
            difficulty: courseData.metadata?.difficulty as DifficultyLevel, // Cast to DifficultyLevel
          },
          isPublic: false, // Default new courses created via enrollment to private? Or should they be public? Assuming false.
          status: "ready",
          createdAt: now,
          updatedAt: now,
          enrollmentCount: 0, // Initialize enrollment count
          // featured: false, // Default featured status
          // popularity: 0, // Default popularity
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
          completionStatus: "not_started", // Added required field
          progress: 0,
          isActive: true,
          completedLessons: [],
          // totalTimeSpent: 0 // Initialize time spent
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

// Enroll a user in an existing course by ID
export const enrollInCourse = mutation({
  args: {
    courseId: v.id("courses"),
    userId: v.string()
  },
  async handler({ db }, { courseId, userId }) {
    try {
      // Get the course to verify it exists
      const course = await db.get(courseId);
      if (!course) {
        throw new Error("Course not found");
      }

      // Check if enrollment already exists
      const existingEnrollment = await db
        .query("enrollments")
        .filter((q) => q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("courseId"), courseId)
        ))
        .first();

      const now = Date.now();
      
      // If not already enrolled, create enrollment
      if (!existingEnrollment) {
        const enrollmentId = await db.insert("enrollments", {
          userId,
          courseId,
          enrolledAt: now,
          lastAccessedAt: now,
          completionStatus: "not_started",
          progress: 0,
          isActive: true,
          completedLessons: [],
        });

        // Update the enrollment count
        const enrollmentCount = (course.enrollmentCount || 0) + 1;
        await db.patch(courseId, { 
          enrollmentCount,
          updatedAt: now
        });

        // Log this activity
        await db.insert("learning_activities", {
          userId,
          type: "started_course", // Changed from "enrolled" to match allowed activity types
          courseId,
          timestamp: now,
          visible: true
        });

        return {
          success: true,
          courseId,
          enrollmentId,
          newEnrollment: true,
          course
        };
      }

      return {
        success: true,
        courseId,
        enrollmentId: existingEnrollment._id,
        newEnrollment: false,
        course
      };
    } catch (error) {
      console.error("Error in enrollInCourse:", error);
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
      // Use the index "by_user_enrolledAt" for efficient sorting and filtering
      const enrollments = await db
        .query("enrollments")
        .withIndex("by_user_enrolledAt", q => q.eq("userId", userId))
        .order("desc") // Order by enrolledAt (descending for most recent)
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
    const updateData: Partial<Doc<"enrollments">> = { // Use Partial<Doc> for type safety
      progress,
      lastAccessedAt: now
    };

    if (completedLessons !== undefined) { // Check if explicitly provided
      updateData.completedLessons = completedLessons;
    }

    // Determine completion status based on progress
    if (progress >= 100) {
      updateData.completionStatus = "completed";
    } else if (progress > 0 && enrollment.completionStatus === "not_started") {
      updateData.completionStatus = "in_progress";
    }
    // Add logic to update totalTimeSpent if tracked

    await db.patch(enrollment._id, updateData);

    // TODO: Consider adding learning activity log here

    return { success: true };
  }
});

// Get all public/universal courses for the explore page
export const getPublicCourses = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("courses")),
    categoryId: v.optional(v.id("categories")),
    searchQuery: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Start with a base query for public courses
    const baseQuery = ctx.db
      .query("courses")
      .filter(q => q.eq(q.field("isPublic"), true));
    
    // Collection of course IDs if filtering by category
    let categoryFilteredCourseIds: Id<"courses">[] = [];
    
    // Apply category filter if provided
    if (args.categoryId) {
      // Get all course IDs in this category
      const courseCategories = await ctx.db
        .query("course_categories")
        .withIndex("by_category", q => q.eq("categoryId", args.categoryId!)) // Use index
        .collect();

      categoryFilteredCourseIds = courseCategories.map(cc => cc.courseId);

      if (categoryFilteredCourseIds.length === 0) {
         // No courses in this category, return empty result immediately
         return {
          courses: [],
          cursor: null
        };
      }
    }
    
    // Handle search query separately to avoid reassignment issues
    let finalQuery;
    if (args.searchQuery && args.searchQuery.trim() !== "") {
      const searchQuery = args.searchQuery.trim();
      // Use the search index
      finalQuery = ctx.db
        .query("courses")
        .withSearchIndex("search_courses", (q) => 
          q.search("title", searchQuery).eq("isPublic", true)
        );
    } else {
      finalQuery = baseQuery;
    }

    // Apply pagination
    const limit = args.limit ?? 20;
    // Note: searchQuery would use different pagination approach
    const results = await finalQuery
      .paginate({ numItems: limit, cursor: args.cursor as string | null });

    // Apply post-query filtering for tags and categories if needed
    let filteredPage = results.page;
    
    // Filter by category IDs if we have them
    if (categoryFilteredCourseIds.length > 0) {
      filteredPage = filteredPage.filter((course: any) => 
        categoryFilteredCourseIds.includes(course._id)
      );
    }
    
    // Filter by tags if provided
    if (args.tags && args.tags.length > 0) {
      filteredPage = filteredPage.filter((course: any) => {
        if (!course.tags) return false;
        return args.tags!.some(tag => course.tags!.includes(tag));
      });
    }

    // Fetch category information for each course
    const coursesWithCategories = await Promise.all(
      filteredPage.map(async (course) => {
        const courseCategoryLinks = await ctx.db
          .query("course_categories")
          .withIndex("by_course", q => q.eq("courseId", course._id))
          .collect();

        const categoryIds = courseCategoryLinks.map(link => link.categoryId);
        const categoryDetails = categoryIds.length > 0
          ? await Promise.all(categoryIds.map(id => ctx.db.get(id)))
          : [];

        return {
          ...course,
          categories: categoryDetails.filter((c): c is Doc<"categories"> => c !== null)
        };
      })
    );

    return {
      courses: coursesWithCategories,
      isDone: results.isDone,
      cursor: results.continueCursor
    };
  }
});

// Update a generated course with content and make it public
export const updateGeneratedCourse = mutation({
  args: {
    courseId: v.id("courses"),
    courseContent: v.object({
      title: v.string(),
      subtitle: v.optional(v.string()),
      description: v.optional(v.string()),
      videoId: v.optional(v.string()),
      thumbnail: v.optional(v.string()),
      overview: v.optional(v.object({
        description: v.optional(v.string()),
        prerequisites: v.optional(v.array(v.string())),
        learningOutcomes: v.optional(v.array(v.string())),
        totalDuration: v.optional(v.string()),
        difficultyLevel: v.optional(difficultyLevelValidator), // Fixed: Use difficultyLevelValidator instead of v.string()
        skills: v.optional(v.array(v.string())),
        tools: v.optional(v.array(v.string()))
      })),
      sections: v.array(v.any()),
      metadata: v.optional(v.object({
        difficulty: v.optional(difficultyLevelValidator), // Fixed: Use difficultyLevelValidator instead of v.string()
        duration: v.optional(v.string()),
        prerequisites: v.optional(v.array(v.string())),
        objectives: v.optional(v.array(v.string())),
        category: v.optional(v.string()),
        sources: v.optional(v.array(v.any())),
      })),
      tags: v.optional(v.array(v.string())),
    })
  },
  async handler(ctx, { courseId, courseContent }) {
    // Check if the course exists
    const existingCourse = await ctx.db.get(courseId);
    if (!existingCourse) {
      throw new Error("Course not found");
    }
    
    // Update the course with generated content
    const now = Date.now();
    await ctx.db.patch(courseId, {
      title: courseContent.title,
      subtitle: courseContent.subtitle,
      description: courseContent.description,
      videoId: courseContent.videoId,
      thumbnail: courseContent.thumbnail,
      overview: courseContent.overview,
      sections: courseContent.sections,
      metadata: courseContent.metadata,
      tags: courseContent.tags,
      isPublic: true, // Mark as public in universal course database
      status: "ready", // Change status from "generating" to "ready"
      updatedAt: now
    });
    
    // If there are tags, ensure they exist in the tags table
    if (courseContent.tags && courseContent.tags.length > 0) {
      for (const tagName of courseContent.tags) {
        // Check if tag exists
        const existingTag = await ctx.db.query("tags")
          .withIndex("by_name", q => q.eq("name", tagName))
          .unique();
        
        if (existingTag) {
          // Increment the use count for the tag
          await ctx.db.patch(existingTag._id, {
            useCount: (existingTag.useCount || 0) + 1
          });
          
          // Create tag-course relationship if it doesn't exist
          const existingRelation = await ctx.db.query("course_tags")
            .withIndex("by_course_tag", q => 
              q.eq("courseId", courseId).eq("tagId", existingTag._id)
            )
            .unique();
            
          if (!existingRelation) {
            await ctx.db.insert("course_tags", {
              courseId,
              tagId: existingTag._id
            });
          }
        } else {
          // Create new tag
          const tagId = await ctx.db.insert("tags", {
            name: tagName,
            useCount: 1
          });
          
          // Create tag-course relationship
          await ctx.db.insert("course_tags", {
            courseId,
            tagId
          });
        }
      }
    }
    
    // If there's a category in metadata, ensure the category-course relationship exists
    if (courseContent.metadata?.category) {
      const categoryName = courseContent.metadata.category;
      // Find or create the category
      let categoryId;
      const existingCategory = await ctx.db.query("categories")
        .withIndex("by_name", q => q.eq("name", categoryName))
        .unique();
      
      if (existingCategory) {
        categoryId = existingCategory._id;
        // Increment the course count for the category
        await ctx.db.patch(categoryId, {
          courseCount: (existingCategory.courseCount || 0) + 1
        });
      } else {
        // Create new category
        categoryId = await ctx.db.insert("categories", {
          name: categoryName,
          description: `Courses related to ${categoryName}`,
          slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
          courseCount: 1
        });
      }
      
      // Check if relationship already exists
      const existingRelation = await ctx.db.query("course_categories")
        .withIndex("by_course_category", q => 
          q.eq("courseId", courseId).eq("categoryId", categoryId)
        )
        .unique();
        
      if (!existingRelation) {
        // Create category-course relationship
        await ctx.db.insert("course_categories", {
          courseId,
          categoryId
        });
      }
    }
    
    // Return the updated course
    return await ctx.db.get(courseId);
  }
});
