import { tool } from 'ai';
import { z } from 'zod';

// Generate course structure schemas
const learningOutcomeSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(['skill', 'knowledge', 'tool'])
});

const prerequisiteSchema = z.object({
  title: z.string(),
  description: z.string(),
  level: z.enum(['beginner', 'intermediate', 'advanced'])
});

const courseStructureSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  overview: z.object({
    description: z.string(),
    prerequisites: z.array(prerequisiteSchema),
    learningOutcomes: z.array(learningOutcomeSchema),
    totalDuration: z.string(),
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    skills: z.array(z.string()),
    tools: z.array(z.string())
  }),
  sections: z.array(z.object({
    title: z.string(),
    description: z.string(),
    duration: z.string(),
    lessons: z.array(z.object({
      title: z.string(),
      duration: z.string(),
      description: z.string(),
      content: z.string(),
      test: z.object({
        questions: z.array(z.object({
          question: z.string(),
          options: z.array(z.string()),
          correctAnswer: z.number(),
          explanation: z.string()
        }))
      }).optional(),
      resources: z.array(z.object({
        title: z.string(),
        type: z.enum(['article', 'video', 'code', 'document']),
        url: z.string(),
        description: z.string()
      }))
    }))
  }))
});

// Resource suggestion schemas
const resourceRequestSchema = z.object({
  topics: z.array(z.string()),
  resourceTypes: z.array(z.enum(['article', 'video', 'code', 'document']))
});

const resourceResultSchema = z.array(z.object({
  topic: z.string(),
  resources: z.array(z.object({
    title: z.string(),
    type: z.enum(['article', 'video', 'code', 'document']),
    url: z.string(),
    description: z.string()
  }))
}));

// Course generation tool
export const generateCourseStructure = tool({
  parameters: courseStructureSchema,
  description: "Generate a structured course outline",
  execute: async (courseStructure) => {
    return courseStructure;
  }
});

// Resource suggestion tool
export const suggestResources = tool({
  parameters: resourceRequestSchema,
  description: "Get resource suggestions for course topics",
  execute: async ({ topics, resourceTypes }) => {
    // Mock response for now
    return topics.map(topic => ({
      topic,
      resources: resourceTypes.map(type => ({
        title: `Sample ${type} for ${topic}`,
        type,
        url: `https://example.com/${type}/${encodeURIComponent(topic)}`,
        description: `A ${type} resource about ${topic}`
      }))
    }));
  }
});

// Export types
export type CourseStructure = z.infer<typeof courseStructureSchema>;
export type ResourceRequest = z.infer<typeof resourceRequestSchema>;
export type ResourceResult = z.infer<typeof resourceResultSchema>;