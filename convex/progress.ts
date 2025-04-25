import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { ProgressStatus } from "./types";

// Get assessment progress for a user
export const getAssessmentProgress = query({
  args: { 
    assessmentId: v.id("assessments")
  },
  handler: async (ctx, { assessmentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const progress = await ctx.db
      .query("progress")
      .withIndex("by_user_assessment", (q) => 
        q.eq("userId", identity.subject).eq("assessmentId", assessmentId)
      )
      .first();

    if (!progress) {
      return {
        status: "not_started" as ProgressStatus,
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
    assessmentId: v.id("assessments")
  },
  handler: async (ctx, { assessmentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if already started
    const existing = await ctx.db
      .query("progress")
      .withIndex("by_user_assessment", (q) => 
        q.eq("userId", identity.subject).eq("assessmentId", assessmentId)
      )
      .first();

    if (existing && existing.status !== "not_started") {
      throw new Error("Assessment already started");
    }

    const now = Date.now();
    await ctx.db.insert("progress", {
      userId: identity.subject,
      assessmentId,
      status: "in_progress",
      startedAt: now
    });
  }
});

// Submit assessment attempt
export const submitAssessment = mutation({
  args: { 
    assessmentId: v.id("assessments"),
    submission: v.any()
  },
  handler: async (ctx, { assessmentId, submission }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current progress
    const progress = await ctx.db
      .query("progress")
      .withIndex("by_user_assessment", (q) => 
        q.eq("userId", identity.subject).eq("assessmentId", assessmentId)
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
      completedAt: now
    });
  }
});

// Get all progress for a user
export const getUserProgress = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("progress")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  }
});

// Mark assessment as graded (for auto-graded assessments)
export const gradeAssessment = mutation({
  args: { 
    assessmentId: v.id("assessments"),
    score: v.number(),
    feedback: v.optional(v.string())
  },
  handler: async (ctx, { assessmentId, score, feedback }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const progress = await ctx.db
      .query("progress")
      .withIndex("by_user_assessment", (q) => 
        q.eq("userId", identity.subject).eq("assessmentId", assessmentId)
      )
      .first();

    if (!progress || progress.status !== "completed") {
      throw new Error("Assessment not completed");
    }

    await ctx.db.patch(progress._id, {
      status: "graded",
      score,
      feedback
    });
  }
});