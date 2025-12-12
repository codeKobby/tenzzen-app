import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./helpers";

// Mutation to create a complete course with modules and lessons
export const createAICourse = mutation({
  args: {
    course: v.object({
      title: v.string(),
      description: v.string(),
      detailedOverview: v.string(),
      category: v.string(),
      difficulty: v.string(),
      learningObjectives: v.array(v.string()),
      prerequisites: v.array(v.string()),
      targetAudience: v.string(),
      estimatedDuration: v.string(),
      tags: v.array(v.string()),
      resources: v.array(
        v.object({
          title: v.string(),
          url: v.string(),
          type: v.string(),
          description: v.optional(v.string()),
          category: v.string(),
          provenance: v.optional(
            v.union(v.literal("found"), v.literal("suggested"))
          ),
        })
      ),
      sourceType: v.union(
        v.literal("youtube"),
        v.literal("manual"),
        v.literal("topic")
      ),
      sourceId: v.optional(v.string()),
      sourceUrl: v.optional(v.string()),
      isPublic: v.boolean(),
      aiModel: v.string(),
      thumbnail: v.optional(v.string()),
    }),
    modules: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        lessons: v.array(
          v.object({
            title: v.string(),
            description: v.string(),
            content: v.string(),
            durationMinutes: v.number(),
            timestampStart: v.optional(v.string()),
            timestampEnd: v.optional(v.string()),
            keyPoints: v.array(v.string()),
          })
        ),
      })
    ),
    assessmentPlan: v.optional(
      v.object({
        quizLocations: v.array(
          v.object({
            afterModule: v.optional(v.number()),
            afterLesson: v.optional(
              v.object({
                moduleIndex: v.number(),
                lessonIndex: v.number(),
              })
            ),
            type: v.literal("quiz"),
          })
        ),
        hasEndOfCourseTest: v.boolean(),
        hasFinalProject: v.boolean(),
        projectDescription: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const now = new Date().toISOString();

    // Create course
    const courseId = await ctx.db.insert("courses", {
      ...args.course,
      detailedOverview: args.course.detailedOverview,
      category: args.course.category,
      difficulty: args.course.difficulty,
      tags: args.course.tags,
      resources: args.course.resources,
      assessmentPlan: args.assessmentPlan,
      createdBy: userId,
      isPublished: false,
      enrollmentCount: 0,
      generatedBy: "ai" as const,
      generatedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Create modules and lessons
    for (
      let moduleIndex = 0;
      moduleIndex < args.modules.length;
      moduleIndex++
    ) {
      const moduleData = args.modules[moduleIndex];

      const moduleId = await ctx.db.insert("modules", {
        courseId,
        title: moduleData.title,
        description: moduleData.description,
        order: moduleIndex,
        createdAt: now,
        updatedAt: now,
      });

      for (
        let lessonIndex = 0;
        lessonIndex < moduleData.lessons.length;
        lessonIndex++
      ) {
        const lessonData = moduleData.lessons[lessonIndex];

        await ctx.db.insert("lessons", {
          moduleId,
          courseId,
          title: lessonData.title,
          description: lessonData.description,
          content: lessonData.content,
          durationMinutes: lessonData.durationMinutes,
          timestampStart: lessonData.timestampStart,
          timestampEnd: lessonData.timestampEnd,
          keyPoints: lessonData.keyPoints,
          order: lessonIndex,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return courseId;
  },
});

// Patch course to include a denormalized preview (sections + overview + thumbnail)
export const patchCoursePreview = mutation({
  args: {
    courseId: v.id("courses"),
    preview: v.object({
      sections: v.array(
        v.object({
          title: v.string(),
          description: v.string(),
          lessons: v.array(
            v.object({
              title: v.string(),
              description: v.string(),
              content: v.string(),
              durationMinutes: v.number(),
              timestampStart: v.optional(v.string()),
              timestampEnd: v.optional(v.string()),
              keyPoints: v.array(v.string()),
            })
          ),
        })
      ),
      overview: v.optional(
        v.object({
          skills: v.array(v.string()),
          difficulty_level: v.string(),
          total_duration: v.string(),
        })
      ),
      thumbnail: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    await ctx.db.patch(args.courseId, {
      sections: args.preview.sections,
      overview: args.preview.overview,
      thumbnail: args.preview.thumbnail,
      updatedAt: now,
    });

    return await ctx.db.get(args.courseId);
  },
});

// Query to get full course with modules and lessons
export const getCourseWithContent = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;

    const modules = await ctx.db
      .query("modules")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("by_module", (q) => q.eq("moduleId", module._id))
          .collect();

        return {
          ...module,
          lessons: lessons.sort((a, b) => a.order - b.order),
        };
      })
    );

    return {
      ...course,
      modules: modulesWithLessons.sort((a, b) => a.order - b.order),
    };
  },
});

// Query to find existing course by sourceId
export const getCourseBySourceId = query({
  args: { sourceId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_source", (q) =>
        q.eq("sourceType", "youtube").eq("sourceId", args.sourceId)
      )
      .filter((q) => q.eq(q.field("createdBy"), args.userId))
      .first();
  },
});

// Query to get user's courses
export const getUserCourses = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userId))
      .collect();
  },
});

// Query to get public courses
export const getPublicCourses = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_public", (q) =>
        q.eq("isPublic", true).eq("isPublished", true)
      )
      .collect();
  },
});

// Query to get a single lesson
export const getLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.lessonId);
  },
});

// Mutation to delete a course and all its related data
export const deleteCourse = mutation({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Verify the user owns the course
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");
    if (course.createdBy !== userId) throw new Error("Unauthorized");

    // Delete all lessons associated with the course
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    for (const lesson of lessons) {
      await ctx.db.delete(lesson._id);
    }

    // Delete all modules associated with the course
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    for (const module of modules) {
      await ctx.db.delete(module._id);
    }

    // Delete all enrollments for the course
    const enrollments = await ctx.db
      .query("user_enrollments")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    for (const enrollment of enrollments) {
      await ctx.db.delete(enrollment._id);
    }

    // Finally, delete the course itself
    await ctx.db.delete(args.courseId);

    return { success: true };
  },
});
