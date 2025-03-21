import { defineTable } from "convex/server";
import { v } from "convex/values";

// Course schema definition
const courseSchema = {
  title: v.string(),
  subtitle: v.string(),
  overview: v.object({
    description: v.string(),
    prerequisites: v.array(v.object({
      title: v.string(),
      description: v.string(),
      level: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
    })),
    learningOutcomes: v.array(v.object({
      title: v.string(),
      description: v.string(),
      category: v.union(v.literal("skill"), v.literal("knowledge"), v.literal("tool"))
    })),
    totalDuration: v.string(),
    difficultyLevel: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    skills: v.array(v.string()),
    tools: v.array(v.string())
  }),
  sections: v.array(v.object({
    id: v.string(),
    title: v.string(),
    description: v.string(),
    duration: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    lessons: v.array(v.object({
      id: v.string(),
      title: v.string(),
      description: v.string(),
      content: v.string(),
      duration: v.string(),
      startTime: v.number(),
      endTime: v.number(),
      resources: v.array(v.object({
        title: v.string(),
        type: v.union(
          v.literal("article"),
          v.literal("video"),
          v.literal("code"),
          v.literal("document")
        ),
        url: v.string(),
        description: v.string()
      }))
    })),
    assessments: v.array(v.object({
      id: v.string(),
      type: v.union(v.literal("test"), v.literal("assignment"), v.literal("project")),
      title: v.string(),
      description: v.string(),
      position: v.number(),
      isLocked: v.boolean(),
      estimatedDuration: v.string(),
      requiredSkills: v.array(v.string()),
      contentGenerated: v.boolean()
    }))
  })),
  status: v.union(
    v.literal("draft"),
    v.literal("generating"),
    v.literal("ready"),
    v.literal("failed")
  ),
  createdAt: v.number(),
  updatedAt: v.number(),
  videoId: v.optional(v.string())
};

// Define tables
export default {
  courses: defineTable(courseSchema),
  
  progress: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    lessonId: v.string(),
    completed: v.boolean(),
    lastAccessed: v.number()
  }),

  assessments: defineTable({
    courseId: v.id("courses"),
    sectionId: v.string(),
    assessmentId: v.string(),
    type: v.union(v.literal("test"), v.literal("assignment"), v.literal("project")),
    content: v.string(),
    expectedOutput: v.string(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
};
