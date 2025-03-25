import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { DbVideo, DbPlaylist } from "./youtubeTypes";

// Cache video details
export const cacheVideo = mutation({
  args: {
    youtubeId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    duration: v.optional(v.string()),
    channelId: v.optional(v.string()),
    channelName: v.optional(v.string()),
    channelAvatar: v.optional(v.string()),
    views: v.optional(v.string()),
    likes: v.optional(v.string()),
    publishDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if video already exists
    const existing = await ctx.db
      .query("videos")
      .withIndex("by_youtube_id", (q) => q.eq("youtubeId", args.youtubeId))
      .first();

    // If video exists, update it
    if (existing) {
      return await ctx.db.patch(existing._id, {
        ...args,
        cachedAt: new Date().toISOString()
      });
    }

    // Otherwise create a new record
    return await ctx.db.insert("videos", {
      ...args,
      cachedAt: new Date().toISOString()
    });
  },
});

// Retrieve cached video details
export const getCachedVideo = query({
  args: {
    youtubeId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videos")
      .withIndex("by_youtube_id", (q) => q.eq("youtubeId", args.youtubeId))
      .first();
  },
});

// Get cached playlist data if it exists
export const getCachedPlaylist = query({
  args: { youtubeId: v.string() },
  handler: async (ctx, args): Promise<(DbPlaylist & { videos?: { videoId: string; position: number }[] }) | null> => {
    const playlist = await ctx.db
      .query("playlists")
      .withIndex("by_youtube_id", (q) => q.eq("youtubeId", args.youtubeId))
      .unique();

    if (!playlist) return null;

    // Get all videos in the playlist with position information
    const playlistVideos = await ctx.db
      .query("playlist_videos")
      .withIndex("by_playlist", (q) => q.eq("playlistId", args.youtubeId))
      .collect();

    // Sort playlist videos by position
    const sortedPlaylistVideos = playlistVideos.sort((a, b) => a.position - b.position);
    
    // Convert to simpler structure for the client
    const videos = sortedPlaylistVideos.map(pv => ({
      videoId: pv.videoId,
      position: pv.position
    }));

    return {
      ...playlist,
      videos
    };
  }
})

// Cache playlist data and its videos
export const cachePlaylist = mutation({
  args: {
    youtubeId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    channelId: v.optional(v.string()),
    channelName: v.optional(v.string()),
    channelAvatar: v.optional(v.string()),
    publishDate: v.optional(v.string()),
    videoCount: v.optional(v.number()), // Keep as number for database
    videos: v.optional(v.array(v.object({
      videoId: v.string(),
      position: v.number()
    })))
  },
  handler: async (ctx, args) => {
    console.log(`Caching playlist ${args.title}`);
    
    // Extract fields for the playlists table, handling optional videos array
    const { videos = [], ...playlistBaseData } = args;
    
    // Ensure we have a valid number for videoCount
    const videoCount = args.videoCount ?? (args.videos?.length ?? 0);
    
    const playlistData = {
      ...playlistBaseData,
      videoCount, // Use the sanitized value
      cachedAt: new Date().toISOString()
    };
    
    console.log("Saving playlist with data:", JSON.stringify({
      ...playlistData,
      videosCount: videos.length
    }));
    
    try {
      // Cache playlist data without the videos field
      const existing = await ctx.db
        .query("playlists")
        .withIndex("by_youtube_id", (q) => q.eq("youtubeId", args.youtubeId))
        .unique();
      
      let playlistId;
      if (existing) {
        await ctx.db.patch(existing._id, playlistData);
        playlistId = existing._id;
      } else {
        playlistId = await ctx.db.insert("playlists", playlistData);
      }
      
      // Only handle videos if they were provided
      if (videos.length > 0) {
        // Clear existing playlist-video relations to avoid duplicates
        const existingRelations = await ctx.db
          .query("playlist_videos")
          .withIndex("by_playlist", (q) => q.eq("playlistId", args.youtubeId))
          .collect();
        
        // Delete old relations
        for (const relation of existingRelations) {
          await ctx.db.delete(relation._id);
        }
        
        // Insert new relations with batch operation for performance
        const now = new Date().toISOString();
        
        // Process videos in smaller batches to avoid overloading
        const batchSize = 20;
        for (let i = 0; i < videos.length; i += batchSize) {
          const batch = videos.slice(i, i + batchSize);
          await Promise.all(
            batch.map(video => 
              ctx.db.insert("playlist_videos", {
                playlistId: args.youtubeId,
                videoId: video.videoId,
                position: video.position,
                cachedAt: now
              })
            )
          );
        }
      }
      
      return { 
        success: true, 
        playlistId,
        videoCount: videos.length 
      };
    } catch (error) {
      console.error("Error in cachePlaylist:", error);
      throw error;
    }
  }
});
