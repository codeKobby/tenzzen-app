import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user by Clerk ID
export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Create a new user (usually called via webhook or first login)
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) return existingUser._id;

    const now = new Date().toISOString();
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      credits: 5, // Default starting credits
      creditsSpent: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Deduct credits from user
export const deductCredits = mutation({
  args: {
    clerkId: v.optional(v.string()), // Use clerkId to find user easily from client
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    if (!args.clerkId) throw new Error("User ID required");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId as string))
      .unique();

    if (!user) throw new Error("User not found");

    const currentCredits = user.credits ?? 0;
    if (currentCredits < args.amount) {
      throw new Error("Insufficient credits");
    }

    await ctx.db.patch(user._id, {
      credits: currentCredits - args.amount,
      creditsSpent: (user.creditsSpent ?? 0) + args.amount,
      updatedAt: new Date().toISOString(),
    });

    return { success: true, remaining: currentCredits - args.amount };
  },
});

// Check if user has sufficient credits (helper query)
export const hasCredits = query({
  args: { clerkId: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return false;
    return (user.credits ?? 0) >= args.amount;
  },
});
