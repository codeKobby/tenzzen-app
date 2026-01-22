import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new note
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.string(),
    tags: v.optional(v.array(v.string())),
    courseId: v.optional(v.string()),
    lessonId: v.optional(v.string()),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Basic validation
    if (!args.title.trim()) {
      throw new Error("Title is required");
    }

    const noteId = await ctx.db.insert("notes", {
      title: args.title,
      content: args.content,
      category: args.category,
      tags: args.tags || [],
      courseId: args.courseId,
      lessonId: args.lessonId,
      clerkId: args.clerkId,
      isStarred: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return noteId;
  },
});

// Update an existing note
export const update = mutation({
  args: {
    id: v.id("notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isStarred: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Note not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Delete a note
export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Note not found");
    }
    await ctx.db.delete(args.id);
  },
});

// Toggle star status
export const toggleStar = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);
    if (!note) {
      throw new Error("Note not found");
    }

    await ctx.db.patch(args.id, {
      isStarred: !note.isStarred,
      updatedAt: Date.now(),
    });
  },
});

// Get a single note
export const get = query({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List notes with filters
export const list = query({
  args: {
    clerkId: v.string(),
    filter: v.optional(v.string()), // 'all', 'starred', 'course', 'personal', 'code'
    search: v.optional(v.string()),
    courseId: v.optional(v.string()),
    lessonId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let notes;

    // First filter by user
    if (args.filter === "starred") {
      // For starred, we can't easily use a compound index if we also want to filter by courseId etc.
      // But we can filter in memory for now as note volume per user is likely manageable.
      // Or we can query by clerkId and filter.
      notes = await ctx.db
        .query("notes")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
        .collect();
      notes = notes.filter((n) => n.isStarred);
    } else if (args.filter && args.filter !== "all") {
      // Filter by category
      notes = await ctx.db
        .query("notes")
        .withIndex("by_clerk_and_category", (q) =>
          q.eq("clerkId", args.clerkId).eq("category", args.filter as string),
        )
        .collect();
    } else {
      // All notes for user
      notes = await ctx.db
        .query("notes")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
        .collect();
    }

    // Apply additional in-memory filters
    if (args.courseId) {
      notes = notes.filter((n) => n.courseId === args.courseId);
    }

    if (args.lessonId) {
      notes = notes.filter((n) => n.lessonId === args.lessonId);
    }

    // Apply search
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchLower) ||
          n.content.toLowerCase().includes(searchLower),
      );
    }

    // Sort by updated at desc
    return notes.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});
