import { internalMutation } from "./_generated/server";

/**
 * Internal Cron Task Handlers
 *
 * These are internal functions called by scheduled cron jobs.
 * They handle periodic maintenance and background processing.
 */

// Cleanup notifications older than 30 days
export const cleanupOldNotifications = internalMutation({
  handler: async (ctx) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    // Get old read notifications
    const oldNotifications = await ctx.db
      .query("notifications")
      .filter((q) =>
        q.and(
          q.eq(q.field("read"), true),
          q.lt(q.field("createdAt"), cutoffDate),
        ),
      )
      .take(100); // Process in batches

    let deleted = 0;
    for (const notification of oldNotifications) {
      await ctx.db.delete(notification._id);
      deleted++;
    }

    console.log(`[Cron] Cleaned up ${deleted} old notifications`);
    return { deleted };
  },
});

// Recalculate trending scores based on recent activity
export const recalculateTrendingScores = internalMutation({
  handler: async (ctx) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    let updated = 0;
    for (const course of courses) {
      // Calculate trust score based on multiple factors
      const enrollmentWeight = (course.enrollmentCount || 0) * 2;
      const upvoteWeight = (course.upvoteCount || 0) * 3;
      const ratingWeight = (course.rating || 0) * 10;

      // Decay factor based on age (courses lose 10% score per month)
      const ageInDays =
        (Date.now() - new Date(course.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);
      const decayFactor = Math.max(0.5, 1 - ageInDays / 300); // Min 50% after ~10 months

      const trustScore =
        (enrollmentWeight + upvoteWeight + ratingWeight) * decayFactor;

      await ctx.db.patch(course._id, {
        trustScore: Math.round(trustScore * 100) / 100,
        updatedAt: new Date().toISOString(),
      });
      updated++;
    }

    console.log(`[Cron] Recalculated trending scores for ${updated} courses`);
    return { updated };
  },
});

// Process pending generation jobs
export const processPendingJobs = internalMutation({
  handler: async (ctx) => {
    // Get pending jobs that haven't been picked up
    const pendingJobs = await ctx.db
      .query("generation_jobs")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(3); // Process max 3 at a time

    let processed = 0;
    for (const job of pendingJobs) {
      // Mark as processing
      await ctx.db.patch(job._id, {
        status: "processing",
        updatedAt: new Date().toISOString(),
      });
      processed++;

      // Note: Actual generation is triggered via server action
      // This cron just marks jobs ready for processing
      // The frontend polls job status and can trigger generation
    }

    if (processed > 0) {
      console.log(`[Cron] Marked ${processed} jobs as processing`);
    }
    return { processed };
  },
});

// Cleanup old completed/failed generation jobs
export const cleanupOldJobs = internalMutation({
  handler: async (ctx) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString();

    // Get old completed/failed jobs
    const oldJobs = await ctx.db
      .query("generation_jobs")
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("status"), "completed"),
            q.eq(q.field("status"), "failed"),
          ),
          q.lt(q.field("createdAt"), cutoffDate),
        ),
      )
      .take(50);

    let deleted = 0;
    for (const job of oldJobs) {
      await ctx.db.delete(job._id);
      deleted++;
    }

    if (deleted > 0) {
      console.log(`[Cron] Cleaned up ${deleted} old generation jobs`);
    }
    return { deleted };
  },
});
