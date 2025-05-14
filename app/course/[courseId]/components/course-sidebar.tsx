"use client"

import { useState } from "react"
import { ChevronDown, CheckCircle, PlayCircle, FileQuestion, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface CourseSidebarProps {
  course: any
  courseEnrollment: any
  currentSectionIndex: number
  currentLessonIndex: number
  onSelectLesson: (sectionIndex: number, lessonIndex: number) => void
}

export function CourseSidebar({
  course,
  courseEnrollment,
  currentSectionIndex,
  currentLessonIndex,
  onSelectLesson
}: CourseSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([`section-${currentSectionIndex}`])

  // Get sections from course data - try both sources
  const sectionsFromCourse = course?.sections || [];
  const sectionsFromEnrollment = courseEnrollment?.courseData?.sections || [];

  // Use whichever has content, preferring course sections
  const sections = sectionsFromCourse.length > 0 ? sectionsFromCourse : sectionsFromEnrollment;

  console.log("Sidebar sections:", {
    fromCourse: sectionsFromCourse.length,
    fromEnrollment: sectionsFromEnrollment.length,
    using: sections.length
  });

  // Get completed lessons
  const completedLessons = courseEnrollment?.completedLessons || []

  // Create a default section if none exists
  const effectiveSections = sections.length > 0 ? sections : [
    {
      title: "Course Content",
      lessons: [
        {
          id: "default-lesson",
          title: course?.title ? `Watch: ${course.title}` : "Introduction",
          type: "video",
          videoId: course?.videoId || courseEnrollment?.courseData?.videoId || "qz0aGYrrlhU", // Use course video ID, enrollment video ID, or better fallback
          duration: 300 // 5 minutes default
        }
      ]
    }
  ]

  console.log("Using effective sections:", {
    count: effectiveSections.length,
    firstSectionTitle: effectiveSections[0]?.title,
    firstSectionLessonsCount: effectiveSections[0]?.lessons?.length || 0,
    firstLessonTitle: effectiveSections[0]?.lessons?.[0]?.title,
    firstLessonVideoId: effectiveSections[0]?.lessons?.[0]?.videoId
  });

  // Check if a specific lesson is completed
  const isLessonCompleted = (sectionIndex: number, lessonIndex: number) => {
    return completedLessons.includes(`${sectionIndex}-${lessonIndex}`)
  }

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

  // Format duration
  const formatDuration = (seconds: number) => {
    if (!seconds) return "00:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Handle accordion state
  const handleAccordionChange = (value: string[]) => {
    setExpandedSections(value)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="font-semibold text-lg mb-4">Course Content</h2>

        {/* Course Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Your Progress</span>
            <span className="text-sm text-muted-foreground">{course.progress || 0}%</span>
          </div>
          <Progress value={course.progress || 0} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {completedLessons.length} of {course.totalLessons || 0} lessons completed
          </p>
        </div>

        {/* Course Sections */}
        <Accordion
          type="multiple"
          value={expandedSections}
          onValueChange={handleAccordionChange}
          className="space-y-2"
        >
          {effectiveSections.map((section: any, sectionIndex: number) => {
              const { completed, total } = getSectionCompletion(sectionIndex, section.lessons?.length || 0)
              const progress = total > 0 ? Math.round((completed / total) * 100) : 0

              return (
                <AccordionItem
                  key={`section-${sectionIndex}`}
                  value={`section-${sectionIndex}`}
                  className={cn(
                    "border rounded-md overflow-hidden",
                    sectionIndex === currentSectionIndex && "border-primary/50 bg-primary/5"
                  )}
                >
                  <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 hover:no-underline">
                    <div className="flex flex-col items-start text-left">
                      <div className="flex items-center gap-2 w-full">
                        <span className="font-medium truncate">{section.title}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{completed}/{total} lessons</span>
                        <span>•</span>
                        <span>{formatDuration(section.duration || 0)}</span>
                      </div>
                      <Progress value={progress} className="h-1 mt-2 w-full" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-2">
                    <ul className="space-y-1">
                      {section.lessons?.map((lesson: any, lessonIndex: number) => {
                        const isActive = sectionIndex === currentSectionIndex && lessonIndex === currentLessonIndex
                        const isCompleted = isLessonCompleted(sectionIndex, lessonIndex)

                        return (
                          <li key={`lesson-${sectionIndex}-${lessonIndex}`}>
                            <button
                              type="button"
                              onClick={() => onSelectLesson(sectionIndex, lessonIndex)}
                              className={cn(
                                "flex items-start gap-2 w-full px-4 py-2 text-left text-sm rounded-md",
                                isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/50",
                                isCompleted && "text-green-600 dark:text-green-500"
                              )}
                            >
                              <div className="mt-0.5">
                                {isCompleted ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                                ) : lesson.type === 'quiz' ? (
                                  <FileQuestion className="h-4 w-4" />
                                ) : (
                                  <PlayCircle className="h-4 w-4" />
                                )}
                              </div>
                              <div className="flex-1 flex flex-col">
                                <span className={cn(
                                  "line-clamp-2",
                                  isActive && "font-medium",
                                  isCompleted && "text-green-600 dark:text-green-500"
                                )}>
                                  {lesson.title}
                                </span>
                                {lesson.duration && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatDuration(lesson.duration)}</span>
                                  </div>
                                )}
                              </div>
                            </button>
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
    </div>
  )
}
