"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  CheckCircle, PlayCircle, Clock, Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NormalizedCourse, NormalizedLesson } from "@/hooks/use-normalized-course"
import { formatDurationFromSeconds } from "@/lib/utils/duration"

interface CourseOutlineModalProps {
  course: NormalizedCourse
  onSelectLesson?: (sectionIndex: number, lessonIndex: number, lesson: NormalizedLesson) => void
  completedLessons?: string[]
  currentLessonId?: string
  trigger?: React.ReactNode
}

export function CourseOutlineModal({
  course,
  onSelectLesson,
  completedLessons = [],
  currentLessonId,
  trigger
}: CourseOutlineModalProps) {
  const [open, setOpen] = useState(false)
  const sections = course?.sections || []
  const completedLessonSet = new Set(completedLessons)

  const getSectionCompletion = (section: any) => {
    const lessons = section.lessons || []
    const total = lessons.length
    const completed = lessons.filter((lesson: any) => completedLessonSet.has(lesson.id)).length
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

  const handleLessonSelect = (sectionIndex: number, lessonIndex: number, lesson: NormalizedLesson) => {
    onSelectLesson?.(sectionIndex, lessonIndex, lesson)
    setOpen(false)
  }

  const totalLessons = sections.reduce((acc: number, section: any) =>
    acc + (section.lessons?.length || 0), 0)
  const completedCount = completedLessons.length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Menu className="h-4 w-4 mr-2" />
            Course Outline
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Course Outline</span>
            <Badge variant="secondary">
              {completedCount}/{totalLessons} completed
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <h3 className="text-lg font-semibold mb-2">No content available</h3>
              <p className="text-muted-foreground text-center max-w-md">
                This course doesn't have any content yet. Please check back later.
              </p>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={sections.map((_, i) => `section-${i}`)} className="space-y-2">
              {sections.map((section: any, sectionIndex: number) => {
                const { completed, total } = getSectionCompletion(section)
                const sectionId = section.id || `section-${sectionIndex}`
                const isCompleted = completed === total && total > 0

                return (
                  <AccordionItem key={sectionId} value={sectionId} className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
                      <div className="flex items-center gap-3 text-left w-full">
                        <div className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                          isCompleted
                            ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-primary/10 text-primary"
                        )}>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            sectionIndex + 1
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{section.title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{completed}/{total} completed</span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pb-0">
                      <ul className="divide-y">
                        {section.lessons?.map((lesson: any, lessonIndex: number) => {
                          const lessonCompleted = isLessonCompleted(lesson.id)
                          const isCurrentLesson = lesson.id === currentLessonId
                          const timeDisplay =
                            formatTimeRange(lesson.timestampStart, lesson.timestampEnd) ||
                            (typeof lesson.duration === 'number'
                              ? formatDurationFromSeconds(Math.max(1, lesson.duration * 60))
                              : lesson.duration || "10m")

                          return (
                            <li key={lesson.id || `lesson-${sectionIndex}-${lessonIndex}`}>
                              <Button
                                variant="ghost"
                                className={cn(
                                  "flex items-center w-full justify-between px-4 py-3 h-auto text-left",
                                  lessonCompleted && "text-green-600 dark:text-green-400",
                                  isCurrentLesson && "bg-primary/5 border-l-2 border-primary"
                                )}
                                onClick={() => handleLessonSelect(sectionIndex, lessonIndex, lesson)}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className={cn(
                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                                    lessonCompleted
                                      ? "bg-green-600/10 border-green-600 dark:border-green-400"
                                      : "border-muted-foreground/30",
                                    isCurrentLesson && "border-primary bg-primary/10"
                                  )}>
                                    {lessonCompleted ? (
                                      <CheckCircle className="h-3 w-3" />
                                    ) : (
                                      <PlayCircle className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="truncate flex-1">
                                    <span className={cn(
                                      "block truncate text-sm",
                                      isCurrentLesson && "font-medium"
                                    )}>{lesson.title}</span>
                                  </div>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>{timeDisplay}</span>
                                </div>
                              </Button>
                            </li>
                          )
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
