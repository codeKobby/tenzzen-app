"use client"

import { useState, useEffect } from "react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
    CheckCircle, FileQuestion, PlayCircle, Clock, ChevronRight, FileText, Trophy
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { NormalizedCourse, NormalizedLesson, NormalizedSection } from "@/hooks/use-normalized-course"
import { formatDurationFromSeconds } from "@/lib/utils/duration"

interface CourseContentProps {
    course: NormalizedCourse
    onSelectLesson?: (sectionIndex: number, lessonIndex: number, lesson: NormalizedLesson) => void
    onSelectQuiz?: (sectionIndex: number, assessmentIndex: number, assessment: any) => void
    completedLessons?: string[]
    isSidebar?: boolean
    currentLessonId?: string
    currentQuizId?: string
    activeSectionIndex?: number
}

export function CourseContent({ course, onSelectLesson, onSelectQuiz, completedLessons = [], isSidebar = false, currentLessonId, currentQuizId, activeSectionIndex }: CourseContentProps) {
    // Get sections from the normalized course
    const sections = course.sections || []
    const completedLessonSet = new Set(completedLessons)

    // State to control which accordion sections are expanded
    const [expandedSections, setExpandedSections] = useState<string[]>(() => {
        if (!isSidebar) {
            // In full view, expand all sections by default
            return sections.map((_, i) => `section-${i}`)
        }
        // In sidebar, expand the active section or first section
        return activeSectionIndex !== undefined ? [`section-${activeSectionIndex}`] : ['section-0']
    })
    const [lastActiveSectionIndex, setLastActiveSectionIndex] = useState<number | undefined>(activeSectionIndex)

    // Update expanded sections when activeSectionIndex changes (for sidebar)
    useEffect(() => {
        if (isSidebar && activeSectionIndex !== undefined && activeSectionIndex !== lastActiveSectionIndex) {
            const sectionKey = `section-${activeSectionIndex}`
            // Always set to only the active section in sidebar
            setExpandedSections([sectionKey])
            setLastActiveSectionIndex(activeSectionIndex)
        }
    }, [activeSectionIndex, isSidebar, lastActiveSectionIndex])

    const getSectionCompletion = (section: NormalizedSection) => {
        const lessons = section.lessons || []
        const total = lessons.length
        const completed = lessons.filter((lesson) => completedLessonSet.has(lesson.id)).length
        return { completed, total }
    }

    const isLessonCompleted = (lessonId: string) => completedLessonSet.has(lessonId)

    const formatTimeLabel = (value?: number | null) => {
        if (typeof value !== "number" || Number.isNaN(value)) return null
        return formatDurationFromSeconds(Math.floor(value))
    }

    const formatTimeRange = (start?: number, end?: number) => {
        const startLabel = formatTimeLabel(start)
        const endLabel = formatTimeLabel(end)
        if (startLabel && endLabel) return `${startLabel} - ${endLabel}`
        return startLabel || endLabel || null
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
    const completedLessonsCount = completedLessonSet.size
    const totalLessons = sections.reduce((acc: number, section: any) =>
        acc + (section.lessons?.length || 0), 0)

    return (
        <div className={cn("space-y-6", isSidebar && "px-0")}>
            {/* Course Progress Summary - Only show in non-sidebar mode */}
            {!isSidebar && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-medium text-foreground">Your Progress</h3>
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
                                    const lesson = section.lessons[j]
                                    if (lesson && !isLessonCompleted(lesson.id) && onSelectLesson) {
                                        onSelectLesson(i, j, lesson)
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
                value={expandedSections}
                onValueChange={setExpandedSections}
                className={cn("space-y-3", isSidebar && "space-y-0 border-0")}
            >
                {sections.map((section: any, sectionIndex: number) => {
                    const sectionKey = `section-${sectionIndex}`

                    // Check if this is an assessment section
                    if (section.isAssessment) {
                        const isActiveQuiz = currentQuizId === section.id;
                        const isPlaceholder = section.isGenerated === false;

                        // Determine icon and color based on type
                        const AssessmentIcon = section.assessmentType === 'test' ? FileText
                            : section.assessmentType === 'project' ? Trophy
                                : FileQuestion;

                        const colorClasses = section.assessmentType === 'test'
                            ? {
                                bg: isActiveQuiz ? "bg-blue-500" : isPlaceholder ? "bg-blue-500/5 border border-blue-500/30" : "bg-blue-500/10",
                                text: isActiveQuiz ? "text-white" : isPlaceholder ? "text-blue-500/70" : "text-blue-500",
                                activeBg: "bg-blue-500/10 border-l-2 border-blue-500 hover:bg-blue-500/15",
                                badge: isActiveQuiz ? "border-blue-500 text-blue-500" : isPlaceholder ? "border-blue-500/30 text-blue-500/70" : "",
                                sectionBg: "bg-blue-500/5 border-blue-500/20"
                            }
                            : section.assessmentType === 'project'
                                ? {
                                    bg: isActiveQuiz ? "bg-purple-500" : isPlaceholder ? "bg-purple-500/5 border border-purple-500/30" : "bg-purple-500/10",
                                    text: isActiveQuiz ? "text-white" : isPlaceholder ? "text-purple-500/70" : "text-purple-500",
                                    activeBg: "bg-purple-500/10 border-l-2 border-purple-500 hover:bg-purple-500/15",
                                    badge: isActiveQuiz ? "border-purple-500 text-purple-500" : isPlaceholder ? "border-purple-500/30 text-purple-500/70" : "",
                                    sectionBg: "bg-purple-500/5 border-purple-500/20"
                                }
                                : {
                                    bg: isActiveQuiz ? "bg-amber-500" : isPlaceholder ? "bg-amber-500/5 border border-amber-500/30" : "bg-amber-500/10",
                                    text: isActiveQuiz ? "text-white" : isPlaceholder ? "text-amber-500/70" : "text-amber-500",
                                    activeBg: "bg-amber-500/10 border-l-2 border-amber-500 hover:bg-amber-500/15",
                                    badge: isActiveQuiz ? "border-amber-500 text-amber-500" : isPlaceholder ? "border-amber-500/30 text-amber-500/70" : "",
                                    sectionBg: "bg-amber-500/5 border-amber-500/20"
                                };

                        const badgeLabel = section.assessmentType === 'test' ? 'Test'
                            : section.assessmentType === 'project' ? 'Project'
                                : 'Quiz';

                        return (
                            <div
                                key={section.id || sectionKey}
                                className={cn(
                                    "border rounded-lg overflow-hidden border-border",
                                    isSidebar && "border-0 rounded-none border-b border-border/40",
                                    !isSidebar && colorClasses.sectionBg
                                )}
                            >
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "flex items-center w-full justify-between h-auto text-left transition-colors",
                                        isSidebar ? "px-3 py-2.5 hover:bg-accent/50" : "px-4 py-3",
                                        isActiveQuiz && isSidebar && colorClasses.activeBg,
                                        isPlaceholder && "opacity-60 hover:opacity-100"
                                    )}
                                    onClick={() => onSelectQuiz?.(sectionIndex, 0, section)}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className={cn(
                                            "flex shrink-0 items-center justify-center rounded-full",
                                            isSidebar ? "h-5 w-5" : "h-6 w-6",
                                            colorClasses.bg,
                                            colorClasses.text
                                        )}>
                                            <AssessmentIcon className={cn(isSidebar ? "h-3 w-3" : "h-3.5 w-3.5")} />
                                        </div>
                                        <div className="truncate flex-1 min-w-0">
                                            <span className={cn(
                                                "block truncate font-medium",
                                                isSidebar ? "text-xs leading-tight" : "text-sm",
                                                isActiveQuiz && colorClasses.text
                                            )}>{section.title}</span>
                                            {isPlaceholder && (
                                                <span className={cn(
                                                    "block text-[10px] text-muted-foreground mt-0.5",
                                                    isSidebar && "text-[9px]"
                                                )}>
                                                    {section.assessmentType === 'project' ? 'View requirements' : 'Click to generate'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "ml-2 flex-shrink-0",
                                            isSidebar && "text-[10px] px-1.5 py-0",
                                            colorClasses.badge
                                        )}
                                    >
                                        {isPlaceholder && section.assessmentType !== 'project' ? "Generate" : badgeLabel}
                                    </Badge>
                                </Button>
                            </div>
                        );
                    }

                    // Regular module section with lessons - calculate module number by counting non-assessment sections before this one
                    const moduleNumber = sections.slice(0, sectionIndex).filter((s: any) => !s.isAssessment).length + 1;
                    const { completed, total } = getSectionCompletion(section)
                    const isCompleted = completed === total && total > 0;

                    return (
                        <AccordionItem
                            key={section.id || sectionKey}
                            value={sectionKey}
                            className={cn(
                                "border rounded-lg overflow-hidden border-border",
                                isSidebar && "border-0 rounded-none border-b border-border/40"
                            )}
                        >
                            <AccordionTrigger className={cn(
                                "px-4 py-3 hover:bg-muted/50",
                                isSidebar && "px-3 py-2.5 hover:bg-accent/50 [&[data-state=open]]:bg-accent/50"
                            )}>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-left w-full">
                                    <div className="flex items-center gap-2.5 flex-1">
                                        <div className={cn(
                                            "flex shrink-0 items-center justify-center rounded-full font-semibold",
                                            isSidebar ? "h-6 w-6 text-xs" : "h-7 w-7 text-sm",
                                            isCompleted
                                                ? "bg-green-500/10 text-green-500"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {isCompleted ? (
                                                <CheckCircle className={cn(isSidebar ? "h-3.5 w-3.5" : "h-4 w-4")} />
                                            ) : (
                                                moduleNumber
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={cn(
                                                "font-semibold truncate text-foreground",
                                                isSidebar ? "text-xs" : "text-sm"
                                            )}>{section.title}</h3>
                                            <div className={cn(
                                                "flex items-center gap-2 mt-0.5 text-xs text-muted-foreground",
                                                isSidebar ? "text-[10px]" : ""
                                            )}>
                                                <span>{completed}/{total} completed</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>

                            <AccordionContent className={cn(
                                "border-t border-border/40 pt-0",
                                isSidebar && "border-t-0 pt-0"
                            )}>
                                <ul className={cn(
                                    "divide-y divide-border/30",
                                    isSidebar && "divide-y divide-border/20"
                                )}>
                                    {section.lessons?.map((lesson: any, lessonIndex: number) => {
                                        const lessonCompleted = isLessonCompleted(lesson.id);
                                        const isActive = currentLessonId === lesson.id;
                                        const timeDisplay =
                                            formatTimeRange(lesson.timestampStart, lesson.timestampEnd) ||
                                            (typeof lesson.duration === 'number'
                                                ? formatDurationFromSeconds(Math.max(1, lesson.duration * 60))
                                                : lesson.duration || "10m");

                                        return (
                                            <li key={lesson.id || `lesson-${sectionIndex}-${lessonIndex}`}>
                                                <Button
                                                    variant="ghost"
                                                    className={cn(
                                                        "flex items-center w-full justify-between h-auto text-left transition-colors",
                                                        isSidebar ? "px-3 py-2.5 hover:bg-accent/50" : "px-4 py-3",
                                                        isActive && isSidebar && "bg-primary/5 border-l-2 border-primary hover:bg-primary/10",
                                                        !isActive && lessonCompleted && "text-green-600 dark:text-green-500"
                                                    )}
                                                    onClick={() => onSelectLesson?.(sectionIndex, lessonIndex, lesson)}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <div className={cn(
                                                            "flex shrink-0 items-center justify-center rounded-full",
                                                            isSidebar ? "h-5 w-5" : "h-6 w-6",
                                                            isActive
                                                                ? "bg-primary text-primary-foreground"
                                                                : lessonCompleted
                                                                    ? "bg-green-500/10 text-green-500"
                                                                    : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {lessonCompleted && !isActive ? (
                                                                <CheckCircle className={cn(isSidebar ? "h-3 w-3" : "h-3.5 w-3.5")} />
                                                            ) : (
                                                                <PlayCircle className={cn(isSidebar ? "h-3 w-3" : "h-3.5 w-3.5")} />
                                                            )}
                                                        </div>
                                                        <div className="truncate flex-1 min-w-0">
                                                            <span className={cn(
                                                                "block truncate font-medium",
                                                                isSidebar ? "text-xs leading-tight" : "text-sm",
                                                                isActive && "text-primary"
                                                            )}>{lesson.title}</span>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "flex items-center text-xs flex-shrink-0 ml-2",
                                                        isActive ? "text-primary" : "text-muted-foreground"
                                                    )}>
                                                        <Clock className={cn(isSidebar ? "h-3 w-3 mr-1" : "h-3.5 w-3.5 mr-1")} />
                                                        <span className={cn(isSidebar && "text-[10px]")}>{timeDisplay}</span>
                                                    </div>
                                                </Button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </div>
    )
}
