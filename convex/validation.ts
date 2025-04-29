import { v } from "convex/values";

// User related validation
export const userRoleValidator = v.union(
  v.literal("user"), 
  v.literal("admin"), 
  v.literal("moderator"),
  v.literal("instructor")
);

export const userStatusValidator = v.union(
  v.literal("active"), 
  v.literal("suspended"), 
  v.literal("deleted"),
  v.literal("pending")
);

export const authProviderValidator = v.union(
  v.literal("clerk"), 
  v.literal("google"), 
  v.literal("github"),
  v.literal("discord"),
  v.literal("apple")
);

// Learning related validation
export const difficultyLevelValidator = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced"),
  v.literal("expert")
);

export const courseStatusValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("archived"),
  v.literal("pending"),
  v.literal("generating"),
  v.literal("failed"),
  v.literal("ready")
);

export const completionStatusValidator = v.union(
  v.literal("not_started"),
  v.literal("in_progress"),
  v.literal("completed")
);

// Assessment related validation
export const assessmentTypeValidator = v.union(
  v.literal("quiz"),
  v.literal("project"),
  v.literal("assignment"),
  v.literal("exam")
);

export const submissionStatusValidator = v.union(
  v.literal("submitted"),
  v.literal("reviewed"),
  v.literal("revisions_requested"),
  v.literal("approved")
);

export const submissionTypeValidator = v.union(
  v.literal("file"),
  v.literal("link"),
  v.literal("text"),
  v.literal("code"),
  v.literal("mixed")
);

export const progressStatusValidator = v.union(
  v.literal("not_started"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("graded")
);

// Resource related validation
export const resourceTypeValidator = v.union(
  v.literal("link"),
  v.literal("file"),
  v.literal("document"),
  v.literal("video"),
  v.literal("image"),
  v.literal("code"),
  v.literal("pdf")
);

export const resourceSourceTypeValidator = v.union(
  v.literal("user_created"),
  v.literal("ai_generated"),
  v.literal("course_provided")
);

// Activity and preferences related validation
export const activityTypeValidator = v.union(
  v.literal("started_course"),
  v.literal("completed_lesson"),
  v.literal("started_assessment"),
  v.literal("completed_assessment"),
  v.literal("submitted_project"),
  v.literal("received_feedback"),
  v.literal("earned_achievement"),
  v.literal("earned_points"),
  v.literal("shared_note"),
  v.literal("created_course"),
  v.literal("completed_course")
);

export const learningStyleValidator = v.union(
  v.literal("visual"),
  v.literal("auditory"),
  v.literal("reading_writing"),
  v.literal("kinesthetic"),
  v.literal("multimodal")
);

export const taskTypeValidator = v.union(
  v.literal("assignment"), 
  v.literal("quiz"), 
  v.literal("project"),
  v.literal("reminder"),
  v.literal("other")
);

export const reminderFrequencyValidator = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("biweekly"),
  v.literal("monthly")
);

export const learningGoalTypeValidator = v.union(
  v.literal("time_based"),
  v.literal("completion_based"),
  v.literal("date_based")
);

export const interestSourceValidator = v.union(
  v.literal("user_selected"),
  v.literal("inferred"),
  v.literal("quiz")
);

export const achievementTypeValidator = v.union(
  v.literal("streak"),
  v.literal("course_completion"),
  v.literal("assessment_mastery"),
  v.literal("first_project"),
  v.literal("learning_milestone"),
  v.literal("perfect_score"),
  v.literal("community_contribution")
);

// Export typescript types for use in other files
export type UserRole = "user" | "admin" | "moderator" | "instructor";
export type UserStatus = "active" | "suspended" | "deleted" | "pending";
export type AuthProvider = "clerk" | "google" | "github" | "discord" | "apple";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type CourseStatus = "draft" | "published" | "archived" | "pending" | "generating" | "failed" | "ready";
export type CompletionStatus = "not_started" | "in_progress" | "completed";
export type AssessmentType = "quiz" | "project" | "assignment" | "exam";
export type SubmissionStatus = "submitted" | "reviewed" | "revisions_requested" | "approved";
export type SubmissionType = "file" | "link" | "text" | "code" | "mixed";
export type ProgressStatus = "not_started" | "in_progress" | "completed" | "graded";
export type ResourceType = "link" | "file" | "document" | "video" | "image" | "code" | "pdf";
export type ResourceSourceType = "user_created" | "ai_generated" | "course_provided";
export type ActivityType = 
  | "started_course" 
  | "completed_lesson" 
  | "started_assessment" 
  | "completed_assessment"
  | "submitted_project"
  | "received_feedback"
  | "earned_achievement"
  | "earned_points"
  | "shared_note"
  | "created_course"
  | "completed_course";
export type LearningStyle = "visual" | "auditory" | "reading_writing" | "kinesthetic" | "multimodal";
export type TaskType = "assignment" | "quiz" | "project" | "reminder" | "other";
export type ReminderFrequency = "daily" | "weekly" | "biweekly" | "monthly";
export type LearningGoalType = "time_based" | "completion_based" | "date_based";
export type InterestSource = "user_selected" | "inferred" | "quiz";
export type AchievementType = 
  | "streak" 
  | "course_completion" 
  | "assessment_mastery" 
  | "first_project" 
  | "learning_milestone" 
  | "perfect_score" 
  | "community_contribution";