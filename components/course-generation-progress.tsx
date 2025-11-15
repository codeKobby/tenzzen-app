"use client";

import React, { useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

interface CourseGenerationProgressProps {
  progress: number;
  message: string;
  onCancel: () => void;
  className?: string;
}

export function CourseGenerationProgress({
  progress,
  message,
  onCancel,
  className = "",
}: CourseGenerationProgressProps) {
  // Add debug logging to track progress updates, but only when the value changes
  const prevProgressRef = useRef(progress);

  useEffect(() => {
    if (prevProgressRef.current !== progress) {
      console.log("[CourseGenerationProgress] Progress updated:", progress, "Message:", message);

      // Log when progress reaches 100%
      if (progress === 100) {
        console.log("[CourseGenerationProgress] Progress reached 100%, should hide cancel button");
      }

      prevProgressRef.current = progress;
    }
  }, [progress, message]);
  // Define progress stages with their thresholds and messages
  const stages = [
    { threshold: 5, message: "Checking database..." },
    { threshold: 10, message: "Fetching transcript..." },
    { threshold: 20, message: "Analyzing video content..." },
    { threshold: 30, message: "Identifying key concepts..." },
    { threshold: 40, message: "Structuring course outline..." },
    { threshold: 50, message: "Creating lessons..." },
    { threshold: 60, message: "Adding learning objectives..." },
    { threshold: 70, message: "Finding supplementary resources..." },
    { threshold: 80, message: "Finalizing course structure..." },
    { threshold: 90, message: "Polishing content..." },
    { threshold: 100, message: "Course generation complete!" },
  ];

  // Find the current stage based on progress
  const currentStage = stages.findIndex(stage => progress < stage.threshold);
  const stageIndex = currentStage === -1 ? stages.length - 1 : currentStage - 1;

  // Use the provided message if available, otherwise use the stage message
  const displayMessage = message || (stageIndex >= 0 ? stages[stageIndex].message : "Processing...");

  // Force the progress to be a number between 0 and 100
  const safeProgress = Math.min(Math.max(0, Number(progress) || 0), 100);

  // If progress is 90% or higher, don't render anything
  // Using 90 as a threshold to catch any rounding issues and ensure we transition early
  if (safeProgress >= 90) {
    console.log("[CourseGenerationProgress] CRITICAL FIX: Progress is 90% or higher, not rendering progress component");
    return null;
  }

  // If progress is 0 or very low, don't render the progress bar yet
  // This ensures we only show progress after generation has actually started
  if (safeProgress <= 5) {
    console.log("[CourseGenerationProgress] Progress is too low, not rendering progress component yet");
    return null;
  }

  // If we have a cancel button but no progress, don't render
  if (!message && !progress) {
    console.log("[CourseGenerationProgress] No message or progress, not rendering progress component");
    return null;
  }

  // Log the current progress value to help diagnose issues
  console.log("[CourseGenerationProgress] Rendering with progress:", safeProgress, "Message:", message);

  return (
    <div className={`flex flex-col items-center space-y-4 w-full max-w-md mx-auto p-4 ${className}`}>
      <div className="w-full space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{displayMessage}</span>
          <span className="font-medium">{Math.round(safeProgress)}%</span>
        </div>
        <Progress value={safeProgress} className="h-2" />
      </div>

      <div className="flex flex-col space-y-2 w-full">
        <div className="text-xs text-muted-foreground text-center">
          AI is analyzing the video and generating your course. This may take a few minutes.
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="mt-2 gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          <XCircle className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
