"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { Loader2, X, Bug, RefreshCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface GenerationActionsProps {
  className?: string;
}

export function GenerationActions({ className }: GenerationActionsProps) {
  const {
    courseGenerating,
    courseError,
    courseData,
    generateCourse,
    cancelGeneration
  } = useAnalysis();

  // Debug actions
  const handleResetState = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset state:', error);
      toast.error('Failed to reset state');
    }
  };

  const handleTestGeneration = async () => {
    try {
      const mockVideoData = {
        title: "Test Video",
        description: "This is a test video description",
        duration: "10:00"
      };
      localStorage.setItem('testVideoData', JSON.stringify(mockVideoData));
      await generateCourse();
    } catch (error) {
      console.error('Test generation failed:', error);
      toast.error('Test generation failed');
    }
  };

  const handleClearCache = () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('course-') || key.startsWith('video-')) {
          localStorage.removeItem(key);
        }
      });
      toast.success('Cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {courseGenerating ? (
        <Button
          variant="outline"
          size="sm"
          onClick={cancelGeneration}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      ) : (
        <>
          <Button
            variant={courseError ? "destructive" : "default"}
            size="sm"
            onClick={generateCourse}
            disabled={courseGenerating || !!courseData}
            className="gap-2"
          >
            {courseError ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Retry
              </>
            ) : courseData ? (
              <>
                <Loader2 className="h-4 w-4" />
                Generated
              </>
            ) : (
              <>
                <Loader2 className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>

          {/* Debug menu in development */}
          {process.env.NODE_ENV === 'development' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Bug className="h-4 w-4" />
                  Debug
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Debug Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleTestGeneration}>
                  Test Generation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleClearCache}>
                  Clear Cache
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleResetState}
                  className="text-destructive"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Reset State
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      )}
    </div>
  );
}