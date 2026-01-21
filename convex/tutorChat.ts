import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Send a message to the tutor chat
export const sendMessage = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    lessonId: v.id("lessons"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const messageId = await ctx.db.insert("tutor_messages", {
      userId: args.userId,
      courseId: args.courseId,
      lessonId: args.lessonId,
      role: args.role,
      content: args.content,
      createdAt: now,
    });

    return messageId;
  },
});

// Get chat history for a specific lesson
export const getChatHistory = query({
  args: {
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("tutor_messages")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId),
      )
      .collect();

    // Sort by creation time
    return messages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  },
});

// Get all chat history for a course
export const getCourseChatHistory = query({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("tutor_messages")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .collect();

    return messages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  },
});

// Clear chat history for a lesson
export const clearLessonChat = mutation({
  args: {
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("tutor_messages")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId),
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    return { deleted: messages.length };
  },
});
