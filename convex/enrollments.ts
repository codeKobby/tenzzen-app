import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get user's enrolled courses
export const getUserEnrollments = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("user_enrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Fetch course details for each enrollment
    const courses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId);
        return course ? { ...course, enrollment } : null;
      })
    );

    return courses.filter(Boolean);
  },
});

// Get enrollment for specific user and course
export const getUserCourseEnrollment = query({
  args: { userId: v.string(), courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user_enrollments")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();
  },
});

// Enroll user in a course
export const enrollInCourse = mutation({
  args: { userId: v.string(), courseId: v.id("courses") },
  handler: async (ctx, args) => {
    // Check if already enrolled
    const existing = await ctx.db
      .query("user_enrollments")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();

    // Create enrollment
    const enrollmentId = await ctx.db.insert("user_enrollments", {
      userId: args.userId,
      courseId: args.courseId,
      enrolledAt: now,
      progress: 0,
      isCompleted: false,
    });

    // Update course enrollment count
    const course = await ctx.db.get(args.courseId);
    if (course) {
      await ctx.db.patch(args.courseId, {
        enrollmentCount: course.enrollmentCount + 1,
      });
    }

    // Log activity
    await ctx.db.insert("user_activities", {
      userId: args.userId,
      activityType: "course_enrolled",
      entityId: args.courseId,
      entityType: "course",
      createdAt: now,
    });

    return await ctx.db.get(enrollmentId);
  },
});

// Update enrollment progress
export const updateEnrollmentProgress = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    progress: v.number(),
    isCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db
      .query("user_enrollments")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    const updates: any = {
      progress: args.progress,
      lastAccessedAt: new Date().toISOString(),
    };

    if (args.isCompleted !== undefined) {
      updates.isCompleted = args.isCompleted;
      if (args.isCompleted) {
        updates.completedAt = new Date().toISOString();
      }
    }

    await ctx.db.patch(enrollment._id, updates);

    return await ctx.db.get(enrollment._id);
  },
});

// Get course enrollment count
export const getCourseEnrollmentCount = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("user_enrollments")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    return enrollments.length;
  },
});
