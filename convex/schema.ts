import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  userRoleValidator,
  userStatusValidator,
  authProviderValidator,
  taskTypeValidator,
  difficultyLevelValidator,
  completionStatusValidator,
  courseStatusValidator,
  assessmentTypeValidator,
  submissionTypeValidator,
  progressStatusValidator,
  submissionStatusValidator,
  resourceTypeValidator,
  resourceSourceTypeValidator,
  activityTypeValidator,
  learningStyleValidator,
  reminderFrequencyValidator,
  learningGoalTypeValidator,
  interestSourceValidator,
  achievementTypeValidator
} from "./validation";

// Define schema with proper table configuration
export default defineSchema({
  // Users - Core identity information linked with Clerk
  users: defineTable({
    // This will match the Clerk user ID
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    authProvider: authProviderValidator,
    role: userRoleValidator,
    status: userStatusValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
    lastLogin: v.optional(v.object({
      time: v.number(),
      ip: v.optional(v.string()),
      userAgent: v.optional(v.string()),
    })),
  }).index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Tasks for Calendar
  tasks: defineTable({
    userId: v.string(), // Foreign key to users table
    title: v.string(),
    date: v.string(), // ISO date string
    type: taskTypeValidator,
    dueTime: v.optional(v.string()),
    description: v.optional(v.string()),
    completed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_completion", ["userId", "completed"]),

  // User profiles - Extended user information and preferences
  user_profiles: defineTable({
    userId: v.string(), // Foreign key to users table
    bio: v.optional(v.string()),
    timezone: v.optional(v.string()),
    language: v.optional(v.string()),
    preferences: v.optional(v.object({
      darkMode: v.optional(v.boolean()),
      accentColor: v.optional(v.string()),
      notificationPreferences: v.optional(v.string()),
      emailUpdates: v.optional(v.boolean()),
    })),
    learningPreferences: v.optional(v.object({
      preferredCategories: v.optional(v.array(v.string())),
      difficulty: v.optional(difficultyLevelValidator),
      dailyGoalMinutes: v.optional(v.number()),
    })),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  // Videos and transcripts (already enhanced)
  videos: defineTable({
    youtubeId: v.string(),
    details: v.object({
      type: v.string(),
      id: v.string(),
      title: v.optional(v.string()),
      description: v.string(),
      duration: v.string(), // Store ISO 8601 duration string
      thumbnail: v.string(),
      // Add new fields for caching
      channelId: v.optional(v.string()),
      channelName: v.optional(v.string()),
      channelAvatar: v.optional(v.string()),
      views: v.optional(v.string()), // Store formatted string (e.g., "1.2M")
      likes: v.optional(v.string()), // Store formatted string
      publishDate: v.optional(v.string()) // Store formatted date string
    }),
    transcripts: v.optional(v.array(v.object({
      language: v.string(),
      segments: v.array(v.object({
        text: v.string(),
        start: v.number(),
        duration: v.number()
      })),
      cachedAt: v.string()
    }))),
    cachedAt: v.string(),
    // Add courseData field to store generated course data
    courseData: v.optional(v.any()),
  }).index("by_youtube_id", ["youtubeId"]),

  // Playlists table
  playlists: defineTable({
    youtubeId: v.string(),
    title: v.string(),
    description: v.string(),
    thumbnail: v.string(),
    itemCount: v.number(),
    cachedAt: v.string(),
  }).index("by_youtube_id", ["youtubeId"]),

  // Playlist videos relationship table
  playlist_videos: defineTable({
    playlistId: v.id("playlists"),
    videoId: v.id("videos"),
    position: v.number(),
  }).index("by_playlist", ["playlistId"]),

  // Categories for courses
  categories: defineTable({
    name: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    slug: v.string(), // URL-friendly version of name
    courseCount: v.number(), // Counter for courses in this category
  }).index("by_name", ["name"])
    .index("by_slug", ["slug"])
    .index("by_courseCount", ["courseCount"]), // Added index for sorting

  // Tags for courses
  tags: defineTable({
    name: v.string(),
    useCount: v.number(), // How many times this tag is used
  }).index("by_name", ["name"])
    .index("by_use_count", ["useCount"]),

  // Course-Tag relationship (many-to-many)
  course_tags: defineTable({
    courseId: v.id("courses"),
    tagId: v.id("tags"),
  }).index("by_course", ["courseId"])
    .index("by_tag", ["tagId"])
    .index("by_course_tag", ["courseId", "tagId"]),

  // Enhanced Courses Table (Universal/Public Courses)
  courses: defineTable({
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    videoId: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    isPublic: v.boolean(), // Whether this is a universal/public course
    creatorId: v.optional(v.string()), // User ID of course creator (if user-generated)
    avgRating: v.optional(v.number()), // Average rating from 1-5
    enrollmentCount: v.optional(v.number()), // Number of users enrolled
    overview: v.optional(v.object({
      description: v.optional(v.string()),
      prerequisites: v.optional(v.array(v.string())),
      learningOutcomes: v.optional(v.array(v.string())),
      totalDuration: v.optional(v.string()),
      difficultyLevel: v.optional(difficultyLevelValidator),
      skills: v.optional(v.array(v.string())),
      tools: v.optional(v.array(v.string()))
    })),
    sections: v.optional(v.array(v.any())),
    metadata: v.optional(v.object({
      difficulty: v.optional(difficultyLevelValidator),
      duration: v.optional(v.string()),
      prerequisites: v.optional(v.array(v.string())),
      objectives: v.optional(v.array(v.string())),
      category: v.optional(v.string()), // Legacy field - will migrate to course_categories
      sources: v.optional(v.array(v.any())),
    })),
    status: v.optional(courseStatusValidator),
    createdAt: v.number(),
    updatedAt: v.number(),
    estimatedHours: v.optional(v.number()), // Estimated hours to complete
    tags: v.optional(v.array(v.string())), // Array of tag names for search
    featured: v.optional(v.boolean()), // Whether this course is featured on explore page
    popularity: v.optional(v.number()), // Calculated popularity score (views + enrollments)
  }).index("by_public", ["isPublic"])
    .index("by_creator", ["creatorId"])
    .index("by_featured", ["featured"])
    .index("by_popularity", ["popularity"])
    .searchIndex("search_courses", {
      searchField: "title",
      filterFields: ["isPublic"]
    }),

  // Course-Category relationship (many-to-many)
  course_categories: defineTable({
    courseId: v.id("courses"),
    categoryId: v.id("categories"),
  }).index("by_course", ["courseId"])
    .index("by_category", ["categoryId"])
    .index("by_course_category", ["courseId", "categoryId"]),

  // Enhanced Enrollments Table (User's Personal Courses)
  enrollments: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    enrolledAt: v.number(),
    lastAccessedAt: v.number(),
    completionStatus: completionStatusValidator,
    progress: v.optional(v.number()), // Percentage complete (0-100)
    isActive: v.optional(v.boolean()),
    completedLessons: v.optional(v.array(v.string())),
    lastLessonId: v.optional(v.string()), // Last accessed lesson ID for resume
    totalTimeSpent: v.optional(v.number()), // Total time spent in milliseconds
    notes: v.optional(v.string()), // Personal notes about this course
    reminderEnabled: v.optional(v.boolean()), // Whether learning reminders are enabled
    reminderFrequency: v.optional(reminderFrequencyValidator),
    learningGoal: v.optional(v.object({
      type: learningGoalTypeValidator,
      targetDate: v.number(), // Target completion date
      hoursPerWeek: v.optional(v.number()), // Target hours per week
    })),
  }).index("by_user", ["userId"])
    .index("by_course", ["courseId"])
    .index("by_user_course", ["userId", "courseId"])
    .index("by_completion", ["userId", "completionStatus"])
    .index("by_user_enrolledAt", ["userId", "enrolledAt"]), // Added index for sorting recent enrollments

  // Course Ratings
  ratings: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    rating: v.number(), // 1-5 stars
    review: v.optional(v.string()), // Written review
    createdAt: v.number(),
    updatedAt: v.number(),
    helpful: v.optional(v.number()), // Number of users who found this helpful
    reported: v.optional(v.boolean()), // If the review has been reported
    verified: v.optional(v.boolean()), // If user completed the course
  }).index("by_course", ["courseId"])
    .index("by_user", ["userId"])
    .index("by_user_course", ["userId", "courseId"])
    .index("by_rating", ["courseId", "rating"]),

  // Assessments Table (Enhanced for project-based learning)
  assessments: defineTable({
    title: v.string(),
    description: v.string(),
    courseId: v.id("courses"),
    type: assessmentTypeValidator,
    questions: v.optional(v.array(v.any())),
    instructions: v.optional(v.string()),
    projectRequirements: v.optional(v.array(v.string())), // For project assessments
    submissionType: v.optional(submissionTypeValidator),
    resources: v.optional(v.array(v.object({
      title: v.string(),
      url: v.string(),
      type: v.string()
    }))),
    deadline: v.optional(v.number()), // Optional deadline timestamp
    createdAt: v.number(),
    difficulty: v.optional(difficultyLevelValidator),
    estimatedTime: v.optional(v.number()), // Estimated completion time in minutes
    passingScore: v.optional(v.number()), // Minimum score to pass (percentage)
    allowRetries: v.optional(v.boolean()), // Whether retries are allowed
    maxRetries: v.optional(v.number()), // Maximum number of retry attempts
  }).index("by_course", ["courseId"])
    .index("by_type", ["type"])
    .index("by_course_type", ["courseId", "type"]),

  // Progress Table (Assessment progress)
  progress: defineTable({
    userId: v.string(),
    assessmentId: v.id("assessments"),
    status: progressStatusValidator,
    score: v.optional(v.number()),
    feedback: v.optional(v.any()), // Changed from v.string() to v.any() to allow structured feedback
    submission: v.optional(v.any()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    attemptNumber: v.optional(v.number()), // Which attempt this is (for retries)
    timeSpent: v.optional(v.number()), // Time spent on this assessment (ms)
  }).index("by_assessment", ["assessmentId"])
    .index("by_user", ["userId"])
    .index("by_user_assessment", ["userId", "assessmentId"]),

  // Project Submissions (For project-based assessments)
  project_submissions: defineTable({
    userId: v.string(),
    assessmentId: v.id("assessments"),
    submissionUrl: v.optional(v.string()), // URL to GitHub/external resource
    fileIds: v.optional(v.array(v.string())), // IDs of submitted files
    notes: v.optional(v.string()), // Student notes about submission
    status: submissionStatusValidator,
    feedback: v.optional(v.string()), // Instructor feedback
    grade: v.optional(v.number()), // Numeric grade if applicable
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewerNotes: v.optional(v.string()), // Private notes for reviewers
    revisionCount: v.optional(v.number()), // Number of revision cycles
  }).index("by_user", ["userId"])
    .index("by_assessment", ["assessmentId"])
    .index("by_user_assessment", ["userId", "assessmentId"])
    .index("by_status", ["status"]),

  // User Notes (For note-taking system)
  notes: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.string(), // Rich text content
    courseId: v.optional(v.id("courses")),
    lessonId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())), // User-defined tags for organization
    createdAt: v.number(),
    updatedAt: v.number(),
    isPublic: v.optional(v.boolean()), // If the note is shared publicly
    aiSummary: v.optional(v.string()), // AI-generated summary of note contents
    highlights: v.optional(v.array(v.string())), // Key highlights from the note
    isFavorite: v.optional(v.boolean()), // If the user has favorited this note
  }).index("by_user", ["userId"])
    .index("by_course", ["courseId"])
    .index("by_user_course", ["userId", "courseId"])
    .index("by_tags", ["userId", "tags"])
    .index("by_user_updatedAt", ["userId", "updatedAt"]) // Added index for sorting
    .searchIndex("search_notes", {
      searchField: "content",
      filterFields: ["userId"]
    }),

  // Learning Resources (For resource hub)
  resources: defineTable({
    userId: v.string(),
    title: v.string(),
    type: resourceTypeValidator,
    url: v.optional(v.string()),
    content: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
    lessonId: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
    isPublic: v.optional(v.boolean()),
    views: v.optional(v.number()), // Number of times viewed (if public)
    isFavorite: v.optional(v.boolean()), // If the user has favorited this resource
    sourceType: v.optional(resourceSourceTypeValidator),
  }).index("by_user", ["userId"])
    .index("by_course", ["courseId"])
    .index("by_type", ["type"])
    .index("by_tags", ["userId", "tags"])
    .index("by_user_updatedAt", ["userId", "updatedAt"]), // Added index for sorting

  // User Statistics (For dashboard metrics)
  user_stats: defineTable({
    userId: v.string(),
    totalLearningHours: v.number(), // Total time spent learning
    coursesCompleted: v.number(),
    coursesInProgress: v.number(),
    assessmentsCompleted: v.number(),
    projectsSubmitted: v.number(),
    lastActiveAt: v.number(),
    streakDays: v.number(), // Consecutive days of learning
    longestStreak: v.number(), // Longest streak achieved
    totalPoints: v.optional(v.number()), // Gamification points if implemented
    weeklyActivity: v.optional(v.array(v.number())), // Activity hours by day of week
    badges: v.optional(v.array(v.string())), // Achievement badges earned
    level: v.optional(v.number()), // User experience level
    learningStyle: v.optional(learningStyleValidator),
    topCategories: v.optional(v.array(v.string())), // Most studied categories
  }).index("by_user", ["userId"]),

  // Learning Activities (For activity feed and detailed tracking)
  learning_activities: defineTable({
    userId: v.string(),
    type: activityTypeValidator,
    courseId: v.optional(v.id("courses")),
    lessonId: v.optional(v.string()),
    assessmentId: v.optional(v.id("assessments")),
    timestamp: v.number(),
    metadata: v.optional(v.any()), // Additional activity details
    visible: v.optional(v.boolean()), // If this should appear in activity feed
  }).index("by_user", ["userId"])
    .index("by_user_time", ["userId", "timestamp"])
    .index("by_type", ["userId", "type"]),

  // User Interests (For personalized recommendations)
  user_interests: defineTable({
    userId: v.string(),
    categoryId: v.id("categories"),
    interestLevel: v.number(), // 1-5 scale of interest
    createdAt: v.number(),
    updatedAt: v.number(),
    source: v.optional(interestSourceValidator),
  }).index("by_user", ["userId"])
    .index("by_category", ["categoryId"]),

  // Course Recommendations
  recommendations: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    score: v.number(), // Recommendation strength/relevance score
    reason: v.string(), // Why this was recommended
    createdAt: v.number(),
    viewed: v.optional(v.boolean()), // If user has viewed this recommendation
    dismissed: v.optional(v.boolean()), // If user has dismissed this recommendation
  }).index("by_user", ["userId"])
    .index("by_course", ["courseId"])
    .index("by_user_score", ["userId", "score"]),

  // User Achievements (For gamification)
  achievements: defineTable({
    userId: v.string(),
    type: achievementTypeValidator,
    title: v.string(),
    description: v.string(),
    awardedAt: v.number(),
    points: v.optional(v.number()), // Points awarded for this achievement
    icon: v.optional(v.string()), // Icon to display for this achievement
    level: v.optional(v.number()), // Achievement level (for multi-level achievements)
    metadata: v.optional(v.any()), // Additional achievement details
  }).index("by_user", ["userId"])
    .index("by_type", ["userId", "type"]),

  // Course Groups (For organizing related courses)
  course_groups: defineTable({
    title: v.string(),
    description: v.string(),
    thumbnail: v.optional(v.string()),
    creatorId: v.string(),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    courseCount: v.number(),
    tags: v.optional(v.array(v.string())),
    slug: v.optional(v.string()),
  }).index("by_creator", ["creatorId"])
    .index("by_public", ["isPublic"]),

  // Course Group Membership
  course_group_members: defineTable({
    groupId: v.id("course_groups"),
    courseId: v.id("courses"),
    position: v.number(), // Order within group
  }).index("by_group", ["groupId"])
    .index("by_course", ["courseId"]),

  // Migrations Registry - Track applied migrations
  migrations_registry: defineTable({
    migrationId: v.string(),
    name: v.string(),
    description: v.string(),
    version: v.number(),
    appliedAt: v.number(), // Timestamp when applied
    result: v.any(), // Result of the migration
    rerun: v.boolean(), // Whether this migration was rerun
  }).index("by_migration_id", ["migrationId"])
    .index("by_version", ["version"]),
});

// Export types for reuse
export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

// Export type for video document
export interface VideoDoc {
  _id: string;
  _creationTime: number;
  youtubeId: string;
  details: {
    type: string;
    id: string,
    title?: string; // Made optional to match schema
    description: string;
    duration: string; // ISO 8601 duration
    thumbnail: string;
    // Add corresponding types for new fields
    channelId?: string;
    channelName?: string;
    channelAvatar?: string;
    views?: string;
    likes?: string;
    publishDate?: string;
  };
  transcripts?: {
    language: string;
    segments: TranscriptSegment[];
    cachedAt: string;
  }[];
  cachedAt: string;
  // Add courseData field to match schema update
  courseData?: any;
  // Add expired flag for cache expiration state
  expired?: boolean;
}

// Re-export types from validation.ts for backward compatibility
export type {
  CourseStatus,
  CompletionStatus,
  AssessmentType,
  SubmissionStatus,
  ActivityType,
  ResourceType,
  DifficultyLevel,
  UserRole,
  UserStatus,
  AuthProvider,
  LearningStyle,
  TaskType,
  SubmissionType,
  ReminderFrequency,
  LearningGoalType,
  ResourceSourceType,
  AchievementType,
  InterestSource,
  ProgressStatus
} from './validation';
