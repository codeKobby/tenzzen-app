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
      return {
        userId: args.userId,
        totalLearningHours: 0,
        coursesCompleted: 0,
        coursesInProgress: 0,
        assessmentsCompleted: 0,
        projectsSubmitted: 0,
        lastActiveAt: Date.now(),
        streakDays: 0,
        longestStreak: 0,
        totalPoints: 0,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0] // One value per day of week
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
    
    // Create new user stats
    const statsId = await ctx.db.insert("user_stats", {
      userId: args.userId,
      totalLearningHours: 0,
      coursesCompleted: 0,
      coursesInProgress: 0,
      assessmentsCompleted: 0,
      projectsSubmitted: 0,
      lastActiveAt: Date.now(),
      streakDays: 1, // Start with day 1 of streak
      longestStreak: 1,
      totalPoints: 0,
      weeklyActivity: [0, 0, 0, 0, 0, 0, 0] // One value per day of week
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
    const lastActive = userStats.lastActiveAt;
    
    // Calculate the days since last activity
    const daysSinceLastActive = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
    
    let newStreakDays = userStats.streakDays;
    let newLongestStreak = userStats.longestStreak;
    
    // If the user was active today already, no change to streak
    if (daysSinceLastActive < 1) {
      // Just update the last active time
      await ctx.db.patch(userStats._id, {
        lastActiveAt: now
      });
      
      return { 
        streakDays: userStats.streakDays, 
        longestStreak: userStats.longestStreak,
        streakChanged: false 
      };
    }
    
    // If the user was active yesterday, increment streak
    if (daysSinceLastActive === 1) {
      newStreakDays += 1;
      
      // Update longest streak if current streak is longer
      if (newStreakDays > newLongestStreak) {
        newLongestStreak = newStreakDays;
      }
    } 
    // If the user missed a day, reset streak to 1
    else {
      newStreakDays = 1;
    }
    
    // Update the user's weekly activity
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const weeklyActivity = userStats.weeklyActivity ? [...userStats.weeklyActivity] : [0, 0, 0, 0, 0, 0, 0];
    
    weeklyActivity[dayOfWeek] += 1;
    
    // Update stats
    await ctx.db.patch(userStats._id, {
      streakDays: newStreakDays,
      longestStreak: newLongestStreak,
      lastActiveAt: now,
      weeklyActivity
    });
    
    return { 
      streakDays: newStreakDays, 
      longestStreak: newLongestStreak,
      streakChanged: true 
    };
  }
});

// Log learning activity
export const logLearningActivity = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
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
        lastActiveAt: now
      };
      
      // Update learning hours if time spent is provided
      if (args.timeSpent) {
        const hoursSpent = args.timeSpent / (1000 * 60 * 60); // Convert ms to hours
        updates.totalLearningHours = userStats.totalLearningHours + hoursSpent;
      }
      
      // Update specific counters based on activity type
      if (args.type === "completed_assessment") {
        updates.assessmentsCompleted = userStats.assessmentsCompleted + 1;
      } else if (args.type === "submitted_project") {
        updates.projectsSubmitted = userStats.projectsSubmitted + 1;
      } else if (args.type === "completed_course") {
        updates.coursesCompleted = userStats.coursesCompleted + 1;
        // Decrement in-progress count if it's greater than 0
        if (userStats.coursesInProgress > 0) {
          updates.coursesInProgress = userStats.coursesInProgress - 1;
        }
      } else if (args.type === "started_course") {
        updates.coursesInProgress = userStats.coursesInProgress + 1;
      }
      
      // Update weekly activity
      const dayOfWeek = new Date().getDay();
      const weeklyActivity = userStats.weeklyActivity ? [...userStats.weeklyActivity] : [0, 0, 0, 0, 0, 0, 0];
      weeklyActivity[dayOfWeek] += 1;
      updates.weeklyActivity = weeklyActivity;
      
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
      .filter(q => q.eq(q.field("userId"), args.userId))
      .order("desc"); // Fixed: removed second parameter
    
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
      // Create new stats with points
      const statsId = await ctx.db.insert("user_stats", {
        userId: args.userId,
        totalLearningHours: 0,
        coursesCompleted: 0,
        coursesInProgress: 0,
        assessmentsCompleted: 0,
        projectsSubmitted: 0,
        lastActiveAt: Date.now(),
        streakDays: 1,
        longestStreak: 1,
        totalPoints: args.points,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0]
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
    const newTotal = (userStats.totalPoints || 0) + args.points;
    
    await ctx.db.patch(userStats._id, {
      totalPoints: newTotal,
      lastActiveAt: Date.now()
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