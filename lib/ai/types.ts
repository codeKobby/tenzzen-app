import { z } from "zod";

// Helper to sanitize timestamps - truncate to valid format and validate strictly
const sanitizeTimestamp = (val: string): string => {
  if (!val) return "0:00:00";
  
  // Remove any whitespace
  val = val.trim();
  
  // If it's already short and valid, return it
  if (val.length <= 8 && /^\d{1,2}:\d{2}(:\d{2})?$/.test(val)) {
    return val;
  }
  
  // Truncate overly long timestamps to valid H:MM:SS format (max 8 chars: "00:00:00")
  const match = val.match(/^(\d{1,2}:\d{2}:\d{2})/);
  if (match && match[1].length <= 8) {
    return match[1];
  }
  
  // If still invalid, return default
  return "0:00:00";
};

// Strict timestamp schema with preprocess to handle malformed data
const TimestampSchema = z.preprocess(
  (val) => {
    if (typeof val !== 'string') return "0:00:00";
    
    // Log if we're getting malformed data
    if (val.length > 10) {
      console.warn(`⚠️ Truncating malformed timestamp (${val.length} chars): ${val.substring(0, 20)}...`);
    }
    
    // Aggressively truncate to valid format before validation
    return sanitizeTimestamp(val);
  },
  z.string()
    .regex(/^\d{1,2}:\d{2}(:\d{2})?$/, "Timestamp must be in format H:MM:SS (e.g., '0:05:30' or '1:23:45')")
    .optional()
);

// Course structure
export const LessonSchema = z.object({
  title: z.string().max(200, "Title must be 200 characters or less"),
  description: z.string().max(1000, "Description must be 1000 characters or less"),
  durationMinutes: z.number(),
  timestampStart: TimestampSchema,
  timestampEnd: TimestampSchema,
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
