import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api"; // Add this import for API reference

// Get user statistics for dashboard
export const getUserStats = query({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    // Get user stats
    const userStats = await ctx.db
      .query("user_stats")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    // If no stats exist, return default values
    if (!userStats) {
      const now = Date.now();
      return {
        // CamelCase fields
        userId: args.userId,
        totalLearningHours: 0,
        coursesCompleted: 0,
        coursesInProgress: 0,
        assessmentsCompleted: 0,
        projectsSubmitted: 0,
        lastActiveAt: now,
        streakDays: 0,
        longestStreak: 0,
        totalPoints: 0,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0], // One value per day of week

        // Snake_case fields for backward compatibility
        user_id: args.userId,
        total_learning_hours: 0,
        courses_completed: 0,
        courses_in_progress: 0,
        assessments_completed: 0,
        projects_submitted: 0,
        last_active_at: now,
        streak_days: 0,
        longest_streak: 0,
        total_points: 0,
        weekly_activity: [0, 0, 0, 0, 0, 0, 0]
      };
    }

    return userStats;
  }
});

// Initialize or update user stats
export const initializeUserStats = mutation({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    // Check if user stats already exist
    const existingStats = await ctx.db
      .query("user_stats")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    if (existingStats) {
      // Update last active timestamp
      await ctx.db.patch(existingStats._id, {
        lastActiveAt: Date.now()
      });

      return { statsId: existingStats._id, isNew: false };
    }

    // Create new user stats with both camelCase and snake_case field names
    const now = Date.now();
    const statsId = await ctx.db.insert("user_stats", {
      // CamelCase fields
      userId: args.userId,
      totalLearningHours: 0,
      coursesCompleted: 0,
      coursesInProgress: 0,
      assessmentsCompleted: 0,
      projectsSubmitted: 0,
      lastActiveAt: now,
      streakDays: 1, // Start with day 1 of streak
      longestStreak: 1,
      totalPoints: 0,
      weeklyActivity: [0, 0, 0, 0, 0, 0, 0], // One value per day of week

      // Snake_case fields for backward compatibility
      user_id: args.userId,
      total_learning_hours: 0,
      courses_completed: 0,
      courses_in_progress: 0,
      assessments_completed: 0,
      projects_submitted: 0,
      last_active_at: now,
      streak_days: 1,
      longest_streak: 1,
      total_points: 0,
      weekly_activity: [0, 0, 0, 0, 0, 0, 0]
    });

    return { statsId, isNew: true };
  }
});

