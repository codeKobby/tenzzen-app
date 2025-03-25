import { googleModel, DEFAULT_SYSTEM_MESSAGE } from './config';
import { generateText, generateObject, type GenerateObjectResult } from 'ai';
import { generateCourseFromVideo, fetchResourcesFromVideo, type CourseData, type Resource } from '@/tools/tools';
import { logger } from '@/lib/ai/debug-logger';
import { z } from 'zod';
import { getVideoDetails } from '@/actions/getYoutubeData';
import { identifyYoutubeIdType } from '@/lib/utils/youtube';
import { VideoDetails } from '@/types/youtube';

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
    
    // Generate course from video URL using our tool
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
          content: `Generate a structured course from the following YouTube video: ${videoUrl}. 
          Please ensure the course follows our standard curriculum format with clear sections, lessons, and learning objectives.`
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
    
    // Validate tool response
    if (!courseResponse.toolCalls || courseResponse.toolCalls.length === 0) {
      logger.error('course-generation', 'No tool calls returned', { courseResponse });
      throw new Error('Course generation failed: No tool calls returned');
    }
    
    // Extract course data from tool call results
    const courseCallArgs = courseResponse.toolCalls[0].args;
    
    // Print debug information about what we received
    logger.debug('course-generation', 'Course data received', { 
      toolCallName: courseResponse.toolCalls[0].name,
      argsType: typeof courseCallArgs,
      hasTitle: courseCallArgs && typeof courseCallArgs === 'object' && 'title' in courseCallArgs,
      hasSections: courseCallArgs && typeof courseCallArgs === 'object' && 'sections' in courseCallArgs
    });
    
    // Get the video ID for backup metadata
    const { id } = await identifyYoutubeIdType(videoUrl);
    let videoDetails;
    
    try {
      // Fetch video details for fallback data
      videoDetails = id ? await getVideoDetails(id) : null;
      logger.info('course-generation', 'Successfully fetched video details for fallbacks', { 
        videoId: id
      });
    } catch (videoError) {
      logger.warn('course-generation', 'Failed to fetch video details for fallbacks', { 
        error: videoError instanceof Error ? videoError.message : 'Unknown error'
      });
      videoDetails = null;
    }
    
    // Simple validation
    if (!courseCallArgs || typeof courseCallArgs !== 'object') {
      logger.error('course-generation', 'Invalid course data - not an object', {
        dataType: typeof courseCallArgs
      });
      
      // Create fallback course if we have video details
      if (videoDetails && id) {
        logger.info('course-generation', 'Creating fallback course from video details');
        return createFallbackCourse(videoDetails, id);
      }
      
      throw new Error('Invalid course data returned: Missing or non-object result');
    }
    
    // Cast to course data format but with safety
    const courseData = courseCallArgs as Partial<CourseData>;
    
    // If title is missing but we have video details, use the video title
    if (!courseData.title && videoDetails) {
      courseData.title = videoDetails.title;
      logger.info('course-generation', 'Using video title as fallback for course title');
    } else if (!courseData.title) {
      courseData.title = 'Generated Course';
      logger.warn('course-generation', 'Using default title "Generated Course" as fallback');
    }
    
    // Ensure sections array exists
    if (!courseData.sections || !Array.isArray(courseData.sections) || courseData.sections.length === 0) {
      logger.warn('course-generation', 'Missing sections, creating default section');
      courseData.sections = [{
        id: 'section-1',
        title: 'Course Content',
        description: `Content from ${courseData.title || 'video'}`,
        duration: videoDetails?.duration || '30 minutes',
        lessons: [{
          id: 'lesson-1-1',
          title: 'Main Concepts',
          description: `Learn about ${courseData.title || 'main concepts'}`,
          duration: videoDetails?.duration || '30 minutes',
          keyPoints: ['Key concepts from the video']
        }]
      }];
    }
    
    // Ensure other required fields exist
    courseData.description = courseData.description || (videoDetails ? videoDetails.description : `A course about ${courseData.title}`);
    courseData.videoId = courseData.videoId || id || '';
    courseData.image = courseData.image || (videoDetails ? videoDetails.thumbnail : '');
    
    // Ensure we have metadata
    if (!courseData.metadata) {
      courseData.metadata = {
        title: courseData.title,
        description: courseData.description || `Learn about ${courseData.title}`,
        objectives: ['Understand the concepts presented in the video'],
        prerequisites: ['Basic understanding of the topic'],
        duration: videoDetails?.duration || '30 minutes',
        category: 'General',
        difficulty: 'Intermediate',
      };
    }
    
    // Ensure all properties of CourseData are present for type safety
    const validatedCourse = courseData as CourseData;
    
    onProgress?.(50, "Course structure validated");
    
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
    
    // Extract resources from the tool response
    let resources: Resource[] = [];
    if (resourcesResponse.toolCalls && resourcesResponse.toolCalls.length > 0) {
      const resourcesResult = resourcesResponse.toolCalls[0].args;
      
      // Add resources if they were returned correctly
      if (Array.isArray(resourcesResult)) {
        resources = resourcesResult as Resource[];
      }
    }
    
    onProgress?.(90, "Resources collected");
    
    // Add resources to the course data
    const courseWithResources: CourseData = {
      ...validatedCourse,
      metadata: {
        ...validatedCourse.metadata,
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

/**
 * Creates a fallback course when AI generation fails
 */
function createFallbackCourse(videoDetails: VideoDetails, videoId: string): CourseData {
  // Create a minimal valid course structure
  return {
    title: videoDetails.title,
    description: videoDetails.description || `A course based on ${videoDetails.title}`,
    videoId: videoId,
    image: videoDetails.thumbnail,
    metadata: {
      title: videoDetails.title,
      description: videoDetails.description || `Learn about ${videoDetails.title}`,
      objectives: ['Understand the main concepts from this video'],
      prerequisites: ['Basic understanding of the topic'],
      duration: videoDetails.duration || '30 minutes',
      category: 'General',
      difficulty: 'Intermediate',
      sources: [{
        title: videoDetails.title,
        url: `https://youtube.com/watch?v=${videoId}`,
        description: 'Original video source',
        type: 'video'
      }]
    },
    sections: [{
      id: 'section-1',
      title: 'Introduction',
      description: `Introduction to ${videoDetails.title}`,
      duration: videoDetails.duration || '30 minutes',
      lessons: [{
        id: 'lesson-1-1',
        title: 'Key Concepts',
        description: `Learn about the main topics in ${videoDetails.title}`,
        duration: videoDetails.duration || '30 minutes',
        keyPoints: [
          'Understanding fundamentals',
          'Practical applications'
        ]
      }]
    }],
    assessments: [{
      type: 'quiz',
      title: 'Knowledge Check',
      description: 'Test your understanding of the core concepts',
      placeholder: true
    }]
  };
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
    
    // Fix: More robust typing for the project assignment result
    const result = resultObj as unknown as ProjectAssignment;
    if (!result || typeof result !== 'object' || !('title' in result)) {
      throw new Error('Invalid project assignment data returned');
    }

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
