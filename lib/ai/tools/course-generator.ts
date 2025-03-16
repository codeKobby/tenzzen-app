import { generateContent } from '@/lib/ai/google';
import { COURSE_PROMPTS } from '@/lib/ai/prompts';
import { logger } from '@/lib/ai/debug-logger';
import type { Course } from '@/types/course';

interface GenerateCourseParams {
  videoId: string;
  videoData: {
    title: string;
    description: string;
    duration: string;
  };
  transcript: string;
}

export async function getCourse({
  videoId,
  videoData,
  transcript
}: GenerateCourseParams): Promise<Course> {
  try {
    logger.info('state', 'Generating course structure', {
      videoId,
      title: videoData.title
    });

    // Generate course structure with AI
    const { result: courseData } = await generateContent(
      COURSE_PROMPTS.generateStructure(transcript)
    );

    const course = JSON.parse(courseData) as Course;

    // Add video metadata
    course.title = course.title || videoData.title;
    course.overview.totalDuration = videoData.duration;

    // Validate course structure
    validateCourseStructure(course);

    return course;
  } catch (error) {
    logger.error('api', 'Course generation failed', error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
}

function validateCourseStructure(course: Course) {
  // Basic validation
  if (!course.title) throw new Error('Course title is missing');
  if (!course.sections || !Array.isArray(course.sections)) {
    throw new Error('Course sections are missing or invalid');
  }

  // Validate sections
  course.sections.forEach((section, sectionIndex) => {
    if (!section.title) {
      throw new Error(`Section ${sectionIndex + 1} title is missing`);
    }
    if (!section.lessons || !Array.isArray(section.lessons)) {
      throw new Error(`Section ${sectionIndex + 1} lessons are missing or invalid`);
    }

    // Validate timestamps
    let previousEndTime = 0;
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

  // All validations passed
  return true;
}