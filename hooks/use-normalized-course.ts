'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

export interface NormalizedLesson {
  id: string;
  title: string;
  content?: string;
  videoTimestamp?: number;
  duration?: number;
  orderIndex: number;
  completed?: boolean;
  timestampStart?: number;
  timestampEnd?: number;
  videoId?: string;
  courseId?: string;
  keyPoints?: string[];
}

export interface NormalizedSection {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: NormalizedLesson[];
  isAssessment?: boolean;
  assessmentType?: 'quiz' | 'test' | 'project';
  passingScore?: number;
  isGenerated?: boolean;
}

export interface NormalizedCourse {
  id: string;
  title: string;
  description?: string;
  videoId: string;
  youtubeUrl?: string;
  thumbnail?: string;
  isPublic: boolean;
  createdBy?: string;
  creatorId?: string;
  avgRating?: number;
  enrollmentCount?: number;
  status?: string;
  difficultyLevel?: string;
  estimatedDuration?: string;
  estimatedHours?: number;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  category?: string;
  featured?: boolean;
  popularity?: number;
  metadata?: any;
  generatedSummary?: string;
  transcript?: string;
  sections: NormalizedSection[];
  progress?: number;
  completedLessons?: string[];
  isEnrolled?: boolean;
  enrollmentId?: string;
}

interface UseNormalizedCourseOptions {
  includeProgress?: boolean;
}

const toSeconds = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const parts = trimmed.split(':').map(Number);
    if (parts.some((part) => Number.isNaN(part))) {
      const asNumber = Number(trimmed);
      return Number.isNaN(asNumber) ? undefined : asNumber;
    }

    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      return hours * 3600 + minutes * 60 + seconds;
    }

    if (parts.length === 2) {
      const [minutes, seconds] = parts;
      return minutes * 60 + seconds;
    }

    if (parts.length === 1) {
      return parts[0];
    }
  }

  return undefined;
};

