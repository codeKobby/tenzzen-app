"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./overview-tab";
import { LessonsTab } from "./lessons-tab";
import { ResourcesTab } from "./resources-tab";
import { TestsTab } from "./tests-tab";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { cn } from "@/lib/utils";
import { SkeletonTransition, ContentTransition } from "./skeleton-transition";

export function TabContent() {
  const { courseData, courseError, courseGenerating } = useAnalysis();

  const showEmptyState = !courseData && !courseGenerating && !courseError;
  const showContent = !courseGenerating && !!courseData;

  // Handle error state separately to prevent flicker
  if (courseError && !courseGenerating) {
    return null;
  }
  
  return (
    <div className="relative min-h-[200px]">
      {/* Empty state */}
      {showEmptyState && (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-muted-foreground">
          Generate a course to see its structure and content
        </div>
      )}

      {/* Loading state */}
      <SkeletonTransition 
        show={courseGenerating} 
        className={cn(
          "absolute inset-0 z-10",
          !courseGenerating && "pointer-events-none"
        )}
      />

      {/* Content */}
      <ContentTransition 
        show={showContent}
        className={cn(
          "transition-all duration-300",
          (!showContent || courseGenerating) && "pointer-events-none opacity-0"
        )}
      >

        <Tabs defaultValue="overview" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
          </TabsList>

          <div className="space-y-8">
            <TabsContent value="overview" className="space-y-4">
              <OverviewTab course={courseData!} loading={courseGenerating} />
            </TabsContent>

            <TabsContent value="lessons" className="space-y-4">
              <LessonsTab course={courseData!} loading={courseGenerating} />
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <ResourcesTab course={courseData!} loading={courseGenerating} />
            </TabsContent>

            <TabsContent value="tests" className="space-y-4">
              <TestsTab course={courseData!} loading={courseGenerating} />
            </TabsContent>
          </div>
        </Tabs>
      </ContentTransition>
    </div>
  );
}
