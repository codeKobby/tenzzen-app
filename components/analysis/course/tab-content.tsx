"use client"

import React, { useState } from 'react'
import { CheckCircle, Play, FileQuestion, Clock, Code } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TabContentProps {
  course: any
  activeTab: string
  setCurrentLesson?: (sectionIndex: number, lessonIndex: number, lesson: any) => void
  completedLessons?: string[]
}

export function TabContent({ course, activeTab, setCurrentLesson, completedLessons = [] }: TabContentProps) {
  if (!course) return null
  
  // Overview Tab
  if (activeTab === "overview") {
    return (
      <div className="space-y-6">
        {/* About this course */}
        <div>
          <h3 className="text-lg font-medium">About this course</h3>
          <p className="text-muted-foreground mt-1">
            {course.description}
          </p>
          <p className="text-muted-foreground mt-2">
            {course.overview?.description || 
              "This comprehensive course will take you from the fundamentals to advanced concepts. You'll learn through practical examples and gain valuable skills."}
          </p>
        </div>

        {/* What you'll learn */}
        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-lg font-medium mb-3">What you'll learn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(course.overview?.learningOutcomes || []).map((outcome: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-500" />
                <span className="text-sm">{outcome}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Learning objectives and Prerequisites side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learning objectives */}
          {course.metadata?.objectives && (
            <div>
              <h3 className="text-lg font-medium">Learning objectives</h3>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                {course.metadata.objectives.map((objective: string, i: number) => (
                  <li key={i} className="text-muted-foreground">{objective}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Prerequisites */}
          {course.overview?.prerequisites && (
            <div>
              <h3 className="text-lg font-medium">Prerequisites</h3>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                {course.overview.prerequisites.map((prerequisite: string, i: number) => (
                  <li key={i} className="text-muted-foreground">{prerequisite}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Skills section */}
        {course.overview?.skills && course.overview.skills.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Skills you'll gain</h3>
            <div className="flex flex-wrap gap-2">
              {course.overview.skills.map((skill: string, i: number) => (
                <Badge key={i} variant="outline" className="bg-primary/10">{skill}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tools section if available */}
        {course.overview?.tools && course.overview.tools.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Tools covered</h3>
            <div className="flex flex-wrap gap-2">
              {course.overview.tools.map((tool: string, i: number) => (
                <Badge key={i} variant="secondary">{tool}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Target audience */}
        {course.metadata?.targetAudience && course.metadata.targetAudience.length > 0 && (
          <div>
            <h3 className="text-lg font-medium">Who this course is for</h3>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              {course.metadata.targetAudience.map((audience: string, i: number) => (
                <li key={i} className="text-muted-foreground">{audience}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
  
  // Content Tab
  if (activeTab === "content") {
    // Calculate total lessons
    const totalLessons = course.sections?.reduce(
      (acc: number, section: any) => acc + (section.lessons?.length || 0),
      0
    ) || 0;
    
    // Calculate completed lessons count
    const completedLessonsCount = completedLessons.length;
    const progress = totalLessons > 0 ? Math.floor((completedLessonsCount / totalLessons) * 100) : 0;

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
    
    return (
      <div className="space-y-6">
        {/* Course Progress Summary */}
        <div className="mb-6 p-4 bg-muted/40 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-medium">Your Progress</h3>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={progress} className="w-32 sm:w-44 h-2" />
                <span className="text-sm text-muted-foreground">{progress}% complete</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {completedLessonsCount} of {totalLessons} lessons completed
              </p>
            </div>
            <Button onClick={() => {
              // Find first uncompleted lesson
              if (setCurrentLesson) {
                for (let i = 0; i < course.sections?.length || 0; i++) {
                  const section = course.sections[i]
                  for (let j = 0; j < (section.lessons?.length || 0); j++) {
                    if (!isLessonCompleted(i, j)) {
                      setCurrentLesson(i, j, section.lessons[j])
                      return
                    }
                  }
                }
                // If all completed, go to first lesson
                if (course.sections?.[0]?.lessons?.length) {
                  setCurrentLesson(0, 0, course.sections[0].lessons[0])
                }
              }
            }}>
              Continue Learning
            </Button>
          </div>
        </div>

        {/* Course Content Accordion */}
        <Accordion
          type="multiple"
          defaultValue={course.sections?.map((_, i: number) => `section-${i}`) || []}
          className="space-y-3"
        >
          {course.sections?.map((section: any, sectionIndex: number) => {
            const { completed, total } = getSectionCompletion(sectionIndex, section.lessons?.length || 0)
            const sectionId = section.id || `section-${sectionIndex}`;
            const isCompleted = completed === total && total > 0;

            return (
              <AccordionItem
                key={sectionId}
                value={sectionId}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-left w-full">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium",
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
                      <div>
                        <h3 className="font-medium text-sm">{section.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{completed}/{total} completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="border-t pt-0">
                  <ul className="divide-y">
                    {section.lessons?.map((lesson: any, lessonIndex: number) => {
                      const isCompleted = isLessonCompleted(sectionIndex, lessonIndex);
                      const duration = lesson.duration || "10m";

                      return (
                        <li key={lesson.id || `lesson-${sectionIndex}-${lessonIndex}`}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "flex items-center w-full justify-between px-4 py-3 h-auto text-left",
                              isCompleted && "text-green-600 dark:text-green-400"
                            )}
                            onClick={() => setCurrentLesson?.(sectionIndex, lessonIndex, lesson)}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                                isCompleted
                                  ? "bg-green-600/10 border-green-600 dark:border-green-400"
                                  : "border-muted-foreground/30"
                              )}>
                                {isCompleted ? (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                ) : (
                                  <Play className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="truncate flex-1">
                                <span className="block truncate text-sm">{lesson.title}</span>
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

                    {/* Show assessments if available */}
                    {section.assessments?.map((assessment: any, assessmentIndex: number) => (
                      <li key={`assessment-${sectionIndex}-${assessmentIndex}`}>
                        <Button
                          variant="ghost"
                          className="flex items-center w-full justify-between px-4 py-3 h-auto"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                              {assessment.type === 'assignment' ? (
                                <Code className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <FileQuestion className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              )}
                            </div>
                            <span className="text-sm truncate">{assessment.title}</span>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {assessment.type === 'assignment' ? 'Assignment' : 'Quiz'}
                          </Badge>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    )
  }
  
  // Resources Tab
  if (activeTab === "resources") {
    // Collect all resources from course sections and lessons
    const courseResources: any[] = [];
    
    course.sections?.forEach((section: any) => {
      section.lessons?.forEach((lesson: any) => {
        if (lesson.resources?.length) {
          lesson.resources.forEach((resource: any) => {
            courseResources.push({
              ...resource,
              lesson: lesson.title,
              section: section.title,
              sourceType: "course"
            })
          })
        }
      })
    });
    
    // Video sources (mock data if needed)
    const videoResources = [
      {
        title: "MDN Web Docs - HTML Documentation",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
        description: "Comprehensive HTML reference and guides",
        sourceType: "official"
      },
      {
        title: "CSS Tricks - A Complete Guide to Flexbox",
        url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
        description: "Visual guide to understanding CSS Flexbox",
        sourceType: "official"
      },
      {
        title: "JavaScript.info - The Modern JavaScript Tutorial",
        url: "https://javascript.info/",
        description: "From basics to advanced topics with simple explanations",
        sourceType: "official"
      }
    ];
    
    return (
      <div className="space-y-6">
        {/* Source Resources */}
        <div>
          <h3 className="text-lg font-medium">Source Resources</h3>
          <p className="text-muted-foreground mb-4">
            Official documentation and references cited in the video content
          </p>
          <div className="space-y-3">
            {videoResources.map((resource, index) => (
              <div key={index} className="border rounded-lg p-3 bg-muted/10">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {resource.title}
                </a>
                <p className="text-sm text-muted-foreground mt-1">
                  {resource.description}
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                    Official Resource
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Course-specific resources */}
        <div>
          <h3 className="text-lg font-medium">Supplementary Resources</h3>
          <p className="text-muted-foreground mb-4">Additional learning materials for each lesson</p>
          <div className="space-y-3">
            {courseResources.length === 0 ? (
              <p className="text-muted-foreground">No additional resources available for this course.</p>
            ) : (
              courseResources.map((resource, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {resource.title}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    From: {resource.section} - {resource.lesson}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }
  
  return null;
}
