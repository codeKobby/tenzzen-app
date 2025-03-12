import { generateObject } from 'ai';
import { openai } from '@/lib/ai/openai';
import { CourseGenerationRequest, CourseGenerationResult } from "@/types/ai";
import { z } from 'zod';

// Define the schema for structured course generation
const courseSchema = z.object({
  title: z.string().describe('Title of the course'),
  description: z.string().describe('Overview of the course content'),
  sections: z.array(z.object({
    title: z.string().describe('Section title'),
    summary: z.string().describe('Brief summary of the section content'),
    keyPoints: z.array(z.string()).describe('Key learning points for this section'),
    quiz: z.array(z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.number().describe('Index of the correct answer (0-based)')
    })).describe('Practice questions for this section')
  })).describe('Course sections')
});

export async function generateCourse({ 
  videoId, 
  videoDetails 
}: CourseGenerationRequest): Promise<CourseGenerationResult> {
  const model = openai.chat('gpt-4-turbo', {
    structuredOutputs: true
  });

  const { object: course } = await generateObject({
    model,
    schema: courseSchema,
    schemaName: 'course',
    schemaDescription: 'A structured course with sections, key points, and practice questions',
    system: `You are an expert course creator that analyzes video content and creates structured learning materials.
Focus on delivering practical, actionable content that helps learners understand and retain the material.
Break down the content into logical sections with clear summaries and key points.
Create engaging practice questions that reinforce learning.`,
    prompt: `Create a well-structured course based on this video content:

Title: ${videoDetails.title}
Duration: ${videoDetails.duration}
Description: ${videoDetails.description}

Structure the course with:
1. Clear sections based on the content flow
2. Brief summaries for each section
3. Key learning points to remember
4. Practice questions to test understanding

Follow these guidelines:
- Keep sections focused and manageable
- Include 2-3 key points per section
- Create multiple-choice questions that test comprehension
- Ensure questions have clear, unambiguous answers`,
  });

  return course as CourseGenerationResult;
}