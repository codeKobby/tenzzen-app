import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get assessment progress for a user
export const getAssessmentProgress = query({
  args: { 
    courseId: v.string(),
    assessmentId: v.string()
  },
  handler: async (ctx, { courseId, assessmentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const progress = await ctx.db
      .query("progress")
      .filter(q => 
        q.eq(q.field("userId"), identity.subject) && 
        q.eq(q.field("courseId"), courseId) &&
        q.eq(q.field("assessmentId"), assessmentId)
      )
      .first();

    if (!progress) {
      return {
        status: "not_started" as const,
        score: undefined,
        feedback: undefined
      };
    }

    return {
      status: progress.status,
      score: progress.score,
      feedback: progress.feedback
    };
  }
});

// Start an assessment attempt
export const startAssessment = mutation({
  args: { 
    courseId: v.string(),
    assessmentId: v.string()
  },
  handler: async (ctx, { courseId, assessmentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if already started
    const existing = await ctx.db
      .query("progress")
      .filter(q => 
        q.eq(q.field("userId"), identity.subject) && 
        q.eq(q.field("courseId"), courseId) &&
        q.eq(q.field("assessmentId"), assessmentId)
      )
      .first();

    if (existing && existing.status !== "not_started") {
      throw new Error("Assessment already started");
    }

    const now = Date.now();
    await ctx.db.insert("progress", {
      userId: identity.subject,
      courseId,
      assessmentId,
      status: "in_progress",
      startedAt: now,
      updatedAt: now
    });
  }
});

// Submit assessment attempt
export const submitAssessment = mutation({
  args: { 
    courseId: v.string(),
    assessmentId: v.string(),
    submission: v.any()
  },
  handler: async (ctx, { courseId, assessmentId, submission }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current progress
    const progress = await ctx.db
      .query("progress")
      .filter(q => 
        q.eq(q.field("userId"), identity.subject) && 
        q.eq(q.field("courseId"), courseId) &&
        q.eq(q.field("assessmentId"), assessmentId)
      )
      .first();

    if (!progress) {
      throw new Error("Assessment not started");
    }

    if (progress.status === "completed" || progress.status === "graded") {
      throw new Error("Assessment already completed");
    }

    const now = Date.now();
    await ctx.db.patch(progress._id, {
      status: "completed",
      submission,
      completedAt: now,
      updatedAt: now
    });
  }
});

// Get all progress for a course
export const getCourseProgress = query({
  args: { courseId: v.string() },
  handler: async (ctx, { courseId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("progress")
      .filter(q => 
        q.eq(q.field("userId"), identity.subject) && 
        q.eq(q.field("courseId"), courseId)
      )
      .collect();
  }
});

// Mark assessment as graded (for auto-graded assessments)
export const gradeAssessment = mutation({
  args: { 
    courseId: v.string(),
    assessmentId: v.string(),
    score: v.number(),
    feedback: v.string()
  },
  handler: async (ctx, { courseId, assessmentId, score, feedback }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const progress = await ctx.db
      .query("progress")
      .filter(q => 
        q.eq(q.field("userId"), identity.subject) && 
        q.eq(q.field("courseId"), courseId) &&
        q.eq(q.field("assessmentId"), assessmentId)
      )
      .first();

    if (!progress || progress.status !== "completed") {
      throw new Error("Assessment not completed");
    }

    const now = Date.now();
    await ctx.db.patch(progress._id, {
      status: "graded",
      score,
      feedback,
      updatedAt: now
    });
  }
});