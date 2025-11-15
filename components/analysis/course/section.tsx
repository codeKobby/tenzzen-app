"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CourseSectionProps {
  section: any;
  sectionIndex: number;
  lessonsDone?: number;
  totalLessons?: number;
  onLessonClick?: (sectionIndex: number, lessonIndex: number, lesson: any) => void;
  completedLessons?: string[];
  defaultOpen?: boolean;
}

export function CourseSection({
  section,
  sectionIndex,
  lessonsDone = 0,
  totalLessons,
  onLessonClick,
  completedLessons = [],
  defaultOpen = false,
}: CourseSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Calculate section completion if not provided
  const calculatedTotalLessons = totalLessons || section.lessons?.length || 0;
  
  // Check if a specific lesson is completed
  const isLessonCompleted = (lessonIndex: number) => {
    return completedLessons.includes(`${sectionIndex}-${lessonIndex}`);
  };

  // Calculate how many lessons are done if not provided
  const calculatedLessonsDone = lessonsDone > 0 ? lessonsDone : 
    section.lessons?.reduce((count: number, _: any, index: number) => 
      isLessonCompleted(index) ? count + 1 : count, 0) || 0;

  // Section is fully completed if all lessons are done
  const isCompleted = calculatedLessonsDone === calculatedTotalLessons && calculatedTotalLessons > 0;

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen} 
      className="border rounded-lg overflow-hidden"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/40 transition-colors">
        <div className="flex items-start gap-3 text-left">
          <div className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            isCompleted ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "border"
          )}>
            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : sectionIndex + 1}
          </div>
          <div>
            <h3 className="font-medium">{section.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{section.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {calculatedLessonsDone}/{calculatedTotalLessons} completed
              </span>
            </div>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t px-4 py-2 space-y-1">
          {section.lessons?.map((lesson: any, lessonIndex: number) => (
            <button
              key={lesson.id || `lesson-${sectionIndex}-${lessonIndex}`}
              className={cn(
                "flex items-center justify-between py-2 px-2 w-full text-left hover:bg-muted/40 rounded-md transition-colors cursor-pointer group",
                isLessonCompleted(lessonIndex) && "text-green-600 dark:text-green-400"
              )}
              onClick={() => onLessonClick?.(sectionIndex, lessonIndex, lesson)}
            >
              <div className="flex gap-3 items-center">
                <div className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]",
                  isLessonCompleted(lessonIndex) ? "bg-green-100 dark:bg-green-900/30" : "border"
                )}>
                  {isLessonCompleted(lessonIndex) ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    lessonIndex + 1
                  )}
                </div>
                <span className="text-sm font-medium">{lesson.title}</span>
              </div>
            </button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