export function useNormalizedCourse(courseId: string, options: UseNormalizedCourseOptions = {}) {
  const { userId } = useAuth();
  const [course, setCourse] = useState<NormalizedCourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<Id<"user_enrollments"> | null>(null);
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // Convert courseId string to Convex ID
  const convexCourseId = courseId as Id<"courses">;

  // Fetch course with content from Convex
  const courseData = useQuery(api.courses.getCourseWithContent, { courseId: convexCourseId });
  
  // Fetch quizzes for this course
  const quizzesData = useQuery(api.quizzes.getCourseQuizzes, { courseId: convexCourseId });

  const shouldIncludeProgress = Boolean(options.includeProgress && userId);

  // Fetch enrollment if user is authenticated and includeProgress is true
  const enrollmentData = useQuery(
    shouldIncludeProgress ? api.enrollments.getUserCourseEnrollment : 'skip' as any,
    shouldIncludeProgress && courseId
      ? { userId: userId as string, courseId: convexCourseId }
      : 'skip' as any
  );

  const lessonProgressData = useQuery(
    shouldIncludeProgress ? api.enrollments.getLessonProgress : 'skip' as any,
    shouldIncludeProgress && courseId
      ? { userId: userId as string, courseId: convexCourseId }
      : 'skip' as any
  );

  const loading =
    courseData === undefined ||
    quizzesData === undefined ||
    (shouldIncludeProgress && (enrollmentData === undefined || lessonProgressData === undefined));

  useEffect(() => {
    // Don't process until we have data
    if (!courseData || quizzesData === undefined) return;
    if (shouldIncludeProgress && (enrollmentData === undefined || lessonProgressData === undefined)) return;

    try {

      const modules = courseData.modules || [];
      const completedLessonIds = Array.isArray(lessonProgressData)
        ? lessonProgressData
            .filter((entry: any) => entry.isCompleted)
            .map((entry: any) => entry.lessonId as string)
        : [];
      const completedLessonSet = new Set(completedLessonIds);
      const totalLessonCount = modules.reduce(
        (acc: number, module: any) => acc + (module.lessons?.length || 0),
        0
      );

      // Build sections from modules, lessons, and assessment plan
      const sections: NormalizedSection[] = [];
      const assessmentPlan = courseData.assessmentPlan;
      
      modules.forEach((module: any, moduleIndex: number) => {
        // Add the module as a section with its lessons
        const moduleSection: NormalizedSection = {
          id: module._id,
          title: module.title,
          description: module.description,
          orderIndex: sections.length,
          lessons: (module.lessons || []).map((lesson: any) => {
            const normalizedLessonId = lesson._id as string;
            const startSeconds = toSeconds(lesson.timestampStart);
            const endSeconds = toSeconds(lesson.timestampEnd);

            return {
              id: normalizedLessonId,
              title: lesson.title,
              content: lesson.content,
              videoTimestamp: startSeconds ?? 0,
              duration: lesson.durationMinutes,
              orderIndex: lesson.order,
              completed: completedLessonSet.has(normalizedLessonId),
              timestampStart: startSeconds,
              timestampEnd: endSeconds,
              videoId: courseData.sourceId || undefined,
              courseId: courseData._id,
              keyPoints: lesson.keyPoints || [],
            } satisfies NormalizedLesson;
          }),
        };
        
        sections.push(moduleSection);
        
        // Check for quizzes after this module
        const quizzesAfterModule = assessmentPlan?.quizLocations?.filter(
          (loc: any) => loc.afterModule === moduleIndex && !loc.afterLesson
        ) || [];
        
        quizzesAfterModule.forEach((loc: any, idx: number) => {
          // Check if there's a generated quiz for this module
          const generatedQuiz = (quizzesData || []).find((quiz: any) => 
            quiz.moduleId === module._id
          );
          
          const quizSection: NormalizedSection = generatedQuiz ? {
            id: generatedQuiz._id,
            title: generatedQuiz.title,
            description: generatedQuiz.description,
            orderIndex: sections.length,
            lessons: [],
            isAssessment: true,
            assessmentType: 'quiz',
            passingScore: generatedQuiz.passingScore,
            isGenerated: true
          } : {
            id: `placeholder-quiz-module-${moduleIndex}-${idx}`,
            title: `${module.title} - Quiz`,
            description: 'Click to generate quiz for this module',
            orderIndex: sections.length,
            lessons: [],
            isAssessment: true,
            assessmentType: 'quiz',
            passingScore: 70,
            isGenerated: false
          };
          
          sections.push(quizSection);
        });
        
        // Check for lesson-specific quizzes within this module
        const lessonQuizzes = assessmentPlan?.quizLocations?.filter(
          (loc: any) => loc.afterLesson && loc.afterLesson.moduleIndex === moduleIndex
        ) || [];
        
        lessonQuizzes.forEach((loc: any, idx: number) => {
          const lessonIdx = loc.afterLesson.lessonIndex;
          const lesson = module.lessons[lessonIdx];
          
          if (lesson) {
            const quizSection: NormalizedSection = {
              id: `placeholder-quiz-lesson-${moduleIndex}-${lessonIdx}-${idx}`,
              title: `${lesson.title} - Quiz`,
              description: 'Click to generate quiz for this lesson',
              orderIndex: sections.length,
              lessons: [],
              isAssessment: true,
              assessmentType: 'quiz',
              passingScore: 70,
              isGenerated: false
            };
            
            sections.push(quizSection);
          }
        });
      });
      
      // Add end-of-course test if specified
      if (assessmentPlan?.hasEndOfCourseTest) {
        const testSection: NormalizedSection = {
          id: `placeholder-test-final`,
          title: 'Final Assessment Test',
          description: 'Comprehensive test covering all course material',
          orderIndex: sections.length,
          lessons: [],
          isAssessment: true,
          assessmentType: 'test',
          passingScore: 70,
          isGenerated: false
        };
        
        sections.push(testSection);
      }
      
      // Add final project if specified
      if (assessmentPlan?.hasFinalProject) {
        const projectSection: NormalizedSection = {
          id: `placeholder-project-final`,
          title: 'Final Project',
          description: assessmentPlan.projectDescription || 'Capstone project to demonstrate your learning',
          orderIndex: sections.length,
          lessons: [],
          isAssessment: true,
          assessmentType: 'project',
          isGenerated: false
        };
        
        sections.push(projectSection);
      }

      // Handle enrollment and progress
      let userProgress = 0;
      let userCompletedLessons: string[] = completedLessonIds;
      let userEnrollmentId: Id<'user_enrollments'> | null = null;
      let userIsEnrolled = false;

      if (enrollmentData) {
        userIsEnrolled = true;
        userEnrollmentId = enrollmentData._id;
        userProgress = enrollmentData.progress || 0;
      }

      if (!userProgress && totalLessonCount > 0) {
        userProgress = Math.round((completedLessonIds.length / totalLessonCount) * 100);
      }

      // Construct normalized course
      const normalizedCourse: NormalizedCourse = {
        id: courseData._id,
        title: courseData.title,
        description: courseData.description,
        videoId: courseData.sourceId || '',
        youtubeUrl: courseData.sourceUrl,
        thumbnail: courseData.sourceUrl ? `https://img.youtube.com/vi/${courseData.sourceId}/maxresdefault.jpg` : undefined,
        isPublic: courseData.isPublic,
        createdBy: courseData.createdBy,
        creatorId: courseData.createdBy,
        enrollmentCount: courseData.enrollmentCount,
        estimatedDuration: courseData.estimatedDuration,
        createdAt: courseData.createdAt,
        updatedAt: courseData.updatedAt,
        tags: courseData.tags,
        category: courseData.category,
        metadata: {
          resources: courseData.resources || [],
          objectives: courseData.learningObjectives || [],
          prerequisites: courseData.prerequisites || [],
          targetAudience: courseData.targetAudience ? [courseData.targetAudience] : [],
        },
        sections: sections,
        progress: userProgress,
        completedLessons: userCompletedLessons,
        isEnrolled: userIsEnrolled,
        enrollmentId: userEnrollmentId as any
      };

      setCourse(normalizedCourse);
      setIsEnrolled(userIsEnrolled);
      setEnrollmentId(userEnrollmentId);
      setProgress(userProgress);
      setCompletedLessons(userCompletedLessons);
      setError(null);
    } catch (err) {
      console.error('Error in useNormalizedCourse:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  }, [courseData, quizzesData, enrollmentData, lessonProgressData, shouldIncludeProgress, userId]);

  return {
    course,
    loading,
    error,
    isEnrolled,
    enrollmentId,
    progress,
    completedLessons
  };
}

