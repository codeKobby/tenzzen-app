import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getOrCreateUser, updateUserLogin, getUserWithProfile } from "./helpers";

// Create or update a user when they sign in
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    try {
      // Create or update the user
      const userId = await getOrCreateUser(ctx, args.clerkId, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl
      });
      
      // Update login information
      await updateUserLogin(ctx, args.clerkId, args.ipAddress, args.userAgent);
      
      return { success: true, userId };
    } catch (error) {
      console.error("Error creating/updating user:", error);
      return { success: false, error: (error as Error).message };
    }
  }
});

// Get user data including profile and stats
export const getCurrentUser = query({
  args: {
    clerkId: v.string()
  },
  handler: async (ctx, args) => {
    try {
      const userData = await getUserWithProfile(ctx, args.clerkId);
      return userData;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  }
});