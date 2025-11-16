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
    .index("by_video", ["videoId"]),

  // AI-generated courses
  courses: defineTable({
    title: v.string(),
    description: v.string(),
    learningObjectives: v.array(v.string()),
    prerequisites: v.array(v.string()),
    targetAudience: v.string(),
    estimatedDuration: v.string(),

    // Source information
    sourceType: v.union(v.literal('youtube'), v.literal('manual'), v.literal('topic')),
    sourceId: v.optional(v.string()), // YouTube video ID or playlist ID
    sourceUrl: v.optional(v.string()),

    // Metadata
    createdBy: v.string(), // Clerk user ID
    isPublic: v.boolean(),
    isPublished: v.boolean(),
    enrollmentCount: v.number(),
    rating: v.optional(v.number()),
    categoryId: v.optional(v.id('categories')),

    // AI generation metadata
    generatedBy: v.literal('ai'),
    aiModel: v.string(),
    generatedAt: v.string(),

    // Timestamps
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_user', ['createdBy'])
    .index('by_source', ['sourceType', 'sourceId'])
    .index('by_public', ['isPublic', 'isPublished'])
    .index('by_category', ['categoryId']),

  // Course modules
  modules: defineTable({
    courseId: v.id('courses'),
    title: v.string(),
    description: v.string(),
    order: v.number(),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_course', ['courseId']),

  // Course lessons
  lessons: defineTable({
    moduleId: v.id('modules'),
    courseId: v.id('courses'),
    title: v.string(),
    description: v.string(),
    content: v.string(),
    durationMinutes: v.number(),
    keyPoints: v.array(v.string()),
    order: v.number(),

    // Video association
    videoId: v.optional(v.id('videos')),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_module', ['moduleId'])
    .index('by_course', ['courseId']),

  // AI-generated quizzes
  quizzes: defineTable({
    lessonId: v.optional(v.id('lessons')),
    moduleId: v.optional(v.id('modules')),
    courseId: v.id('courses'),

    title: v.string(),
    description: v.string(),
    passingScore: v.number(),

    // AI generation metadata
    generatedBy: v.literal('ai'),
    aiModel: v.string(),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_course', ['courseId'])
    .index('by_lesson', ['lessonId']),

  // Quiz questions
  quizQuestions: defineTable({
    quizId: v.id('quizzes'),
    question: v.string(),
    options: v.array(v.string()),
    correctAnswer: v.number(),
    explanation: v.string(),
    difficulty: v.union(
      v.literal('easy'),
      v.literal('medium'),
      v.literal('hard')
    ),
    order: v.number(),

    createdAt: v.string(),
  })
    .index('by_quiz', ['quizId']),

  // Categories for course organization
  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_active', ['isActive']),

  // User course enrollments
  user_enrollments: defineTable({
    userId: v.string(), // Clerk user ID
    courseId: v.id('courses'),
    enrolledAt: v.string(),
    lastAccessedAt: v.optional(v.string()),
    progress: v.number(), // 0-100 percentage
    isCompleted: v.boolean(),
    completedAt: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_course', ['courseId'])
    .index('by_user_course', ['userId', 'courseId']),

  // User streak tracking
  user_streaks: defineTable({
    userId: v.string(), // Clerk user ID
    streakDays: v.number(),
    longestStreak: v.number(),
    lastCheckIn: v.string(), // ISO date
    weeklyActivity: v.array(v.number()), // 7 numbers for weekly activity
  })
    .index('by_user', ['userId']),

  // Lesson progress tracking
  lesson_progress: defineTable({
    userId: v.string(), // Clerk user ID
    lessonId: v.id('lessons'),
    courseId: v.id('courses'),
    isCompleted: v.boolean(),
    completedAt: v.optional(v.string()),
    timeSpentMinutes: v.optional(v.number()),
    lastAccessedAt: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_lesson', ['lessonId'])
    .index('by_course', ['courseId'])
    .index('by_user_course', ['userId', 'courseId']),

  // User activity tracking for dashboard
  user_activities: defineTable({
    userId: v.string(), // Clerk user ID
    activityType: v.union(
      v.literal('course_enrolled'),
      v.literal('lesson_completed'),
      v.literal('quiz_attempted'),
      v.literal('course_generated'),
      v.literal('login')
    ),
    entityId: v.optional(v.string()), // courseId, lessonId, etc.
    entityType: v.optional(v.string()), // 'course', 'lesson', 'quiz'
    metadata: v.optional(v.any()), // Additional data like scores, etc.
    createdAt: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_user_type', ['userId', 'activityType'])
    .index('by_created_at', ['createdAt']),
});
