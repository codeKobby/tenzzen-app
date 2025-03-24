import { googleModel, DEFAULT_SYSTEM_MESSAGE } from './config';
import { generateText, generateObject, type GenerateObjectResult } from 'ai';
import { generateCourseFromVideo, fetchResourcesFromVideo, type CourseData, type Resource } from '@/tools/tools';
import { logger } from '@/lib/ai/debug-logger';
import { z } from 'zod';

// Define the progress update callback type
export type ProgressCallback = (progress: number, message?: string) => void;

/**
 * Analyzes a YouTube video and generates a structured course from it
 */
export async function generateCourseFromYoutubeVideo({
  videoUrl,
  onProgress
}: {
  videoUrl: string;
  onProgress?: ProgressCallback;
}): Promise<CourseData> {
  try {
    // Update progress to indicate we're starting
    onProgress?.(5, "Initializing course generation");
    
    logger.info('course-generation', 'Starting course generation', { videoUrl });
    
    // First, generate the course structure using our custom tool
    onProgress?.(10, "Analyzing video content");
    
    const courseResponse = await generateText({
      model: googleModel,
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: DEFAULT_SYSTEM_MESSAGE
        },
        {
          role: 'user',
          content: `Generate a structured course from the following YouTube video: ${videoUrl}`
        }
      ],
      tools: {
        generateCourseFromVideo
      },
      toolChoice: {
        type: 'tool',
        toolName: 'generateCourseFromVideo'
      }
    });
    
    // Fix: Properly type and extract the course data from tool calls
    if (!courseResponse.toolCalls || courseResponse.toolCalls.length === 0) {
      throw new Error('No tool calls returned from course generation');
    }
    
    // First extract the args from the tool call and force type to unknown
    const rawCourseResult = courseResponse.toolCalls[0].args as unknown;
    
    // Validate the course data structure
    if (
      !rawCourseResult || 
      typeof rawCourseResult !== 'object' || 
      !('title' in rawCourseResult) || 
      !('sections' in rawCourseResult)
    ) {
      throw new Error('Invalid course data returned');
    }
    
    // Now safely cast to CourseData after validation
    const courseData = rawCourseResult as CourseData;
    
    onProgress?.(50, "Course structure generated");
    logger.info('course-generation', 'Course structure generated', { 
      courseTitle: courseData.title || 'Unknown'
    });
    
    // Now fetch additional resources for this course
    onProgress?.(70, "Finding relevant resources");
    
    const resourcesResponse = await generateText({
      model: googleModel,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: DEFAULT_SYSTEM_MESSAGE
        },
        {
          role: 'user',
          content: `Find relevant learning resources for this course based on the video: ${videoUrl}`
        }
      ],
      tools: {
        fetchResourcesFromVideo
      },
      toolChoice: {
        type: 'tool',
        toolName: 'fetchResourcesFromVideo'
      }
    });
    
    // Fix: Properly type and extract resources
    let resources: Resource[] = [];
    if (resourcesResponse.toolCalls && resourcesResponse.toolCalls.length > 0) {
      const resourcesResult = resourcesResponse.toolCalls[0].args;
      // Check if the result is an array of Resource objects
      if (Array.isArray(resourcesResult)) {
        resources = resourcesResult as Resource[];
      }
    }
    
    onProgress?.(90, "Resources collected");
    logger.info('course-generation', 'Resources fetched', { 
      resourceCount: resources.length
    });
    
    // Add resources to the course data
    const courseWithResources: CourseData = {
      ...courseData,
      metadata: {
        ...courseData.metadata,
        sources: resources
      }
    };
    
    onProgress?.(100, "Course generation complete");
    
    return courseWithResources;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('course-generation', 'Course generation failed', { 
      error: err.message, 
      videoUrl 
    });
    throw err;
  }
}

// Define the quiz question schema
const quizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswerIndex: z.number(),
  explanation: z.string()
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

/**
 * Generate quiz questions for a course section
 */
