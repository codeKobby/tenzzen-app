"use client";

import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { useAnalysis } from "@/hooks/use-analysis-context";

export function CoursePanelSkeleton({ className }: { className?: string }) {
  // Get video data from the analysis context
  const { videoData } = useAnalysis();

  // Use local state for progress since the actual tracking may not be accurate
  const [progress, setProgress] = useState(5);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Generic message about generation time
  const [timeMessage, setTimeMessage] = useState("This may take a few moments...");

  useEffect(() => {
    // Set appropriate time message based on video length
    if (videoData?.duration) {
      const durationInMinutes = Math.floor(videoData.duration / 60);

      if (durationInMinutes > 30) {
        setTimeMessage("This may take several minutes. Longer videos require more processing time.");
      } else if (durationInMinutes > 10) {
        setTimeMessage("This may take a few minutes. Please be patient.");
      } else {
        setTimeMessage("This should only take a moment...");
      }
    }

    // Simulate progress increasing over time to provide visual feedback
    const interval = setInterval(() => {
      setProgress(prev => {
        // Increase progress but cap at 95% to show it's still working
        const newProgress = prev + (Math.random() * 0.7 + 0.3);

        // Update current step based on progress
        if (newProgress > 20 && newProgress <= 40 && currentStep < 2) {
          setCurrentStep(2);
        } else if (newProgress > 40 && newProgress <= 60 && currentStep < 3) {
          setCurrentStep(3);
        } else if (newProgress > 60 && newProgress <= 80 && currentStep < 4) {
          setCurrentStep(4);
        } else if (newProgress > 80 && currentStep < 5) {
          setCurrentStep(5);
        }

        return newProgress > 95 ? 95 : newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [videoData?.duration, currentStep]);
  return (
    <div className={cn("bg-background flex flex-col w-full h-full overflow-hidden transition-all duration-300 ease-in-out relative", className)}>
      {/* Loading overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="bg-card border shadow-lg rounded-lg p-8 max-w-md w-full mx-4 flex flex-col items-center">
          <LoadingSpinner size="lg" className="text-primary mb-6" />
          <h3 className="text-xl font-medium mb-3 animate-pulse">Generating Your Course</h3>
          <p className="text-muted-foreground text-center mb-4">
            Our AI is analyzing the content and structuring your personalized learning path...
          </p>
          <div className="w-full mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="w-full space-y-1 text-sm text-muted-foreground">
            <div className={cn("flex justify-between", currentStep > 1 && "text-primary")}>
              <span>Analyzing video transcript</span>
              <span>{currentStep === 1 ? <span className="animate-pulse">...</span> : currentStep > 1 ? "✓" : "-"}</span>
            </div>
            <div className={cn("flex justify-between", currentStep < 2 && "opacity-50", currentStep > 2 && "text-primary")}>
              <span>Identifying key concepts</span>
              <span>{currentStep === 2 ? <span className="animate-pulse">...</span> : currentStep > 2 ? "✓" : "-"}</span>
            </div>
            <div className={cn("flex justify-between", currentStep < 3 && "opacity-50", currentStep > 3 && "text-primary")}>
              <span>Creating learning objectives</span>
              <span>{currentStep === 3 ? <span className="animate-pulse">...</span> : currentStep > 3 ? "✓" : "-"}</span>
            </div>
            <div className={cn("flex justify-between", currentStep < 4 && "opacity-50", currentStep > 4 && "text-primary")}>
              <span>Structuring course modules</span>
              <span>{currentStep === 4 ? <span className="animate-pulse">...</span> : currentStep > 4 ? "✓" : "-"}</span>
            </div>
            <div className={cn("flex justify-between", currentStep < 5 && "opacity-50", currentStep === 5 && "text-primary")}>
              <span>Finalizing course content</span>
              <span>{currentStep === 5 ? <span className="animate-pulse">...</span> : "-"}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Step {currentStep} of {totalSteps}
          </p>

          <p className="text-xs text-muted-foreground mt-2">
            {timeMessage}
          </p>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b">
          {/* Top section with thumbnail and summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video thumbnail skeleton */}
            <div className="aspect-video relative rounded-lg border skeleton"></div>

            {/* Course summary skeleton */}
            <div className="flex flex-col gap-3">
              {/* Category & Difficulty */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <div className="h-5 w-24 rounded-full skeleton"></div>
                <div className="h-5 w-20 rounded-full skeleton"></div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <div className="h-4 w-12 rounded-full skeleton"></div>
                <div className="h-4 w-16 rounded-full skeleton"></div>
                <div className="h-4 w-14 rounded-full skeleton"></div>
              </div>

              {/* Sources */}
              <div className="flex items-center gap-2 mt-2">
                <div className="h-4 w-14 rounded-full skeleton"></div>
                <div className="flex items-center">
                  <div className="h-5 w-5 rounded-full skeleton"></div>
                </div>
              </div>

              {/* About */}
              <div>
                <div className="h-6 w-40 rounded-md skeleton mt-2"></div>
                <div className="space-y-2 mt-2">
                  <div className="h-4 w-full rounded-md skeleton"></div>
                  <div className="h-4 w-full rounded-md skeleton"></div>
                  <div className="h-4 w-3/4 rounded-md skeleton"></div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
                <div className="h-4 w-24 rounded-full skeleton"></div>
                <div className="h-4 w-20 rounded-full skeleton"></div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                <div className="h-9 w-28 rounded-md skeleton"></div>
                <div className="h-9 w-24 rounded-md skeleton"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="border-b">
          <div className="flex items-center px-4">
            <div className="flex space-x-4 py-2">
              <div className="h-8 w-20 rounded-md skeleton"></div>
              <div className="h-8 w-20 rounded-md skeleton"></div>
              <div className="h-8 w-20 rounded-md skeleton"></div>
            </div>
          </div>
        </div>

        {/* Tab content skeleton - Overview tab */}
        <div className="px-4 py-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-full rounded-md skeleton"></div>
              <div className="h-4 w-full rounded-md skeleton"></div>
              <div className="h-4 w-3/4 rounded-md skeleton"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-4 pt-4 border-t">
              {/* Learning Objectives */}
              <div>
                <div className="h-6 w-40 rounded-md skeleton mb-3"></div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 py-1">
                    <div className="h-5 w-5 rounded-full skeleton"></div>
                    <div className="h-4 w-full rounded-md skeleton"></div>
                  </div>
                  <div className="flex items-start gap-3 py-1">
                    <div className="h-5 w-5 rounded-full skeleton"></div>
                    <div className="h-4 w-full rounded-md skeleton"></div>
                  </div>
                </div>
              </div>

              {/* Prerequisites */}
              <div>
                <div className="h-6 w-32 rounded-md skeleton mb-3"></div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 py-1">
                    <div className="h-5 w-5 rounded-full skeleton"></div>
                    <div className="h-4 w-full rounded-md skeleton"></div>
                  </div>
                  <div className="flex items-start gap-3 py-1">
                    <div className="h-5 w-5 rounded-full skeleton"></div>
                    <div className="h-4 w-full rounded-md skeleton"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
