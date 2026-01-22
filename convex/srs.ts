import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getUserId } from "./helpers";

// List all SRS items for the authenticated user
export const listItems = query({
  args: {
    courseId: v.optional(v.id("courses")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) return [];

    let items;
    if (args.courseId) {
      items = await ctx.db
        .query("srs_items")
        .withIndex("by_user_course", (q) =>
          q.eq("userId", userId).eq("courseId", args.courseId!),
        )
        .collect();
    } else {
      items = await ctx.db
        .query("srs_items")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    }

    return items;
  },
});

// Get items due for review today
export const getDueItems = query({
  args: {
    courseId: v.optional(v.id("courses")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) return [];

    const today = new Date().toISOString().split("T")[0];

    const allItems = await ctx.db
      .query("srs_items")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter for due items
    let dueItems = allItems.filter((item) => item.nextReviewDate <= today);

    // Filter by course if specified
    if (args.courseId) {
      dueItems = dueItems.filter((item) => item.courseId === args.courseId);
    }

    return dueItems;
  },
});

// Get SRS stats for the user
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return null;

    const today = new Date().toISOString().split("T")[0];

    const allItems = await ctx.db
      .query("srs_items")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const dueCount = allItems.filter(
      (item) => item.nextReviewDate <= today,
    ).length;
    const totalCount = allItems.length;
    const masteredCount = allItems.filter(
      (item) => item.repetitions >= 5,
    ).length;

    // Group by course
    const byCourse = allItems.reduce(
      (acc, item) => {
        const key = item.courseId.toString();
        if (!acc[key]) {
          acc[key] = { total: 0, due: 0 };
        }
        acc[key].total++;
        if (item.nextReviewDate <= today) {
          acc[key].due++;
        }
        return acc;
      },
      {} as Record<string, { total: number; due: number }>,
    );

    return {
      dueCount,
      totalCount,
      masteredCount,
      byCourse,
    };
  },
});

// Create a new SRS item
export const createItem = mutation({
  args: {
    courseId: v.id("courses"),
    lessonId: v.optional(v.id("lessons")),
    quizQuestionId: v.optional(v.id("quizQuestions")),
    front: v.string(),
    back: v.string(),
    cardType: v.union(
      v.literal("quiz"),
      v.literal("key_point"),
      v.literal("user_created"),
    ),
    easeFactor: v.number(),
    interval: v.number(),
    repetitions: v.number(),
    nextReviewDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const now = new Date().toISOString();

    const itemId = await ctx.db.insert("srs_items", {
      userId,
      courseId: args.courseId,
      lessonId: args.lessonId,
      quizQuestionId: args.quizQuestionId,
      front: args.front,
      back: args.back,
      cardType: args.cardType,
      easeFactor: args.easeFactor,
      interval: args.interval,
      repetitions: args.repetitions,
      nextReviewDate: args.nextReviewDate,
      createdAt: now,
      updatedAt: now,
    });

    return itemId;
  },
});

// Update an SRS item after review
export const updateItem = mutation({
  args: {
    id: v.id("srs_items"),
    easeFactor: v.number(),
    interval: v.number(),
    repetitions: v.number(),
    nextReviewDate: v.string(),
    lastReviewedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const item = await ctx.db.get(args.id);
    if (!item || item.userId !== userId) {
      throw new Error("Item not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      easeFactor: args.easeFactor,
      interval: args.interval,
      repetitions: args.repetitions,
      nextReviewDate: args.nextReviewDate,
      lastReviewedAt: args.lastReviewedAt,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Delete an SRS item
export const deleteItem = mutation({
  args: {
    id: v.id("srs_items"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const item = await ctx.db.get(args.id);
    if (!item || item.userId !== userId) {
      throw new Error("Item not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

// Bulk create SRS items from quiz questions
export const createFromQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");

    const questions = await ctx.db
      .query("quizQuestions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    const now = new Date().toISOString();
    const today = now.split("T")[0];

    const createdIds = [];

    for (const question of questions) {
      // Check if SRS item already exists for this question
      const existing = await ctx.db
        .query("srs_items")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("quizQuestionId"), question._id))
        .first();

      if (!existing) {
        const itemId = await ctx.db.insert("srs_items", {
          userId,
          courseId: quiz.courseId,
          lessonId: quiz.lessonId,
          quizQuestionId: question._id,
          front: question.question,
          back:
            question.options && question.correctAnswer !== undefined ?
              question.options[question.correctAnswer]
            : question.explanation,
          cardType: "quiz",
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReviewDate: today,
          createdAt: now,
          updatedAt: now,
        });
        createdIds.push(itemId);
      }
    }

    return { created: createdIds.length };
  },
});
