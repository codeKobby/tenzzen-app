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

  if (courseError) {
    return null;
  }

  if (!courseData && !courseGenerating) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        Generate a course to see its structure and content
      </div>
    );
  }

  return (
    <div className="relative">
      <SkeletonTransition show={courseGenerating} />
      <ContentTransition 
        show={!courseGenerating && !!courseData}
        className={cn(
          "transition-opacity duration-300",
          courseGenerating && "pointer-events-none opacity-0"
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