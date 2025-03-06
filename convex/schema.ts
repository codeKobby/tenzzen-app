import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // Videos table for storing video metadata
  videos: defineTable({
    id: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    duration: v.optional(v.string()),
    channel_id: v.optional(v.string()),
    channel_name: v.optional(v.string()),
    channel_avatar: v.optional(v.string()),
    views: v.optional(v.string()),
    likes: v.optional(v.string()),
    publish_date: v.optional(v.string()),
    userId: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_video_id", ["id"])
    .index("by_channel", ["channel_id"]),

  // Any other necessary tables can be added here
})
