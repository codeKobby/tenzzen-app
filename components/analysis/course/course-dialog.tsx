"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icons";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CourseDialog({ open, onOpenChange }: CourseDialogProps) {
  const { courseData } = useAnalysis();

  if (!courseData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{courseData.title}</DialogTitle>
          <DialogDescription>
            {courseData.overview.description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-6">
            {/* Overview */}
            <section className="space-y-3">
              <h4 className="text-sm font-medium">Course Overview</h4>
              <div className="grid gap-2 text-sm">
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{courseData.overview.totalDuration}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Level:</span>
                  <span className="capitalize">{courseData.overview.difficultyLevel}</span>
                </div>
              </div>

              {/* Learning Outcomes */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Learning Outcomes</h5>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {courseData.overview.learningOutcomes.map((outcome, i) => (
                    <li key={i} className="text-muted-foreground">
                      {outcome.title}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Sections */}
            <section className="space-y-4">
              {courseData.sections.map((section, i) => (
                <div key={i} className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Icons.section className="h-4 w-4" />
                    {section.title}
                  </h4>
                  
                  {/* Lessons */}
                  <ul className="ml-6 space-y-2">
                    {section.lessons.map((lesson, j) => (
                      <li key={j} className="text-sm">
                        <div className="flex items-start gap-2">
                          <Icons.video className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p>{lesson.title}</p>
                            <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Assessments */}
                  {section.assessments.length > 0 && (
                    <ul className="ml-6 space-y-2">
                      {section.assessments.map((assessment, j) => (
                        <li key={j} className="text-sm">
                          <div className="flex items-start gap-2">
                            {assessment.type === 'test' && (
                              <Icons.clipboard className="h-4 w-4 text-muted-foreground mt-0.5" />
                            )}
                            {assessment.type === 'assignment' && (
                              <Icons.edit className="h-4 w-4 text-muted-foreground mt-0.5" />
                            )}
                            {assessment.type === 'project' && (
                              <Icons.rocket className="h-4 w-4 text-muted-foreground mt-0.5" />
                            )}
                            <div>
                              <p>{assessment.title}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {assessment.type} · {assessment.estimatedDuration}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <Button onClick={() => onOpenChange(false)}>Close Preview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
