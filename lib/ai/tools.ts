import { z } from 'zod';

// Tool schemas
export const courseSections = z.array(z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  duration: z.string(),
  lessons: z.array(z.object({
    id: z.string(),
    title: z.string(),
    duration: z.string(),
    description: z.string(),
    content: z.string(),
    isLocked: z.boolean(),
    resources: z.array(z.object({
      title: z.string(),
      type: z.enum(['article', 'video', 'code', 'document']),
      url: z.string(),
      description: z.string()
    })),
    test: z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      timeLimit: z.number(),
      passingScore: z.number(),
      questions: z.array(z.object({
        question: z.string(),
        options: z.array(z.string()),
        correctAnswer: z.number(),
        explanation: z.string()
      })),
      isLocked: z.boolean()
    })
  })),
  isLocked: z.boolean()
}));

export const courseOverview = z.object({
  description: z.string(),
  prerequisites: z.array(z.object({
    title: z.string(),
    description: z.string(),
    level: z.enum(['beginner', 'intermediate', 'advanced'])
  })),
  learningOutcomes: z.array(z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['skill', 'knowledge', 'tool'])
  })),
  totalDuration: z.string(),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  skills: z.array(z.string()),
  tools: z.array(z.string())
});

// Tool definitions
export const tools = [
  {
    name: 'analyzeCourseContent',
    description: 'Analyze video content and determine key topics and learning objectives',
    parameters: z.object({
      title: z.string(),
      description: z.string(),
      duration: z.string(),
      topics: z.array(z.string()),
      targetAudience: z.string(),
      recommendedLevel: z.enum(['beginner', 'intermediate', 'advanced'])
    })
  },
  {
    name: 'generateCourseOverview',
    description: 'Create a comprehensive course overview with prerequisites and outcomes',
    parameters: courseOverview
  },
  {
    name: 'generateCourseSections',
    description: 'Generate detailed course sections with lessons and assessments',
    parameters: courseSections
  },
  {
    name: 'validateCourseStructure',
    description: 'Validate the complete course structure and ensure all required elements are present',
    parameters: z.object({
      title: z.string(),
      subtitle: z.string(),
      overview: courseOverview,
      sections: courseSections
    })
  },
  {
    name: 'generateTestQuestions',
    description: 'Generate test questions for each course section',
    parameters: z.object({
      sectionTitle: z.string(),
      topics: z.array(z.string()),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
      questions: z.array(z.object({
        question: z.string(),
        options: z.array(z.string()),
        correctAnswer: z.number(),
        explanation: z.string()
      }))
    })
  },
  {
    name: 'suggestResources',
    description: 'Suggest additional learning resources for each topic',
    parameters: z.object({
      topic: z.string(),
      resources: z.array(z.object({
        title: z.string(),
        type: z.enum(['article', 'video', 'code', 'document']),
        url: z.string(),
        description: z.string()
      }))
    })
  }
] as const;

// Tool return types
export type ToolCallResult = {
  name: (typeof tools)[number]['name'];
  parameters: z.infer<(typeof tools)[number]['parameters']>;
};

// Schema validation helper
export function validateToolCall(
  name: string,
  parameters: unknown
): parameters is ToolCallResult['parameters'] {
  const tool = tools.find(t => t.name === name);
  if (!tool) return false;
  
  try {
    tool.parameters.parse(parameters);
    return true;
  } catch {
    return false;
  }
}