// Update user's streak
export const updateUserStreak = mutation({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args): Promise<{
    streakDays: number;
    longestStreak: number;
    streakChanged: boolean
  }> => {
    // Get current user stats
    const userStats = await ctx.db
      .query("user_stats")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    if (!userStats) {
      // Create new stats if they don't exist
      const result = await ctx.runMutation(api.user_stats.initializeUserStats, { userId: args.userId });
      // Return a compatible result with the expected type
      return {
        streakDays: 1,
        longestStreak: 1,
        streakChanged: true
      };
    }

    const now = Date.now();
    // Get the last active timestamp, handling both camelCase and snake_case
    const lastActive = userStats.lastActiveAt || userStats.last_active_at || now;

    // Get date objects (without time) for today and last active day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActiveDate = new Date(lastActive);
    lastActiveDate.setHours(0, 0, 0, 0);

    // Calculate difference in days between today and last active day
    const timeDiff = today.getTime() - lastActiveDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    // Get the current streak values, handling both camelCase and snake_case
    let newStreakDays = userStats.streakDays || userStats.streak_days || 0;
    let newLongestStreak = userStats.longestStreak || userStats.longest_streak || 0;
    let streakChanged = false;

    // If the user was active today already, no change to streak
    if (daysDiff === 0) {
      // Just update the last active time (both camelCase and snake_case)
      await ctx.db.patch(userStats._id, {
        lastActiveAt: now,
        last_active_at: now
      });

      // Get the current streak values, handling both camelCase and snake_case
      const currentStreakDays = userStats.streakDays || userStats.streak_days || 0;
      const currentLongestStreak = userStats.longestStreak || userStats.longest_streak || 0;

      return {
        streakDays: currentStreakDays,
        longestStreak: currentLongestStreak,
        streakChanged: false
      };
    }

    // If the user was active yesterday, increment streak
    if (daysDiff === 1) {
      newStreakDays += 1;
      streakChanged = true;

      // Update longest streak if current streak is longer
      if (newStreakDays > newLongestStreak) {
        newLongestStreak = newStreakDays;
      }
    }
    // If the user missed a day or more, reset streak to 1
    else if (daysDiff > 1) {
      // Only reset if it's been more than 24 hours since the streak could continue
      // This fixes the issue where logging in on the next day incorrectly resets the streak
      newStreakDays = 1;
      streakChanged = true;
    }

    // Update the user's weekly activity
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Get the current weekly activity, handling both camelCase and snake_case
    const currentWeeklyActivity = userStats.weeklyActivity || userStats.weekly_activity || [0, 0, 0, 0, 0, 0, 0];
    const weeklyActivity = [...currentWeeklyActivity];

    weeklyActivity[dayOfWeek] += 1;

    // Update stats (both camelCase and snake_case)
    await ctx.db.patch(userStats._id, {
      // CamelCase fields
      streakDays: newStreakDays,
      longestStreak: newLongestStreak,
      lastActiveAt: now,
      weeklyActivity,

      // Snake_case fields for backward compatibility
      streak_days: newStreakDays,
      longest_streak: newLongestStreak,
      last_active_at: now,
      weekly_activity: weeklyActivity
    });

    return {
      streakDays: newStreakDays,
      longestStreak: newLongestStreak,
      streakChanged
    };
  }
});

// Log learning activity
export const logLearningActivity = mutation({
  args: {
    userId: v.string(),
    type: v.union(
      v.literal("started_course"),
      v.literal("completed_lesson"),
      v.literal("started_assessment"),
      v.literal("completed_assessment"),
      v.literal("submitted_project"),
      v.literal("received_feedback"),
      v.literal("earned_achievement"),
      v.literal("earned_points"),
      v.literal("shared_note"),
      v.literal("created_course"),
      v.literal("completed_course")
    ),
    courseId: v.optional(v.id("courses")),
    lessonId: v.optional(v.string()),
    assessmentId: v.optional(v.id("assessments")),
    timeSpent: v.optional(v.number()), // Time spent in milliseconds
    metadata: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create activity record
    const activityId = await ctx.db.insert("learning_activities", {
      userId: args.userId,
      type: args.type,
      courseId: args.courseId,
      lessonId: args.lessonId,
      assessmentId: args.assessmentId,
      timestamp: now,
      metadata: args.metadata || {}
    });

    // Update user stats
    const userStats = await ctx.db
      .query("user_stats")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    if (userStats) {
      const updates: any = {
        lastActiveAt: now,
        last_active_at: now // Update both camelCase and snake_case fields
      };

      // Update learning hours if time spent is provided
      if (args.timeSpent) {
        const hoursSpent = args.timeSpent / (1000 * 60 * 60); // Convert ms to hours
        // Get the current value, handling both camelCase and snake_case
        const currentHours = userStats.totalLearningHours || userStats.total_learning_hours || 0;
        updates.totalLearningHours = currentHours + hoursSpent;
        updates.total_learning_hours = currentHours + hoursSpent; // Update both fields
      }

      // Update specific counters based on activity type
      if (args.type === "completed_assessment") {
        // Get the current value, handling both camelCase and snake_case
        const currentAssessments = userStats.assessmentsCompleted || userStats.assessments_completed || 0;
        updates.assessmentsCompleted = currentAssessments + 1;
        updates.assessments_completed = currentAssessments + 1; // Update both fields
      } else if (args.type === "submitted_project") {
        // Get the current value, handling both camelCase and snake_case
        const currentProjects = userStats.projectsSubmitted || userStats.projects_submitted || 0;
        updates.projectsSubmitted = currentProjects + 1;
        updates.projects_submitted = currentProjects + 1; // Update both fields
      } else if (args.type === "completed_course") {
        // Get the current value, handling both camelCase and snake_case
        const currentCompleted = userStats.coursesCompleted || userStats.courses_completed || 0;
        updates.coursesCompleted = currentCompleted + 1;
        updates.courses_completed = currentCompleted + 1; // Update both fields

        // Decrement in-progress count if it's greater than 0
        const currentInProgress = userStats.coursesInProgress || userStats.courses_in_progress || 0;
        if (currentInProgress > 0) {
          updates.coursesInProgress = currentInProgress - 1;
          updates.courses_in_progress = currentInProgress - 1; // Update both fields
        }
      } else if (args.type === "started_course") {
        // Get the current value, handling both camelCase and snake_case
        const currentInProgress = userStats.coursesInProgress || userStats.courses_in_progress || 0;
        updates.coursesInProgress = currentInProgress + 1;
        updates.courses_in_progress = currentInProgress + 1; // Update both fields
      }

      // Update weekly activity
      const dayOfWeek = new Date().getDay();
      // Get the current weekly activity, handling both camelCase and snake_case
      const weeklyActivity = userStats.weeklyActivity || userStats.weekly_activity || [0, 0, 0, 0, 0, 0, 0];
      const updatedWeeklyActivity = [...weeklyActivity];
      updatedWeeklyActivity[dayOfWeek] += 1;
      updates.weeklyActivity = updatedWeeklyActivity;
      updates.weekly_activity = updatedWeeklyActivity; // Update both fields

      await ctx.db.patch(userStats._id, updates);
    } else {
      // Create new user stats if they don't exist
      await ctx.runMutation(api.user_stats.initializeUserStats, { userId: args.userId });
    }

    // Update streak
    await ctx.runMutation(api.user_stats.updateUserStreak, { userId: args.userId });

    return { activityId };
  }
});

