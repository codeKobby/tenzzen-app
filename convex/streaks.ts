import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get user's streak data
export const getStreak = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const streak = await ctx.db
      .query("user_streaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!streak) {
      // Return default streak data for new users
      const todayStr = new Date().toISOString().split('T')[0];
      return {
        streakDays: 0,
        longestStreak: 0,
        lastCheckIn: todayStr,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0], // 7 days
      };
    }

    return streak;
  },
});

// Check in user for today (update streak)
export const checkInStreak = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    let streak = await ctx.db
      .query("user_streaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!streak) {
      // Create new streak record
      const newStreakId = await ctx.db.insert("user_streaks", {
        userId: args.userId,
        streakDays: 1,
        longestStreak: 1,
        lastCheckIn: todayStr,
        weeklyActivity: [1, 0, 0, 0, 0, 0, 0], // Today is active
      });

      // Log activity
      await ctx.db.insert("user_activities", {
        userId: args.userId,
        activityType: "login",
        entityId: args.userId,
        entityType: "user",
        createdAt: new Date().toISOString(),
      });

      return await ctx.db.get(newStreakId);
    }

    // Check if already checked in today
    if (streak.lastCheckIn === todayStr) {
      return streak; // Already checked in
    }

    const lastCheckIn = new Date(streak.lastCheckIn + 'T00:00:00');
    const daysDiff = Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));

    let newStreakDays = streak.streakDays;
    let newWeeklyActivity = [...streak.weeklyActivity];

    if (daysDiff === 1) {
      // Consecutive day - increment streak
      newStreakDays += 1;
      // Shift weekly activity and add today's check-in
      newWeeklyActivity.shift();
      newWeeklyActivity.push(1);
    } else if (daysDiff > 1) {
      // Streak broken - reset to 1
      newStreakDays = 1;
      // Reset weekly activity
      newWeeklyActivity = [1, 0, 0, 0, 0, 0, 0];
    }

    const newLongestStreak = Math.max(streak.longestStreak, newStreakDays);

    await ctx.db.patch(streak._id, {
      streakDays: newStreakDays,
      longestStreak: newLongestStreak,
      lastCheckIn: todayStr,
      weeklyActivity: newWeeklyActivity,
    });

    // Log activity
    await ctx.db.insert("user_activities", {
      userId: args.userId,
      activityType: "login",
      entityId: args.userId,
      entityType: "user",
      createdAt: new Date().toISOString(),
    });

    return await ctx.db.get(streak._id);
  },
});

// Update streak manually (for testing or admin purposes)
export const updateStreak = mutation({
  args: {
    userId: v.string(),
    streakDays: v.optional(v.number()),
    longestStreak: v.optional(v.number()),
    lastCheckIn: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    const streak = await ctx.db
      .query("user_streaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!streak) {
      throw new Error("Streak record not found");
    }

    await ctx.db.patch(streak._id, updates);
    return await ctx.db.get(streak._id);
  },
});
