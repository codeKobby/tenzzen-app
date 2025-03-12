"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { CourseTabs } from "./course";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CourseDisplay() {
  const {
    videoData,
    courseData,
    courseError,
    courseGenerating,
    generationProgress,
    generateCourse,
    cancelGeneration
  } = useAnalysis();

  const [showCancelDialog, setShowCancelDialog] = React.useState(false);

  const handleCancel = () => {
    cancelGeneration();
    setShowCancelDialog(false);
  };

  const handleRegenerate = () => {
    generateCourse();
    setShowCancelDialog(false);
  };

  if (!videoData) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        Select content to begin analysis
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      {!courseData && !courseGenerating ? (
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <h3 className="text-xl font-semibold mb-2">Ready to create a course?</h3>
          <p className="text-muted-foreground mb-6">
            Generate a structured course from this video content.
          </p>

          <Button
            onClick={generateCourse}
            size="lg"
            className="gap-2 px-6 py-6 h-auto text-base font-medium transition-all hover:scale-105 hover:shadow-md"
          >
            <Sparkles className="h-5 w-5" />
            Generate Course
          </Button>

          <p className="text-sm text-muted-foreground mt-6">
            Using {videoData.type === "playlist" ? "playlist" : "video"}: 
            {videoData.title.slice(0, 50)}{videoData.title.length > 50 ? '...' : ''}
          </p>
        </div>
      ) : courseGenerating ? (
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <h3 className="text-lg font-medium mb-6">Generating Your Course</h3>
          
          <div className="w-full space-y-2">
            <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-500"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress: {generationProgress}%</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-8 border border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => setShowCancelDialog(true)}
          >
            Cancel Generation
          </Button>
        </div>
      ) : courseError ? (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {courseError}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={generateCourse}
          >
            Try Again
          </Button>
        </div>
      ) : courseData && (
        <CourseTabs courseId={videoData.id} content={courseData} />
      )}

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {courseGenerating ? "Cancel Generation?" : "Regenerate Course?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {courseGenerating 
                ? "Are you sure you want to cancel the course generation? All progress will be lost."
                : "This will start a new course generation. The current course will be replaced."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Continue</AlertDialogCancel>
            <AlertDialogAction
              onClick={courseGenerating ? handleCancel : handleRegenerate}
              variant={courseGenerating ? "destructive" : "default"}
            >
              {courseGenerating ? "Yes, Cancel" : "Yes, Regenerate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
