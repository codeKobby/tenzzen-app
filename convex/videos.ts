import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { Doc, Id } from "./_generated/dataModel"
import { createApiError } from "./types"

// List videos for the current user
export const listVideos = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw createApiError("UNAUTHORIZED", "Not authenticated")
    }

    const limit = args.limit ?? 10
    
    // Query with proper ordering
    let videosQuery = ctx.db
      .query("videos")
      .filter(q => q.eq(q.field("userId"), identity.subject))
      .order("desc") // Use single argument for order

    // Fetch videos
    let videos = await videosQuery.collect()

    // Handle cursor-based pagination
    if (args.cursor) {
      const cursor = videos.findIndex(video => video._id === args.cursor)
      if (cursor !== -1) {
        videos = videos.slice(cursor + 1)
      }
    }

    return videos.slice(0, limit)
  }
})

// Get a single video by ID
export const getVideo = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw createApiError("UNAUTHORIZED", "Not authenticated")
    }

    const video = await ctx.db
      .query("videos")
      .filter(q => q.eq(q.field("id"), args.id))
      .unique()

    if (!video) {
      throw createApiError("NOT_FOUND", "Video not found")
    }

    if (video.userId !== identity.subject) {
      throw createApiError("UNAUTHORIZED", "Not authorized to view this video")
    }

    return video
  }
})

// Add a new video
export const addVideo = mutation({
  args: {
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
    publish_date: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw createApiError("UNAUTHORIZED", "Not authenticated")
    }

    // Check if video already exists
    const existing = await ctx.db
      .query("videos")
      .filter(q => q.eq(q.field("id"), args.id))
      .unique()

    if (existing) {
      throw createApiError("INTERNAL_ERROR", "Video already exists")
    }

    // Add the video
    return await ctx.db.insert("videos", {
      ...args,
      userId: identity.subject,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
})

// Delete a video
export const deleteVideo = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw createApiError("UNAUTHORIZED", "Not authenticated")
    }

    const video = await ctx.db
      .query("videos")
      .filter(q => q.eq(q.field("id"), args.id))
      .unique()

    if (!video) {
      throw createApiError("NOT_FOUND", "Video not found")
    }

    if (video.userId !== identity.subject) {
      throw createApiError("UNAUTHORIZED", "Not authorized to delete this video")
    }

    await ctx.db.delete(video._id)
    return { success: true }
  }
})
