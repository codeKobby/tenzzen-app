"use client"

import React, { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useAnalysis } from "@/hooks/use-analysis-context"
import { mockCourseData } from "@/lib/mock/course-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "../ui/button"
import {
  X, Play, Bookmark, GraduationCap, Clock, BookOpen, FileText, TestTube2,
  XCircle, Tag, ChevronDown, Lock, FileQuestion, Code, Briefcase, CheckCircle2
} from "lucide-react"
import { YouTubeEmbed } from "@/components/youtube-embed"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"

interface CoursePanelProps {
  className?: string
}

// Action Buttons component that can be rendered in multiple places
function ActionButtons({ className }: { className?: string }) {
  const isSmall = className?.includes("sm");

  return (
    <div className={cn("flex gap-2", className)}>
      <Button className="gap-1.5" size={isSmall ? "sm" : "default"}>
        <GraduationCap className="h-4 w-4" />
        {isSmall ? "" : "Enroll Now"}
      </Button>
      <Button
        variant="outline"
        className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
        size={isSmall ? "sm" : "default"}
      >
        <XCircle className="h-4 w-4" />
        {isSmall ? "" : "Cancel"}
      </Button>
    </div>
  );
}

// Course Summary section
function CourseSummary({ course }: { course: any }) {
  // Calculate total lessons count
  const totalLessons = course.sections?.reduce(
    (acc: number, section: any) => acc + (section.lessons?.length || 0),
    0
  ) || 0;

  // Use mock data for assignments and tests since they don't exist in the current data structure
  const assignmentsCount = 6; // Mock data
  const testsCount = 3; // Mock data

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-lg">About this course</h3>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-3">
          {course.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Course category badge */}
        <div className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 dark:bg-purple-900/30 dark:text-purple-200 dark:ring-purple-700/30 gap-1">
          <Tag className="h-3 w-3" />
          Web Development
        </div>

        {/* Difficulty badge */}
        {course.metadata?.difficulty && (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-200 dark:ring-blue-700/30">
            {course.metadata.difficulty}
          </span>
        )}

        {/* Duration badge - showing hours instead of weeks */}
        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/30 dark:text-green-200 dark:ring-green-700/30 gap-1">
          <Clock className="h-3 w-3" />
          24 hours
        </span>
      </div>

      {/* Course stats */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{totalLessons} Lessons</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          <span>{assignmentsCount} Assignments</span>
        </div>
        <div className="flex items-center gap-1">
          <TestTube2 className="h-3.5 w-3.5" />
          <span>{testsCount} Tests</span>
        </div>
      </div>

      <ActionButtons className="flex-1 mt-2" />
    </div>
  )
}

