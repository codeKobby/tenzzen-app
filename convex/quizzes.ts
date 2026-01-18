import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Mutation to create an AI-generated quiz/test/project
export const createAIQuiz = mutation({
  args: {
    lessonId: v.optional(v.id("lessons")),
    moduleId: v.optional(v.id("modules")),
    courseId: v.id("courses"),
    title: v.string(),
    description: v.string(),
    passingScore: v.number(),
    type: v.optional(
      v.union(v.literal("quiz"), v.literal("test"), v.literal("project")),
    ),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.optional(v.array(v.string())),
        correctAnswer: v.optional(v.number()),
        explanation: v.string(),
        difficulty: v.union(
          v.literal("easy"),
          v.literal("medium"),
          v.literal("hard"),
        ),
        type: v.optional(
          v.union(
            v.literal("multiple_choice"),
            v.literal("open_ended"),
            v.literal("project_task"),
          ),
        ),
      }),
    ),
    aiModel: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Create quiz/test/project
    const quizId = await ctx.db.insert("quizzes", {
      lessonId: args.lessonId,
      moduleId: args.moduleId,
      courseId: args.courseId,
      title: args.title,
      description: args.description,
      passingScore: args.passingScore,
      type: args.type || "quiz", // Default to quiz for backward compatibility
      generatedBy: "ai" as const,
      aiModel: args.aiModel,
      createdAt: now,
      updatedAt: now,
    });

    // Create questions
    for (
      let questionIndex = 0;
      questionIndex < args.questions.length;
      questionIndex++
    ) {
      const questionData = args.questions[questionIndex];

      await ctx.db.insert("quizQuestions", {
        quizId,
        question: questionData.question,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
        explanation: questionData.explanation,
        difficulty: questionData.difficulty,
        type: questionData.type,
        order: questionIndex,
        createdAt: now,
      });
    }

    return quizId;
  },
});

// Query to get quiz with questions
export const getQuizWithQuestions = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) return null;

    const questions = await ctx.db
      .query("quizQuestions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    return {
      ...quiz,
      questions: questions.sort((a, b) => a.order - b.order),
    };
  },
});

// Query to get quizzes for a course
export const getCourseQuizzes = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

// Query to get quizzes for a lesson
export const getLessonQuizzes = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizzes")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();
  },
});

// Query to get quizzes for a module
export const getModuleQuizzes = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizzes")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .collect();
  },
});
