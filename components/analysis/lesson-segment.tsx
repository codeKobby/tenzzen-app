'use client';

import { useState } from 'react';
import { VideoEmbed } from './video-embed';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { 
  BookOpen,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface Resource {
  title: string;
  type: string;
  url: string;
  description: string;
}

interface LessonSegmentProps {
  videoId: string;
  title: string;
  description: string;
  content: string;
  startTime: number;
  endTime: number;
  resources: Resource[];
  onComplete?: () => void;
  isActive?: boolean;
  className?: string;
}

export function LessonSegment({
  videoId,
  title,
  description,
  content,
  startTime,
  endTime,
  resources,
  onComplete,
  isActive,
  className
}: LessonSegmentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const duration = Math.floor((endTime - startTime) / 60);

  return (
    <div className={cn("space-y-4", className)}>
      <Card className={cn(
        "transition-colors",
        isActive && "border-primary"
      )}>
        <div className="relative">
          <VideoEmbed
            videoId={videoId}
            title={title}
            startTime={startTime}
            endTime={endTime}
            onEnd={onComplete}
          />
          {isActive && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium">
              Current Lesson
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>

          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {duration} min
            </span>
            {resources.length > 0 && (
              <span className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                {resources.length} resources
              </span>
            )}
          </div>

          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="mt-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Show details</p>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                  <span className="sr-only">Toggle details</span>
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="mt-4">
              <div className="space-y-4">
                {content && (
                  <div className="prose dark:prose-invert max-w-none">
                    <p>{content}</p>
                  </div>
                )}

                {resources.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Additional Resources</h4>
                    <div className="grid gap-2">
                      {resources.map((resource, index) => (
                        <a
                          key={index}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Card className="p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start gap-3">
                              <ExternalLink className="h-4 w-4 mt-1 text-primary" />
                              <div>
                                <p className="text-sm font-medium">{resource.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {resource.description}
                                </p>
                                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full mt-2 inline-block">
                                  {resource.type}
                                </span>
                              </div>
                            </div>
                          </Card>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </Card>
    </div>
  );
}