import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define schema with proper table configuration
export default defineSchema({
  transcripts: defineTable({
    youtubeId: v.string(),
    language: v.string(),
    segments: v.array(v.object({
      text: v.string(),
      start: v.number(),
      duration: v.number()
    })),
    cachedAt: v.string(),
  }).searchIndex("search_by_id", {
    searchField: "youtubeId",
  }).searchIndex("search_by_id_lang", {
    searchField: "youtubeId",
    filterFields: ["language"],
  }),

  videos: defineTable({
    youtubeId: v.string(),
    details: v.object({
      type: v.string(),
      id: v.string(),
      title: v.string(),
      description: v.string(),
      duration: v.string(),
      thumbnail: v.string()
    }),
    cachedAt: v.string(),
  }).searchIndex("by_youtube_id", {
    searchField: "youtubeId",
  }),

  // --- Added Courses Table ---
  courses: defineTable({
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    videoId: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    overview: v.optional(v.object({
      description: v.optional(v.string()),
      prerequisites: v.optional(v.array(v.string())),
      learningOutcomes: v.optional(v.array(v.string())),
      totalDuration: v.optional(v.string()),
      difficultyLevel: v.optional(v.string()),
      skills: v.optional(v.array(v.string())),
      tools: v.optional(v.array(v.string()))
    })),
    sections: v.optional(v.array(v.any())),
    metadata: v.optional(v.object({
      difficulty: v.optional(v.string()),
      duration: v.optional(v.string()),
      prerequisites: v.optional(v.array(v.string())),
      objectives: v.optional(v.array(v.string())),
      category: v.optional(v.string()),
      sources: v.optional(v.array(v.any())),
    })),
    status: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    enrollmentCount: v.optional(v.number())
  }),

  // --- Added Enrollments Table ---
  enrollments: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    enrolledAt: v.number(),
    lastAccessedAt: v.number(),
    progress: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    completedLessons: v.optional(v.array(v.string()))
  })
});

// Export type for segments
export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

// Export type for document
export interface TranscriptDoc {
  _id: string;
  _creationTime: number;
  youtubeId: string;
  language: string;
  segments: TranscriptSegment[];
  cachedAt: string;
}

// Export type for video document
export interface VideoDoc {
  _id: string;
  _creationTime: number;
  youtubeId: string;
  details: {
    type: string;
    id: string;
    title: string;
    description: string;
    duration: string;
    thumbnail: string;
  };
  cachedAt: string;
}
