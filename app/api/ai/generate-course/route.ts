import { NextRequest } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { mockCourseData } from "@/lib/mock/course-data";
import { mockSources } from "@/lib/mock/sources";
import { createSystemPrompt } from '@/lib/ai/prompts';

export const runtime = 'edge';
export const maxDuration = 300; // 5 minutes max duration

// Course structure schema using Zod
const courseSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  overview: z.object({
    description: z.string(),
    prerequisites: z.array(z.string()),
    learningOutcomes: z.array(z.string()),
    totalDuration: z.string(),
    difficultyLevel: z.string(),
    skills: z.array(z.string()),
    tools: z.array(z.string()).optional(),
  }),
  metadata: z.object({
    category: z.string(),
    subcategory: z.string().optional(),
    difficulty: z.string(),
    duration: z.string(),
    objectives: z.array(z.string()).optional(),
    prerequisites: z.array(z.string()).optional(),
    targetAudience: z.array(z.string()).optional(),
  }),
  sections: z.array(z.object({
    title: z.string(),
    description: z.string(),
    lessons: z.array(z.object({
      title: z.string(),
      description: z.string(),
      content: z.string().optional(),
      duration: z.string().optional(),
      keyPoints: z.array(z.string()).optional(),
      resources: z.array(z.object({
        title: z.string(),
        url: z.string(),
        description: z.string().optional(),
        type: z.string().optional()
      })).optional()
    }))
  }))
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type = 'video', data = {} } = body;

    // Use mock data in development if MOCK_AI is set to true
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_AI === 'true') {
      return new Response(JSON.stringify({
        success: true,
        data: {
          ...mockCourseData,
          title: data.title || mockCourseData.title,
          description: data.description || mockCourseData.description,
          metadata: {
            ...mockCourseData.metadata,
            sources: mockSources
          }
        }
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create system prompt with Vercel AI SDK format
    const systemPrompt = createSystemPrompt(type);
    
    // Create payload with content information
    const prompt = [
      `Create a comprehensive course based on this ${type}:`,
      `Title: ${data.title}`,
      data.description ? `Description: ${data.description}` : '',
      data.duration ? `Duration: ${data.duration}` : '',
      type === 'playlist' && data.videos?.length ? 
        `Videos in playlist: ${data.videos.map((v: any, i: number) => 
          `\n${i+1}. ${v.title} ${v.duration ? `(${v.duration})` : ''}`).join('')}` : '',
      '\nFollow the requirements:',
      '1. Create a well-structured course with a title, subtitle, and detailed overview',
      '2. Include prerequisites, learning outcomes, duration, and difficulty level',
      '3. Divide the content into 3-6 logical sections',
      '4. Each section should have 2-5 lessons with detailed content',
      '5. Add relevant resources for each lesson',
      '6. Make the content educational, practical, and progressive'
    ].filter(Boolean).join('\n');

    // Use Vercel AI SDK to generate the course structure
    const { object: courseData } = await generateObject({
      model: google('gemini-1.5-pro-latest', {
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
      }),
      system: systemPrompt,
      schema: courseSchema,
      prompt,
    });

    // Add IDs to sections and lessons
    const enrichedCourse = {
      ...courseData,
      sections: courseData.sections.map((section: any, sectionIndex: number) => ({
        ...section,
        id: `section-${sectionIndex + 1}`,
        lessons: section.lessons.map((lesson: any, lessonIndex: number) => ({
          ...lesson,
          id: `lesson-${sectionIndex + 1}-${lessonIndex + 1}`,
        }))
      }))
    };

    return new Response(JSON.stringify({
      success: true,
      data: enrichedCourse
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Course generation error:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
