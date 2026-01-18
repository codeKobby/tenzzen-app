import { z } from "zod";

// Helper to sanitize timestamps - AGGRESSIVELY truncate decimals and invalid formats
const sanitizeTimestamp = (val: string): string => {
  if (!val) return "0:00";

  // Remove any whitespace
  val = val.trim();

  // CRITICAL: If it contains a decimal point, truncate IMMEDIATELY at the decimal
  if (val.includes(".")) {
    const beforeDecimal = val.split(".")[0];
    val = beforeDecimal;
    console.warn(
      `🔴 Truncated timestamp with decimal: original had decimal point, using "${val}"`,
    );
  }

  // If it's already short and valid (M:SS or H:MM:SS), return it
  if (val.length <= 8 && /^\d{1,2}:\d{2}(:\d{2})?$/.test(val)) {
    return val;
  }

  // Extract only valid M:SS or H:MM:SS format (NO decimals allowed)
  const match = val.match(/^(\d{1,2}:\d{2}(?::\d{2})?)$/);
  if (match && match[1].length <= 8) {
    return match[1];
  }

  // If still invalid or too long, return default
  if (val.length > 8) {
    console.warn(
      `🔴 Timestamp too long (${val.length} chars), using default: "${val.substring(0, 20)}..."`,
    );
  }
  return "0:00";
};

// ULTRA-STRICT timestamp schema with aggressive preprocessing
const TimestampSchema = z.preprocess(
  (val) => {
    if (typeof val !== "string") return "0:00";

    // IMMEDIATE truncation if decimal detected or length exceeds 8
    if (val.includes(".") || val.length > 8) {
      if (val.length > 10) {
        console.warn(
          `⚠️ Malformed timestamp detected (${val.length} chars): ${val.substring(0, 30)}...`,
        );
      }
      // Split at decimal and take only the part before it
      const cleaned = val.split(".")[0];
      return sanitizeTimestamp(cleaned);
    }

    return sanitizeTimestamp(val);
  },
  z
    .string()
    .max(8, "Timestamp must be 8 characters or less (format: H:MM:SS or M:SS)")
    .regex(
      /^\d{1,2}:\d{2}(:\d{2})?$/,
      "Timestamp must be in format M:SS or H:MM:SS (e.g., '5:30' or '1:23:45')",
    )
    .refine(
      (val) => !val.includes("."),
      "Timestamp must NOT contain decimal points",
    )
    .optional(),
);

// Course structure
export const LessonSchema = z.object({
  title: z.string().max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less"),
  durationMinutes: z.number(),
  timestampStart: TimestampSchema,
  timestampEnd: TimestampSchema,
  keyPoints: z.array(
    z.string().max(500, "Each key point must be 500 characters or less"),
  ),
  content: z
    .string()
    .max(5000, "Lesson content must be 5000 characters or less"),
});

export const ModuleSchema = z.object({
  title: z.string().max(200, "Module title must be 200 characters or less"),
  description: z
    .string()
    .max(1000, "Module description must be 1000 characters or less"),
  lessons: z.array(LessonSchema),
});

export const CourseOutlineSchema = z.object({
  title: z.string().max(200, "Course title must be 200 characters or less"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less"), // Brief 2-3 sentences for "About this course"
  detailedOverview: z
    .string()
    .max(3000, "Detailed overview must be 3000 characters or less"), // Detailed 2-3 paragraphs for "Overview" tab
  category: z.string().max(100, "Category must be 100 characters or less"), // Main category like "Web Development", "Mobile Development", "Data Science"
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  learningObjectives: z.array(
    z.string().max(500, "Each objective must be 500 characters or less"),
  ),
  prerequisites: z.array(
    z.string().max(500, "Each prerequisite must be 500 characters or less"),
  ),
  targetAudience: z
    .string()
    .max(500, "Target audience must be 500 characters or less"),
  estimatedDuration: z
    .string()
    .max(50, "Duration must be 50 characters or less"),
  tags: z.array(z.string().max(50, "Each tag must be 50 characters or less")), // 5-10 specific keywords (React, Flutter, Python, etc.)
  resources: z.array(
    z.object({
      title: z
        .string()
        .max(200, "Resource title must be 200 characters or less"),
      url: z.string().max(500, "URL must be 500 characters or less"),
      type: z.enum([
        "Documentation",
        "Tool",
        "Website",
        "Code",
        "Course",
        "Social",
      ]),
      description: z
        .string()
        .max(500, "Resource description must be 500 characters or less")
        .optional(),
      category: z.enum(["Social", "Creator Links", "Other Resources"]),
      provenance: z.enum(["found", "suggested"]).optional(),
    }),
  ),
  modules: z.array(ModuleSchema),
  assessmentPlan: z
    .object({
      quizLocations: z.array(
        z.object({
          afterModule: z.number().optional(),
          afterLesson: z
            .object({
              moduleIndex: z.number(),
              lessonIndex: z.number(),
            })
            .optional(),
          type: z.literal("quiz"),
        }),
      ),
      hasEndOfCourseTest: z.boolean(),
      hasFinalProject: z.boolean(),
      projectDescription: z.string().optional(),
    })
    .optional(),
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

// Test structure (open-ended)
export const TestQuestionSchema = z.object({
  question: z.string(),
  expectedAnswer: z.string(), // Key points that should be in the answer
  rubric: z.string(), // Criteria for grading
  difficulty: z.enum(["easy", "medium", "hard"]),
  points: z.number(),
});

export const TestQuestionsSchema = z.object({
  questions: z.array(TestQuestionSchema),
});

export type TestQuestion = z.infer<typeof TestQuestionSchema>;
export type TestQuestions = z.infer<typeof TestQuestionsSchema>;

// Project structure
export const ProjectPromptSchema = z.object({
  title: z.string(),
  description: z.string(),
  objectives: z.array(z.string()),
  requirements: z.array(z.string()), // Detailed deliverables
  deliverables: z.array(z.string()),
  evaluationCriteria: z.array(z.string()),
  estimatedDuration: z.string(), // e.g. "2-4 hours"
  difficulty: z.enum(["intermediate", "advanced"]),
});

export type ProjectPrompt = z.infer<typeof ProjectPromptSchema>;

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
