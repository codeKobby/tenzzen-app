import { getPromptForType } from "../prompts";
import type { Course } from "@/types/course";
import { generateContent } from "../google";
import type { StreamEvent } from "@/lib/ai/types/stream";
import { createStreamEvent } from "@/lib/ai/types/stream";
import { StreamChunkAccumulator } from "@/lib/utils/stream";

interface GenerateOptions {
  type: 'video' | 'playlist';
  title: string;
  description: string;
  duration?: string;
  videos?: Array<{
    title: string;
    duration: string;
    description: string;
  }>;
  onProgress?: (progress: number) => Promise<void>;
}

// Type guard for checking course data
function isValidCourse(data: any): data is Course {
  try {
    // Basic structure checks
    if (!data || typeof data !== 'object') return false;
    if (!data.title || typeof data.title !== 'string') return false;
    if (!data.subtitle || typeof data.subtitle !== 'string') return false;
    if (!data.overview || typeof data.overview !== 'object') return false;
    if (!Array.isArray(data.sections)) return false;

    // Overview checks
    const overview = data.overview;
    if (!overview.description || typeof overview.description !== 'string') return false;
    if (!Array.isArray(overview.prerequisites)) return false;
    if (!Array.isArray(overview.learningOutcomes)) return false;
    if (!overview.totalDuration || typeof overview.totalDuration !== 'string') return false;
    if (!overview.difficultyLevel || !['beginner', 'intermediate', 'advanced'].includes(overview.difficultyLevel)) return false;
    if (!Array.isArray(overview.skills)) return false;
    if (!Array.isArray(overview.tools)) return false;

    // Sections check
    for (const section of data.sections) {
      if (!section.title || typeof section.title !== 'string') return false;
      if (!section.description || typeof section.description !== 'string') return false;
      if (!section.duration || typeof section.duration !== 'string') return false;
      if (!Array.isArray(section.lessons)) return false;
      if (!Array.isArray(section.assessments)) return false;

      // Check lessons
      for (const lesson of section.lessons) {
        if (!lesson.title || typeof lesson.title !== 'string') return false;
        if (!lesson.description || typeof lesson.description !== 'string') return false;
        if (!lesson.content || typeof lesson.content !== 'string') return false;
        if (!Array.isArray(lesson.resources)) return false;
      }

      // Check assessments
      for (const assessment of section.assessments) {
        if (!assessment.type || !['test', 'assignment', 'project'].includes(assessment.type)) return false;
        if (!assessment.title || typeof assessment.title !== 'string') return false;
        if (!assessment.description || typeof assessment.description !== 'string') return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

interface ProcessedContent {
  course: Course;
  metadata?: {
    processingTime: number;
    sourceType: 'video' | 'playlist';
    status: 'completed' | 'failed';
    error?: string;
  };
}

export async function generateCourseStructure({
  type,
  title,
  description,
  duration,
  videos,
  onProgress
}: GenerateOptions): Promise<ProcessedContent> {
  try {
    const startTime = Date.now();
    await onProgress?.(5);

    const context = JSON.stringify({ title, description, duration, videos }, null, 2);
    const { systemPrompt } = getPromptForType(type, context);
    
    await onProgress?.(10);

    const accumulator = new StreamChunkAccumulator();
    const response = await generateContent(systemPrompt, {
      stream: true,
      onProgress: async (event) => {
        if (event.type === 'progress') {
          const progress = 10 + (event.progress || 0) * 0.8;
          await onProgress?.(progress);
        }
      }
    });

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response stream available');
    }

    try {
      let course: Course | null = null;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const result = accumulator.append(value);
        if (result && isValidCourse(result)) {
          await onProgress?.(90);
          course = {
            title: result.title,
            subtitle: result.subtitle,
            overview: {
              description: result.overview.description,
              prerequisites: result.overview.prerequisites,
              learningOutcomes: result.overview.learningOutcomes,
              totalDuration: result.overview.totalDuration,
              difficultyLevel: result.overview.difficultyLevel,
              skills: result.overview.skills,
              tools: result.overview.tools
            },
            sections: result.sections.map((section: any, sectionIndex: number) => ({
              id: `section-${sectionIndex + 1}`,
              title: section.title,
              description: section.description,
              duration: section.duration,
              startTime: section.startTime,
              endTime: section.endTime,
              lessons: section.lessons.map((lesson: any, lessonIndex: number) => ({
                id: `lesson-${sectionIndex + 1}-${lessonIndex + 1}`,
                title: lesson.title,
                description: lesson.description,
                content: lesson.content,
                duration: lesson.duration,
                startTime: lesson.startTime,
                endTime: lesson.endTime,
                resources: lesson.resources
              })),
              assessments: section.assessments.map((assessment: any, assessmentIndex: number) => ({
                id: `assessment-${sectionIndex + 1}-${assessmentIndex + 1}`,
                type: assessment.type,
                title: assessment.title,
                description: assessment.description,
                position: assessment.position || assessmentIndex,
                isLocked: true,
                requiredSkills: assessment.requiredSkills || [],
                estimatedDuration: assessment.estimatedDuration || "30 minutes",
                contentGenerated: false
              }))
            }))
          };
          break;
        }
      }

      if (!course) {
        throw new Error('Failed to generate valid course content');
      }

      await onProgress?.(100);

      return {
        course,
        metadata: {
          processingTime: Date.now() - startTime,
          sourceType: type,
          status: 'completed'
        }
      };

    } finally {
      reader.releaseLock();
      accumulator.clear();
    }

  } catch (error) {
    console.error('Course generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      course: {
        title: '',
        subtitle: '',
        overview: {
          description: '',
          prerequisites: [],
          learningOutcomes: [],
          totalDuration: '',
          difficultyLevel: 'beginner',
          skills: [],
          tools: []
        },
        sections: []
      },
      metadata: {
        processingTime: 0,
        sourceType: type,
        status: 'failed',
        error: errorMessage
      }
    };
  }
}
