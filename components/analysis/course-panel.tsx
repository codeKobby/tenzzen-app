"use client"

import React, { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useAnalysis } from "@/hooks/use-analysis-context"
// Remove the import for mockCourseData
// import { mockCourseData } from "@/lib/mock/course-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "../ui/button"
import {
  X, Play, Bookmark, GraduationCap, Clock, BookOpen, FileText, TestTube2,
  XCircle, Tag, ChevronDown, Lock, FileQuestion, Code, Briefcase, CheckCircle2,
  ArrowUp, Loader2
} from "lucide-react"
import { YouTubeEmbed } from "@/components/youtube-embed"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { safelyEnrollInCourse } from "@/lib/api-wrapper"
import { mockSources } from "@/lib/mock/sources"

// Mock sources data for the course
const mockSources = [
  {
    name: "YouTube",
    type: "video",
    avatar: "https://www.youtube.com/favicon.ico",
    url: "https://youtube.com"
  },
  {
    name: "MDN Web Docs",
    type: "documentation",
    avatar: "https://developer.mozilla.org/favicon-48x48.png",
    url: "https://developer.mozilla.org"
  },
  {
    name: "W3Schools",
    type: "tutorial",
    avatar: "https://www.w3schools.com/favicon.ico",
    url: "https://www.w3schools.com"
  },
  {
    name: "CSS Tricks",
    type: "blog",
    avatar: "https://css-tricks.com/favicon.ico",
    url: "https://css-tricks.com"
  }
];

// Update mock course data to include all required fields for UI
function enrichCourseData(courseData: any) {
  // Make sure the course has all required fields for database and UI
  return {
    ...courseData,
    metadata: {
      ...courseData.metadata,
      category: courseData.metadata?.category || "Programming",
      difficulty: courseData.metadata?.difficulty || "Beginner",
      duration: courseData.metadata?.duration || "6 weeks",
      sources: mockSources
    },
    // Make sure each section has the required fields
    sections: courseData.sections?.map((section: any, sectionIndex: number) => ({
      ...section,
      id: section.id || `section-${sectionIndex + 1}`,
      lessons: section.lessons?.map((lesson: any, lessonIndex: number) => ({
        ...lesson,
        id: lesson.id || `lesson-${sectionIndex + 1}-${lessonIndex + 1}`,
      }))
    })) || []
  };
}

// Add a local mock data structure to replace the imported one
const mockCourseData = {
  title: "Introduction to Web Development",
  description: "Learn the fundamentals of web development including HTML, CSS, and JavaScript",
  videoId: "W6NZfCO5SIk",
  image: "https://i.ytimg.com/vi/W6NZfCO5SIk/maxresdefault.jpg",
  metadata: {
    title: "Introduction to Web Development",
    description: "Learn the fundamentals of web development including HTML, CSS, and JavaScript",
    objectives: [
      "Understand HTML structure and semantics",
      "Learn CSS styling techniques",
      "Build interactive elements with JavaScript"
    ],
    prerequisites: ["Basic computer skills", "No prior coding experience required"],
    duration: "3 hours",
    category: "Programming",
    difficulty: "Beginner"
  },
  sections: [
    {
      id: "section-1",
      title: "Introduction",
      description: "Getting started with web development",
      lessons: [
        {
          id: "lesson-1-1",
          title: "Web Development Overview",
          description: "Introduction to web development concepts",
          duration: "15 minutes",
          keyPoints: ["Web development basics", "How websites work"]
        },
        {
          id: "lesson-1-2",
          title: "Setting Up Your Environment",
          description: "Configuring your development tools",
          duration: "10 minutes",
          keyPoints: ["Code editors", "Browser tools"]
        }
      ],
      duration: "25 minutes"
    },
    {
      id: "section-2",
      title: "HTML Fundamentals",
      description: "Learn the building blocks of web pages",
      lessons: [
        {
          id: "lesson-2-1",
          title: "HTML Basics",
          description: "Understanding HTML structure",
          duration: "20 minutes",
          keyPoints: ["HTML tags", "Document structure"]
        },
        {
          id: "lesson-2-2",
          title: "Common HTML Elements",
          description: "Working with text, links, and images",
          duration: "25 minutes",
          keyPoints: ["Text formatting", "Links and images"]
        }
      ],
      duration: "45 minutes"
    }
  ],
  assessments: [
    {
      type: "quiz",
      title: "HTML Fundamentals Quiz",
      description: "Test your understanding of HTML basics",
      placeholder: true
    }
  ]
};

