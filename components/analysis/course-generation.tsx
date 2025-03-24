"use client"

import { useCallback } from 'react';
import { useAnalysis } from '@/hooks/use-analysis-context';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, X } from 'lucide-react';

export function CourseGeneration() {
  const {
    videoData,
    courseGenerating,
    progressMessage,
    generationProgress,
    courseError,
    generateCourse,
    cancelGeneration
  } = useAnalysis();

  // Fix: Use useCallback to prevent state updates during render
  const handleGenerateCourse = useCallback(() => {
    if (videoData && !courseGenerating) {
      generateCourse();
    }
  }, [videoData, courseGenerating, generateCourse]);

  // Fix: Use useCallback for cancel handler
  const handleCancel = useCallback(() => {
    if (cancelGeneration) {
      cancelGeneration();
    }
  }, [cancelGeneration]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6">
      <div className="bg-background border rounded-xl shadow-sm p-8 max-w-md mx-auto w-full text-center">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mx-auto mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>

        <h2 className="text-2xl font-semibold mb-2">Generate Course</h2>
        <p className="text-muted-foreground mb-6">
          Transform this video into a structured course with lessons, resources, and assessments.
        </p>

        {courseGenerating ? (
          <div className="space-y-4">
            <div className="w-full bg-secondary h-2 rounded-full">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, generationProgress)}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground">{progressMessage || "Analyzing video content..."}</p>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="mt-4 gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        ) : (
          <>
            {courseError && (
              <div className="text-red-500 mb-4 p-3 bg-red-50 dark:bg-red-950/30 rounded-md">
                {courseError}
              </div>
            )}
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={handleGenerateCourse}
              disabled={!videoData || courseGenerating}
            >
              <Sparkles className="h-4 w-4" />
              Generate Course
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              This process may take a few minutes depending on the video length.
            </p>
          </>
        )}
      </div>
    </div>
  );
}