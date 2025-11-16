import { z } from "zod";

// Course structure
export const LessonSchema = z.object({
  title: z.string(),
  description: z.string(),
  durationMinutes: z.number(),
  keyPoints: z.array(z.string()),
  content: z.string(),
});

export const ModuleSchema = z.object({
  title: z.string(),
  description: z.string(),
  lessons: z.array(LessonSchema),
});

export const CourseOutlineSchema = z.object({
  title: z.string(),
  description: z.string(),
  learningObjectives: z.array(z.string()),
  prerequisites: z.array(z.string()),
  targetAudience: z.string(),
  estimatedDuration: z.string(),
  modules: z.array(ModuleSchema),
});

export type CourseOutline = z.infer<typeof CourseOutlineSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Lesson = z.infer<typeof LessonSchema>;

// Quiz structure
export const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
  explanation: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export const QuizSchema = z.object({
  title: z.string(),
  description: z.string(),
  questions: z.array(QuizQuestionSchema),
  passingScore: z.number(),
});

export type Quiz = z.infer<typeof QuizSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

// Video recommendation structure
export const VideoRecommendationSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channelName: z.string(),
  thumbnail: z.string(),
  duration: z.string(),
  views: z.string(),
  publishDate: z.string(),
  relevanceScore: z.number(),
  benefit: z.string(),
});

export const VideoRecommendationsSchema = z.object({
  recommendations: z.array(VideoRecommendationSchema),
});

export type VideoRecommendation = z.infer<typeof VideoRecommendationSchema>;
export type VideoRecommendations = z.infer<typeof VideoRecommendationsSchema>;
