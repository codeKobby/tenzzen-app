import { generateText, tool } from 'ai';
import { openai, withRateLimit, AI_CONFIG } from '@/lib/ai/openai';
import { CourseGenerationRequest, CourseGenerationResult } from "@/types/ai";
import { chunkTranscript, processWithRateLimit, combinePartialResults } from '@/lib/ai/helpers';
import { z } from 'zod';

const testSchema = z.object({
  id: z.string().describe('Unique identifier for the test'),
  title: z.string().describe('Test title'),
  description: z.string().describe('Test description'),
  timeLimit: z.number().describe('Time limit in minutes'),
  passingScore: z.number().describe('Required score to pass (percentage)'),
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.number().describe('Index of correct answer'),
    explanation: z.string().describe('Explanation of the correct answer')
  })),
  isLocked: z.boolean().default(false),
  unlockCondition: z.object({
    type: z.enum(['section', 'lesson', 'test']),
    id: z.string()
  }).optional()
});

const lessonSchema = z.object({
  id: z.string().describe('Unique identifier for the lesson'),
  title: z.string().describe('Lesson title'),
  duration: z.string().describe('Estimated duration'),
  description: z.string().describe('Lesson description'),
  content: z.string().describe('Main lesson content in markdown'),
  isLocked: z.boolean().default(false),
  resources: z.array(z.object({
    title: z.string(),
    type: z.enum(['article', 'video', 'code', 'document']),
    url: z.string(),
    description: z.string()
  })),
  test: testSchema.optional()
});

const courseSchema = z.object({
  title: z.string().describe('Course title'),
  subtitle: z.string().describe('Course subtitle'),
  overview: z.object({
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
  }),
  sections: z.array(z.object({
    id: z.string().describe('Section identifier'),
    title: z.string().describe('Section title'),
    description: z.string().describe('Section description'),
    duration: z.string().describe('Estimated duration'),
    lessons: z.array(lessonSchema),
    isLocked: z.boolean().default(false)
  })),
  resources: z.array(z.object({
    title: z.string(),
    type: z.enum(['article', 'video', 'code', 'document']),
    url: z.string(),
    description: z.string()
  }))
});

// Define the course generation tool
const generateCourseTool = tool({
  description: 'Generate a structured course from video content',
  parameters: courseSchema,
  execute: async (courseData) => courseData
});

export async function generateCourse({ 
  videoId, 
  videoDetails,
  transcript
}: CourseGenerationRequest & { transcript: string[] }): Promise<CourseGenerationResult> {
  return withRateLimit(async () => {
    // Split transcript into manageable chunks
    const chunks = chunkTranscript(transcript.map((text, index) => ({
      text,
      offset: index * 1000,
      duration: 1000
    })));

    // Process each chunk with rate limiting
    const parts = await processWithRateLimit(
      chunks,
      async (chunk) => {
        const { toolCalls } = await generateText({
          model: openai.chat('gpt-4'),
          tools: {
            generateCourse: generateCourseTool
          },
          toolChoice: 'required',
          maxSteps: 1,
          messages: [
            {
              role: 'system',
              content: `You are an expert course creator that analyzes video content and creates professional, structured learning materials.
Create a course that follows best practices from platforms like Udemy and Coursera:
- Clear progression and prerequisites
- Well-defined learning outcomes
- Practical assessments and quizzes
- Organized additional resources
- Proper content sequencing with locked/unlocked states`
            },
            {
              role: 'user',
              content: `Create a professional course from this video segment:

Context:
Title: ${videoDetails.title}
Description: ${videoDetails.description}

Transcript segment:
${chunk.map(seg => seg.text).join(' ')}

Requirements:
1. Clear prerequisites and learning outcomes
2. Logical content progression
3. Practice tests with detailed feedback
4. Curated additional resources
5. Professional structure and organization`
            }
          ]
        });

        if (!toolCalls?.[0] || toolCalls[0].toolName !== 'generateCourse') {
          throw new Error('Failed to generate course part');
        }

        return typeof toolCalls[0].args === 'string'
          ? JSON.parse(toolCalls[0].args)
          : toolCalls[0].args;
      },
      {
        maxConcurrent: 1,
        baseDelay: 2000,
        onProgress: (processed, total) => {
          console.log(`Processing chunks: ${Math.round((processed / total) * 100)}%`);
        }
      }
    );

    // Combine all parts into final course
    const combinedContent = combinePartialResults(parts);

    return {
      title: videoDetails.title,
      subtitle: videoDetails.description.split('\n')[0],
      overview: combinedContent.overview,
      sections: combinedContent.sections,
      resources: combinedContent.resources
    };
  }, AI_CONFIG.maxRetries);
}