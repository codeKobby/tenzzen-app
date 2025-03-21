import { logger } from '@/lib/ai/debug-logger';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { 
  Course, 
  ResourceType, 
  AssessmentBase,
  TestContent,
  AssignmentContent,
  ProjectContent,
  Section
} from '@/types/course';
import { courseStructureSchema, testGenerationSchema, assignmentGenerationSchema, projectGenerationSchema } from './schema';

// Tool definitions
export const tools = {
  generateCourseStructure: {
    description: "Generate a structured course outline from transcript",
    parameters: courseStructureSchema
  },
  generateTest: {
    description: "Generate test questions based on content",
    parameters: testGenerationSchema
  },
  generateAssignment: {
    description: "Generate practical assignment tasks",
    parameters: assignmentGenerationSchema
  },
  generateProject: {
    description: "Generate capstone project requirements",
    parameters: projectGenerationSchema
  }
} as const;

// Type for tool names
type ToolName = keyof typeof tools;

// Initialize Google model
const googleModel = google('gemini-1.5-pro-latest', {
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ]
});

// Common interfaces
export interface GenerateOptions {
  abortSignal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
}

interface TestParams {
  content: string;  
  questionCount?: number;
  questionTypes?: ('multiple-choice' | 'written')[];
  options?: GenerateOptions;
}

interface AssignmentParams {
  content: string;
  skills: string[];
  taskCount?: number;
  options?: GenerateOptions;
}

interface ProjectParams {
  courseContent: string;
  requiredSkills: string[];
  options?: GenerateOptions;
}

// Helper function to call AI with tool functions
export async function generateWithTools<T extends z.ZodType>(
  prompt: string,
  tool: ToolName,
  schema: T,
  options: GenerateOptions = {}
): Promise<z.infer<T>> {
  const { abortSignal, maxTokens = 2048, temperature = 0.7 } = options;

  const result = await generateText({
    model: googleModel,
    maxTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }],
    tools: { [tool]: tools[tool] },
    toolChoice: { type: 'tool', toolName: tool },
    abortSignal
  });

  const parsed = schema.parse(result.toolCalls[0].args);
  return parsed;
}

// Course structure generator
export async function generateCourseStructure(
  transcript: string,
  options?: GenerateOptions
): Promise<Course> {
  const prompt = `
Create a structured course outline from this transcript:
${transcript}

Guidelines:
1. Break content into logical sections
2. Create focused lessons with clear objectives
3. Include start and end timestamps
4. Add resources where relevant`;

  const course = await generateWithTools(
    prompt,
    'generateCourseStructure',
    courseStructureSchema,
    options
  );

  // Add IDs to sections
  const sectionsWithIds: Section[] = course.sections.map(section => ({
    ...section,
    id: `section-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    lessons: section.lessons.map(lesson => ({
      ...lesson,
      id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }))
  }));

  return {
    ...course,
    sections: sectionsWithIds
  };
}

// Test generator
export async function generateTest({
  content,
  questionCount = 5,
  questionTypes = ['multiple-choice', 'written'],
  options
}: TestParams): Promise<TestContent> {
  const test = await generateWithTools(
    `Generate ${questionCount} test questions from:\n${content}`,
    'generateTest',
    testGenerationSchema,
    options
  );

  return {
    ...test,
    id: `test-${Date.now()}`,
    type: 'test',
    isLocked: true,
    position: 0,
    requiredSkills: [],
    contentGenerated: true,
    estimatedDuration: `${questionCount * 5} minutes`,
    questions: test.questions.map(q => ({
      ...q,
      type: q.type || 'multiple-choice'
    }))
  };
}

// Assignment generator
export async function generateAssignment({
  content,
  skills,
  taskCount = 1,
  options
}: AssignmentParams): Promise<AssignmentContent> {
  const assignment = await generateWithTools(
    `Create ${taskCount} practical task(s) based on:\n${content}\n\nSkills: ${skills.join(', ')}`,
    'generateAssignment',
    assignmentGenerationSchema,
    options
  );

  return {
    ...assignment,
    id: `assignment-${Date.now()}`,
    type: 'assignment',
    isLocked: true,
    position: 0,
    requiredSkills: skills,
    contentGenerated: true,
    estimatedDuration: `${taskCount * 10} minutes`,
    tasks: assignment.tasks
  };
}

// Project generator
export async function generateProject({
  courseContent,
  requiredSkills,
  options
}: ProjectParams): Promise<ProjectContent> {
  const project = await generateWithTools(
    `Design a comprehensive project that tests:\n${courseContent}\n\nRequired skills: ${requiredSkills.join(', ')}`,
    'generateProject',
    projectGenerationSchema,
    options
  );

  return {
    ...project,
    id: `project-${Date.now()}`,
    type: 'project',
    isLocked: true,
    position: 0,
    requiredSkills,
    contentGenerated: true,
    estimatedDuration: '1-2 weeks',
    guidelines: project.guidelines,
    submissionFormats: project.submissionFormats,
    deadline: project.deadline
  };
}
