'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface ProgressUpdateOptions {
  userId: string;
  courseId: Id<'courses'>;
  lessonId: Id<'lessons'>;
  completed: boolean;
}

interface ProgressUpdateResult {
  success: boolean;
  progress: number;
  completedLessons: Id<'lessons'>[];
  completionStatus: 'in-progress' | 'completed';
}

export function useCourseProgressUpdate() {
  const recordLessonProgress = useMutation(api.enrollments.recordLessonProgress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProgress = async (options: ProgressUpdateOptions): Promise<ProgressUpdateResult | null> => {
    if (!options.userId) {
      setError('Authentication required to update progress');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await recordLessonProgress({
        userId: options.userId,
        courseId: options.courseId,
        lessonId: options.lessonId,
        completed: options.completed,
      });

      return {
        success: data.success,
        progress: data.progress,
        completedLessons: data.completedLessons,
        completionStatus: data.completionStatus as 'in-progress' | 'completed',
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateProgress,
    loading,
    error,
  };
}
