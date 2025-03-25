import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  courses: defineTable({
    // Basic course information
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    videoId: v.optional(v.string()), // YouTube/Vimeo video ID used to generate the course
    
    // Overview metadata
    overview: v.object({
      description: v.string(),
      prerequisites: v.array(v.string()),
      learningOutcomes: v.array(v.string()),
      totalDuration: v.string(), // Could be "6 weeks", "24 hours", etc.
      difficultyLevel: v.string(), // "beginner", "intermediate", "advanced", etc.
      skills: v.array(v.string()),
      tools: v.optional(v.array(v.string())),
    }),
    
    // Course sections with lessons
    sections: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        lessons: v.array(
          v.object({
            id: v.string(),
            title: v.string(),
            description: v.string(),
            keyPoints: v.optional(v.array(v.string())),
            duration: v.optional(v.number()), // in minutes
            contentGenerated: v.optional(v.boolean()),
            isCompleted: v.optional(v.boolean()),
            resources: v.optional(v.array(
              v.object({
                title: v.string(),
                url: v.string(),
                description: v.optional(v.string()),
                type: v.optional(v.string()), // "article", "video", "documentation", etc.
              })
            )),
          })
        ),
        assessments: v.optional(v.array(
          v.object({
            id: v.string(),
            title: v.string(),
            description: v.string(),
            type: v.string(), // "quiz", "assignment", "project", etc.
            contentGenerated: v.boolean(),
            isLocked: v.boolean(),
            isCompleted: v.optional(v.boolean()),
            questions: v.optional(v.array(
              v.object({
                id: v.string(),
                question: v.string(),
                options: v.optional(v.array(v.string())),
                correctAnswer: v.optional(v.union(v.string(), v.number(), v.array(v.string()))),
                explanation: v.optional(v.string()),
              })
            )),
          })
        )),
      })
    ),
    
    // Course metadata for filtering and search
    metadata: v.optional(
      v.object({
        tags: v.optional(v.array(v.string())),
        category: v.optional(v.string()),
        subcategory: v.optional(v.string()),
        difficulty: v.optional(v.string()),
        duration: v.optional(v.string()),
        prerequisites: v.optional(v.array(v.string())),
        objectives: v.optional(v.array(v.string())),
        targetAudience: v.optional(v.array(v.string())),
        instructors: v.optional(v.array(
          v.object({
            name: v.string(),
            bio: v.optional(v.string()),
            avatarUrl: v.optional(v.string()),
          })
        )),
      })
    ),
    
    // User progress tracking
    userProgress: v.optional(
      v.object({
        lastAccessedAt: v.optional(v.number()),
        completedLessons: v.optional(v.array(v.string())),
        currentLessonId: v.optional(v.string()),
        completionPercentage: v.optional(v.number()),
        // Fix: Replace v.map with a valid object structure for quiz results
        quizResults: v.optional(v.object({
          // Define properties dynamically with a comment explaining the structure
          // This is a workaround since Convex doesn't support map directly
          // Each key would be a quiz ID and each value would be the score
          // Example properties:
          // quiz1: v.number(),
          // quiz2: v.number()
        })),
      })
    ),
    
    // Status and timestamps
    status: v.string(), // "draft", "generating", "ready", "archived", etc.
    createdAt: v.number(), // Timestamp
    updatedAt: v.number(), // Timestamp
    publishedAt: v.optional(v.number()), // Timestamp when published
    
    // Related content
    relatedCourses: v.optional(v.array(v.id("courses"))),
    
    // Usage tracking
    enrollmentCount: v.optional(v.number()),
    averageRating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    
    // Versioning
    version: v.optional(v.number()),
    previousVersions: v.optional(v.array(v.id("courses"))),
    
    // Source information
    sourceType: v.optional(v.string()), // "youtube", "article", "manual", etc.
    sourceId: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    
    // AI generation metadata
    generationModel: v.optional(v.string()), // e.g., "gemini-1.5-pro"
    generationPrompt: v.optional(v.string()),
    generationParameters: v.optional(
      v.object({
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        topP: v.optional(v.number()),
      })
    ),
    
    // Access control
    isPublic: v.optional(v.boolean()),
    ownerId: v.optional(v.string()),
    collaborators: v.optional(v.array(v.string())),
  }),
  
  // Add other tables as needed
  enrollments: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    enrolledAt: v.number(),
    completedAt: v.optional(v.number()),
    progress: v.optional(v.number()), // Percentage
    currentLessonId: v.optional(v.string()),
    completedLessons: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
  }),
  
  lessonProgress: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    lessonId: v.string(),
    sectionId: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    timeSpent: v.optional(v.number()), // In seconds
    completionStatus: v.string(), // "not_started", "in_progress", "completed"
    notes: v.optional(v.string()),
  }),
  
  assessmentResults: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    assessmentId: v.string(),
    sectionId: v.string(),
    submittedAt: v.number(),
    score: v.number(),
    maxScore: v.number(),
    passThreshold: v.optional(v.number()),
    passed: v.boolean(),
    answers: v.array(
      v.object({
        questionId: v.string(),
        userAnswer: v.union(v.string(), v.number(), v.array(v.string())),
        isCorrect: v.boolean(),
        feedback: v.optional(v.string()),
      })
    ),
    feedback: v.optional(v.string()),
  }),
  
  // Store individual quiz results in a separate table instead
  quizResults: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    quizId: v.string(),
    score: v.number(),
    attemptedAt: v.number(),
    timeTaken: v.optional(v.number()), // In seconds
    isPassed: v.boolean(),
  }),
  
  reviews: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    rating: v.number(),
    comment: v.optional(v.string()),
    postedAt: v.number(),
    updatedAt: v.optional(v.number()),
    isHidden: v.optional(v.boolean()),
    helpfulCount: v.optional(v.number()),
  }),

  // Add transcripts table
  transcripts: defineTable({
    youtubeId: v.string(),
    language: v.string(),
    segments: v.array(
      v.object({
        text: v.string(),
        duration: v.number(),
        offset: v.number(),
      })
    ),
    cachedAt: v.string(),
  })
    .index("by_youtube_id_and_language", ["youtubeId", "language"])
    .index("by_cached_at", ["cachedAt"]),

  // Add videos table for caching YouTube video details
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
    cachedAt: v.string(),
  })
    .index("by_youtube_id", ["youtubeId"])
    .index("by_cached_at", ["cachedAt"]),
});
