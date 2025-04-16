import { z } from "zod";

// Define resource types and schema
export const resourceTypeSchema = z.enum(['article', 'book', 'tutorial', 'tool', 'video', 'code', 'documentation', 'blog']);

// Resource schema
export const resourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  description: z.string(),
  type: resourceTypeSchema
});

// Schema for individual course lessons
export const lessonSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  contentType: z.enum(["text", "video", "quiz", "exercise"]).default("text"),
  content: z.string(),
  timeEstimate: z.number().min(1).max(60).optional(),
  order: z.number().optional(),
});

export type Lesson = z.infer<typeof lessonSchema>;

// Schema for course sections
export const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  order: z.number().optional(),
  lessons: z.array(lessonSchema).optional(),
  timeEstimate: z.number().min(1).max(240).optional(),
});

export type Section = z.infer<typeof sectionSchema>;

// Schema for quizzes and assessments
export const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
  options: z.array(z.object({
    id: z.string().optional(),
    text: z.string(),
    isCorrect: z.boolean(),
  })),
  explanation: z.string().optional(),
});

export type Question = z.infer<typeof questionSchema>;

export const quizSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  questions: z.array(questionSchema),
  passingScore: z.number().min(0).max(100).default(70),
  timeLimit: z.number().min(1).max(60).optional(), // in minutes
});

export type Quiz = z.infer<typeof quizSchema>;

// Main course schema
export const courseSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).default("Intermediate"),
  learningObjectives: z.array(z.string()),
  prerequisites: z.array(z.string()).optional(),
  sections: z.array(sectionSchema),
  duration: z.number().min(1).optional(), // Total duration in minutes
  assessment: quizSchema.optional(),
  tags: z.array(z.string()).optional(),
  videoId: z.string().optional(),
  createdBy: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Course = z.infer<typeof courseSchema>;