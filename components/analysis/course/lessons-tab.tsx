"use client"

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CourseGenerationResult, CourseProgress, CourseSection } from '@/types/ai';
import { 
  Lock,
  Clock,
  Play,
  CheckCircle,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseLessonsTabProps {
  content: CourseGenerationResult;
  progress: CourseProgress;
  onLessonComplete: (lessonId: string) => void;
}

export function CourseLessonsTab({ 
  content,
  progress,
  onLessonComplete
}: CourseLessonsTabProps) {
  const [selectedLesson, setSelectedLesson] = React.useState<string | null>(null);

  // Check if a lesson is locked based on prerequisites
  const isLessonLocked = React.useCallback((sectionIndex: number, lessonIndex: number): boolean => {
    const currentSection = content.sections[sectionIndex];
    if (!currentSection) return true;

    const currentLesson = currentSection.lessons[lessonIndex];
    if (!currentLesson) return true;

    // First lesson of first section is always unlocked
    if (sectionIndex === 0 && lessonIndex === 0) return false;

    // Previous lesson in same section must be completed
    if (lessonIndex > 0) {
      const prevLesson = currentSection.lessons[lessonIndex - 1];
      if (!progress.completedLessons.includes(prevLesson.id)) {
        return true;
      }
    }

    // First lesson of other sections requires previous section completion
    if (lessonIndex === 0 && sectionIndex > 0) {
      const prevSection = content.sections[sectionIndex - 1];
      if (!prevSection) return true;

      return !prevSection.lessons.every(
        lesson => progress.completedLessons.includes(lesson.id)
      );
    }

    return false;
  }, [content.sections, progress.completedLessons]);

  // Calculate overall progress
  const totalLessons = React.useMemo(() => {
    return content.sections.reduce(
      (acc: number, section: CourseSection) => acc + section.lessons.length,
      0
    );
  }, [content.sections]);

  const completedPercentage = React.useMemo(() => {
    return Math.round((progress.completedLessons.length / totalLessons) * 100);
  }, [progress.completedLessons.length, totalLessons]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr,400px] gap-6">
      {/* Lessons List */}
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-6 pr-6">
          {/* Progress Overview */}
          <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Course Progress</h3>
              <Badge variant="secondary">
                {completedPercentage}% Complete
              </Badge>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${completedPercentage}%` }}
              />
            </div>
          </div>

          {/* Sections Accordion */}
          <Accordion type="single" collapsible className="space-y-4">
            {content.sections.map((section, sectionIndex) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border rounded-lg px-2"
              >
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                      {sectionIndex + 1}
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">{section.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {section.lessons.length} lessons • {section.duration}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="space-y-2">
                    {section.lessons.map((lesson, lessonIndex) => {
                      const isLocked = isLessonLocked(sectionIndex, lessonIndex);
                      const isCompleted = progress.completedLessons.includes(lesson.id);
                      const isActive = selectedLesson === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => !isLocked && setSelectedLesson(lesson.id)}
                          disabled={isLocked}
                          className={cn(
                            "w-full flex items-start gap-4 p-3 rounded-lg transition-colors text-left",
                            isLocked && "opacity-60 cursor-not-allowed",
                            isActive && "bg-primary/10",
                            !isLocked && !isActive && "hover:bg-secondary/80"
                          )}
                        >
                          <div className="mt-1">
                            {isLocked ? (
                              <Lock className="h-4 w-4" />
                            ) : isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{lesson.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{lesson.duration}</span>
                            </div>
                          </div>
                          {!isLocked && <ChevronRight className="h-4 w-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollArea>

      {/* Lesson Content */}
      <ScrollArea className="h-[calc(100vh-12rem)] border-l">
        <div className="p-6">
          {selectedLesson ? (
            (() => {
              const lesson = content.sections
                .flatMap(s => s.lessons)
                .find(l => l.id === selectedLesson);

              if (!lesson) return null;

              const isCompleted = progress.completedLessons.includes(lesson.id);

              return (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{lesson.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {lesson.duration}
                      </div>
                      {isCompleted && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="prose dark:prose-invert">
                    {lesson.content}
                  </div>

                  {!isCompleted && (
                    <Button
                      className="w-full"
                      onClick={() => onLessonComplete(lesson.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Complete
                    </Button>
                  )}

                  {lesson.resources.length > 0 && (
                    <div className="border-t pt-6">
                      <h3 className="font-medium mb-4">Lesson Resources</h3>
                      <div className="space-y-2">
                        {lesson.resources.map((resource, i) => (
                          <a
                            key={i}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 hover:bg-secondary rounded"
                          >
                            <BookOpen className="h-4 w-4" />
                            <span>{resource.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Lesson</h3>
              <p className="text-sm text-muted-foreground">
                Choose a lesson from the list to start learning
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}