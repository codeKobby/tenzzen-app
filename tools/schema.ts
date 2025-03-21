import { z } from 'zod';
import type { ResourceType } from '@/types/course';

const resourceTypeSchema = z.enum(['article', 'video', 'code', 'document', 'link']);
const difficultyLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
const categorySchema = z.enum(['skill', 'knowledge', 'tool']);
const assessmentTypeSchema = z.enum(['test', 'assignment', 'project']);
const questionTypeSchema = z.enum(['multiple-choice', 'written']);

// Resource schema
const resourceSchema = z.object({
  title: z.string(),
  type: resourceTypeSchema,
  url: z.string().url(),
  description: z.string()
});

// Lesson schema
const lessonSchema = z.object({
  title: z.string(),
  duration: z.string(),
  description: z.string(),
  content: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  resources: z.array(resourceSchema)
});

// Assessment placeholder schema
const assessmentPlaceholderSchema = z.object({
  id: z.string(),
  type: assessmentTypeSchema,
  title: z.string(),
  description: z.string(),
  position: z.number(),
  isLocked: z.boolean(),
  requiredSkills: z.array(z.string()),
  estimatedDuration: z.string(),
  contentGenerated: z.literal(false)
});

// Section schema
const sectionSchema = z.object({
  title: z.string(),
  description: z.string(),
  duration: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  lessons: z.array(lessonSchema),
  assessments: z.array(assessmentPlaceholderSchema)
});

// Course structure schema
export const courseStructureSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  overview: z.object({
    description: z.string(),
    prerequisites: z.array(z.object({
      title: z.string(),
      description: z.string(),
      level: difficultyLevelSchema
    })),
    learningOutcomes: z.array(z.object({
      title: z.string(),
      description: z.string(),
      category: categorySchema
    })),
    totalDuration: z.string(),
    difficultyLevel: difficultyLevelSchema,
    skills: z.array(z.string()),
    tools: z.array(z.string())
  }),
  sections: z.array(sectionSchema)
});

// Test generation schema
export const testGenerationSchema = z.object({
  title: z.string(),
  description: z.string(),
  questions: z.array(z.object({
    question: z.string(),
    type: questionTypeSchema,
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    explanation: z.string()
  })),
  questionCount: z.number(),
  questionTypes: z.array(questionTypeSchema)
});

// Assignment generation schema
export const assignmentGenerationSchema = z.object({
  title: z.string(),
  description: z.string(),
  tasks: z.array(z.object({
    title: z.string(),
    description: z.string(),
    acceptance: z.array(z.string()),
    hint: z.string().optional()
  })),
  instructions: z.string(),
  skills: z.array(z.string())
});

// Project generation schema
export const projectGenerationSchema = z.object({
  title: z.string(),
  description: z.string(),
  guidelines: z.string(),
  submissionFormats: z.array(z.enum(['file upload', 'git repo link'])),
  deadline: z.string(),
  requiredSkills: z.array(z.string())
});

// Export schema types
export type CourseStructure = z.infer<typeof courseStructureSchema>;
export type TestGeneration = z.infer<typeof testGenerationSchema>;
export type AssignmentGeneration = z.infer<typeof assignmentGenerationSchema>;
export type ProjectGeneration = z.infer<typeof projectGenerationSchema>;