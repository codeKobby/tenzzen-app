import { v } from "convex/values";
import { query } from "./_generated/server";

// Get user dashboard stats
export const getUserStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get enrollment stats
    const enrollments = await ctx.db
      .query("user_enrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalEnrolled = enrollments.length;
    const completedCourses = enrollments.filter(e => e.isCompleted).length;
    const inProgressCourses = enrollments.filter(e => !e.isCompleted && e.progress > 0).length;

    // Get streak data
    const streak = await ctx.db
      .query("user_streaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Get recent activities (last 10)
    const recentActivities = await ctx.db
      .query("user_activities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);

    // Get courses created by user
    const createdCourses = await ctx.db
      .query("courses")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userId))
      .collect();

    // Get recent courses (last 5 enrolled)
    const recentEnrollments = await ctx.db
      .query("user_enrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(5);

    const recentCourses = await Promise.all(
      recentEnrollments.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId);
        if (!course) return null;

        // Strip heavy content from sections/lessons
        const sections = course.sections?.map(section => ({
          ...section,
          lessons: section.lessons?.map(lesson => {
            const { content, ...rest } = lesson;
            return rest;
          }) || []
        }));

        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          sourceUrl: course.sourceUrl,
          sections,
          overview: course.overview,
          enrollment,
        };
      })
    );

    return {
      enrollmentStats: {
        totalEnrolled,
        completedCourses,
        inProgressCourses,
      },
      streak: streak ? {
        current: streak.streakDays,
        longest: streak.longestStreak,
        weeklyActivity: streak.weeklyActivity,
      } : {
        current: 0,
        longest: 0,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
      },
      recentActivities: recentActivities.map(activity => ({
        type: activity.activityType,
        entityId: activity.entityId,
        entityType: activity.entityType,
        createdAt: activity.createdAt,
        metadata: activity.metadata,
      })),
      createdCoursesCount: createdCourses.length,
      recentCourses: recentCourses.filter(Boolean),
    };
  },
});

// Get user's recent courses
export const getRecentCourses = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    const recentEnrollments = await ctx.db
      .query("user_enrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    const courses = await Promise.all(
      recentEnrollments.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId);
        if (!course) return null;

        // Strip heavy content from sections/lessons to improve performance
        const sections = course.sections?.map(section => ({
          ...section,
          lessons: section.lessons?.map(lesson => {
            const { content, ...rest } = lesson;
            return rest;
          }) || []
        }));

        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          sourceUrl: course.sourceUrl,
          sections,
          overview: course.overview,
          enrollment,
        };
      })
    );

    return courses.filter(Boolean);
  },
});

// Get user's learning activity over time
export const getLearningActivity = query({
  args: { userId: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await ctx.db
      .query("user_activities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("createdAt"), startDate.toISOString()))
      .collect();

    // Group by date
    const activityByDate: { [date: string]: number } = {};
    activities.forEach(activity => {
      const date = activity.createdAt.split('T')[0];
      activityByDate[date] = (activityByDate[date] || 0) + 1;
    });

    return activityByDate;
  },
});
