"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, AlertCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GENERATION_PHASES } from "@/lib/ai/config";
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
  const [currentPhase, setCurrentPhase] = React.useState(0);

  // Update current phase based on progress
  React.useEffect(() => {
    if (courseGenerating) {
      const newPhase = GENERATION_PHASES.findIndex(
        (phase) => generationProgress < phase.progress
      );
      setCurrentPhase(Math.max(0, newPhase - 1));
    }
  }, [courseGenerating, generationProgress]);

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
    <div className="p-6 h-full flex flex-col items-center justify-center">
      {!courseData && !courseGenerating ? (
        <div className="text-center max-w-md">
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
        <div className="flex flex-col items-center justify-center py-12 w-full max-w-md">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <h3 className="text-lg font-medium mb-2">Generating Course</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {GENERATION_PHASES[currentPhase]?.name || 'Preparing...'}
          </p>
          
          <div className="w-full space-y-2">
            <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
              <Progress 
                value={generationProgress} 
                className="absolute inset-0 transition-all duration-500"
                indicatorClassName="h-full bg-gradient-to-r from-blue-500 to-primary"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress: {generationProgress}%</span>
              <span>Phase {currentPhase + 1}/{GENERATION_PHASES.length}</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-8 border border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => setShowCancelDialog(true)}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Generation
          </Button>
        </div>
      ) : courseError ? (
        <div className="p-6 border rounded-lg bg-destructive/10 text-center max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {courseError.includes("Rate limit") 
                ? "Rate limit reached. Please wait a moment and try again."
                : courseError}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4"
            onClick={generateCourse}
          >
            Try Again
          </Button>
        </div>
      ) : courseData && (
        <ScrollArea className="h-[calc(100vh-12rem)] w-full pr-4">
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Course Structure</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
              >
                Regenerate
              </Button>
            </div>

            {courseData.sections.map((section, index) => (
              <div key={index} className="border rounded-lg p-4 bg-card">
                <h3 className="font-semibold mb-2">
                  Section {index + 1}: {section.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{section.summary}</p>

                {section.keyPoints.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Key Points:</h4>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      {section.keyPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {section.quiz && section.quiz.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Practice Questions:</h4>
                    <div className="space-y-4">
                      {section.quiz.map((question, qIndex) => (
                        <div key={qIndex} className="space-y-2">
                          <p className="text-sm font-medium">{question.question}</p>
                          <ul className="pl-4 space-y-1">
                            {question.options.map((option, oIndex) => (
                              <li
                                key={oIndex}
                                className={`text-sm ${
                                  oIndex === question.correctAnswer
                                    ? "text-green-600 dark:text-green-500"
                                    : "text-muted-foreground"
                                }`}
                              >
                                • {option}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
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
