"use client"

import { useState } from "react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
    CheckCircle, FileQuestion, PlayCircle, Clock, ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { NormalizedCourse, NormalizedLesson, NormalizedSection } from "@/hooks/use-normalized-course"
import { formatDurationFromSeconds } from "@/lib/utils/duration"

interface CourseContentProps {
    course: NormalizedCourse
    onSelectLesson?: (sectionIndex: number, lessonIndex: number, lesson: NormalizedLesson) => void
    completedLessons?: string[]
    isSidebar?: boolean
}

export function CourseContent({ course, onSelectLesson, completedLessons = [], isSidebar = false }: CourseContentProps) {
    // Get sections from the normalized course
    const sections = course.sections || []

    // Calculate section completion
    const getSectionCompletion = (sectionIndex: number, lessonCount: number) => {
        let completed = 0
        for (let i = 0; i < lessonCount; i++) {
            if (completedLessons.includes(`${sectionIndex}-${i}`)) {
                completed++
            }
        }
        return { completed, total: lessonCount }
    }

    // Check if a specific lesson is completed
    const isLessonCompleted = (sectionIndex: number, lessonIndex: number) => {
        return completedLessons.includes(`${sectionIndex}-${lessonIndex}`)
    }

    // If the course doesn't have sections, display a message
    if (sections.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10">
                <h3 className="text-xl font-semibold mb-2">No content available</h3>
                <p className="text-muted-foreground text-center max-w-md">
                    This course doesn't have any content yet. Please check back later.
                </p>
            </div>
        )
    }

    // Calculate completed lessons count
    const completedLessonsCount = completedLessons.length
    const totalLessons = course.total_lessons || course.totalLessons || sections.reduce((acc: number, section: any) =>
        acc + (section.lessons?.length || 0), 0)

    return (
        <div className={cn("space-y-6", isSidebar && "px-0")}>
            {/* Course Progress Summary - Only show in non-sidebar mode */}
            {!isSidebar && (
                <div className="mb-6 p-4 bg-muted/40 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-medium">Your Progress</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Progress value={course.progress} className="w-32 sm:w-44 h-2" />
                                <span className="text-sm text-muted-foreground">{course.progress}% complete</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {completedLessonsCount} of {totalLessons} lessons completed
                            </p>
                        </div>
                        <Button onClick={() => {
                            // Find first uncompleted lesson
                            for (let i = 0; i < sections.length; i++) {
                                const section = sections[i]
                                for (let j = 0; j < (section.lessons?.length || 0); j++) {
                                    if (!isLessonCompleted(i, j) && onSelectLesson) {
                                        onSelectLesson(i, j, section.lessons[j])
                                        return
                                    }
                                }
                            }
                            // If all completed, go to first lesson
                            if (sections[0]?.lessons?.length && onSelectLesson) {
                                onSelectLesson(0, 0, sections[0].lessons[0])
                            }
                        }}>
                            Continue Learning
                        </Button>
                    </div>
                </div>
            )}

            {/* Course Content Accordion */}
            <Accordion
                type="multiple"
                defaultValue={sections.map((_, i) => `section-${i}`)}
                className={cn("space-y-3", isSidebar && "space-y-0 border-0")}
            >
                {sections.map((section: any, sectionIndex: number) => {
                    const { completed, total } = getSectionCompletion(sectionIndex, section.lessons?.length || 0)
                    const sectionId = section.id || `section-${sectionIndex}`;
                    const isCompleted = completed === total && total > 0;

                    return (
                        <AccordionItem
                            key={sectionId}
                            value={sectionId}
                            className={cn(
                                "border rounded-lg overflow-hidden",
                                isSidebar && "border-0 rounded-none border-b"
                            )}
                        >
                            <AccordionTrigger className={cn(
                                "px-4 py-3 hover:bg-muted/50",
                                isSidebar && "px-4 py-2"
                            )}>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-left w-full">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={cn(
                                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                                            isCompleted
                                                ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                                : "bg-primary/10 text-primary",
                                            isSidebar && "h-6 w-6"
                                        )}>
                                            {isCompleted ? (
                                                <CheckCircle className="h-4 w-4" />
                                            ) : (
                                                sectionIndex + 1
                                            )}
                                        </div>
                                        <div>
                                            <h3 className={cn(
                                                "font-medium text-sm",
                                                isSidebar && "text-xs"
                                            )}>{section.title}</h3>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <span>{completed}/{total} completed</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>

                            <AccordionContent className={cn(
                                "border-t pt-0",
                                isSidebar && "border-t-0"
                            )}>
                                <ul className={cn(
                                    "divide-y",
                                    isSidebar && "divide-y-0"
                                )}>
                                    {section.lessons?.map((lesson: any, lessonIndex: number) => {
                                        const isCompleted = isLessonCompleted(sectionIndex, lessonIndex);
                                        // Format duration using the standardized format
                                        const duration = typeof lesson.duration === 'number'
                                            ? formatDurationFromSeconds(lesson.duration)
                                            : lesson.duration || "10m";

                                        return (
                                            <li key={lesson.id || `lesson-${sectionIndex}-${lessonIndex}`}>
                                                <Button
                                                    variant="ghost"
                                                    className={cn(
                                                        "flex items-center w-full justify-between px-4 py-3 h-auto text-left",
                                                        isCompleted && "text-green-600 dark:text-green-400",
                                                        isSidebar && "px-4 py-2 h-auto"
                                                    )}
                                                    onClick={() => onSelectLesson?.(sectionIndex, lessonIndex, lesson)}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className={cn(
                                                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                                                            isCompleted
                                                                ? "bg-green-600/10 border-green-600 dark:border-green-400"
                                                                : "border-muted-foreground/30",
                                                            isSidebar && "h-5 w-5"
                                                        )}>
                                                            {isCompleted ? (
                                                                <CheckCircle className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <PlayCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div className="truncate flex-1">
                                                            <span className={cn(
                                                                "block truncate text-sm",
                                                                isSidebar && "text-xs"
                                                            )}>{lesson.title}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center text-xs text-muted-foreground">
                                                        <Clock className="h-3.5 w-3.5 mr-1" />
                                                        <span>{duration}</span>
                                                    </div>
                                                </Button>
                                            </li>
                                        )
                                    })}

                                    {/* Quiz or assessment if available */}
                                    {section.assessments?.length > 0 && (
                                        section.assessments.map((assessment: any, assessmentIndex: number) => (
                                            <li key={`assessment-${sectionIndex}-${assessmentIndex}`}>
                                                <Button
                                                    variant="ghost"
                                                    className={cn(
                                                        "flex items-center w-full justify-between px-4 py-3 h-auto",
                                                        isSidebar && "px-4 py-2 h-auto"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className={cn(
                                                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30",
                                                            isSidebar && "h-5 w-5"
                                                        )}>
                                                            <FileQuestion className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                                        </div>
                                                        <span className={cn(
                                                            "text-sm truncate",
                                                            isSidebar && "text-xs"
                                                        )}>{assessment.title}</span>
                                                    </div>
                                                    <Badge variant="outline" className="ml-2">Quiz</Badge>
                                                </Button>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </div>
    )
}
