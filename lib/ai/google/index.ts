import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { courseStructureSchema } from '@/tools/schema';

// Initialize Google AI with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Safety settings for the model
const safetySettings = [
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }
];

// Get model instance with safety settings
export const courseModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro-latest',
  safetySettings
});

// Tool definitions for course generation
export const courseGenerationTools = {
  generateCourseStructure: {
    description: "Generate a structured course outline from content",
    parameters: z.object({
      title: z.string(),
      subtitle: z.string(),
      overview: z.object({
        description: z.string(),
        prerequisites: z.array(z.object({
          title: z.string(),
          description: z.string()
        })),
        learningOutcomes: z.array(z.string()),
        totalDuration: z.string(),
        difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
        skills: z.array(z.string()),
        tools: z.array(z.string())
      }),
      sections: z.array(z.object({
        title: z.string(),
        description: z.string(),
        duration: z.string(),
        startTime: z.number(),
        endTime: z.number(),
        lessons: z.array(z.object({
          title: z.string(),
          duration: z.string(),
          description: z.string(),
          content: z.string(),
          startTime: z.number(),
          endTime: z.number(),
          resources: z.array(z.object({
            title: z.string(),
            type: z.string(),
            url: z.string(),
            description: z.string()
          }))
        })),
        assessments: z.array(z.object({
          type: z.enum(['test', 'assignment', 'project']),
          title: z.string(),
          description: z.string(),
          position: z.number(),
          isLocked: z.boolean(),
          requiredSkills: z.array(z.string()),
          estimatedDuration: z.string()
        }))
      }))
    })
  },
  generateAssessment: {
    description: "Generate an assessment for a course section",
    parameters: courseStructureSchema
  }
};

// Common prompt templates
export const PROMPT_TEMPLATES = {
  courseStructure: (context: string) => `
Create a structured course outline based on this content:

${context}

Guidelines:
1. Break content into logical sections
2. Create focused lessons with clear objectives
3. Include timestamps where relevant
4. Add relevant resources and assessments
5. Follow difficulty progression
6. Ensure clear prerequisites

Return the course structure following the schema provided.
`,
  assessment: (context: string) => `
Generate an assessment based on this course section:

${context}

Guidelines:
1. Match difficulty to content
2. Test key concepts
3. Include practical applications
4. Provide clear instructions
5. Add evaluation criteria

Return the assessment following the schema provided.
`
};

// Error handling
export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'AI_ERROR',
    public readonly status: number = 500
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export function handleAIError(error: unknown): never {
  if (error instanceof AIError) {
    throw error;
  }
  const message = error instanceof Error ? error.message : 'Unknown AI error';
  throw new AIError(message);
}