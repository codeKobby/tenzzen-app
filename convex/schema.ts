import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // Cache for video data
  videos: defineTable({
    youtubeId: v.string(), // YouTube video ID
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
    cachedAt: v.string(), // When this data was fetched
  }).index("by_youtube_id", ["youtubeId"]),

  // Cache for playlist data
  playlists: defineTable({
    youtubeId: v.string(), // YouTube playlist ID
    title: v.string(),
    thumbnail: v.optional(v.string()),
    channelId: v.optional(v.string()),
    channelName: v.optional(v.string()),
    videoCount: v.optional(v.number()),
    cachedAt: v.string(), // When this data was fetched
  }).index("by_youtube_id", ["youtubeId"]),

  // Track which videos belong to which playlists
  playlist_videos: defineTable({
    playlistId: v.string(), // YouTube playlist ID
    videoId: v.string(), // YouTube video ID
    position: v.number(), // Order in playlist
    cachedAt: v.string(), // When this relationship was recorded
  })
  .index("by_playlist", ["playlistId"])
  .index("by_video", ["videoId"])
  .index("by_playlist_position", ["playlistId", "position"])
})
