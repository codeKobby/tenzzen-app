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
    const transcript = video.transcripts.find((t: { language: string; segments: TranscriptSegment[]; cachedAt: string }) => t.language === args.language);
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

// Save video details to cache with better conflict handling
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
    cachedAt: v.string(),
    // Add courseData field (optional)
    courseData: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    // First check if the video already exists and get it atomically
    const existing = await ctx.db
      .query("videos")
      .filter(q => 
        q.eq(q.field("youtubeId"), args.youtubeId)
      )
      .first();

    // If the video exists and has courseData, don't update it - just return the ID
    if (existing && existing.courseData) {
      console.log(`Video ${args.youtubeId} already has course data, skipping cache operation`);
      return existing._id;
    }

    // Determine if we need to set courseData
    const shouldSetCourseData = args.courseData !== undefined;
    
    // If the video exists
    if (existing) {
      try {
        // Preserve existing transcripts when updating video details
        const transcripts = existing.transcripts || [];
        // Use patch to update existing document instead of delete/insert
        // This preserves the original _id and _creationTime
        const updates: any = {
          details: args.details, // Pass the full details object
          transcripts: transcripts, // Keep existing transcripts
          cachedAt: args.cachedAt
        };
        
        // Add courseData if provided
        if (shouldSetCourseData) {
          updates.courseData = args.courseData;
        }
        
        await ctx.db.patch(existing._id, updates);
        return existing._id; // Return the ID of the updated document
      } catch (error) {
        // Log the error but don't throw - this helps avoid cascade failures
        console.error(`Error updating video ${args.youtubeId}:`, error);
        // Even if patching fails, return the existing ID so clients can try again or use existing data
        return existing._id;
      }
    }

    // Insert new video details without transcripts
    try {
      const insertData: any = {
        youtubeId: args.youtubeId,
        details: args.details, // Pass the full details object
        cachedAt: args.cachedAt
        // transcripts will be undefined initially
      };
      
      // Add courseData if provided
      if (shouldSetCourseData) {
        insertData.courseData = args.courseData;
      };
      
      return await ctx.db.insert("videos", insertData);
    } catch (error) {
      // If insertion fails, try one more time to fetch the document
      // It's possible another concurrent request succeeded in creating it
      console.error(`Insert failed for video ${args.youtubeId}, checking if created by concurrent request:`, error);
      
      const retryFetch = await ctx.db
        .query("videos")
        .filter(q => 
          q.eq(q.field("youtubeId"), args.youtubeId)
        )
        .first();
        
      if (retryFetch) {
        // Document exists now, so return its ID
        return retryFetch._id;
      }
      
      // If we still can't find it, propagate the error
      throw error;
    }
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
    transcripts = transcripts.filter((t: { language: string; segments: TranscriptSegment[]; cachedAt: string }) => t.language !== args.language);
    
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
    const updatedTranscripts = video.transcripts.filter((t: { language: string; segments: TranscriptSegment[]; cachedAt: string }) => t.language !== args.language);
    
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

// Check if a video has course data
export const hasCourseData = query({
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
      return false;
    }

    return video.courseData !== undefined;
  }
});

// Update a video record with course data
export const updateVideoCourseData = mutation({
  args: {
    youtubeId: v.string(),
    courseData: v.any()
  },
  handler: async (ctx, args) => {
    // Find the video document
    const video = await ctx.db
      .query("videos")
      .filter(q => q.eq(q.field("youtubeId"), args.youtubeId))
      .first();

    if (!video) {
      throw new Error(`Video with ID ${args.youtubeId} not found`);
    }

    // Update the video with the course data
    await ctx.db.patch(video._id, {
      courseData: args.courseData,
      cachedAt: new Date().toISOString() // Update cache timestamp
    });

    console.log(`Updated video ${args.youtubeId} with course data`);
    return video._id;
  }
});
