import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const getUserProgress = query({
  args: {
    courseId: v.id('courses')
  },
  handler: async (ctx, { courseId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      // Not logged in, no progress
      return null
    }
    const userId = identity.subject
    return await ctx.db
      .query('userProgress')
      .withIndex('by_user_course', q =>
        q.eq('userId', userId).eq('courseId', courseId)
      )
      .first()
  }
})

export const updateUserProgress = mutation({
  args: {
    courseId: v.id('courses'),
    lastCompletedLesson: v.optional(v.number()),
    lastPlaybackTime: v.optional(v.object({
      lessonId: v.id('lessons'),
      time: v.number()
    }))
  },
  handler: async (ctx, args) => {
    const { courseId, lastCompletedLesson, lastPlaybackTime } = args
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error('User not authenticated')
    }

    const userId = identity.subject

    // Check if progress for this user and course already exists
    const existingProgress = await ctx.db
      .query('userProgress')
      .withIndex('by_user_course', q =>
        q.eq('userId', userId).eq('courseId', courseId)
      )
      .first()

    if (existingProgress) {
      // Update existing progress
      const patch: {
        lastCompletedLesson?: number,
        lastPlaybackTime?: { lessonId: any; time: number }
      } = {}
      if (lastCompletedLesson !== undefined) {
        patch.lastCompletedLesson = Math.max(existingProgress.lastCompletedLesson ?? -1, lastCompletedLesson)
      }
      if (lastPlaybackTime !== undefined) {
        // Cast lessonId to the DB id type to satisfy Convex TypeScript signatures
        patch.lastPlaybackTime = lastPlaybackTime as any
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existingProgress._id, patch)
      }
    } else {
      // Create new progress document
      await ctx.db.insert('userProgress', {
        userId,
        courseId,
        lastCompletedLesson: lastCompletedLesson ?? -1,
        // Only include lastPlaybackTime if provided to avoid inserting invalid empty ids
        lastPlaybackTime: lastPlaybackTime ?? undefined
      })
    }

    return { success: true }
  }
})
