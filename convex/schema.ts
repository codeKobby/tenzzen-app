import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// --- Shared Schema Definitions ---

const LessonSchema = v.object({
  title: v.string(),
  description: v.string(),
  content: v.string(),
  durationMinutes: v.number(),
  timestampStart: v.optional(v.string()),
  timestampEnd: v.optional(v.string()),
  keyPoints: v.array(v.string()),
});

const ModuleSchema = v.object({
  title: v.string(),
  description: v.string(),
  lessons: v.array(LessonSchema),
});

const ResourceSchema = v.object({
  title: v.string(),
  url: v.string(),
  type: v.string(),
  description: v.optional(v.string()),
  category: v.string(), // "Creator Links" or "Other Resources"
  provenance: v.optional(v.union(v.literal("found"), v.literal("suggested"))),
});

const AssessmentPlanSchema = v.object({
  quizLocations: v.array(
    v.object({
      afterModule: v.optional(v.number()),
      afterLesson: v.optional(
        v.object({
          moduleIndex: v.number(),
          lessonIndex: v.number(),
        }),
      ),
      type: v.literal("quiz"),
    }),
  ),
  hasEndOfCourseTest: v.boolean(),
  hasFinalProject: v.boolean(),
  projectDescription: v.optional(v.string()),
});

// Legacy/Cached course data structure used in videos table
const CachedCourseDataSchema = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  image: v.optional(v.string()),
  courseItems: v.optional(
    v.array(
      v.object({
        title: v.string(),
        content: v.optional(v.string()),
        durationMinutes: v.optional(v.number()),
      }),
    ),
  ),
  metadata: v.optional(v.any()), // Still semi-flexible but improved
  transcript: v.optional(v.string()),
});

