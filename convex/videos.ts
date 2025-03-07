import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import type { DbVideo, DbPlaylist, DbPlaylistVideo } from "./youtubeTypes"
import { isDbVideo } from "./youtubeTypes"

// Get cached video data if it exists
export const getCachedVideo = query({
  args: { youtubeId: v.string() },
  handler: async (ctx, args): Promise<DbVideo | null> => {
    return await ctx.db
      .query("videos")
      .withIndex("by_youtube_id", (q) => q.eq("youtubeId", args.youtubeId))
      .unique()
  }
})

// Get cached playlist data if it exists
export const getCachedPlaylist = query({
  args: { youtubeId: v.string() },
  handler: async (ctx, args): Promise<(DbPlaylist & { videos?: DbVideo[] }) | null> => {
    const playlist = await ctx.db
      .query("playlists")
      .withIndex("by_youtube_id", (q) => q.eq("youtubeId", args.youtubeId))
      .unique()

    if (!playlist) return null

    // Get all videos in the playlist
    const playlistVideos = await ctx.db
      .query("playlist_videos")
      .withIndex("by_playlist", (q) => q.eq("playlistId", args.youtubeId))
      .collect()

    // Get all video details
    const videoDetails = await Promise.all(
      playlistVideos.map(pv => 
        ctx.db
          .query("videos")
          .withIndex("by_youtube_id", (q) => q.eq("youtubeId", pv.videoId))
          .unique()
      )
    )

    return {
      ...playlist,
      videos: videoDetails.filter(isDbVideo)
    }
  }
})

// Cache video data
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
    publishDate: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<string> => {
    // Check if video already exists
    const existing = await ctx.db
      .query("videos")
      .withIndex("by_youtube_id", (q) => q.eq("youtubeId", args.youtubeId))
      .unique()

    const now = new Date().toISOString()

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        cachedAt: now
      })
      return existing._id
    }

    // Add new video
    return await ctx.db.insert("videos", {
      ...args,
      cachedAt: now
    })
  }
})

// Cache playlist data and its videos
export const cachePlaylist = mutation({
  args: {
    youtubeId: v.string(),
    title: v.string(),
    thumbnail: v.optional(v.string()),
    channelId: v.optional(v.string()),
    channelName: v.optional(v.string()),
    videoCount: v.optional(v.number()),
    videos: v.array(v.object({
      videoId: v.string(),
      position: v.number()
    }))
  },
  handler: async (ctx, args) => {
    // Cache playlist data
    const existing = await ctx.db
      .query("playlists")
      .withIndex("by_youtube_id", (q) => q.eq("youtubeId", args.youtubeId))
      .unique()

    const now = new Date().toISOString()

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        cachedAt: now
      })
    } else {
      await ctx.db.insert("playlists", {
        ...args,
        cachedAt: now
      })
    }

    // Cache video relations
    for (const video of args.videos) {
      await ctx.db.insert("playlist_videos", {
        playlistId: args.youtubeId,
        videoId: video.videoId,
        position: video.position,
        cachedAt: now
      })
    }

    return { success: true }
  }
})
