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
}

export interface NormalizedSection {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: NormalizedLesson[];
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
  
  // Fetch enrollment if user is authenticated and includeProgress is true
  const enrollmentData = useQuery(
    options.includeProgress && userId 
      ? api.enrollments.getUserCourseEnrollment 
      : 'skip' as any,
    options.includeProgress && userId && courseId
      ? { userId, courseId: convexCourseId } 
      : 'skip' as any
  );

  const loading = courseData === undefined || (options.includeProgress && userId && enrollmentData === undefined);

  useEffect(() => {
    if (loading) return;

    try {
      if (!courseData) {
        setError('Course not found');
        return;
      }

      // Build sections from modules and lessons
      const sections: NormalizedSection[] = (courseData.modules || []).map((module: any) => ({
        id: module._id,
        title: module.title,
        description: module.description,
        orderIndex: module.order,
        lessons: (module.lessons || []).map((lesson: any) => ({
          id: lesson._id,
          title: lesson.title,
          content: lesson.content,
          videoTimestamp: 0,
          duration: lesson.durationMinutes,
          orderIndex: lesson.order,
          completed: false
        }))
      }));

      // Handle enrollment and progress
      let userProgress = 0;
      let userCompletedLessons: string[] = [];
      let userEnrollmentId: Id<"user_enrollments"> | null = null;
      let userIsEnrolled = false;

      if (enrollmentData) {
        userIsEnrolled = true;
        userEnrollmentId = enrollmentData._id;
        userProgress = enrollmentData.progress || 0;
        userCompletedLessons = enrollmentData.completedLessons || [];

        // Mark completed lessons
        for (const section of sections) {
          for (const lesson of section.lessons) {
            lesson.completed = userCompletedLessons.includes(lesson.id);
          }
        }
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
  }, [courseData, enrollmentData, loading, userId, options.includeProgress]);

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

