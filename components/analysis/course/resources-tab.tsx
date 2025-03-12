"use client"

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { CourseGenerationResult, CourseResource } from '@/types/ai';
import { 
  FileText,
  Video,
  Code,
  File,
  Search,
  ExternalLink,
  Bookmark,
  BookOpen
} from 'lucide-react';

interface CourseResourcesTabProps {
  content: CourseGenerationResult;
}

const RESOURCE_ICONS = {
  article: FileText,
  video: Video,
  code: Code,
  document: File,
} as const;

export function CourseResourcesTab({ content }: CourseResourcesTabProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const allResources = React.useMemo(() => {
    const resourcesFromSections = content.sections.flatMap(section =>
      section.lessons.flatMap(lesson => lesson.resources)
    );
    return [...content.resources, ...resourcesFromSections];
  }, [content]);

  const resourcesByType = React.useMemo(() => {
    const grouped = allResources.reduce((acc, resource) => {
      if (!acc[resource.type]) {
        acc[resource.type] = [];
      }
      acc[resource.type].push(resource);
      return acc;
    }, {} as Record<string, CourseResource[]>);

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [allResources]);

  const filteredResources = React.useMemo(() => {
    if (!searchQuery.trim()) return resourcesByType;

    const query = searchQuery.toLowerCase();
    return resourcesByType
      .map(([type, resources]) => [
        type,
        resources.filter(
          resource =>
            resource.title.toLowerCase().includes(query) ||
            resource.description.toLowerCase().includes(query)
        ),
      ])
      .filter(([, resources]) => resources.length > 0) as [string, CourseResource[]][];
  }, [resourcesByType, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Resources List */}
      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="space-y-8 pr-4">
          {filteredResources.map(([type, resources]) => (
            <section key={type}>
              <div className="flex items-center gap-2 mb-4">
                {React.createElement(RESOURCE_ICONS[type as keyof typeof RESOURCE_ICONS] || BookOpen, {
                  className: "h-5 w-5"
                })}
                <h3 className="font-semibold capitalize">{type} Resources</h3>
                <Badge variant="secondary" className="ml-auto">
                  {resources.length}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-2 p-4 rounded-lg border bg-card transition-colors hover:bg-accent"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium group-hover:text-accent-foreground">
                        {resource.title}
                      </h4>
                      <ExternalLink className="h-4 w-4 text-muted-foreground/50 group-hover:text-accent-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {resource.description}
                    </p>
                    <div className="mt-auto pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      {React.createElement(RESOURCE_ICONS[resource.type as keyof typeof RESOURCE_ICONS] || BookOpen, {
                        className: "h-3 w-3"
                      })}
                      <span className="capitalize">{resource.type}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}

          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Resources Found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search query
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}