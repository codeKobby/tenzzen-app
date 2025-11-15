'use client';

import { useState } from 'react';

interface ProgressUpdateOptions {
  courseId: string;
  lessonId?: string;
  sectionIndex: number;
  lessonIndex: number;
  completed: boolean;
}

interface ProgressUpdateResult {
  success: boolean;
  progress: number;
  completedLessons: string[];
  completionStatus: string;
}

export function useCourseProgressUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProgress = async (options: ProgressUpdateOptions): Promise<ProgressUpdateResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/supabase/courses/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update progress');
      }

      const data = await response.json();
      return {
        success: data.success,
        progress: data.progress,
        completedLessons: data.completedLessons,
        completionStatus: data.completionStatus,
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
