'use client';

import React from "react";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { AlertCircle, BookOpen } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GoogleAICourseGenerateButton } from "./google-ai-course-generate-button";

export function CourseGeneration() {
    const { videoData, courseGenerating, courseError } = useAnalysis();

    return (
        <div className="container mx-auto flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
            {/* Error Alert */}
            {courseError && (
                <Alert variant="destructive" className="max-w-xl w-full mx-auto mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{courseError}</AlertDescription>
                </Alert>
            )}

            {/* Video Info with Generate Button */}
            {videoData && (
                <div className="max-w-xl w-full mx-auto text-center">
                    <h1 className="text-2xl font-bold tracking-tight mb-2">{videoData.title}</h1>

                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        Generate an interactive course structure with organized lessons, assessments, and resources from this video.
                    </p>

                    <div className="flex justify-center">
                        <GoogleAICourseGenerateButton
                            size="lg"
                            className="px-8 py-6 text-lg font-medium"
                        />
                    </div>
                </div>
            )}

            {/* Loading State */}
            {!videoData && !courseError && (
                <div className="flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-primary/40 animate-pulse" />
                    </div>
                    <p className="text-muted-foreground mt-4">Loading video details...</p>
                </div>
            )}
        </div>
    );
}
