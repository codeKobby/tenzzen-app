import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Videos table - for caching individual videos
  videos: defineTable({
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
    cachedAt: v.string()
  }).index("by_youtube_id", ["youtubeId"]),

  // Playlists table - for caching playlists (without videos field)
  playlists: defineTable({
    youtubeId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    channelId: v.optional(v.string()),
    channelName: v.optional(v.string()),
    channelAvatar: v.optional(v.string()), 
    publishDate: v.optional(v.string()),
    videoCount: v.optional(v.float64()),
    cachedAt: v.string()
  }).index("by_youtube_id", ["youtubeId"]),

  // Playlist-video relations table
  playlist_videos: defineTable({
    playlistId: v.string(),
    videoId: v.string(),
    position: v.float64(),
    cachedAt: v.string()
  }).index("by_playlist", ["playlistId"])
    .index("by_video", ["videoId"])
});
