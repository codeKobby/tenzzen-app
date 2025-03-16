"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenerationProgress } from "../generation-progress";
import { GenerationActions } from "../generation-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Bug } from "lucide-react";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { ERROR_MESSAGES } from "@/lib/ai/config";

export function TestGeneration() {
  const {
    courseGenerating,
    courseError,
    courseData,
    generationProgress
  } = useAnalysis();

  const [showDebug, setShowDebug] = React.useState(false);
  const [lastResponse, setLastResponse] = React.useState<string | null>(null);

  // Effect to capture response data
  React.useEffect(() => {
    if (courseData) {
      setLastResponse(JSON.stringify(courseData, null, 2));
    }
  }, [courseData]);

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Course Generation</CardTitle>
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setShowDebug(!showDebug)}
            >
              <Bug className="h-4 w-4" />
              {showDebug ? 'Hide Debug' : 'Show Debug'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Indicators */}
        <div className="space-y-4">
          {courseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Generation Failed</AlertTitle>
              <AlertDescription>
                {ERROR_MESSAGES[courseError as keyof typeof ERROR_MESSAGES] || courseError}
              </AlertDescription>
            </Alert>
          )}

          {courseData && !courseError && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Generation Complete</AlertTitle>
              <AlertDescription>
                Course structure has been generated successfully!
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Progress Tracking */}
        {(courseGenerating || courseError) && (
          <div className="space-y-4">
            <GenerationProgress />
            
            {/* Debug Information */}
            {showDebug && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Debug Information</h4>
                <div className="rounded-md bg-muted p-4">
                  <pre className="text-xs">
                    {JSON.stringify({
                      state: {
                        generating: courseGenerating,
                        progress: generationProgress,
                        error: courseError,
                        hasData: !!courseData,
                        timestamp: new Date().toISOString()
                      }
                    }, null, 2)}
                  </pre>
                </div>

                {lastResponse && (
                  <>
                    <h4 className="text-sm font-medium">Last Response</h4>
                    <div className="rounded-md bg-muted p-4 max-h-[300px] overflow-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {lastResponse}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <GenerationActions />
        </div>
      </CardContent>

      {/* Loading overlay */}
      {courseGenerating && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm pointer-events-none" />
      )}
    </Card>
  );
}