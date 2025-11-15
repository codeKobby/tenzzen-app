import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./helpers";

// Mutation to create a complete course with modules and lessons
export const createAICourse = mutation({
  args: {
    course: v.object({
      title: v.string(),
      description: v.string(),
      learningObjectives: v.array(v.string()),
      prerequisites: v.array(v.string()),
      targetAudience: v.string(),
      estimatedDuration: v.string(),
      sourceType: v.union(
        v.literal("youtube"),
        v.literal("manual"),
        v.literal("topic")
      ),
      sourceId: v.optional(v.string()),
      sourceUrl: v.optional(v.string()),
      isPublic: v.boolean(),
      aiModel: v.string(),
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
            keyPoints: v.array(v.string()),
          })
        ),
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
