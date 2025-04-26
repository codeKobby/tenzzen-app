import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { TranscriptSegment, VideoDoc } from "./schema";
import { Id } from "./_generated/dataModel";

// Get cached transcript from a video document
export const getCachedTranscript = query({
  args: { 
    youtubeId: v.string(),
    language: v.string()
  },
  handler: async (ctx, args) => {
    // Find the video by YouTube ID
    const video = await ctx.db
      .query("videos")
      .withIndex("by_youtube_id", q => q.eq("youtubeId", args.youtubeId))
      .unique();

    if (!video || !video.transcripts) {
      return null;
    }

    // Find the requested language transcript
    const transcript = video.transcripts.find(
      (t: { language: string }) => t.language === args.language
    );

    if (!transcript) {
      return null;
    }

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const cachedAt = new Date(transcript.cachedAt);

    // Return expired flag if cache is older than 1 hour
    if (cachedAt < oneHourAgo) {
      return { videoId: video._id, expired: true, language: args.language };
    }

    return {
      videoId: video._id,
      language: transcript.language,
      segments: transcript.segments,
      cachedAt: transcript.cachedAt
    };
  }
});

// Remove a specific transcript from a video
export const deleteTranscript = mutation({
  args: {
    videoId: v.id("videos"),
    language: v.string()
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    
    if (!video || !video.transcripts) {
      return { success: false, message: "Video or transcript not found" };
    }
    
    // Filter out the specified language transcript
    const updatedTranscripts = video.transcripts.filter(
      (t: { language: string }) => t.language !== args.language
    );
    
    // Update the video with the filtered transcripts
    await ctx.db.patch(args.videoId, {
      transcripts: updatedTranscripts
    });
    
    return { success: true, message: "Transcript removed" };
  }
});

// Cache transcript to a video document
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
    // Find the video by YouTube ID
    const video = await ctx.db
      .query("videos")
      .withIndex("by_youtube_id", q => q.eq("youtubeId", args.youtubeId))
      .unique();

    if (!video) {
      // Create a new video if it doesn't exist
      return await ctx.db.insert("videos", {
        youtubeId: args.youtubeId,
        details: {
          type: "video",
          id: args.youtubeId,
          title: "Auto-generated Title",
          description: "Automatically created for transcript",
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
    }

    // Get existing transcripts or initialize empty array
    const existingTranscripts = video.transcripts || [];
    
    // Remove existing transcript in this language if it exists
    const filteredTranscripts = existingTranscripts.filter(
      (t: { language: string }) => t.language !== args.language
    );
    
    // Add the new transcript
    const updatedTranscripts = [
      ...filteredTranscripts,
      {
        language: args.language,
        segments: args.segments,
        cachedAt: args.cachedAt
      }
    ];
    
    // Update the video with the new transcripts
    await ctx.db.patch(video._id, {
      transcripts: updatedTranscripts
    });
    
    return video._id;
  }
});

// Clean up old transcripts within video documents
export const clearOldTranscripts = mutation({
  args: {},
  handler: async (ctx) => {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const oneHourAgoString = oneHourAgo.toISOString();
    
    // Get all videos with transcripts
    const videos = await ctx.db
      .query("videos")
      .filter(q => q.neq(q.field("transcripts"), undefined))
      .collect();

    let updatedVideos = 0;
    let removedTranscripts = 0;

    for (const video of videos) {
      if (!video.transcripts || video.transcripts.length === 0) continue;
      
      // Filter out old transcripts
      const updatedTranscripts = video.transcripts.filter(
        (t: { cachedAt: string }) => new Date(t.cachedAt) >= oneHourAgo
      );
      
      // If we removed any transcripts, update the video
      if (updatedTranscripts.length < video.transcripts.length) {
        removedTranscripts += (video.transcripts.length - updatedTranscripts.length);
        await ctx.db.patch(video._id, {
          transcripts: updatedTranscripts
        });
        updatedVideos++;
      }
    }

    return {
      updatedVideos,
      removedTranscripts
    };
  }
});
