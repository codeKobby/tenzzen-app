"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ResizablePanel } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabContent } from "./course/tab-content";
import { PanelHeader } from "./panel-header";
import { TestGeneration } from "./course/test-generation";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Bug, RefreshCcw } from "lucide-react";
import { useDebugKeys } from "@/hooks/use-debug-keys";
import { DebugShortcuts } from "./debug-shortcuts";

interface CoursePanelProps {
  className?: string;
}

export function CoursePanel({ className }: CoursePanelProps) {
  const { 
    width, 
    setWidth, 
    minWidth, 
    maxWidth, 
    isOpen,
    courseGenerating,
    courseError,
    courseData
  } = useAnalysis();

  const [showDebug, setShowDebug] = React.useState(false);

  // Initialize debug keyboard shortcuts
  useDebugKeys({
    enabled: process.env.NODE_ENV === 'development',
    onToggleDebug: () => setShowDebug(prev => !prev)
  });

  const handleResize = React.useCallback((newWidth: number) => {
    setWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
  }, [maxWidth, minWidth, setWidth]);

  if (!isOpen) return null;

  return (
    <ResizablePanel
      defaultSize={width}
      minSize={minWidth}
      maxSize={maxWidth}
      onResize={handleResize}
      className={cn("relative border-l bg-background", className)}
    >
      <div className="flex h-full flex-col">
        <PanelHeader />
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-8">
            {/* Debug controls in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDebug(!showDebug)}
                    >
                      <Bug className="mr-2 h-4 w-4" />
                      Debug
                    </Button>
                    <DebugShortcuts />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>

                {showDebug && (
                  <Alert>
                    <AlertDescription>
                      <pre className="mt-2 w-full overflow-auto rounded-md bg-slate-950 p-4">
                        <code className="text-xs text-slate-50">
                          {JSON.stringify({
                            courseGenerating,
                            courseError,
                            hasData: !!courseData,
                            width,
                            isOpen,
                            timestamp: new Date().toISOString()
                          }, null, 2)}
                        </code>
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}

                <TestGeneration />
              </div>
            )}

            {/* Main content */}
            <TabContent />
          </div>
        </ScrollArea>
      </div>
    </ResizablePanel>
  );
}