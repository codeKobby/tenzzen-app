"use client"

import React, { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useAnalysis } from "@/hooks/use-analysis-context"
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
import { toast } from "@/components/custom-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { safelyEnrollInCourse } from "@/lib/api-wrapper"

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

      // Make sure we have course data and a user ID
      if (!courseData) {
        toast.error("No course data available", {
          description: "Please generate a course first"
        });
        setIsEnrolling(false);
        return;
      }

      if (!userId) {
        toast.error("Please sign in to enroll in courses", {
          description: "You need to be logged in to enroll in courses"
        });
        setIsEnrolling(false);
        return;
      }

      // Prepare course data for enrollment - using actual AI-generated content
      const courseDataForEnrollment = {
        title: courseData.title,
        description: courseData.description || "",
        videoId: courseData.videoId || "",
        thumbnail: courseData.image || `/course-thumbnails/course-${Math.floor(Math.random() * 5) + 1}.jpg`,
        metadata: {
          difficulty: courseData.metadata?.difficulty,
          duration: courseData.metadata?.duration,
          prerequisites: courseData.metadata?.prerequisites || [],
          objectives: courseData.metadata?.objectives || [],
          category: courseData.metadata?.category || "General",
          sources: courseData.metadata?.sources || []
        },
        sections: courseData.sections
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

// Updated Course Summary section to use AI-generated content
function CourseSummary({ course }: { course: any }) {
  // Calculate total lessons count from actual course data
  const totalLessons = course.sections?.reduce(
    (acc: number, section: any) => acc + (section.lessons?.length || 0),
    0
  ) || 0;

  // Calculate assessments count from the actual course data
  const assessmentsCount = course.assessments?.length || 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-lg">About this course</h3>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-3">
          {course.description || "Transform this video into a structured learning experience."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Category badge - use actual course category if available */}
        <div className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-800 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-900/30 dark:text-indigo-200 dark:ring-indigo-700/30">
          {course.metadata?.category || "General"}
        </div>

        {/* Difficulty badge - use actual course difficulty */}
        {course.metadata?.difficulty && (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-200 dark:ring-blue-700/30">
            {course.metadata.difficulty}
          </span>
        )}

        {/* Duration badge - using actual course duration */}
        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/30 dark:text-green-200 dark:ring-green-700/30 gap-1">
          <Clock className="h-3 w-3" />
          {course.metadata?.duration || "Variable duration"}
        </span>
      </div>

      {/* Course stats using actual numbers */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{totalLessons} Lesson{totalLessons !== 1 ? 's' : ''}</span>
        </div>
        {assessmentsCount > 0 && (
          <div className="flex items-center gap-1">
            <TestTube2 className="h-3.5 w-3.5" />
            <span>{assessmentsCount} Assessment{assessmentsCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Sources section with actual sources from AI */}
      {course.metadata?.sources && course.metadata.sources.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sources</span>
            <span className="text-xs text-muted-foreground">{course.metadata.sources.length} total</span>
          </div>

          <TooltipProvider delayDuration={300}>
            <div className="flex -space-x-2">
              {course.metadata.sources.slice(0, 5).map((source: any, index: number) => {
                // Generate avatar fallback from source title or type
                const avatarText = source.title ? source.title.substring(0, 2).toUpperCase() : source.type?.substring(0, 2).toUpperCase() || "SRC";

                // Create a simple color mapping for source types
                const getColorForType = (type?: string) => {
                  const colorMap: Record<string, string> = {
                    'video': 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                    'documentation': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                    'tutorial': 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                    'article': 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
                    'code': 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
                    'blog': 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
                  };
                  return colorMap[type?.toLowerCase() || ''] || 'bg-primary/10 text-primary';
                };

                return (
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
                          index > 4 && "opacity-80"
                        )}>
                          <AvatarFallback className={cn("text-[10px] font-medium", getColorForType(source.type))}>
                            {avatarText}
                          </AvatarFallback>
                        </Avatar>
                      </a>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      <div className="font-medium">{source.title}</div>
                      <div className="text-muted-foreground capitalize">{source.type || "Resource"}</div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {/* Show +X more if there are additional sources */}
              {course.metadata.sources.length > 5 && (
                <Avatar className="h-7 w-7 border-2 border-background bg-muted">
                  <AvatarFallback>+{course.metadata.sources.length - 5}</AvatarFallback>
                </Avatar>
              )}
            </div>
          </TooltipProvider>
        </div>
      )}

      <ActionButtons className="flex-1 mt-2" />
    </div>
  )
}

// Enhanced TabContent component to use AI-generated content
function TabContent({ tab, course }: { tab: string; course: any }) {
  if (tab === "overview") {
    return (
      <div className="space-y-6">
        {/* About this course - using actual course description and AI-generated overview */}
        <div>
          <h3 className="text-lg font-medium">About this course</h3>
          <p className="text-muted-foreground mt-1">
            {course.description}
          </p>
          {course.metadata?.overviewText && (
            <p className="text-muted-foreground mt-3">
              {course.metadata.overviewText}
            </p>
          )}
        </div>

        {/* What you'll learn - Skills and knowledge section with AI-generated objectives */}
        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-lg font-medium mb-3">What you'll learn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {course.metadata?.objectives && course.metadata.objectives.length > 0 ? (
              course.metadata.objectives.map((objective: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                  <span className="text-sm">{objective}</span>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-500" />
                <span className="text-sm">Understand key concepts from the video content</span>
              </div>
            )}
          </div>
        </div>

        {/* Learning objectives and Prerequisites side by side - using AI content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learning objectives - Left side on desktop */}
          {course.metadata?.objectives && course.metadata.objectives.length > 0 && (
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
          {course.metadata?.prerequisites && course.metadata.prerequisites.length > 0 && (
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

        {/* Career outcomes section - show only if difficulty is provided */}
        {course.metadata?.difficulty && (
          <div>
            <h3 className="text-lg font-medium">Career outcomes</h3>
            <p className="text-muted-foreground mt-1">
              Skills you'll develop with this {course.metadata.difficulty.toLowerCase()} level course:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {generateCareerOutcomes(course.metadata?.category || 'General', course.metadata.difficulty).map(
                (outcome, index) => (
                  <div key={index} className="border rounded-md p-3">
                    <h4 className="font-medium text-sm">{outcome.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {outcome.description}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (tab === "content") {
    // Simple mock completion state to show UI capabilities
    // In a real scenario, this would come from the user's progress data
    const mockCompletionState: Record<number, { lessonsDone: number; totalLessons: number }> = {};

    // Initialize the mockCompletionState based on actual course sections
    if (course.sections) {
      course.sections.forEach((section: any, idx: number) => {
        mockCompletionState[idx] = {
          lessonsDone: 0,
          totalLessons: section.lessons?.length || 0
        };
      });
    }

    return (
      <div className="space-y-6">
        {/* Collapsible course sections using actual AI-generated sections */}
        {course.sections?.map((section: any, sectionIndex: number) => {
          const sectionState = mockCompletionState[sectionIndex] ||
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
                  {/* Regular lessons from AI-generated data */}
                  {section.lessons?.map((lesson: any, lessonIndex: number) => (
                    <div
                      key={lessonIndex}
                      className="flex items-center justify-between py-2 px-2 hover:bg-muted/40 rounded-md transition-colors cursor-pointer group"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]">
                          {lessonIndex + 1}
                        </div>
                        <span className="text-sm font-medium">{lesson.title}</span>
                      </div>
                      <Play className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}

                  {/* Add assessments for this section if they exist */}
                  {course.assessments?.filter((assessment: any) => assessment.sectionId === section.id)
                    .map((assessment: any, index: number) => (
                      <div
                        key={`assessment-${index}`}
                        className="flex items-center justify-between py-2 px-2 mt-2 hover:bg-muted/40 rounded-md transition-colors cursor-pointer group"
                      >
                        <div className="flex gap-3 items-center">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-[10px]">
                            <FileQuestion className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{assessment.title}</span>
                          </div>
                        </div>
                        <div className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Available
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    )
  }

  if (tab === "resources") {
    // Get actual resources from the course metadata
    const resources = course.metadata?.sources || [];

    return (
      <div className="space-y-6">
        {/* Resources section - using AI-generated resources */}
        <div>
          <h3 className="text-lg font-medium">Learning Resources</h3>
          <p className="text-muted-foreground mb-4">
            Additional materials to support your learning journey
          </p>
          <div className="space-y-3">
            {resources.length === 0 ? (
              <p className="text-muted-foreground">No additional resources available for this course.</p>
            ) : (
              resources.map((resource: any, index: number) => (
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
                    <span className={cn(
                      "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
                      resource.type === 'documentation' && "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
                      resource.type === 'tutorial' && "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200",
                      resource.type === 'video' && "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200",
                      resource.type === 'article' && "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200",
                      resource.type === 'blog' && "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200",
                      resource.type === 'code' && "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
                    )}>
                      {resource.type ? resource.type.charAt(0).toUpperCase() + resource.type.slice(1) : 'Resource'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}

/**
 * Generate career outcomes based on course category and difficulty
 */
function generateCareerOutcomes(category: string, difficulty: string): Array<{ title: string; description: string }> {
  // Default outcomes that apply to most categories
  const defaultOutcomes = [
    {
      title: "Problem Solving",
      description: "Develop analytical thinking and problem-solving skills applicable across domains"
    },
    {
      title: "Technical Knowledge",
      description: "Build expertise in specialized tools, methodologies and practices"
    }
  ];

  // Category-specific outcomes
  const categoryOutcomes: Record<string, Array<{ title: string; description: string }>> = {
    'Programming': [
      {
        title: "Software Development",
        description: "Build and implement software solutions across various platforms"
      },
      {
        title: "Code Optimization",
        description: "Write efficient, maintainable code following best practices"
      }
    ],
    'Design': [
      {
        title: "UI/UX Design",
        description: "Create intuitive interfaces that enhance user experience"
      },
      {
        title: "Visual Communication",
        description: "Effectively communicate ideas through visual elements"
      }
    ],
    'Business': [
      {
        title: "Strategic Planning",
        description: "Develop and implement business strategies for growth"
      },
      {
        title: "Market Analysis",
        description: "Analyze market trends and identify opportunities"
      }
    ],
    'Data Science': [
      {
        title: "Data Analysis",
        description: "Extract meaningful insights from complex datasets"
      },
      {
        title: "Predictive Modeling",
        description: "Build models that forecast trends and behaviors"
      }
    ]
  };

  // Select appropriate outcomes
  let outcomes = [...defaultOutcomes];

  // Add category-specific outcomes if available
  const specificOutcomes = categoryOutcomes[category];
  if (specificOutcomes) {
    outcomes = [...specificOutcomes, ...defaultOutcomes];
  }

  // Limit to 4 items
  return outcomes.slice(0, 4);
}

// Define CourseResource interface to fix TypeScript errors
interface CourseResource {
  title: string;
  url: string;
  description?: string;
  type?: string;
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
    courseData
  } = useAnalysis()

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
          <div className="w-full max-w-md bg-secondary rounded-full h-2.5 dark:bg-secondary/20">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${Math.min(Math.max(generationProgress, 0), 100)}%` }}
            />
          </div>
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
                  videoId={courseData.videoId || ""}
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