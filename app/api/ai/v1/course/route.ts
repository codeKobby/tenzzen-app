import { NextRequest } from 'next/server';
import { COURSE_PROMPTS } from '@/lib/ai/prompts';
import { generateContent } from '@/lib/ai/google';
import { logger } from '@/lib/ai/debug-logger';
import { type Course } from '@/types/course';
import { z } from 'zod';

const requestSchema = z.object({
  transcript: z.string(),
  metadata: z.object({
    videoId: z.string(),
    title: z.string(),
    description: z.string(),
    duration: z.string()
  })
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const rawBody = await request.json();
    const validatedData = requestSchema.parse(rawBody);
    const { transcript, metadata } = validatedData;

    // Generate course structure
    const { result: courseData } = await generateContent(
      COURSE_PROMPTS.generateStructure(transcript)
    );

    const course = JSON.parse(courseData) as Course;

    // Add video metadata
    course.title = course.title || metadata.title;
    course.overview.totalDuration = metadata.duration;

    // Validate generated content
    validateCourseStructure(course);

    logger.info('state', 'Generated course structure', {
      videoId: metadata.videoId,
      title: course.title,
      sections: course.sections.length,
      totalLessons: course.sections.reduce((acc, s) => acc + s.lessons.length, 0)
    });

    return new Response(JSON.stringify(course), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error('api', 'Course generation failed', error instanceof Error ? error : new Error(errorMessage));

    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        status: error instanceof z.ZodError ? 400 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

function validateCourseStructure(course: Course) {
  if (!course.title) {
    throw new Error('Course title is missing');
  }
  if (!course.sections || !Array.isArray(course.sections)) {
    throw new Error('Course sections are missing or invalid');
  }

  let previousEndTime = 0;

  course.sections.forEach((section, sectionIndex) => {
    section.lessons.forEach((lesson, lessonIndex) => {
      if (!lesson.title) {
        throw new Error(`Lesson ${lessonIndex + 1} in section ${sectionIndex + 1} title is missing`);
      }
      if (typeof lesson.startTime !== 'number' || typeof lesson.endTime !== 'number') {
        throw new Error(`Lesson ${lessonIndex + 1} in section ${sectionIndex + 1} timestamps are invalid`);
      }
      if (lesson.startTime < previousEndTime) {
        throw new Error(`Lesson ${lessonIndex + 1} in section ${sectionIndex + 1} has overlapping timestamps`);
      }
      previousEndTime = lesson.endTime;
    });
  });
}