// Action Buttons component that can be rendered in multiple places
function ActionButtons({ className }: { className?: string }) {
  const router = useRouter()
  const isSmall = className?.includes("sm")
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const { courseData } = useAnalysis();

  // Get the user ID from Clerk
  const { userId } = useAuth();

  // Handle enrollment - using localStorage fallback
  const handleEnroll = async () => {
    try {
      // Start loading state
      setIsEnrolling(true)

      // Use course data from context or fallback to mock data
      const courseToEnroll = courseData || mockCourseData;

      // Make sure we have a user ID
      if (!userId) {
        toast.error("Please sign in to enroll in courses", {
          description: "You need to be logged in to enroll in courses"
        });
        setIsEnrolling(false);
        return;
      }

      // Enrich course data to ensure it has all required fields
      const enrichedCourse = enrichCourseData(courseToEnroll);

      // Prepare course data for enrollment
      const courseDataForEnrollment = {
        title: enrichedCourse.title,
        description: enrichedCourse.description || "",
        videoId: enrichedCourse.videoId || "W6NZfCO5SIk", // default if not available
        thumbnail: enrichedCourse.image || `/course-thumbnails/course-${Math.floor(Math.random() * 5) + 1}.jpg`,
        metadata: {
          difficulty: enrichedCourse.metadata?.difficulty,
          duration: enrichedCourse.metadata?.duration,
          prerequisites: enrichedCourse.metadata?.prerequisites || [],
          objectives: enrichedCourse.metadata?.objectives || [],
          category: enrichedCourse.metadata?.category || "Programming",
          sources: mockSources
        },
        sections: enrichedCourse.sections
      };

      // Use the safe enrollment wrapper
      const result = await safelyEnrollInCourse({
        courseData: courseDataForEnrollment,
        userId,
        useConvex: false // Force localStorage in development for now
      });

      // Success notification
      toast.success(result.newEnrollment
        ? "Successfully enrolled in course"
        : "Course access restored", {
        description: "You can now access all course materials"
      });

      // Navigate to courses page
      router.push("/courses");
    } catch (error) {
      console.error("Enrollment error:", error);
      // Error notification
      toast.error("Failed to enroll in course", {
        description: "Please try again later"
      });

      // Reset loading state
      setIsEnrolling(false);
    }
  };

  return (
    <>
      <div className={cn("flex gap-2", className)}>
        <Button
          className="gap-1.5"
          size={isSmall ? "sm" : "default"}
          onClick={handleEnroll}
          disabled={isEnrolling}
        >
          {isEnrolling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GraduationCap className="h-4 w-4" />
          )}
          {isSmall ? "" : isEnrolling ? "Enrolling..." : "Enroll Now"}
        </Button>
        <Button
          variant="outline"
          className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          size={isSmall ? "sm" : "default"}
          onClick={() => setShowCancelConfirm(true)}
        >
          <XCircle className="h-4 w-4" />
          {isSmall ? "" : "Cancel"}
        </Button>
      </div>

      {/* Cancel confirmation modal */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent className="rounded-lg border">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel course generation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will discard the current course. You'll need to generate it again if you want to access it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Course</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                // Return to video analysis
                toast.info("Course generation cancelled")
                // We could add the actual logic to discard the course here
                router.push("/analysis")
              }}
            >
              Discard Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Updated Course Summary section
