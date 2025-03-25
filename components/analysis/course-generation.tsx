"use client"

import { useCallback, useState } from 'react';
import { useAnalysis } from '@/hooks/use-analysis-context';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, X, AlertCircle } from 'lucide-react';
import { safeToast } from '@/lib/toast-manager';

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

  // Add local error state to capture and display detailed errors
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Fix: Use useCallback with improved error handling
  const handleGenerateCourse = useCallback(() => {
    if (videoData && !courseGenerating) {
      // Clear any previous errors
      setErrorDetails(null);

      // Use requestAnimationFrame to defer the state update to next frame
      requestAnimationFrame(() => {
        generateCourse().catch(error => {
          console.error("Error generating course:", error);
          // Capture detailed error information
          setErrorDetails(error instanceof Error ? error.message : "An unexpected error occurred");
          // Use safeToast for error notification
          safeToast.error("Failed to generate course", {
            description: error instanceof Error ? error.message : "An unexpected error occurred"
          });
        });
      });
    }
  }, [videoData, courseGenerating, generateCourse]);

  // Fix: Use useCallback for cancel handler with requestAnimationFrame
  const handleCancel = useCallback(() => {
    if (cancelGeneration) {
      requestAnimationFrame(() => {
        cancelGeneration();
      });
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
            {(courseError || errorDetails) && (
              <div className="text-red-500 mb-4 p-3 bg-red-50 dark:bg-red-950/30 rounded-md flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{courseError || "Failed to generate course"}</span>
                </div>

                {errorDetails && errorDetails !== courseError && (
                  <div className="text-xs mt-1 text-left">
                    <details>
                      <summary className="cursor-pointer">Technical details</summary>
                      <p className="mt-1 break-words">{errorDetails}</p>
                    </details>
                  </div>
                )}

                <Button
                  variant="link"
                  size="sm"
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 p-0"
                  onClick={() => {
                    window.open(`https://status.tenzzen.com`, '_blank');
                  }}
                >
                  Check System Status
                </Button>
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