// Get recent learning activities
export const getRecentActivities = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("learning_activities"))
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Set up the query with pagination
    let activitiesQuery = ctx.db
      .query("learning_activities")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .order("desc"); // Correctly specify ordering by timestamp

    // Paginate using cursor-based pagination
    const paginationResult = await activitiesQuery.paginate({
      numItems: limit,
      cursor: args.cursor ? String(args.cursor) : null
    });

    const activities = paginationResult.page;
    const nextCursor = activities.length < limit ? null : activities[activities.length - 1]._id;

    // Enhance activities with course/resource information
    const enhancedActivities = await Promise.all(
      activities.map(async (activity) => {
        let additionalInfo = {};

        if (activity.courseId) {
          const course = await ctx.db.get(activity.courseId);
          if (course) {
            additionalInfo = {
              ...additionalInfo,
              courseName: course.title,
              courseThumbnail: course.thumbnail
            };
          }
        }

        if (activity.assessmentId) {
          const assessment = await ctx.db.get(activity.assessmentId);
          if (assessment) {
            additionalInfo = {
              ...additionalInfo,
              assessmentTitle: assessment.title
            };
          }
        }

        return {
          ...activity,
          ...additionalInfo
        };
      })
    );

    return {
      activities: enhancedActivities,
      cursor: nextCursor
    };
  }
});

