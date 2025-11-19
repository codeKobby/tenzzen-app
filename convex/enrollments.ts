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

// Get per-lesson progress for a user within a course
export const getLessonProgress = query({
  args: { userId: v.string(), courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lesson_progress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .collect();
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

// Record lesson completion and update enrollment progress
export const recordLessonProgress = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    lessonId: v.id("lessons"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db
      .query("user_enrollments")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();

    if (!enrollment) {
      throw new Error("User is not enrolled in this course");
    }

    const now = new Date().toISOString();

    const existingLessonProgress = await ctx.db
      .query("lesson_progress")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existingLessonProgress) {
      await ctx.db.patch(existingLessonProgress._id, {
        isCompleted: args.completed,
        completedAt: args.completed ? now : existingLessonProgress.completedAt,
      });
    } else {
      await ctx.db.insert("lesson_progress", {
        userId: args.userId,
        courseId: args.courseId,
        lessonId: args.lessonId,
        isCompleted: args.completed,
        completedAt: args.completed ? now : undefined,
      });
    }

    const totalLessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    const completedEntries = await ctx.db
      .query("lesson_progress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .collect();

    const completedLessonIds = completedEntries
      .filter((entry) => entry.isCompleted)
      .map((entry) => entry.lessonId);

    const totalLessonCount = Math.max(totalLessons.length, 1);
    const completedCount = completedLessonIds.length;
    const progress = Math.min(
      100,
      Math.round((completedCount / totalLessonCount) * 100)
    );

    await ctx.db.patch(enrollment._id, {
      progress,
      lastAccessedAt: now,
      isCompleted: progress === 100,
      completedAt: progress === 100 ? now : undefined,
    });

    return {
      success: true,
      progress,
      completedLessons: completedLessonIds,
      completionStatus: progress === 100 ? "completed" : "in-progress",
    };
  },
});

// Unenroll a user from a course and clean up progress
export const unenrollFromCourse = mutation({
  args: { userId: v.string(), courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db
      .query("user_enrollments")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();

    if (!enrollment) {
      return { success: false, message: "User is not enrolled in this course" };
    }

    await ctx.db.delete(enrollment._id);

    const progressEntries = await ctx.db
      .query("lesson_progress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .collect();

    for (const entry of progressEntries) {
      await ctx.db.delete(entry._id);
    }

    const course = await ctx.db.get(args.courseId);
    if (course && course.enrollmentCount > 0) {
      await ctx.db.patch(args.courseId, {
        enrollmentCount: Math.max(0, course.enrollmentCount - 1),
      });
    }

    return { success: true };
  },
});