function CourseSummary({ course }: { course: any }) {
  // Calculate total lessons count
  const totalLessons = course.sections?.reduce(
    (acc: number, section: any) => acc + (section.lessons?.length || 0),
    0
  ) || 0;

  // Use mock data for assignments and tests 
  const assignmentsCount = 6; // Mock data
  const testsCount = 3; // Mock data

  // Define course category and subcategory/tag
  const courseCategory = "Programming";
  const courseTag = "Web Development";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-lg">About this course</h3>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-3">
          {course.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Main Course category badge */}
        <div className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-800 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-900/30 dark:text-indigo-200 dark:ring-indigo-700/30">
          {courseCategory}
        </div>

        {/* Course tag/subcategory badge */}
        <div className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 dark:bg-purple-900/30 dark:text-purple-200 dark:ring-purple-700/30 gap-1">
          <Tag className="h-3 w-3" />
          {courseTag}
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

      {/* Sources section with overlapping avatars and tooltips */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Sources</span>
          <span className="text-xs text-muted-foreground">{mockSources.length} total</span>
        </div>

        <TooltipProvider delayDuration={300}>
          <div className="flex -space-x-2">
            {mockSources.map((source, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-110 hover:z-10"
                  >
                    <Avatar className={cn(
                      "h-7 w-7 border-2 border-background",
                      index > 3 && "opacity-80"
                    )}>
                      <AvatarImage src={source.avatar} alt={source.name} />
                      <AvatarFallback className="text-[10px] font-medium bg-primary/10 text-primary">
                        {source.name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </a>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <div className="font-medium">{source.name}</div>
                  <div className="text-muted-foreground capitalize">{source.type}</div>
                </TooltipContent>
              </Tooltip>
            ))}

            {mockSources.length > 4 && (
              <Avatar className="h-7 w-7 border-2 border-background bg-muted">
                <AvatarFallback>+{mockSources.length - 4}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </TooltipProvider>
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
    // Type the mock completion state properly
    interface SectionCompletionState {
      lessonsDone: number;
      totalLessons: number;
    }

    const mockCompletionState: Record<number, SectionCompletionState> = {
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
    // Generate realistic mock video resources with proper typing
    const videoResources: CourseResource[] = [
      {
        title: "MDN Web Docs - HTML Documentation",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
        description: "Comprehensive HTML reference and guides",
        sourceType: "official"
      },
      {
        title: "CSS Tricks - A Complete Guide to Flexbox",
        url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
        description: "Visual guide to understanding the Flexbox layout model",
        sourceType: "official"
      },
      {
        title: "JavaScript.info - The Modern JavaScript Tutorial",
        url: "https://javascript.info/",
        description: "From basics to advanced topics with simple explanations",
        sourceType: "official"
      }
    ];

    // Collect all resources from course sections and lessons
    const courseResources: CourseResource[] = [];

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
    })

    // Combine resources with video resources first
    const allResources = [...videoResources, ...courseResources];

    return (
      <div className="space-y-6">
        {/* Video source resources section */}
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

        {/* Course supplementary resources */}
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

        {/* Practice resources */}
        <div>
          <h3 className="text-lg font-medium">Practice Resources</h3>
          <p className="text-muted-foreground mb-4">Interactive platforms to practice your skills</p>
          <div className="space-y-3">
            <div className="border rounded-lg p-3">
              <a
                href="https://codepen.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                CodePen - Front-end Development Playground
              </a>
              <p className="text-sm text-muted-foreground mt-1">
                Create, test, and share HTML, CSS, and JavaScript code snippets
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <a
                href="https://www.freecodecamp.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                freeCodeCamp - Web Development Curriculum
              </a>
              <p className="text-sm text-muted-foreground mt-1">
                Interactive coding challenges and projects with certification
              </p>
            </div>
          </div>
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

// Define CourseResource interface to fix TypeScript errors
interface CourseResource {
  title: string;
  url: string;
  description?: string;
  sourceType?: string;
  lesson?: string;
  section?: string;
}

// Define CoursePanelProps to fix TypeScript errors
interface CoursePanelProps {
  className?: string;
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

  // Use context data if available, otherwise use mock data
  const courseData = contextCourseData || mockCourseData

  // Track if panel should be visible
  const [isVisible, setIsVisible] = React.useState(false)

  // Current tab state
  const [activeTab, setActiveTab] = React.useState("overview")

  // Track if summary section is visible
  const [isSummaryVisible, setIsSummaryVisible] = React.useState(true)

  // Track scroll position for the scroll-to-top button
  const [showScrollTop, setShowScrollTop] = React.useState(false)

  // References to DOM elements
  const summaryRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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
        setIsSummaryVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: "-10px 0px 0px 0px"
      }
    );

    observer.observe(summaryRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle scroll events to show/hide the scroll-to-top button
  const handleScroll = React.useCallback(() => {
    if (scrollContainerRef.current) {
      const shouldShow = scrollContainerRef.current.scrollTop > 300;
      setShowScrollTop(shouldShow);
    }
  }, []);

  // Add scroll event listener
  React.useEffect(() => {
    const scrollElement = scrollContainerRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // Function to scroll to top
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  if (!isVisible) {
    return null
  }

  // Use a fixed video ID for the course preview
  const coursePreviewVideoId = "W6NZfCO5SIk"

  return (
    <div
      className={cn(
        "bg-background flex flex-col w-full sm:w-full h-full overflow-hidden transition-all duration-300 ease-in-out relative",
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
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto hover:scrollbar scrollbar-thin"
            onScroll={handleScroll}
          >
            {/* Course preview and summary section */}
            <div className="p-4 border-b" ref={summaryRef}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <YouTubeEmbed
                  videoId={courseData.videoId || "W6NZfCO5SIk"}
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

          {/* Scroll to top button - ensure it's visible and on top of content */}
          {showScrollTop && (
            <Button
              variant="secondary"
              size="icon"
              onClick={scrollToTop}
              className="fixed bottom-6 right-6 h-10 w-10 rounded-full shadow-lg z-50 animate-in fade-in"
              aria-label="Scroll to top"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}