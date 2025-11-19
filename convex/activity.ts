import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get today's active minutes for a user if present
export const getTodayActiveMinutes = query({
  args: { userId: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("user_activities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const todayRecord = records.find(
      (r) =>
        r.activityType === "active_minutes" &&
        r.metadata &&
        r.metadata.date === args.date
    );
    if (!todayRecord) return null;
    return todayRecord.metadata?.minutes ?? null;
  },
});

// Upsert active minutes for today
export const upsertActiveMinutes = mutation({
  args: { userId: v.string(), date: v.string(), minutes: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user_activities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const todayRecord = existing.find(
      (r) =>
        r.activityType === "active_minutes" &&
        r.metadata &&
        r.metadata.date === args.date
    );
    const now = new Date().toISOString();

    if (todayRecord) {
      await ctx.db.patch(todayRecord._id, {
        metadata: { ...todayRecord.metadata, minutes: args.minutes },
        createdAt: now,
      });
      return { success: true };
    }

    await ctx.db.insert("user_activities", {
      userId: args.userId,
      activityType: "active_minutes",
      entityId: args.userId,
      entityType: "user",
      createdAt: now,
      metadata: { date: args.date, minutes: args.minutes },
    });

    return { success: true };
  },
});