// Get user's learning stats and progress over time
export const getLearningTrends = query({
  args: {
    userId: v.string(),
    timeframe: v.string() // "week", "month", "year"
  },
  handler: async (ctx, args) => {
    // Get user stats
    const userStats = await ctx.db
      .query("user_stats")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    if (!userStats) {
      return {
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
        totalHours: 0,
        coursesCompleted: 0,
        assessmentsCompleted: 0
      };
    }

    const now = Date.now();

    // Define time ranges based on timeframe
    let startTime: number;
    if (args.timeframe === "week") {
      startTime = now - (7 * 24 * 60 * 60 * 1000); // 7 days
    } else if (args.timeframe === "month") {
      startTime = now - (30 * 24 * 60 * 60 * 1000); // 30 days
    } else if (args.timeframe === "year") {
      startTime = now - (365 * 24 * 60 * 60 * 1000); // 365 days
    } else {
      // Default to a week
      startTime = now - (7 * 24 * 60 * 60 * 1000);
    }

    // Get activities within the timeframe
    const activities = await ctx.db
      .query("learning_activities")
      .filter(q =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.gte(q.field("timestamp"), startTime)
        )
      )
      .collect();

    // Aggregate activities by date
    const activityByDate: { [date: string]: number } = {};
    const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'short' });

    activities.forEach(activity => {
      const date = dateFormatter.format(new Date(activity.timestamp));
      activityByDate[date] = (activityByDate[date] || 0) + 1;
    });

    // Count completions in this timeframe
    const coursesCompleted = activities.filter(a => a.type === "completed_course").length;
    const assessmentsCompleted = activities.filter(a => a.type === "completed_assessment").length;

    // Calculate total learning hours in this timeframe
    // This is an approximation - for exact hours we'd need to use timeSpent from activity metadata
    const totalHours = activities.reduce((total, activity) => {
      const timeSpent = activity.metadata?.timeSpent || 0;
      return total + (timeSpent / (1000 * 60 * 60));
    }, 0);

    return {
      weeklyActivity: userStats.weeklyActivity,
      activityByDate,
      totalHours,
      coursesCompleted,
      assessmentsCompleted
    };
  }
});

// Award learning points to user (for gamification)
export const awardPoints = mutation({
  args: {
    userId: v.string(),
    points: v.number(),
    reason: v.string()
  },
  handler: async (ctx, args) => {
    if (args.points <= 0) {
      throw new Error("Points must be a positive number");
    }

    // Get user stats
    const userStats = await ctx.db
      .query("user_stats")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    if (!userStats) {
      // Create new stats with points (both camelCase and snake_case)
      const now = Date.now();
      const statsId = await ctx.db.insert("user_stats", {
        // CamelCase fields
        userId: args.userId,
        totalLearningHours: 0,
        coursesCompleted: 0,
        coursesInProgress: 0,
        assessmentsCompleted: 0,
        projectsSubmitted: 0,
        lastActiveAt: now,
        streakDays: 1,
        longestStreak: 1,
        totalPoints: args.points,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0],

        // Snake_case fields for backward compatibility
        user_id: args.userId,
        total_learning_hours: 0,
        courses_completed: 0,
        courses_in_progress: 0,
        assessments_completed: 0,
        projects_submitted: 0,
        last_active_at: now,
        streak_days: 1,
        longest_streak: 1,
        total_points: args.points,
        weekly_activity: [0, 0, 0, 0, 0, 0, 0]
      });

      // Log activity
      await ctx.db.insert("learning_activities", {
        userId: args.userId,
        type: "earned_points",
        timestamp: Date.now(),
        metadata: {
          points: args.points,
          reason: args.reason,
          newTotal: args.points
        }
      });

      return {
        success: true,
        newTotal: args.points,
        statsId
      };
    }

    // Update existing stats
    // Get the current value, handling both camelCase and snake_case
    const currentPoints = userStats.totalPoints || userStats.total_points || 0;
    const newTotal = currentPoints + args.points;
    const now = Date.now();

    await ctx.db.patch(userStats._id, {
      // Update both camelCase and snake_case fields
      totalPoints: newTotal,
      total_points: newTotal,
      lastActiveAt: now,
      last_active_at: now
    });

    // Log activity
    await ctx.db.insert("learning_activities", {
      userId: args.userId,
      type: "earned_points",
      timestamp: Date.now(),
      metadata: {
        points: args.points,
        reason: args.reason,
        newTotal
      }
    });

    return {
      success: true,
      newTotal,
      statsId: userStats._id
    };
  }
});