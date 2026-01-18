"use server";

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { config } from "@/lib/config";
import { AIClient } from "@/lib/ai/client";
import type { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(config.convex.url);

interface GenerateTestResult {
  success: boolean;
  testId?: string;
  error?: string;
}

interface TestQuestion {
  question: string;
  expectedAnswer: string;
  rubric: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
}

/**
 * Generate an open-ended test for a lesson.
 * Tests require typed answers and are more in-depth than quizzes.
 */
export async function generateTest(
  lessonId: Id<"lessons">,
  options: {
    numQuestions?: number;
    difficulty?: "easy" | "medium" | "hard" | "mixed";
    userId: string;
  },
): Promise<GenerateTestResult> {
  try {
    // Step 1: Get lesson data
    console.log("Fetching lesson data for test generation...");
    const lesson = await convex.query(api.courses.getLesson, { lessonId });

    if (!lesson) {
      return {
        success: false,
        error: "Lesson not found",
      };
    }

    // Check if test already generated
    if (lesson.testGenerated) {
      return {
        success: true,
        testId: `test-${lessonId}`,
      };
    }

    // Step 2: Generate test questions with AI
    console.log("Generating test questions with AI...");
    const numQuestions = options.numQuestions || 5;

    // Use AIClient to generate open-ended questions
    const testQuestions = await AIClient.generateTestQuestions({
      lessonTitle: lesson.title,
      lessonContent: lesson.content,
      keyPoints: lesson.keyPoints,
      numQuestions,
      difficulty: options.difficulty || "mixed",
    });

    // Step 3: Store test in Convex (using quizzes table with a test type marker)
    console.log("Storing test in database...");
    const testId = await convex.mutation(api.quizzes.createAIQuiz, {
      lessonId,
      moduleId: lesson.moduleId,
      courseId: lesson.courseId,
      title: `Test: ${lesson.title}`,
      description: `Open-ended test covering: ${lesson.title}`,
      passingScore: 70,
      type: "test", // New field
      questions: testQuestions.questions.map(
        (q: TestQuestion, idx: number) => ({
          question: q.question,
          // Options and correctAnswer are optional now
          explanation: q.expectedAnswer, // Store expected answer as explanation
          difficulty: q.difficulty,
          type: "open_ended", // New field
          order: idx,
        }),
      ),
      aiModel: "gemini-1.5-pro",
    });

    // Step 4: Mark lesson as having test generated
    await convex.mutation(api.courses.updateLessonFlags, {
      lessonId,
      testGenerated: true,
    });

    console.log("Test generated successfully:", testId);
    return {
      success: true,
      testId: testId as unknown as string,
    };
  } catch (error) {
    console.error("Error generating test:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
