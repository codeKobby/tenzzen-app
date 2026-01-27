import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
// import { api } from "./_generated/api";

// --- Queries ---

export const list = query({
  args: {
    userId: v.string(),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("glossary")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.search) {
      // Basic client-side filtering logic for now, or use search index if needed for fuzzy
      // But for exact/prefix matches on terms, this is okay or we switch to search index
      // Using search index for better text search:
      return await ctx.db
        .query("glossary")
        .withSearchIndex("search_term", (q) =>
          q.search("term", args.search!).eq("userId", args.userId),
        )
        .take(50);
    }

    return await q.order("desc").collect();
  },
});

// --- Mutations ---

export const create = mutation({
  args: {
    userId: v.string(),
    term: v.string(),
    definition: v.string(),
    tags: v.optional(v.array(v.string())),
    sourceId: v.optional(v.string()),
    sourceType: v.union(
      v.literal("lesson"),
      v.literal("material"),
      v.literal("manual"),
    ),
  },
  handler: async (ctx, args) => {
    // Check for duplicate term for this user
    const existing = await ctx.db
      .query("glossary")
      .withIndex("by_user_term", (q) =>
        q.eq("userId", args.userId).eq("term", args.term),
      )
      .first();

    if (existing) {
      throw new Error(`Term "${args.term}" already exists.`);
    }

    const id = await ctx.db.insert("glossary", {
      userId: args.userId,
      term: args.term,
      definition: args.definition,
      tags: args.tags || [],
      sourceId: args.sourceId,
      sourceType: args.sourceType,
      createdAt: new Date().toString(),
      updatedAt: new Date().toString(),
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("glossary"),
    definition: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      definition: args.definition,
      updatedAt: new Date().toString(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("glossary"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// --- AI Actions ---

export const extractTerms = action({
  args: {
    text: v.string(),
    userId: v.string(),
    sourceId: v.string(),
    sourceType: v.union(v.literal("lesson"), v.literal("material")),
  },
  handler: async (_ctx, _args) => {
    // TODO: Integrate with actual AI service (Gemini/OpenAI)
    // For now, return mock data or simple regex extraction to verify flow

    // Simulate AI delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock response logic
    const mockTerms = [
      {
        term: "React",
        definition: "A JavaScript library for building user interfaces.",
      },
      { term: "Component", definition: "A reusable piece of UI." },
      {
        term: "Hook",
        definition:
          "A special function that lets you 'hook into' React features.",
      },
    ];

    // In a real implementation, we would call the AI provider here:
    // const prompt = `Extract key terms and definitions from: ${args.text}`;
    // const result = await ai.generate(prompt);

    return mockTerms;
  },
});
