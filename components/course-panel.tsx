"use client"

import React, { useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useAnalysis } from "@/hooks/use-analysis-context"
import { mockCourseData } from "@/lib/mock/course-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "./ui/button"
import {
    X, Play, Bookmark, GraduationCap, Clock, BookOpen, FileText, TestTube2,
    XCircle, Tag, ChevronDown, Lock, FileQuestion, Code, Briefcase, CheckCircle2,
    ArrowUp
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

// TypeScript interface for course resources
interface CourseResource {
    title: string;
    url: string;
    description?: string;
    type?: string;
    lesson?: string;
    section?: string;
}

// --- Helper to normalize AI output for resources and metadata ---
function normalizeCourseData(raw: any) {
    // Accepts both mock and AI output, returns a normalized object for the UI
    const metadata = {
        category: raw.category || raw.metadata?.category || "General",
        tags: raw.tags || raw.metadata?.tags || [],
        difficulty: raw.difficulty || raw.metadata?.difficulty || "",
        prerequisites: raw.prerequisites || raw.metadata?.prerequisites || [],
        objectives: raw.objectives || raw.metadata?.objectives || [],
        overviewText: raw.overviewText || raw.metadata?.overviewText || "",
        sources: raw.resources || raw.metadata?.sources || [],
        duration: raw.duration || raw.metadata?.duration || "Variable duration"
    };
    // Sections and project
    const sections = raw.sections || [];
    // Project assessment (AI output may use project: { assessment: 'project' } or just a section with assessment)
    let project = raw.project || null;
    if (!project && Array.isArray(sections)) {
        const lastSection = sections[sections.length - 1];
        if (lastSection && lastSection.assessment === 'project') {
            project = { assessment: 'project' };
        }
    }
    return {
        ...raw,
        metadata,
        sections,
        project
    };
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
    const courseCategory = course.metadata.category;
    const courseTags = course.metadata.tags;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h3 className="font-semibold text-lg">About this course</h3>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-3">
                    {course.metadata.overviewText || course.description}
                </p>
            </div>

            <div>
                <h4 className="font-semibold text-md">Category</h4>
                <p className="text-sm">{courseCategory}</p>
            </div>

            <div>
                <h4 className="font-semibold text-md">Tags</h4>
                <p className="text-sm">{courseTags.join(", ")}</p>
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
                <div>
                    <h4 className="font-semibold text-md">Difficulty</h4>
                    <p className="text-sm">{course.metadata.difficulty}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-md">Prerequisites</h4>
                    <p className="text-sm">{course.metadata.prerequisites.join(", ")}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-md">Objectives</h4>
                    <ul className="list-disc pl-5">
                        {course.metadata.objectives.map((objective: string, index: number) => (
                            <li key={index} className="text-sm">{objective}</li>
                        ))}
                    </ul>
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
                {course.project && (
                    <div>
                        <h4 className="font-semibold text-md">Project Assessment</h4>
                        <p className="text-sm">This course includes a project assessment.</p>
                    </div>
                )}
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
                type: "official"
            },
            // ...other resources...
        ];

        // Collect all resources from course sections and lessons
        const courseResources: CourseResource[] = course.metadata.sources;

        return (
            <div className="space-y-6">
                {courseResources.map((resource, index) => (
                    <div key={index}>
                        <h4 className="font-semibold text-md">{resource.title}</h4>
                        <p className="text-sm">{resource.description}</p>
                        <a href={resource.url} className="text-blue-500 text-sm" target="_blank" rel="noopener noreferrer">
                            {resource.url}
                        </a>
                    </div>
                ))}
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

    // Use normalized AI or mock data
    const courseData = normalizeCourseData(contextCourseData || mockCourseData);

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

    // Handle scrolling within the course panel section
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            setShowScrollTop(scrollContainerRef.current.scrollTop > 300)
        }
    }

    // Scroll to top function for the course panel
    const scrollToTop = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            })
        }
    }

    // Add scroll event listener to the course panel container
    React.useEffect(() => {
        const currentRef = scrollContainerRef.current
        if (currentRef) {
            currentRef.addEventListener('scroll', handleScroll)
            return () => currentRef.removeEventListener('scroll', handleScroll)
        }
    }, [])

    if (!isVisible) {
        return null
    }

    // Use a fixed video ID for the course preview
    const coursePreviewVideoId = "W6NZfCO5SIk"

    return (
        <div className={cn(
            "bg-background flex flex-col w-full sm:w-full h-full overflow-hidden transition-all duration-300 ease-in-out relative",
            className
        )}>
            {/* Course content with single scrollable container */}
            {courseData && !courseGenerating && !courseError && (
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div
                        ref={scrollContainerRef}
                        className="flex-1 overflow-y-auto hover:scrollbar scrollbar-thin"
                        onScroll={handleScroll}
                    >
                        <div className="p-4 border-b" ref={summaryRef}>
                            <CourseSummary course={courseData} />
                        </div>

                        <Tabs
                            value={activeTab}
                            onValueChange={setActiveTab}
                            className="flex flex-col"
                        >
                            <TabsList>
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="content">Content</TabsTrigger>
                                <TabsTrigger value="resources">Resources</TabsTrigger>
                            </TabsList>
                            <TabsContent value="overview">
                                <TabContent tab="overview" course={courseData} />
                            </TabsContent>
                            <TabsContent value="content">
                                <TabContent tab="content" course={courseData} />
                            </TabsContent>
                            <TabsContent value="resources">
                                <TabContent tab="resources" course={courseData} />
                            </TabsContent>
                        </Tabs>
                    </div>

                    {showScrollTop && (
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={scrollToTop}
                        >
                            <ArrowUp className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
