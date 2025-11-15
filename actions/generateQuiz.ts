"use server";

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { config } from "@/lib/config";
import { AIClient } from "@/lib/ai/client";
import type { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(config.convex.url);

interface GenerateQuizResult {
  success: boolean;
  quizId?: Id<"quizzes">;
  error?: string;
}

export async function generateQuiz(
  lessonId: Id<"lessons">,
  options: {
    numQuestions?: number;
    difficulty?: "easy" | "medium" | "hard" | "mixed";
    userId: string;
  }
): Promise<GenerateQuizResult> {
  try {
    // Step 1: Get lesson data
    console.log("Fetching lesson data...");
    const lesson = await convex.query(api.courses.getLesson, { lessonId });

    if (!lesson) {
      return {
        success: false,
        error: "Lesson not found",
      };
    }

    // Step 2: Generate quiz with AI
    console.log("Generating quiz with AI...");
    const quiz = await AIClient.generateQuiz({
      lessonTitle: lesson.title,
      lessonContent: lesson.content,
      numQuestions: options.numQuestions,
      difficulty: options.difficulty,
    });

    // Step 3: Store quiz in Convex
    console.log("Storing quiz in database...");
    const quizId = await convex.mutation(api.quizzes.createAIQuiz, {
      lessonId,
      courseId: lesson.courseId,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      questions: quiz.questions,
      aiModel: "gpt-4o",
    });

    console.log("Quiz generated successfully:", quizId);
    return {
      success: true,
      quizId,
    };
  } catch (error) {
    console.error("Error generating quiz:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