export default defineSchema({
  // Users table - for app-specific user data (Clerk handles auth)
  users: defineTable({
    clerkId: v.string(), // Clerk user ID
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    credits: v.optional(v.number()), // Available AI generation credits
    creditsSpent: v.optional(v.number()), // Total credits used
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  // Notes table - for user created notes
  notes: defineTable({
    clerkId: v.string(), // User ID
    title: v.string(),
    content: v.string(), // HTML content
    category: v.string(), // 'all', 'starred', 'course', 'personal', 'code' stored as string
    tags: v.optional(v.array(v.string())),
    courseId: v.optional(v.string()), // Link to course if applicable
    lessonId: v.optional(v.string()), // Link to lesson if applicable
    isStarred: v.boolean(),
    createdAt: v.number(), // Timestamp
    updatedAt: v.number(), // Timestamp
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_course", ["courseId"])

    .index("by_clerk_and_category", ["clerkId", "category"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["clerkId", "category"],
    })
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["clerkId", "category"],
    }),

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
    course_data: v.optional(CachedCourseDataSchema),
    cachedAt: v.string(),
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
    cachedAt: v.string(),
  }).index("by_youtube_id", ["youtubeId"]),

  // Playlist-video relations table
  playlist_videos: defineTable({
    playlistId: v.string(),
    videoId: v.string(),
    position: v.float64(),
    cachedAt: v.string(),
  })
    .index("by_playlist", ["playlistId"])
    .index("by_video", ["videoId"]),

  // AI-generated courses
  courses: defineTable({
    title: v.string(),
    description: v.string(),
    detailedOverview: v.string(),
    category: v.string(), // Main category like "Web Development", "Mobile Development"
    difficulty: v.string(), // "Beginner", "Intermediate", "Advanced"
    learningObjectives: v.array(v.string()),
    prerequisites: v.array(v.string()),
    targetAudience: v.string(),
    estimatedDuration: v.string(),
    tags: v.array(v.string()), // Specific keywords
    resources: v.array(ResourceSchema),
    // Denormalized preview fields used by the dashboard UI
    sections: v.optional(v.array(ModuleSchema)),
    overview: v.optional(
      v.object({
        skills: v.array(v.string()),
        difficulty_level: v.string(),
        total_duration: v.string(),
      }),
    ),
    thumbnail: v.optional(v.string()),
    assessmentPlan: v.optional(AssessmentPlanSchema),

    // Source information
    sourceType: v.union(
      v.literal("youtube"),
      v.literal("manual"),
      v.literal("topic"),
    ),
    sourceId: v.optional(v.string()), // YouTube video ID or playlist ID
    sourceUrl: v.optional(v.string()),

    // Metadata
    createdBy: v.string(), // Clerk user ID
    isPublic: v.boolean(),
    isPublished: v.boolean(),
    enrollmentCount: v.number(),
    rating: v.optional(v.number()),
    trustScore: v.optional(v.float64()), // Computed trust/quality score for ranking
    forkedFrom: v.optional(v.id("courses")), // If forked, reference to original course
    upvoteCount: v.optional(v.number()), // Community upvotes
    categoryId: v.optional(v.id("categories")),

    // AI generation metadata
    generatedBy: v.literal("ai"),
    aiModel: v.string(),
    generatedAt: v.string(),

    // Timestamps
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["createdBy"])
    .index("by_source", ["sourceType", "sourceId"])
    .index("by_public", ["isPublic", "isPublished"])
    .index("by_category", ["categoryId"])
    .index("by_enrollment", ["isPublic", "enrollmentCount"])
    .index("by_upvotes", ["isPublic", "upvoteCount"])
    .index("by_creation", ["isPublic", "createdAt"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["isPublic", "category"],
    }),

  // Course modules
  modules: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    description: v.string(),
    order: v.number(),

    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_course", ["courseId"]),

  // Course lessons
  lessons: defineTable({
    moduleId: v.id("modules"),
    courseId: v.id("courses"),
    title: v.string(),
    description: v.string(),
    content: v.string(),
    durationMinutes: v.number(),
    timestampStart: v.optional(v.string()), // Video timestamp start \"0:00:00\"
    timestampEnd: v.optional(v.string()), // Video timestamp end \"0:13:00\"
    keyPoints: v.array(v.string()),
    order: v.number(),

    // Video association
    videoId: v.optional(v.id("videos")),

    // Assessment generation flags (on-demand)
    quizGenerated: v.optional(v.boolean()), // Multichoice flashcard quiz
    testGenerated: v.optional(v.boolean()), // Open-ended typed questions
    projectGenerated: v.optional(v.boolean()), // Capstone project

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_module", ["moduleId"])
    .index("by_course", ["courseId"]),

  // AI-generated quizzes
  quizzes: defineTable({
    lessonId: v.optional(v.id("lessons")),
    moduleId: v.optional(v.id("modules")),
    courseId: v.id("courses"),

    title: v.string(),
    description: v.string(),
    passingScore: v.number(),

    // Assessment type
    type: v.optional(
      v.union(v.literal("quiz"), v.literal("test"), v.literal("project")),
    ),

    // AI generation metadata
    generatedBy: v.literal("ai"),
    aiModel: v.string(),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_course", ["courseId"])
    .index("by_lesson", ["lessonId"])
    .index("by_module", ["moduleId"]),

  // Quiz questions
  quizQuestions: defineTable({
    quizId: v.id("quizzes"),
    question: v.string(),
    options: v.optional(v.array(v.string())), // Optional for open-ended/project
    correctAnswer: v.optional(v.number()), // Optional for open-ended/project
    explanation: v.string(),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard"),
    ),
    type: v.optional(
      v.union(
        v.literal("multiple_choice"),
        v.literal("open_ended"),
        v.literal("project_task"),
      ),
    ),
    order: v.number(),

    createdAt: v.string(),
  }).index("by_quiz", ["quizId"]),

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
  }).index("by_active", ["isActive"]),

  // User course enrollments
  user_enrollments: defineTable({
    userId: v.string(), // Clerk user ID
    courseId: v.id("courses"),
    enrolledAt: v.string(),
    lastAccessedAt: v.optional(v.string()),
    progress: v.number(), // 0-100 percentage
    isCompleted: v.boolean(),
    completedAt: v.optional(v.string()),
  })
    .index("by_user_course", ["userId", "courseId"])
    .index("by_user", ["userId"]) // Added for dashboard queries
    .index("by_course", ["courseId"]), // Added for course-specific queries

  // User progress on a lesson-by-lesson basis
  lesson_progress: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    lessonId: v.id("lessons"),
    isCompleted: v.boolean(),
    completedAt: v.optional(v.string()),
  })
    .index("by_user_course", ["userId", "courseId"])
    .index("by_lesson", ["lessonId"])
    .index("by_user_lesson", ["userId", "lessonId"]), // Added for idempotent progress updates

  // User activity for streaks
  user_activities: defineTable({
    userId: v.string(),
    activityType: v.string(), // e.g., 'lesson_completed', 'quiz_passed'
    entityId: v.optional(v.string()),
    entityType: v.optional(v.string()), // 'lesson', 'quiz', 'course'
    createdAt: v.string(),
    metadata: v.optional(v.any()),
  }).index("by_user", ["userId"]),

  // User streaks
  user_streaks: defineTable({
    userId: v.string(),
    streakDays: v.number(),
    longestStreak: v.number(),
    lastCheckIn: v.string(), // YYYY-MM-DD
    weeklyActivity: v.array(v.number()), // 7 numbers for last 7 days
  }).index("by_user", ["userId"]),

  // Notifications
  notifications: defineTable({
    userId: v.string(),
    type: v.string(), // 'info', 'success', 'warning', 'error', 'streak_risk', 'course_completed'
    title: v.optional(v.string()),
    message: v.string(),
    link: v.optional(v.string()),
    read: v.boolean(),
    metadata: v.optional(v.any()), // flexible for additional data

    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]),

  // User progress tracking
  userProgress: defineTable({
    userId: v.string(), // Clerk user ID
    courseId: v.id("courses"),
    lastCompletedLesson: v.optional(v.number()),
    // Store lessonId (Convex id) and time to avoid ambiguous numeric indexes
    lastPlaybackTime: v.optional(
      v.object({
        lessonId: v.id("lessons"),
        time: v.number(),
      }),
    ),
  }).index("by_user_course", ["userId", "courseId"]),

  // User quiz attempts
  user_quiz_attempts: defineTable({
    userId: v.string(), // Clerk user ID
    quizId: v.id("quizzes"),
    courseId: v.id("courses"),
    score: v.number(),
    maxScore: v.number(),
    durationSeconds: v.number(),
    startedAt: v.string(),
    completedAt: v.optional(v.string()),
    isPassed: v.boolean(),

    // Metadata
    metadata: v.optional(
      v.object({
        // Additional fields can be added here
      }),
    ),

    // AI generation metadata
    generatedBy: v.literal("ai"),
    aiModel: v.string(),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_quiz", ["quizId"])
    .index("by_course", ["courseId"]),

  // Course generation job queue (for deduplication and async processing)
  generation_jobs: defineTable({
    sourceId: v.string(), // YouTube video/playlist ID
    sourceUrl: v.string(),
    sourceType: v.union(v.literal("youtube"), v.literal("topic")),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    createdBy: v.string(), // Clerk user ID who initiated
    watchers: v.array(v.string()), // Users waiting for this course
    resultCourseId: v.optional(v.id("courses")),
    error: v.optional(v.string()),
    retryCount: v.optional(v.number()),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  })
    .index("by_source_status", ["sourceId", "status"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_user", ["createdBy"]),

  // AI Tutor chat messages
  tutor_messages: defineTable({
    userId: v.string(), // Clerk user ID
    courseId: v.id("courses"),
    lessonId: v.id("lessons"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.string(),
  })
    .index("by_user_lesson", ["userId", "lessonId"])
    .index("by_user_course", ["userId", "courseId"]),

  // Spaced Repetition System (SRS) items
  srs_items: defineTable({
    userId: v.string(), // Clerk user ID
    courseId: v.id("courses"),
    lessonId: v.optional(v.id("lessons")),
    quizQuestionId: v.optional(v.id("quizQuestions")),

    // SRS algorithm fields (SM-2)
    easeFactor: v.number(), // Initial: 2.5
    interval: v.number(), // In days
    repetitions: v.number(), // Number of successful reviews
    nextReviewDate: v.string(), // ISO date string

    // Card content (can be from quiz or user-created)
    front: v.string(), // Question or term
    back: v.string(), // Answer or definition
    cardType: v.union(
      v.literal("quiz"),
      v.literal("key_point"),
      v.literal("user_created"),
    ),

    // Metadata
    lastReviewedAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_course", ["userId", "courseId"])
    .index("by_user_due", ["userId", "nextReviewDate"]),

  // User-uploaded materials (PDFs, documents)
  user_materials: defineTable({
    userId: v.string(), // Clerk user ID
    title: v.string(),
    fileType: v.union(
      v.literal("pdf"),
      v.literal("doc"),
      v.literal("txt"),
      v.literal("url"),
    ),
    fileUrl: v.optional(v.string()), // Storage URL for uploaded files
    sourceUrl: v.optional(v.string()), // Original URL if type is 'url'
    extractedText: v.optional(v.string()), // Extracted text content for AI processing

    // AI-extracted metadata
    topics: v.optional(v.array(v.string())), // Key topics extracted by AI
    summary: v.optional(v.string()), // AI-generated summary
    audioOverviewUrl: v.optional(v.string()), // URL to generated audio summary
    audioScript: v.optional(v.string()), // AI-generated podcast script for client-side TTS

    // Linked content
    linkedCourseId: v.optional(v.id("courses")), // If a course was generated from this
    recommendedVideos: v.optional(
      v.array(
        v.object({
          youtubeId: v.string(),
          title: v.string(),
          thumbnail: v.optional(v.string()),
          relevanceScore: v.number(),
        }),
      ),
    ),

    // Progress tracking
    lastStudiedAt: v.optional(v.string()),
    studyCount: v.number(), // Times accessed

    // Metadata
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_category", ["userId", "category"])

    .index("by_user_recent", ["userId", "lastStudiedAt"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["userId"],
    }),

  // Glossary table for user terms and definitions
  glossary: defineTable({
    userId: v.string(), // Clerk user ID
    term: v.string(),
    definition: v.string(),

    // Optional source tracing
    sourceId: v.optional(v.string()),
    sourceType: v.union(
      v.literal("lesson"),
      v.literal("material"),
      v.literal("manual"),
    ),
    tags: v.optional(v.array(v.string())),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_term", ["userId", "term"])
    .searchIndex("search_term", {
      searchField: "term",
      filterFields: ["userId"],
    }),
});
