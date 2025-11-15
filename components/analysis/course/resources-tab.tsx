import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseSkeleton } from "@/components/ui/skeleton";
import type { CourseGeneratorResult } from "@/tools/courseGenerator";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileType, Video, FileText, Code } from "lucide-react";

interface ResourcesTabProps {
  course: CourseGeneratorResult;
  loading?: boolean;
}

type Resource = CourseGeneratorResult['sections'][0]['lessons'][0]['resources'][0];

interface EnhancedResource extends Resource {
  section: string;
  lesson: string;
}

const resourceIcons = {
  video: Video,
  article: FileText,
  code: Code,
  document: FileType
} as const;

export function ResourcesTab({ course, loading }: ResourcesTabProps) {
  if (loading) {
    return <CourseSkeleton />;
  }

  // Collect all resources from all sections and lessons with proper typing
  const allResources: EnhancedResource[] = React.useMemo(() => {
    if (!course || !course.sections) return [];

    return course.sections.flatMap(section =>
      section.lessons.flatMap(lesson =>
        (lesson.resources || []).map(resource => ({
          ...resource,
          lesson: lesson.title,
          section: section.title
        }))
      )
    );
  }, [course, course?.sections]);

  // Group resources by type with proper type annotations
  const resourcesByType = React.useMemo(() => {
    return allResources.reduce<Record<Resource['type'], EnhancedResource[]>>((acc, resource) => {
      const type = resource.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(resource);
      return acc;
    }, {} as Record<Resource['type'], EnhancedResource[]>);
  }, [allResources]);

  return (
    <div className="space-y-6">
      {Object.entries(resourcesByType).map(([type, resources]) => (
        <Card key={type}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {resourceIcons[type as keyof typeof resourceIcons] && (
                <div className="rounded-full bg-primary/10 p-1">
                  {React.createElement(resourceIcons[type as keyof typeof resourceIcons], {
                    className: "h-4 w-4 text-primary"
                  })}
                </div>
              )}
              <CardTitle className="capitalize">{type} Resources</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {resources.map((resource) => (
              <div
                key={`${resource.section}-${resource.lesson}-${resource.title}`}
                className="flex items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium">{resource.title}</h4>
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{resource.section}</Badge>
                    <Badge variant="outline">{resource.lesson}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </a>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {Object.keys(resourcesByType).length === 0 && (
        <div className="flex h-[200px] items-center justify-center rounded-lg border">
          <p className="text-sm text-muted-foreground">No resources available</p>
        </div>
      )}
    </div>
  );
}