// Simple TabContent component
function TabContent({ tab, course }: { tab: string; course: any }) {
  if (tab === "overview") {
    // Enhanced overview tab with more detailed information about skills gained
    return (
      <div className="space-y-6">
        {/* About this course */}
        <div>
          <h3 className="text-lg font-medium">About this course</h3>
          <p className="text-muted-foreground mt-1">
            {course.description}
          </p>
          <p className="text-muted-foreground mt-2">
            This comprehensive introduction to web development will take you from the very fundamentals
            of HTML structure to creating interactive web applications with JavaScript.
            You'll learn industry best practices, responsive design techniques, and how to combine
            these technologies to build modern websites.
          </p>
        </div>

        {/* What you'll learn - Skills and knowledge section */}
        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-lg font-medium mb-3">What you'll learn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-500" />
              <span className="text-sm">Structure web content semantically with HTML5</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-500" />
              <span className="text-sm">Style web pages with CSS layouts and animations</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-500" />
              <span className="text-sm">Create responsive designs that work on all devices</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-500" />
              <span className="text-sm">Implement interactive features with JavaScript</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-500" />
              <span className="text-sm">Build and debug forms with client-side validation</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-500" />
              <span className="text-sm">Manipulate the DOM to create dynamic content</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-500" />
              <span className="text-sm">Apply web accessibility best practices</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-500" />
              <span className="text-sm">Deploy a complete portfolio website</span>
            </div>
          </div>
        </div>

        {/* Learning objectives and Prerequisites side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learning objectives - Left side on desktop */}
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

          {/* Prerequisites - Right side on desktop */}
          {course.metadata?.prerequisites && (
            <div>
              <h3 className="text-lg font-medium">Prerequisites</h3>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                {course.metadata.prerequisites.map((prerequisite: string, i: number) => (
                  <li key={i} className="text-muted-foreground">{prerequisite}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Career and skill outcomes */}
        <div>
          <h3 className="text-lg font-medium">Career outcomes</h3>
          <p className="text-muted-foreground mt-1">
            The skills you'll develop in this course are foundational for roles such as:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <div className="border rounded-md p-3">
              <h4 className="font-medium text-sm">Front-End Developer</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Build and implement visual elements that users see and interact with
              </p>
            </div>
            <div className="border rounded-md p-3">
              <h4 className="font-medium text-sm">Web Designer</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Create attractive, functional layouts for websites and web applications
              </p>
            </div>
            <div className="border rounded-md p-3">
              <h4 className="font-medium text-sm">UI Developer</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Focus on implementing user interfaces with HTML, CSS, and JavaScript
              </p>
            </div>
            <div className="border rounded-md p-3">
              <h4 className="font-medium text-sm">Freelance Web Developer</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Create websites and web applications for clients as an independent contractor
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (tab === "content") {
    // Generate mock completion state for lessons
    const mockCompletionState = {
      0: { lessonsDone: 2, totalLessons: 2 },
      1: { lessonsDone: 0, totalLessons: 2 },
      2: { lessonsDone: 0, totalLessons: 2 }
    };

    return (
      <div className="space-y-6">
        {/* Collapsible course sections */}
        {course.sections?.map((section: any, sectionIndex: number) => {
          const sectionState = mockCompletionState[sectionIndex as keyof typeof mockCompletionState] ||
            { lessonsDone: 0, totalLessons: section.lessons?.length || 0 };

          return (
            <Collapsible
              key={sectionIndex}
              className="border rounded-lg overflow-hidden"
              defaultOpen={sectionIndex === 0}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/40 transition-colors">
                <div className="flex items-start gap-3 text-left">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                    {sectionIndex + 1}
                  </div>
                  <div>
                    <h3 className="font-medium">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t px-4 py-2 space-y-1">
                  {/* Regular lessons - all lessons are accessible */}
                  {section.lessons?.map((lesson: any, lessonIndex: number) => (
                    <div
                      key={lessonIndex}
                      className="flex items-center justify-between py-2 px-2 hover:bg-muted/40 rounded-md transition-colors cursor-pointer group"
                    >
                      <div className="flex gap-3 items-center">
                        <div className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]",
                          lessonIndex < sectionState.lessonsDone
                            ? "bg-primary/10 text-primary"
                            : "border"
                        )}>
                          {lessonIndex < sectionState.lessonsDone ? <CheckCircle2 className="h-3 w-3" /> : lessonIndex + 1}
                        </div>
                        <span className="text-sm font-medium">{lesson.title}</span>
                      </div>
                      <Play className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}

                  {/* Add a test after specific sections, but only if lessons completed */}
                  {sectionIndex === 0 && (
                    <div
                      className={cn(
                        "flex items-center justify-between py-2 px-2 rounded-md",
                        "mt-2 transition-colors",
                        sectionState.lessonsDone === sectionState.totalLessons
                          ? "hover:bg-muted/40 cursor-pointer group"
                          : "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex gap-3 items-center">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-[10px]">
                          <FileQuestion className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Test: HTML Fundamentals</span>
                          {sectionState.lessonsDone < sectionState.totalLessons && (
                            <span className="text-xs text-muted-foreground">
                              Complete all lessons to unlock
                            </span>
                          )}
                        </div>
                      </div>

                      {sectionState.lessonsDone === sectionState.totalLessons && (
                        <div className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Available
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add an assignment to the second section, but only if lessons completed */}
                  {sectionIndex === 1 && (
                    <div
                      className={cn(
                        "flex items-center justify-between py-2 px-2 rounded-md",
                        "mt-2 transition-colors",
                        sectionState.lessonsDone === sectionState.totalLessons
                          ? "hover:bg-muted/40 cursor-pointer group"
                          : "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex gap-3 items-center">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-[10px]">
                          <Code className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Assignment: Create a CSS Layout</span>
                          {sectionState.lessonsDone < sectionState.totalLessons && (
                            <span className="text-xs text-muted-foreground">
                              Complete all lessons to unlock
                            </span>
                          )}
                        </div>
                      </div>

                      {sectionState.lessonsDone === sectionState.totalLessons && (
                        <div className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* Final project section - locked until all sections are complete */}
        <Collapsible className="border rounded-lg overflow-hidden">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/40 transition-colors">
            <div className="flex items-start gap-3 text-left">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/60 text-xs font-semibold">
                <Lock className="h-3 w-3" />
              </div>
              <div>
                <h3 className="font-medium">Final Project</h3>
                <p className="text-sm text-muted-foreground">
                  Build a complete portfolio website
                  <span className="block text-xs mt-1">Complete all sections to unlock</span>
                </p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t p-4">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Lock className="h-8 w-8 text-muted-foreground mb-2" />
                <h4 className="text-sm font-medium">Project is locked</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete all lessons, tests, and assignments first
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    )
  }

  if (tab === "resources") {
    // Collect all resources from all sections and lessons
    const allResources: any[] = []

    course.sections?.forEach((section: any) => {
      section.lessons?.forEach((lesson: any) => {
        if (lesson.resources?.length) {
          lesson.resources.forEach((resource: any) => {
            allResources.push({
              ...resource,
              lesson: lesson.title,
              section: section.title,
            })
          })
        }
      })
    })

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Learning Resources</h3>
        <p className="text-muted-foreground">Additional materials to support your learning</p>
        <div className="space-y-3 mt-4">
          {allResources.length === 0 ? (
            <p className="text-muted-foreground">No resources available for this course.</p>
          ) : (
            allResources.map((resource, index) => (
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
    )
  }

  return null
}

// Simple ProgressBar component
function ProgressBar({ value = 0 }: { value?: number }) {
  return (
    <div className="w-full max-w-xs bg-secondary rounded-full h-2.5 dark:bg-secondary/20">
      <div
        className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  )
}

export function CoursePanel({ className }: CoursePanelProps) {
  const {
    courseGenerating,
    progressMessage,
    generationProgress,
    courseError,
    cancelGeneration,
    courseData: contextCourseData
  } = useAnalysis()

  // Always use mock data instead of context data
  const courseData = mockCourseData

  // Track if panel should be visible
  const [isVisible, setIsVisible] = React.useState(false)

  // Current tab state
  const [activeTab, setActiveTab] = React.useState("overview")

  // Track if summary section is visible
  const [isSummaryVisible, setIsSummaryVisible] = React.useState(true)

  // Reference to the summary section
  const summaryRef = useRef<HTMLDivElement>(null)

  // Show panel when course data exists or is generating
  React.useEffect(() => {
    if (courseGenerating || courseData) {
      setIsVisible(true)
    }
  }, [courseGenerating, courseData])

  // Set up intersection observer to track when summary section is out of view
  React.useEffect(() => {
    if (!summaryRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log("Summary visibility changed:", entry.isIntersecting);
        setIsSummaryVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1, // Consider visible if at least 10% is visible
        rootMargin: "-10px 0px 0px 0px" // Trigger slightly before it's fully out of view
      }
    );

    observer.observe(summaryRef.current);

    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    return null
  }

  // Use a fixed video ID for the course preview
  const coursePreviewVideoId = "W6NZfCO5SIk"

  return (
    <div
      className={cn(
        "bg-background flex flex-col w-full sm:w-full h-full overflow-hidden transition-all duration-300 ease-in-out",
        className
      )}
    >
      {/* Loading state */}
      {courseGenerating && (
        <div className="flex flex-col flex-1 items-center justify-center p-6 overflow-auto hover:scrollbar scrollbar-thin">
          <ProgressBar value={generationProgress} />
          <p className="text-center mt-4 text-muted-foreground">
            {progressMessage || "Generating course content..."}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={cancelGeneration}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Error state */}
      {courseError && !courseGenerating && (
        <div className="flex flex-col flex-1 items-center justify-center p-6 overflow-auto hover:scrollbar scrollbar-thin">
          <p className="text-center text-destructive">
            {courseError}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setIsVisible(false)}
          >
            Close
          </Button>
        </div>
      )}

      {/* Course content with single scrollable container */}
      {courseData && !courseGenerating && !courseError && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* This is now the main scroll container for everything */}
          <div className="flex-1 overflow-y-auto hover:scrollbar scrollbar-thin">
            {/* Course preview and summary section */}
            <div className="p-4 border-b" ref={summaryRef}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <YouTubeEmbed
                  videoId={coursePreviewVideoId}
                  title="Course Preview"
                  enablePiP
                />
                <CourseSummary course={courseData} />
              </div>
            </div>

            {/* Course tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-col"
            >
              {/* Sticky tab navigation that stays at the top when scrolling */}
              <div className="sticky top-0 z-10 bg-background border-b">
                <div className="flex items-center justify-between pr-2">
                  <TabsList className="bg-transparent h-10 p-0">
                    <TabsTrigger
                      value="overview"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none bg-transparent px-4 h-10"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="content"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none bg-transparent px-4 h-10"
                    >
                      Content
                    </TabsTrigger>
                    <TabsTrigger
                      value="resources"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none bg-transparent px-4 h-10"
                    >
                      Resources
                    </TabsTrigger>
                  </TabsList>

                  {/* Show action buttons in the header when summary is not visible */}
                  {!isSummaryVisible && (
                    <div className="px-2">
                      <ActionButtons className="sm" />
                    </div>
                  )}
                </div>
              </div>

              {/* Tab contents without their own scrollbars */}
              <TabsContent
                value="overview"
                className="px-4 py-3 mt-0 border-none"
              >
                <TabContent tab="overview" course={courseData} />
              </TabsContent>

              <TabsContent
                value="content"
                className="px-4 py-3 mt-0 border-none"
              >
                <TabContent tab="content" course={courseData} />
              </TabsContent>

              <TabsContent
                value="resources"
                className="px-4 py-3 mt-0 border-none"
              >
                <TabContent tab="resources" course={courseData} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  )
}