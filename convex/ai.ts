import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { logger } from "@/lib/ai/debug-logger";
import { 
  generateTest, 
  generateAssignment, 
  generateProject,
  GenerateOptions 
} from "@/tools/vercelAiAgent";

// Types for assessment content
interface TestContent {
  type: "test";
  title: string;
  description: string;
  questions: Array<{
    question: string;
    type: "multiple-choice" | "written";
    options?: string[];
    correctAnswer: string;
    explanation: string;
  }>;
}

interface AssignmentContent {
  type: "assignment";
  title: string;
  description: string;
  tasks: Array<{
    title: string;
    description: string;
    acceptance: string[];
    hint?: string;
  }>;
}

interface ProjectContent {
  type: "project";
  title: string;
  description: string;
  guidelines: string;
  submissionFormats: Array<"file upload" | "git repo link">;
  deadline: string;
}

type AssessmentContent = TestContent | AssignmentContent | ProjectContent;

// AI generation action using Vercel AI SDK
export const generateAssessmentContent = action({
  args: {
    type: v.union(v.literal("test"), v.literal("assignment"), v.literal("project")),
    content: v.string(),
    options: v.optional(v.object({
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number())
    }))
  },
  handler: async (ctx, { type, content, options }): Promise<AssessmentContent> => {
    // Edge runtime for AI
    if (process.env.VERCEL_ENV === "development") {
      // Return mock data in development
      return getMockAssessment(type);
    }

    const { temperature = 0.7, maxTokens = 2048 } = options ?? {};
    const generateOptions: GenerateOptions = {
      temperature,
      maxTokens
    };

    try {
      // Use Vercel AI SDK with Google AI
      switch (type) {
        case "test":
          return await generateTest({ 
            content, 
            questionCount: 5,
            options: generateOptions 
          }) as TestContent;

        case "assignment":
          return await generateAssignment({ 
            content,
            skills: ["coding", "problem-solving"],
            options: generateOptions 
          }) as AssignmentContent;

        case "project":
          return await generateProject({ 
            courseContent: content,
            requiredSkills: ["coding", "system-design", "problem-solving"],
            options: generateOptions 
          }) as ProjectContent;
      }
    } catch (error) {
      logger.error(
        "google",
        "Failed to generate assessment content", 
        {
          type,
          error,
          content
        }
      );
      throw error;
    }
  },
});

// Mock data for development
function getMockAssessment(type: "test" | "assignment" | "project"): AssessmentContent {
  switch (type) {
    case "test":
      return {
        type: "test",
        title: "Mock Test",
        description: "A test of your knowledge",
        questions: [
          {
            question: "What is the meaning of life?",
            type: "multiple-choice",
            options: ["42", "Love", "Code", "All of the above"],
            correctAnswer: "42",
            explanation: "According to the Hitchhiker's Guide"
          }
        ]
      };

    case "assignment":
      return {
        type: "assignment",
        title: "Mock Assignment",
        description: "A simple practice task",
        tasks: [
          {
            title: "Hello World",
            description: "Write a program that prints 'Hello, World!'",
            acceptance: ["Program runs", "Correct output"],
            hint: "Use console.log()"
          }
        ]
      };

    case "project":
      return {
        type: "project",
        title: "Mock Project",
        description: "A sample project",
        guidelines: "Build something awesome",
        submissionFormats: ["git repo link"],
        deadline: "2 weeks"
      };
  }
}
