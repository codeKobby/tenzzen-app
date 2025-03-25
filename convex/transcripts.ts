import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a cached transcript in the database
export const cacheTranscript = mutation({
  args: {
    youtubeId: v.string(),
    language: v.string(),
    segments: v.array(
      v.object({
        text: v.string(),
        duration: v.number(),
        offset: v.number(),
      })
    ),
    cachedAt: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if transcript already exists
    const existing = await ctx.db
      .query("transcripts")
      .withIndex("by_youtube_id_and_language", (q) =>
        q.eq("youtubeId", args.youtubeId).eq("language", args.language)
      )
      .first();

    // If transcript exists, update it
    if (existing) {
      return await ctx.db.patch(existing._id, {
        segments: args.segments,
        cachedAt: args.cachedAt,
      });
    }

    // Otherwise create a new record
    return await ctx.db.insert("transcripts", {
      youtubeId: args.youtubeId,
      language: args.language,
      segments: args.segments,
      cachedAt: args.cachedAt,
    });
  },
});

// Retrieve a cached transcript from the database
export const getCachedTranscript = query({
  args: {
    youtubeId: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transcripts")
      .withIndex("by_youtube_id_and_language", (q) =>
        q.eq("youtubeId", args.youtubeId).eq("language", args.language)
      )
      .first();
  },
});
