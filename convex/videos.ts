import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { VideoDoc, TranscriptSegment } from "./schema";

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

// Get transcript from video document
export const getVideoTranscript = query({
  args: { 
    youtubeId: v.string(),
    language: v.string()
  },
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("videos")
      .filter(q => 
        q.eq(q.field("youtubeId"), args.youtubeId)
      )
      .first();

    if (!video || !video.transcripts) {
      return null;
    }

    // Find transcript in the specified language
    const transcript = video.transcripts.find(t => t.language === args.language);
    if (!transcript) {
      return null;
    }

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const cachedAt = new Date(transcript.cachedAt);

    // Return flag if cache is expired
    if (cachedAt < oneHourAgo) {
      return { youtubeId: args.youtubeId, language: args.language, expired: true };
    }

    return {
      youtubeId: args.youtubeId,
      language: args.language,
      segments: transcript.segments,
      cachedAt: transcript.cachedAt
    };
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
      title: v.optional(v.string()), // Use optional as schema allows it
      description: v.string(),
      duration: v.string(), // ISO 8601 duration
      thumbnail: v.string(),
      // Add new optional fields matching the schema
      channelId: v.optional(v.string()),
      channelName: v.optional(v.string()),
      channelAvatar: v.optional(v.string()),
      views: v.optional(v.string()),
      likes: v.optional(v.string()),
      publishDate: v.optional(v.string())
    }),
    cachedAt: v.string()
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("videos")
      .filter(q => 
        q.eq(q.field("youtubeId"), args.youtubeId)
      )
      .first();

    if (existing) {
      // Preserve existing transcripts when updating video details
      const transcripts = existing.transcripts || [];
      // Use patch to update existing document instead of delete/insert
      // This preserves the original _id and _creationTime
      await ctx.db.patch(existing._id, {
        details: args.details, // Pass the full details object
        transcripts: transcripts, // Keep existing transcripts
        cachedAt: args.cachedAt
      });
      return existing._id; // Return the ID of the updated document
    }

    // Insert new video details without transcripts
    return await ctx.db.insert("videos", {
      youtubeId: args.youtubeId,
      details: args.details, // Pass the full details object
      cachedAt: args.cachedAt
      // transcripts will be undefined initially
    });
  }
});

// Add/update transcript in video document
export const cacheVideoTranscript = mutation({
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
    // Get existing video
    const video = await ctx.db
      .query("videos")
      .filter(q => 
        q.eq(q.field("youtubeId"), args.youtubeId)
      )
      .first();

    // If video doesn't exist yet, create a placeholder video document first
    if (!video) {
      // Create placeholder video document to hold the transcript
      const videoId = await ctx.db.insert("videos", {
        youtubeId: args.youtubeId,
        details: {
          type: "video",
          id: args.youtubeId,
          title: "Placeholder Title",
          description: "",
          duration: "",
          thumbnail: ""
        },
        transcripts: [{
          language: args.language,
          segments: args.segments,
          cachedAt: args.cachedAt
        }],
        cachedAt: args.cachedAt
      });
      return videoId;
    }

    // If video exists, update its transcripts
    let transcripts = video.transcripts || [];
    
    // Remove existing transcript in the same language if present
    transcripts = transcripts.filter(t => t.language !== args.language);
    
    // Add the new transcript
    transcripts.push({
      language: args.language,
      segments: args.segments,
      cachedAt: args.cachedAt
    });

    // Update the video document with the new transcripts array
    return await ctx.db.patch(video._id, {
      transcripts: transcripts
    });
  }
});

// Delete a specific transcript from a video
export const deleteVideoTranscript = mutation({
  args: {
    youtubeId: v.string(),
    language: v.string()
  },
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("videos")
      .filter(q => 
        q.eq(q.field("youtubeId"), args.youtubeId)
      )
      .first();

    if (!video || !video.transcripts) {
      return null;
    }

    // Filter out the transcript in the specified language
    const updatedTranscripts = video.transcripts.filter(t => t.language !== args.language);
    
    // Update the video document with the filtered transcripts
    return await ctx.db.patch(video._id, {
      transcripts: updatedTranscripts
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
