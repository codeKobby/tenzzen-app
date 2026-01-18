"use server";

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { config } from "@/lib/config";
import { AIClient } from "@/lib/ai/client";
import type { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(config.convex.url);

interface GenerateProjectResult {
  success: boolean;
  projectId?: string;
  error?: string;
}

/**
 * Generate a capstone project for a course.
 * Projects are comprehensive, practical assignments.
 */
export async function generateProject(
  courseId: Id<"courses">,
  options: {
    userId: string;
  },
): Promise<GenerateProjectResult> {
  try {
    // Step 1: Get course data
    console.log("Fetching course data for project generation...");
    const course = await convex.query(api.courses.getCourseWithContent, {
      courseId,
    });

    if (!course) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    // Check if project already generated (using flags if available, or querying quizzes table)
    // Note: We might need to add a projectGenerated flag to courses table too,
    // but typically we can check existing quizzes/projects.
    // For now, let's proceed with generation.

    // Step 2: Generate project with AI
    console.log("Generating project prompt with AI...");

    // We pass modules to give context on what skills to assess
    const projectPrompt = await AIClient.generateProjectPrompt({
      courseTitle: course.title,
      courseDescription: course.description,
      modules: course.sections || [], // Use 'sections' from course object which maps to modules structure
    });

    // Step 3: Store project in Convex
    console.log("Storing project in database...");
    const projectId = await convex.mutation(api.quizzes.createAIQuiz, {
      courseId,
      title: projectPrompt.title,
      description: projectPrompt.description,
      passingScore: 100, // Projects are usually pass/fail or manual grading, setting 100 as placeholder
      type: "project",
      questions: [
        {
          question: "Project Requirements & Deliverables",
          explanation: JSON.stringify({
            objectives: projectPrompt.objectives,
            requirements: projectPrompt.requirements,
            deliverables: projectPrompt.deliverables,
            evaluationCriteria: projectPrompt.evaluationCriteria,
          }),
          difficulty: projectPrompt.difficulty,
          type: "project_task",
          options: [],
          correctAnswer: 0,
        },
      ],
      aiModel: "gemini-1.5-pro",
    });

    // Step 4: Mark course/project generated flag if we had one,
    // or rely on existence check. For now, we return success.

    console.log("Project generated successfully:", projectId);
    return {
      success: true,
      projectId: projectId as unknown as string,
    };
  } catch (error) {
    console.error("Error generating project:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
