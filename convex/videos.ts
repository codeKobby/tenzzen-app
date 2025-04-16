import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { VideoDoc } from "./schema";

// Get cached video details
export const getCachedVideo = query({
  args: { 
    youtubeId: v.string()
  },
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("videos")
      .filter(q => 
        q.eq(q.field("youtubeId"), args.youtubeId)
      )
      .first();

    if (!video) {
      return null;
    }

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const cachedAt = new Date(video.cachedAt);

    // Return flag if cache is expired
    if (cachedAt < oneHourAgo) {
      return { _id: video._id, expired: true };
    }

    return video;
  }
});

// Delete expired video
export const deleteVideo = mutation({
  args: {
    id: v.id("videos")
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

// Save video details to cache
export const cacheVideo = mutation({
  args: {
    youtubeId: v.string(),
    details: v.object({
      type: v.string(),
      id: v.string(),
      title: v.string(),
      description: v.string(),
      duration: v.string(),
      thumbnail: v.string()
    }),
    cachedAt: v.string()
  },
  handler: async (ctx, args) => {
    // Delete existing cached video
    const existing = await ctx.db
      .query("videos")
      .filter(q => 
        q.eq(q.field("youtubeId"), args.youtubeId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Insert new video details
    return await ctx.db.insert("videos", {
      youtubeId: args.youtubeId,
      details: args.details,
      cachedAt: args.cachedAt
    });
  }
});

// Clean up old videos
export const clearOldVideos = mutation({
  args: {},
  handler: async (ctx) => {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const oldVideos = await ctx.db
      .query("videos")
      .collect();

    let deletedCount = 0;
    for (const video of oldVideos) {
      const cachedAt = new Date(video.cachedAt);
      if (cachedAt < oneHourAgo) {
        await ctx.db.delete(video._id);
        deletedCount++;
      }
    }

    return deletedCount;
  }
});