export async function generateQuizQuestions({
  courseTitle,
  sectionTitle,
  sectionContent,
  questionCount = 5
}: {
  courseTitle: string;
  sectionTitle: string;
  sectionContent: string;
  questionCount?: number;
}): Promise<QuizQuestion[]> {
  try {
    logger.info('quiz-generation', 'Generating quiz questions', {
      courseTitle,
      sectionTitle,
      questionCount
    });

    // Define schema for quiz questions
    const quizSchema = z.array(quizQuestionSchema).max(questionCount);

    // Generate quiz questions using AI
    const result = await generateObject({
      model: googleModel,
      schema: quizSchema,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: DEFAULT_SYSTEM_MESSAGE
        },
        {
          role: 'user',
          content: `Create ${questionCount} quiz questions for the "${sectionTitle}" section of the "${courseTitle}" course with the following content:
          
${sectionContent}

Generate multiple-choice questions that test understanding of key concepts. 
Each question should have 4-5 options with one correct answer.
Include an explanation for why the correct answer is correct.`
        }
      ]
    });
    
    // Fix: Convert the result to properly typed QuizQuestion[]
    let questions: QuizQuestion[] = [];
    
    // Handle both array and non-array results
    if (Array.isArray(result)) {
      // First cast the entire array to unknown, then to our expected type
      questions = result as unknown as QuizQuestion[];
    } else {
      // If it's not an array but should be, wrap it in an array
      // First cast to unknown, then to our expected type
      questions = [result as unknown as QuizQuestion];
    }

    logger.info('quiz-generation', 'Quiz questions generated', {
      courseTitle,
      sectionTitle, 
      questionCount: questions.length
    });
    
    return questions;

  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('quiz-generation', 'Quiz generation failed', { 
      error: err.message, 
      courseTitle,
      sectionTitle 
    });
    throw err;
  }
}

// Define the project assignment schema
const projectAssignmentSchema = z.object({
  title: z.string().describe('Title of the project assignment'),
  description: z.string().describe('Detailed description of what to build'),
  learningObjectives: z.array(z.string()).describe('What students will learn from this project'),
  requirements: z.array(z.string()).describe('Specific requirements for the project'),
  steps: z.array(z.object({
    step: z.number().describe('Step number'),
    title: z.string().describe('Short title for this step'),
    description: z.string().describe('Detailed instructions for this step')
  })).describe('Step-by-step guide to complete the project'),
  deliverables: z.array(z.string()).describe('What students should submit'),
  estimatedTime: z.string().describe('Estimated time to complete the project'),
  difficultyLevel: z.string().describe('Difficulty level of the project')
});

export type ProjectAssignment = z.infer<typeof projectAssignmentSchema>;

/**
 * Generate a project assignment for a course
 */
export async function generateProjectAssignment({
  courseTitle,
  courseDescription,
  difficulty
}: {
  courseTitle: string;
  courseDescription: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}): Promise<ProjectAssignment> {
  try {
    logger.info('project-generation', 'Generating project assignment', {
      courseTitle,
      difficulty
    });

    // Generate project assignment using AI
    const resultObj = await generateObject({
      model: googleModel,
      schema: projectAssignmentSchema,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: DEFAULT_SYSTEM_MESSAGE
        },
        {
          role: 'user',
          content: `Create a project assignment for the "${courseTitle}" course which is described as: "${courseDescription}".
          
This project should be suitable for ${difficulty.toLowerCase()} level students.
The project should:
- Help students apply what they've learned
- Be challenging but achievable
- Include clear steps and requirements
- Have defined deliverables

Create a comprehensive project with step-by-step instructions.`
        }
      ]
    });
    
    // Fix: More explicit two-step casting through unknown
    const result = (resultObj as unknown) as ProjectAssignment;

    logger.info('project-generation', 'Project assignment generated', {
      courseTitle,
      projectTitle: result.title
    });
    
    return result;

  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('project-generation', 'Project generation failed', { 
      error: err.message, 
      courseTitle
    });
    throw err;
  }
}
