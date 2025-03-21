"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Icons } from "@/components/ui/icons";
import { Progress } from "@/components/ui/progress";

export function CourseGeneration() {
  const {
    generateCourse,
    cancelGeneration,
    courseGenerating,
    generationProgress,
    progressMessage,
    courseError
  } = useAnalysis();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Course</CardTitle>
        <CardDescription>
          Convert this video into a structured learning experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Generation Button */}
          <div className="flex items-center justify-center">
            {!courseGenerating ? (
              <Button 
                onClick={generateCourse}
                size="lg"
                className="min-w-[200px]"
              >
                <Icons.rocket className="mr-2 h-4 w-4" />
                Generate Course
              </Button>
            ) : (
              <Button 
                onClick={cancelGeneration}
                variant="destructive"
                size="lg"
                className="min-w-[200px]"
              >
                <Icons.close className="mr-2 h-4 w-4" />
                Cancel Generation
              </Button>
            )}
          </div>

          {/* Progress Indicator */}
          {courseGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{progressMessage}</span>
                <span>{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} />
            </div>
          )}

          {/* Error Message */}
          {courseError && (
            <div className="text-sm text-destructive">
              {courseError}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}