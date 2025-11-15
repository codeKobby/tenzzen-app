"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { ERROR_MESSAGES } from "@/lib/ai/config";

export function GenerationProgress() {
  const {
    courseGenerating,
    generationProgress,
    progressMessage,
    courseError
  } = useAnalysis();

  if (!courseGenerating && !courseError) return null;

  return (
    <div className="w-full space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {courseGenerating && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {courseError ? "Generation Error" : "Generating Course"}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {courseError ? "Failed" : `${generationProgress}%`}
        </span>
      </div>

      {!courseError && (
        <Progress
          value={generationProgress}
          className="h-2"
          aria-label="Generation progress"
        />
      )}

      <div className="text-sm text-muted-foreground">
        {courseError ? (
          <div className="text-destructive">
            {ERROR_MESSAGES[courseError as keyof typeof ERROR_MESSAGES] || courseError}
          </div>
        ) : (
          progressMessage
        )}
      </div>

      {courseGenerating && generationProgress < 100 && (
        <div className="text-xs text-muted-foreground">
          This may take a few minutes. Please don't close the browser.
        </div>
      )}
    </div>
  );
}