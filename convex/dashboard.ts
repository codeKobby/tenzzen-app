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
    const completedCourses = enrollments.filter((e) => e.isCompleted).length;
    const inProgressCourses = enrollments.filter(
      (e) => !e.isCompleted && e.progress > 0,
    ).length;

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
        const sections = course.sections?.map((section) => ({
          ...section,
          lessons:
            section.lessons?.map((lesson) => {
              const { content, ...rest } = lesson;
              return rest;
            }) || [],
        }));

        // Extract YouTube thumbnail if thumbnail is a YouTube URL
        const getProcessedThumbnail = () => {
          const thumb = course.thumbnail || "";
          if (
            thumb &&
            !thumb.includes("youtube.com/watch") &&
            !thumb.includes("youtu.be/")
          ) {
            return thumb;
          }
          const urlToCheck = course.sourceUrl || thumb || "";
          const ytMatch = urlToCheck.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
          );
          if (ytMatch && ytMatch[1]) {
            return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
          }
          return thumb || "";
        };

        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          thumbnail: getProcessedThumbnail(),
          sourceUrl: course.sourceUrl,
          sections,
          overview: course.overview,
          enrollment,
        };
      }),
    );

    return {
      enrollmentStats: {
        totalEnrolled,
        completedCourses,
        inProgressCourses,
      },
      streak:
        streak ?
          {
            current: streak.streakDays,
            longest: streak.longestStreak,
            weeklyActivity: streak.weeklyActivity,
          }
        : {
            current: 0,
            longest: 0,
            weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
          },
      recentActivities: recentActivities.map((activity) => ({
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
        const sections = course.sections?.map((section) => ({
          ...section,
          lessons:
            section.lessons?.map((lesson) => {
              const { content, ...rest } = lesson;
              return rest;
            }) || [],
        }));

        // Extract YouTube thumbnail if thumbnail is a YouTube URL
        const getProcessedThumbnail = () => {
          const thumb = course.thumbnail || "";
          // If it's already a proper image URL, use it
          if (
            thumb &&
            !thumb.includes("youtube.com/watch") &&
            !thumb.includes("youtu.be/")
          ) {
            return thumb;
          }
          // Try to extract YouTube video ID from sourceUrl or thumbnail
          const urlToCheck = course.sourceUrl || thumb || "";
          const ytMatch = urlToCheck.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
          );
          if (ytMatch && ytMatch[1]) {
            return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
          }
          return thumb || "";
        };

        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          thumbnail: getProcessedThumbnail(),
          sourceUrl: course.sourceUrl,
          sections,
          overview: course.overview,
          enrollment,
        };
      }),
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
    activities.forEach((activity) => {
      const date = activity.createdAt.split("T")[0];
      activityByDate[date] = (activityByDate[date] || 0) + 1;
    });

    return activityByDate;
  },
});

// Get recommended courses based on user's enrollment categories
export const getRecommendedCourses = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 4;

    // Get user's enrolled courses to determine their interests
    const enrollments = await ctx.db
      .query("user_enrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const enrolledCourseIds = new Set(
      enrollments.map((e) => e.courseId.toString()),
    );

    // Get categories from enrolled courses
    const enrolledCategories = new Set<string>();
    for (const enrollment of enrollments) {
      const course = await ctx.db.get(enrollment.courseId);
      if (course?.category) {
        enrolledCategories.add(course.category);
      }
    }

    // Find public courses in the same categories that user hasn't enrolled in
    let recommendedCourses: any[] = [];

    if (enrolledCategories.size > 0) {
      // Get courses from user's interested categories
      const categoriesArray = Array.from(enrolledCategories);

      for (const category of categoriesArray) {
        if (recommendedCourses.length >= limit) break;

        const coursesInCategory = await ctx.db
          .query("courses")
          .filter((q) =>
            q.and(
              q.eq(q.field("isPublic"), true),
              q.eq(q.field("isPublished"), true),
              q.eq(q.field("category"), category),
            ),
          )
          .take(limit);

        for (const course of coursesInCategory) {
          if (
            !enrolledCourseIds.has(course._id.toString()) &&
            recommendedCourses.length < limit
          ) {
            recommendedCourses.push(course);
          }
        }
      }
    }

    // If we don't have enough recommendations, fill with popular public courses
    if (recommendedCourses.length < limit) {
      const popularCourses = await ctx.db
        .query("courses")
        .filter((q) =>
          q.and(
            q.eq(q.field("isPublic"), true),
            q.eq(q.field("isPublished"), true),
          ),
        )
        .take(limit * 2); // Get more to filter out enrolled ones

      for (const course of popularCourses) {
        if (
          !enrolledCourseIds.has(course._id.toString()) &&
          !recommendedCourses.some(
            (r) => r._id.toString() === course._id.toString(),
          ) &&
          recommendedCourses.length < limit
        ) {
          recommendedCourses.push(course);
        }
      }
    }

    // Sort by enrollment count (popularity) and trust score
    recommendedCourses.sort((a, b) => {
      const scoreA = (a.enrollmentCount || 0) + (a.trustScore || 0) * 10;
      const scoreB = (b.enrollmentCount || 0) + (b.trustScore || 0) * 10;
      return scoreB - scoreA;
    });

    // Return with minimal data for performance
    return recommendedCourses.slice(0, limit).map((course) => ({
      _id: course._id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      category: course.category,
      difficulty: course.difficulty,
      overview: course.overview,
      sections: course.sections?.map((s: any) => ({
        title: s.title,
        lessons:
          s.lessons?.map((l: any) => ({ id: l.id, title: l.title })) || [],
      })),
      enrollmentCount: course.enrollmentCount || 0,
      trustScore: course.trustScore || 0,
    }));
  },
});
