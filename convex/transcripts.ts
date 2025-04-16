import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { TranscriptSegment, TranscriptDoc } from "./schema";
import { Id } from "./_generated/dataModel";

// Get cached transcript
export const getCachedTranscript = query({
  args: { 
    youtubeId: v.string(),
    language: v.string()
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("transcripts")
      .filter(q => 
        q.and(
          q.eq(q.field("youtubeId"), args.youtubeId),
          q.eq(q.field("language"), args.language)
        )
      )
      .collect();

    const transcript = results[0];
    if (!transcript) {
      return null;
    }

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const cachedAt = new Date(transcript.cachedAt);

    // Return null if cache is older than 1 hour
    if (cachedAt < oneHourAgo) {
      return { _id: transcript._id, expired: true };
    }

    return transcript;
  }
});

// Delete expired transcript
export const deleteTranscript = mutation({
  args: {
    id: v.id("transcripts")
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

// Save transcript to cache
export const cacheTranscript = mutation({
  args: {
    youtubeId: v.string(),
    language: v.string(),
    segments: v.array(v.object({
      text: v.string(),
      start: v.number(),
      duration: v.number()
    })),
    cachedAt: v.string()
  },
  handler: async (ctx, args) => {
    // Get existing transcript
    const results = await ctx.db
      .query("transcripts")
      .filter(q => 
        q.and(
          q.eq(q.field("youtubeId"), args.youtubeId),
          q.eq(q.field("language"), args.language)
        )
      )
      .collect();

    const existing = results[0];
    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Insert new transcript
    return await ctx.db.insert("transcripts", {
      youtubeId: args.youtubeId,
      language: args.language,
      segments: args.segments,
      cachedAt: args.cachedAt
    });
  }
});

// Clean up old transcripts
export const clearOldTranscripts = mutation({
  args: {},
  handler: async (ctx) => {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const oldTranscripts = await ctx.db
      .query("transcripts")
      .collect();

    let deletedCount = 0;
    for (const transcript of oldTranscripts) {
      const cachedAt = new Date(transcript.cachedAt);
      if (cachedAt < oneHourAgo) {
        await ctx.db.delete(transcript._id);
        deletedCount++;
      }
    }

    return deletedCount;
  }
});
