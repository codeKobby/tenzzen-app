import { z } from "zod";

// Course structure
export const LessonSchema = z.object({
  title: z.string().max(200, "Title must be 200 characters or less"),
  description: z.string().max(1000, "Description must be 1000 characters or less"),
  durationMinutes: z.number(),
  timestampStart: z.string().regex(/^\d{1,2}:\d{2}(:\d{2})?$/, "Timestamp must be in format H:MM:SS or M:SS").max(10).optional(), // Format: "0:00:00" or "0:13:00" (max 10 chars)
  timestampEnd: z.string().regex(/^\d{1,2}:\d{2}(:\d{2})?$/, "Timestamp must be in format H:MM:SS or M:SS").max(10).optional(),   // Format: "0:13:00" or "0:23:00" (max 10 chars)
  keyPoints: z.array(z.string().max(500, "Each key point must be 500 characters or less")),
  content: z.string().max(5000, "Lesson content must be 5000 characters or less"),
});

export const ModuleSchema = z.object({
  title: z.string().max(200, "Module title must be 200 characters or less"),
  description: z.string().max(1000, "Module description must be 1000 characters or less"),
  lessons: z.array(LessonSchema),
});

export const CourseOutlineSchema = z.object({
  title: z.string().max(200, "Course title must be 200 characters or less"),
  description: z.string().max(1000, "Description must be 1000 characters or less"), // Brief 2-3 sentences for "About this course"
  detailedOverview: z.string().max(3000, "Detailed overview must be 3000 characters or less"), // Detailed 2-3 paragraphs for "Overview" tab
  category: z.string().max(100, "Category must be 100 characters or less"), // Main category like "Web Development", "Mobile Development", "Data Science"
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  learningObjectives: z.array(z.string().max(500, "Each objective must be 500 characters or less")),
  prerequisites: z.array(z.string().max(500, "Each prerequisite must be 500 characters or less")),
  targetAudience: z.string().max(500, "Target audience must be 500 characters or less"),
  estimatedDuration: z.string().max(50, "Duration must be 50 characters or less"),
  tags: z.array(z.string().max(50, "Each tag must be 50 characters or less")), // 5-10 specific keywords (React, Flutter, Python, etc.)
  resources: z.array(z.object({
    title: z.string().max(200, "Resource title must be 200 characters or less"),
    url: z.string().max(500, "URL must be 500 characters or less"),
    type: z.enum(["Documentation", "Tool", "Website", "Code", "Course", "Social"]),
    description: z.string().max(500, "Resource description must be 500 characters or less").optional(),
    category: z.enum(["Social", "Creator Links", "Other Resources"]),
  })),
  modules: z.array(ModuleSchema),
  assessmentPlan: z.object({
    quizLocations: z.array(z.object({
      afterModule: z.number().optional(),
      afterLesson: z.object({
        moduleIndex: z.number(),
        lessonIndex: z.number(),
      }).optional(),
      type: z.literal('quiz'),
    })),
    hasEndOfCourseTest: z.boolean(),
    hasFinalProject: z.boolean(),
    projectDescription: z.string().optional(),
  }).optional(),
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
