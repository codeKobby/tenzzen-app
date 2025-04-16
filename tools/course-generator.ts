import { z } from 'zod';
import { nanoid } from 'nanoid';

// Types
export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  startTime: number;
  endTime: number;
  keyPoints: string[];
}

export interface Section {
  id: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  objective: string;
  keyPoints: string[];
  lessons: Lesson[];
  assessment?: 'quiz' | 'assignment';
}

export interface CourseData {
  title: string;
  description: string;
  videoId: string;
  metadata: {
    title: string;
    description: string;
    duration: string;
    category: string;
    tags: string[];
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    prerequisites: string[];
    objectives: string[];
    overviewText: string;
    sources: string[];
  };
  sections: Section[];
  resources: string[];
  assessments: Array<{
    type: 'quiz' | 'assignment';
    title: string;
    description: string;
    placeholder: boolean;
  }>;
}

interface LessonWithTimestamp extends Omit<Lesson, 'startTime' | 'endTime'> {
  videoTimestamp?: number;
}

/**
 * Get average duration of a group of lessons
 */
function getGroupDuration(lessons: { duration: string }[]): string {
  if (!lessons.length) return "0:00";

  const totalMinutes = lessons.reduce((sum, lesson) => {
    const [min] = lesson.duration.split(':').map(Number);
    return sum + (min || 0);
  }, 0);

  return `${totalMinutes}:00`;
}

/**
 * Format a number into a timestamp string
 */
function formatTimestamp(timestamp: number): string {
  const minutes = Math.floor(timestamp / 60);
  const seconds = Math.floor(timestamp % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate approximate end time based on start time and duration
 */
function calculateEndTime(startTime: number, duration: string): number {
  const [minutes = 0] = duration.split(':').map(Number);
  return startTime + (minutes * 60);
}

/**
 * Transform legacy videoTimestamp to startTime/endTime format
 */
function transformTimestamps(lessons: LessonWithTimestamp[], sectionDuration: string): Lesson[] {
  let currentTimestamp = 0;

  return lessons.map((lesson, index) => {
    const startTime = lesson.videoTimestamp || currentTimestamp;
    const nextLesson = lessons[index + 1];
    
    const endTime = nextLesson 
      ? nextLesson.videoTimestamp || calculateEndTime(startTime, lesson.duration)
      : calculateEndTime(startTime, lesson.duration);

    currentTimestamp = endTime;

    const { videoTimestamp, ...cleanLesson } = lesson;
    return {
      ...cleanLesson,
      startTime,
      endTime
    };
  });
}

/**
 * Generate basic lesson structure
 */
export function generateLessonStructure(): Lesson[] {
  return [
    {
      id: nanoid(),
      title: "Introduction",
      description: "Course overview and learning objectives",
      duration: "5:00",
      startTime: 0,
      endTime: 300,
      keyPoints: [
        "Course objectives",
        "Prerequisites",
        "Course structure"
      ]
    },
    {
      id: nanoid(),
      title: "Core Concepts",
      description: "Understanding fundamental principles",
      duration: "10:00",
      startTime: 300,
      endTime: 900,
      keyPoints: [
        "Key terminology",
        "Basic principles",
        "Common patterns"
      ]
    }
  ];
}

/**
 * Generate section structure with lessons
 */
export function generateSectionStructure(): Section[] {
  const lessons = generateLessonStructure();
  return [
    {
      id: nanoid(),
      title: "Getting Started",
      description: "Introduction to core concepts and fundamentals",
      startTime: lessons[0].startTime,
      endTime: lessons[lessons.length - 1].endTime,
      objective: "Understand the basics and prepare for advanced topics",
      keyPoints: [
        "Course overview",
        "Core concepts",
        "Basic principles"
      ],
      lessons,
      assessment: "quiz"
    }
  ];
}

/**
 * Generate metadata structure
 */
export function generateMetadataStructure() {
  return {
    title: "Sample Course",
    description: "A comprehensive introduction to the subject",
    duration: "15:00",
    category: "Programming",
    tags: ["JavaScript", "Web Development", "Frontend"],
    difficulty: "Beginner" as const,
    prerequisites: [
      "Basic programming knowledge",
      "Understanding of web technologies"
    ],
    objectives: [
      "Understand core concepts",
      "Build practical skills",
      "Complete real-world projects"
    ],
    overviewText: "Learn essential skills through hands-on practice",
    sources: []
  };
}

/**
 * Generate complete course structure
 */
export function generateBasicStructure(): CourseData {
  const sections = generateSectionStructure();
  return {
    title: "Sample Course",
    description: "A comprehensive introduction to the subject",
    videoId: "",
    metadata: generateMetadataStructure(),
    sections,
    resources: [],
    assessments: [
      {
        type: "quiz",
        title: "Knowledge Check",
        description: "Test your understanding of core concepts",
        placeholder: true
      }
    ]
  };
}

/**
 * Transform raw course data to match our schema
 */
export function transformCourseData(rawData: any): CourseData {
  const sections = rawData.sections.map((section: any) => {
    const lessons = transformTimestamps(section.lessons, section.duration);
    return {
      ...section,
      lessons,
      startTime: lessons[0].startTime,
      endTime: lessons[lessons.length - 1].endTime,
      assessment: section.assessment ? section.assessment as "quiz" | "assignment" : undefined
    };
  });

  return {
    ...rawData,
    sections,
    metadata: {
      ...rawData.metadata,
      tags: rawData.metadata.tags || []
    }
  };
}

// Schema for course generator
export const courseGeneratorSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  description: z.string(),
  duration: z.string(),
  transcript: z.array(z.string())
});

export type CourseGeneratorInput = z.infer<typeof courseGeneratorSchema>;

/**
 * Generate course structure from video content
 * This is a placeholder function that returns a basic course structure.
 * Replace with actual AI implementation in the future.
 */
export async function generateFromVideo(
  input: CourseGeneratorInput,
  onProgress?: (progress: number, message: string) => void
): Promise<CourseData> {
  // Simulate progress
  onProgress?.(10, "Starting course generation");
  await new Promise(resolve => setTimeout(resolve, 1000));
  onProgress?.(50, "Generating course structure");
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return basic course structure with input data
  const basicStructure = generateBasicStructure();
  const courseData = {
    ...basicStructure,
    title: input.title,
    description: input.description,
    videoId: input.videoId,
    metadata: {
      ...basicStructure.metadata,
      title: input.title,
      description: input.description,
      duration: input.duration
    }
  };

  onProgress?.(100, "Course generation complete");
  return courseData;
}
