import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Generation Jobs - Handles course generation deduplication and async processing
 *
 * Key features:
 * - Prevents duplicate course generation for same YouTube URL
 * - Implements watcher pattern for multiple users requesting same course
 * - Atomic credit consumption before job creation
 */

// Check if a generation job already exists for a source
export const checkExistingJob = query({
  args: { sourceId: v.string() },
  handler: async (ctx, { sourceId }) => {
    // Check for pending or processing jobs
    const existingJob = await ctx.db
      .query("generation_jobs")
      .withIndex("by_source_status", (q) => q.eq("sourceId", sourceId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "processing"),
        ),
      )
      .first();

    return existingJob;
  },
});

// Request a new course generation (with deduplication)
export const requestGeneration = mutation({
  args: {
    sourceId: v.string(),
    sourceUrl: v.string(),
    sourceType: v.union(v.literal("youtube"), v.literal("topic")),
    userId: v.string(),
  },
  handler: async (ctx, { sourceId, sourceUrl, sourceType, userId }) => {
    // Check 1: Does a public course already exist for this source?
    const existingCourse = await ctx.db
      .query("courses")
      .withIndex("by_source", (q) =>
        q
          .eq("sourceType", sourceType === "topic" ? "topic" : "youtube")
          .eq("sourceId", sourceId),
      )
      .filter((q) => q.eq(q.field("isPublic"), true))
      .first();

    if (existingCourse) {
      return {
        status: "exists" as const,
        courseId: existingCourse._id,
        message: "Course already exists. You can fork it to customize.",
      };
    }

    // Check 2: Is there already a pending/processing job for this sourceId?
    const existingJob = await ctx.db
      .query("generation_jobs")
      .withIndex("by_source_status", (q) => q.eq("sourceId", sourceId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "processing"),
        ),
      )
      .first();

    if (existingJob) {
      // Add user as watcher if not already watching
      const watchers = existingJob.watchers || [];
      if (!watchers.includes(userId)) {
        await ctx.db.patch(existingJob._id, {
          watchers: [...watchers, userId],
          updatedAt: new Date().toISOString(),
        });
      }
      return {
        status: "queued" as const,
        jobId: existingJob._id,
        message:
          "This course is already being generated. You'll be notified when ready.",
      };
    }

    // Create new generation job
    const jobId = await ctx.db.insert("generation_jobs", {
      sourceId,
      sourceUrl,
      sourceType,
      status: "pending",
      createdBy: userId,
      watchers: [userId],
      retryCount: 0,
      createdAt: new Date().toISOString(),
    });

    return {
      status: "created" as const,
      jobId,
      message: "Course generation started.",
    };
  },
});

// Update job status (used by background processor)
export const updateJobStatus = internalMutation({
  args: {
    jobId: v.id("generation_jobs"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    resultCourseId: v.optional(v.id("courses")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, status, resultCourseId, error }) => {
    await ctx.db.patch(jobId, {
      status,
      resultCourseId,
      error,
      updatedAt: new Date().toISOString(),
    });

    // If completed, notify all watchers
    if (status === "completed" && resultCourseId) {
      const job = await ctx.db.get(jobId);
      if (job?.watchers) {
        for (const userId of job.watchers) {
          await ctx.db.insert("notifications", {
            userId,
            type: "success",
            title: "Course Ready!",
            message: "Your course has been generated and is ready to view.",
            link: `/courses/${resultCourseId}`,
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // If failed, notify watchers
    if (status === "failed") {
      const job = await ctx.db.get(jobId);
      if (job?.watchers) {
        for (const userId of job.watchers) {
          await ctx.db.insert("notifications", {
            userId,
            type: "error",
            title: "Generation Failed",
            message: error || "Course generation failed. Please try again.",
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  },
});

// Get user's generation jobs
export const getUserJobs = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const jobs = await ctx.db
      .query("generation_jobs")
      .withIndex("by_user", (q) => q.eq("createdBy", userId))
      .order("desc")
      .take(10);

    return jobs;
  },
});

// Get job status for polling
export const getJobStatus = query({
  args: { jobId: v.id("generation_jobs") },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId);
    if (!job) return null;

    return {
      status: job.status,
      resultCourseId: job.resultCourseId,
      error: job.error,
    };
  },
});

// Get pending jobs for processing (used by cron)
export const getPendingJobs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 5 }) => {
    const jobs = await ctx.db
      .query("generation_jobs")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("asc") // FIFO
      .take(limit);

    return jobs;
  },
});
