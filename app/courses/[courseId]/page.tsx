"use client"

import { useParams, usePathname } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useMutation } from "convex/react"
import { toast } from "sonner"
import {
  BookOpen,
  Bot,
  Camera,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileQuestion,
  FileText,
  Lock,
  Sparkles,
  StickyNote,
  Trophy,
  Maximize2,
  Minimize2,
} from "lucide-react"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useRouter } from "@/hooks/use-router-with-loader"
import { useCourseProgressUpdate } from "@/hooks/use-course-progress-update"
import {
  useNormalizedCourse,
  type NormalizedCourse,
  type NormalizedLesson,
} from "@/hooks/use-normalized-course"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { validateCourseId, cn } from "@/lib/utils"
import { useBreadcrumb } from "@/contexts/breadcrumb-context"

import { CourseContent } from "./components/course-content"
import { CoursePlayer } from "./components/course-player"
import { CourseResources } from "./components/course-resources"
import { TutorChatSidebar } from "./components/tutor-chat-sidebar"
import { SeekConfirmationModal } from "@/components/seek-confirmation-modal"

export default function CoursePage() {
  const params = useParams()
  const courseId = typeof params.courseId === "string" ? params.courseId : ""
  const pathname = usePathname()
  const router = useRouter()
  const { userId, isSignedIn } = useAuth()
  const { setCourseTitleForPath } = useBreadcrumb()
  const enrollMutation = useMutation(api.enrollments.enrollInCourse)
  const playerRef = useRef<HTMLDivElement>(null)

  const [enrolling, setEnrolling] = useState(false)
  const [sectionIndex, setSectionIndex] = useState(0)
  const [lessonIndex, setLessonIndex] = useState(0)
  const [currentQuiz, setCurrentQuiz] = useState<any>(null)
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  const [seekModalOpen, setSeekModalOpen] = useState(false)
  const [targetSeekLesson, setTargetSeekLesson] = useState<{ sectionIdx: number; lessonIdx: number; title: string; direction: 'forward' | 'backward' } | null>(null)
  const [isFocusMode, setIsFocusMode] = useState(false)

  const seekResolveRef = useRef<((value: boolean) => void) | null>(null)

  useEffect(() => {
    const validation = validateCourseId(courseId)
    if (!validation.isValid) {
      toast.error("Invalid course ID", {
        description: validation.error || "Redirecting back to Courses",
      })
      router.push("/courses")
    }
  }, [courseId, router])

  const {
    course,
    loading,
    error,
    isEnrolled,
    progress = 0,
    completedLessons = [],
  } = useNormalizedCourse(courseId, { includeProgress: true })

  // Set breadcrumb title when course loads
  useEffect(() => {
    if (course?.title && pathname) {
      setCourseTitleForPath(pathname, course.title)
    }
  }, [course?.title, pathname, setCourseTitleForPath])

  const { updateProgress } = useCourseProgressUpdate()

  const sections = useMemo(() => {
    if (!course) return []
    if (course.sections?.length) return course.sections
    return [
      {
        id: "pending-section",
        title: "Curriculum coming soon",
        description: "The team is finalizing modules for this experience.",
        orderIndex: 0,
        lessons: [
          {
            id: "pending-lesson",
            title: "Stay tuned",
            orderIndex: 0,
            content: "Once published, lessons will appear here automatically.",
            videoTimestamp: 0,
            duration: 0,
          },
        ],
      },
    ]
  }, [course])

  const safeSectionIndex = Math.min(sectionIndex, Math.max(sections.length - 1, 0))
  const currentSection = sections[safeSectionIndex]
  const sectionLessons = currentSection?.lessons || []
  const safeLessonIndex = Math.min(lessonIndex, Math.max(sectionLessons.length - 1, 0))
  const currentLesson: NormalizedLesson | null = sectionLessons[safeLessonIndex] || null

  const outlineCourse = course ? ({ ...course, sections } as NormalizedCourse) : null
  const hasNext =
    safeSectionIndex < sections.length - 1 ||
    (sectionLessons.length > 0 && safeLessonIndex < sectionLessons.length - 1)
  const hasPrevious = safeSectionIndex > 0 || safeLessonIndex > 0

  const handleEnroll = async () => {
    if (!isSignedIn || !userId) {
      router.push(`/sign-in?redirect=/courses/${courseId}`)
      return
    }
    if (!course || enrolling) return

    try {
      setEnrolling(true)
      await enrollMutation({ userId, courseId: course.id as Id<"courses"> })
      toast.success("You're enrolled", { description: "Opening your learning workspace" })
    } catch (err) {
      console.error(err)
      toast.error("Unable to enroll", {
        description: err instanceof Error ? err.message : "Please try again",
      })
    } finally {
      setEnrolling(false)
    }
  }

  const scrollPlayerIntoView = () => {
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleLessonSelect = (sectionIdx: number, lessonIdx: number, _lesson: NormalizedLesson) => {
    setSectionIndex(sectionIdx)
    setLessonIndex(lessonIdx)
    setCurrentQuiz(null) // Clear quiz when selecting a lesson
    scrollPlayerIntoView()
  }

  const handleQuizSelect = async (
    newSectionIndex: number,
    assessmentIndex: number,
    assessment: any
  ) => {
    // Check if valid assessment
    if (!assessment) return

    // If already generated, just show it
    if (assessment.isGenerated !== false) {
      setCurrentQuiz(assessment)
      setSectionIndex(newSectionIndex)
      scrollPlayerIntoView()
      return
    }

    // It is a placeholder, need to generate content
    const assessmentType = assessment.type || 'quiz'

    // Trigger generation
    setGeneratingQuiz(true)
    toast.info(`Generating ${assessmentType}...`, {
      description: "This uses your AI credits and may take a few moments"
    })

    try {
      // Get the first lesson of the module to generate assessment from
      const moduleSection = sections[newSectionIndex]
      const firstLesson = moduleSection?.lessons?.[0]

      // For projects, we might use course-level data but linking to a lesson is fine for now as anchor
      if (!firstLesson && assessmentType !== 'project') {
        toast.error(`Cannot generate ${assessmentType}`, {
          description: "No lessons found in this module"
        })
        setGeneratingQuiz(false)
        return
      }

      let result: any = { success: false, error: "Unknown type" }

      if (assessmentType === 'test') {
        const { generateTest } = await import("@/actions/generateTest")
        result = await generateTest(
          firstLesson!.id as Id<"lessons">,
          {
            userId: userId as string,
            numQuestions: 10,
            difficulty: "hard"
          }
        )
      } else if (assessmentType === 'project') {
        const { generateProject } = await import("@/actions/generateProject")
        // Project uses courseId, so we need that. The generic 'course' object should be available in scope or via props.
        // Assuming 'course' is available in component scope based on file context
        // If not, we can get it from firstLesson.courseId if that's available or params
        // Checking existing code, 'course' is likely available or we use 'params.courseId'
        // The outline shows the file path is [courseId]/page.tsx so params.courseId is available
        const courseId = params.courseId as Id<"courses">

        result = await generateProject(
          courseId,
          { userId: userId as string }
        )
      } else {
        // Default to quiz
        const { generateQuiz } = await import("@/actions/generateQuiz")
        result = await generateQuiz(
          firstLesson!.id as Id<"lessons">,
          {
            userId: userId as string,
            numQuestions: 5,
            difficulty: "mixed"
          }
        )
      }

      if (result.success) {
        toast.success(`${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} generated!`, {
          description: `You can now start the ${assessmentType}`
        })
        // Refresh the page to load the new assessment
        window.location.reload()
      } else {
        toast.error(`Failed to generate ${assessmentType}`, {
          description: result.error || "Please try again"
        })
      }
    } catch (error) {
      console.error(`Error generating ${assessmentType}:`, error)
      toast.error(`Failed to generate ${assessmentType}`, {
        description: error instanceof Error ? error.message : "Unknown error"
      })
    } finally {
      setGeneratingQuiz(false)
    }
  }

  const navigateLesson = (direction: "next" | "prev") => {
    if (!sections.length) return

    const currentLessons = sections[safeSectionIndex]?.lessons || []
    if (direction === "next") {
      if (safeLessonIndex < currentLessons.length - 1) {
        setLessonIndex(safeLessonIndex + 1)
      } else if (safeSectionIndex < sections.length - 1) {
        setSectionIndex(safeSectionIndex + 1)
        setLessonIndex(0)
      }
    } else {
      if (safeLessonIndex > 0) {
        setLessonIndex(safeLessonIndex - 1)
      } else if (safeSectionIndex > 0) {
        const previousLessons = sections[safeSectionIndex - 1]?.lessons || []
        setSectionIndex(safeSectionIndex - 1)
        setLessonIndex(Math.max(previousLessons.length - 1, 0))
      }
    }
    scrollPlayerIntoView()
  }

  // Handle seek beyond current lesson with confirmation
  const handleSeekBeyondLesson = async (targetTime: number): Promise<boolean> => {
    console.log('[CoursePage] handleSeekBeyondLesson called with targetTime:', targetTime)
    console.log('[CoursePage] Current position:', { safeSectionIndex, safeLessonIndex })

    return new Promise((resolve) => {
      // Find which lesson the target time falls into
      let targetSectionIdx = safeSectionIndex
      let targetLessonIdx = safeLessonIndex
      let found = false

      for (let sIdx = 0; sIdx < sections.length && !found; sIdx++) {
        const section = sections[sIdx]
        if (section.isAssessment) continue

        const lessons = section.lessons || []
        for (let lIdx = 0; lIdx < lessons.length; lIdx++) {
          const lesson = lessons[lIdx]
          if (lesson.timestampStart !== undefined && lesson.timestampEnd !== undefined) {
            if (targetTime >= lesson.timestampStart && targetTime <= lesson.timestampEnd) {
              targetSectionIdx = sIdx
              targetLessonIdx = lIdx
              found = true
              console.log('[CoursePage] Found target lesson:', { sIdx, lIdx, title: lesson.title })
              break
            }
          }
        }
      }

      // If found a different lesson, show confirmation
      if (found && (targetSectionIdx !== safeSectionIndex || targetLessonIdx !== safeLessonIndex)) {
        const targetLesson = sections[targetSectionIdx]?.lessons?.[targetLessonIdx]
        if (targetLesson) {
          // Determine direction based on lesson position
          const isForward = targetSectionIdx > safeSectionIndex ||
            (targetSectionIdx === safeSectionIndex && targetLessonIdx > safeLessonIndex)
          const direction = isForward ? 'forward' : 'backward'

          console.log('[CoursePage] Showing modal for:', targetLesson.title, 'direction:', direction)
          setTargetSeekLesson({
            sectionIdx: targetSectionIdx,
            lessonIdx: targetLessonIdx,
            title: targetLesson.title,
            direction
          })
          seekResolveRef.current = resolve
          setSeekModalOpen(true)
          return
        }
      }

      console.log('[CoursePage] Not showing modal, resolving false')
      // Default: don't allow seek
      resolve(false)
    })
  }

  const handleSeekConfirm = () => {
    console.log('[CoursePage] handleSeekConfirm called')

    // Store the target lesson info before clearing state
    const target = targetSeekLesson
    const resolve = seekResolveRef.current

    // Clear modal state first
    setSeekModalOpen(false)
    setTargetSeekLesson(null)
    seekResolveRef.current = null

    // Update lesson state
    if (target) {
      console.log('[CoursePage] Updating to lesson:', target.title)
      setSectionIndex(target.sectionIdx)
      setLessonIndex(target.lessonIdx)
    }

    // Resolve promise last (this tells YouTubeEmbed the decision)
    if (resolve) {
      console.log('[CoursePage] Resolving Promise with true')
      resolve(true)
    }
  }

  const handleSeekCancel = () => {
    console.log('[CoursePage] handleSeekCancel called')
    if (seekResolveRef.current) {
      console.log('[CoursePage] Resolving Promise with false')
      seekResolveRef.current(false)
      seekResolveRef.current = null
    }
    setSeekModalOpen(false)
    setTargetSeekLesson(null)
  }

  const handleVideoEnd = () => {
    const currentLessons = sections[safeSectionIndex]?.lessons || []
    const isLastLessonInSection = safeLessonIndex === currentLessons.length - 1
    const nextSection = sections[safeSectionIndex + 1]

    // If it's the last lesson and the next section is an assessment, switch to it.
    if (isLastLessonInSection && nextSection && nextSection.isAssessment) {
      toast.success("Opening assessment", {
        description: `Proceed to: ${nextSection.title || 'Assessment'}`
      })
      // Assessments are treated like lessons in the flat structure
      handleLessonSelect(safeSectionIndex + 1, 0, nextSection.lessons[0])
      return
    }

    // Check if there's a next lesson available
    const hasNextLesson = safeLessonIndex < (sections[safeSectionIndex]?.lessons?.length || 0) - 1
    const hasNextSection = safeSectionIndex < sections.length - 1

    if (hasNextLesson || hasNextSection) {
      // Auto-advance to next lesson
      navigateLesson("next")
      toast.success("Moving to next lesson", {
        description: "Video completed successfully"
      })
    } else {
      toast.success("Course section completed!", {
        description: "You've finished this section"
      })
    }
  }

  const markLessonComplete = async () => {
    if (!course || !currentLesson || !isEnrolled || !userId) return
    try {
      const result = await updateProgress({
        userId,
        courseId: course.id as Id<"courses">,
        lessonId: currentLesson.id as Id<"lessons">,
        completed: true,
      })

      if (result?.success) {
        toast.success("Progress saved", { description: `You are ${result.progress}% complete` })
        navigateLesson("next")
      }
    } catch (err) {
      console.error(err)
      toast.error("Couldn't update progress")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="h-[600px] animate-pulse rounded-2xl bg-muted" />
            <div className="h-[600px] animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-lg font-semibold text-foreground">We couldn't load that course</p>
            <p className="mt-2 text-sm text-muted-foreground">{error || "The course may have moved or been removed."}</p>
            <Button className="mt-6" onClick={() => router.push("/courses")}>
              Return to catalog
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1600px] p-4 lg:p-6">
        {/* Main 2-column layout */}
        <div className={cn(
          "grid gap-6 transition-all duration-300 ease-in-out",
          isFocusMode ? "lg:grid-cols-1 max-w-5xl mx-auto" : "lg:grid-cols-[1fr_400px]"
        )}>

          {/* Left Column - Video & Info */}
          <div className="space-y-4">
            {/* Video Player Container */}
            <div
              ref={playerRef}
              className="relative w-full bg-black rounded-2xl overflow-hidden aspect-video shadow-2xl ring-1 ring-border/50"
            >
              {isEnrolled ? (
                currentQuiz ? (
                  <div className="flex h-full items-center justify-center p-8 text-center bg-card">
                    <div className="max-w-xl w-full">
                      {currentQuiz.type === 'project' ? (
                        <>
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-500/10 mb-4">
                            <Trophy className="h-7 w-7 text-purple-400" />
                          </div>
                          <h2 className="text-xl font-semibold text-foreground mb-2">{currentQuiz.title}</h2>
                          <p className="text-muted-foreground text-sm mb-6">{currentQuiz.description || "Complete this capstone project"}</p>
                          <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                            View Project Details
                          </Button>
                        </>
                      ) : currentQuiz.type === 'test' ? (
                        <>
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                            <FileText className="h-7 w-7 text-primary" />
                          </div>
                          <h2 className="text-xl font-semibold text-foreground mb-2">{currentQuiz.title}</h2>
                          <p className="text-muted-foreground text-sm mb-6">{currentQuiz.description || "Test your knowledge"}</p>
                          {currentQuiz.isGenerated === false ? (
                            <Button
                              className="bg-primary hover:bg-primary/90"
                              onClick={() => handleQuizSelect(sectionIndex, 0, currentQuiz)}
                              disabled={generatingQuiz}
                            >
                              {generatingQuiz ? "Generating..." : "Generate Test"}
                            </Button>
                          ) : (
                            <Button className="bg-primary hover:bg-primary/90">Start Test</Button>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 mb-4">
                            <FileQuestion className="h-7 w-7 text-amber-400" />
                          </div>
                          <h2 className="text-xl font-semibold text-foreground mb-2">{currentQuiz.title}</h2>
                          <p className="text-muted-foreground text-sm mb-6">{currentQuiz.description || "Test your knowledge"}</p>
                          {currentQuiz.isGenerated === false ? (
                            <Button
                              className="bg-amber-500 hover:bg-amber-600 text-white"
                              onClick={() => handleQuizSelect(sectionIndex, 0, currentQuiz)}
                              disabled={generatingQuiz}
                            >
                              {generatingQuiz ? "Generating..." : "Generate Quiz"}
                            </Button>
                          ) : (
                            <Button className="bg-amber-500 hover:bg-amber-600 text-white">Start Quiz</Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : currentLesson ? (
                  <CoursePlayer
                    lesson={currentLesson}
                    courseId={courseId}
                    videoOnly={true}
                    onVideoEnd={handleVideoEnd}
                    onSeekBeyondLesson={handleSeekBeyondLesson}
                    onNext={() => navigateLesson("next")}
                    onPrevious={() => navigateLesson("prev")}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg font-medium text-foreground">Content coming soon</p>
                      <p className="mt-1 text-sm text-muted-foreground">Explore the outline while we prepare lessons.</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-card to-muted">
                  <button
                    className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
                    onClick={handleEnroll}
                    disabled={enrolling}
                    aria-label="Enroll to watch"
                  >
                    <svg className="h-7 w-7 ml-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Lesson Info Bar */}
            {isEnrolled && (currentLesson || currentQuiz) && (
              <div className="space-y-4">
                {/* Header: Title + Next Button */}
                <div className="rounded-xl bg-card border border-border p-4">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl font-semibold text-foreground truncate">
                        {currentQuiz ? currentQuiz.title : currentLesson?.title}
                      </h1>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {Math.round(progress)}% complete
                        </span>
                        <div className="h-1.5 flex-1 max-w-[120px] bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigateLesson("next")}
                      disabled={!hasNext}
                      className="shrink-0 gap-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Navigation + Tools Row */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => navigateLesson("prev")}
                      disabled={!hasPrevious}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8 text-muted-foreground hover:text-foreground", isFocusMode && "text-primary bg-primary/10")}
                        onClick={() => setIsFocusMode(!isFocusMode)}
                        title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                      >
                        {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lower Tabs: Overview, Notes, Resources */}
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="w-full grid grid-cols-3 bg-muted/50 p-0 h-auto rounded-none border-b border-border">
                      <TabsTrigger
                        value="overview"
                        className="rounded-none py-3 text-sm data-[state=active]:bg-card data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary"
                      >
                        <BookOpen className="mr-1.5 h-4 w-4" />
                        Overview
                      </TabsTrigger>
                      <TabsTrigger
                        value="notes"
                        className="rounded-none py-3 text-sm data-[state=active]:bg-card data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary"
                      >
                        <StickyNote className="mr-1.5 h-4 w-4" />
                        Notes
                      </TabsTrigger>
                      <TabsTrigger
                        value="resources"
                        className="rounded-none py-3 text-sm data-[state=active]:bg-card data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary"
                      >
                        <FileText className="mr-1.5 h-4 w-4" />
                        Resources
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="p-4 m-0">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">About this lesson</h3>
                          <p className="text-sm text-muted-foreground">
                            {currentLesson?.content || "No description available for this lesson."}
                          </p>
                        </div>
                        {currentLesson?.keyPoints && currentLesson.keyPoints.length > 0 && (
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Key Points</h4>
                            <ul className="space-y-1.5">
                              {currentLesson.keyPoints.map((point: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="notes" className="p-4 m-0">
                      <div className="flex flex-col items-center justify-center min-h-[150px] text-center">
                        <StickyNote className="h-8 w-8 text-muted-foreground/50 mb-3" />
                        <p className="text-sm font-medium text-foreground">Take notes for this lesson</p>
                        <p className="text-xs text-muted-foreground mt-1">Your notes will be saved automatically</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="resources" className="p-4 m-0">
                      <CourseResources course={course} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>

          <div className={cn(
            "relative group/sidebar transition-all duration-300 ease-in-out",
            isFocusMode ? "hidden opacity-0" : "block opacity-100"
          )}>
            {/* Glassmorphism effect */}
            <div className="absolute -inset-px bg-gradient-to-b from-primary/5 via-transparent to-primary/5 rounded-2xl opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-md sticky top-4 self-start h-[calc(100vh-48px)] flex flex-col overflow-hidden">
              <Tabs defaultValue="outline" className="flex flex-col h-full">
                <TabsList className="grid w-full grid-cols-2 border-b border-border bg-card/50 p-0 rounded-t-2xl flex-shrink-0 sticky top-0 z-10">
                  <TabsTrigger
                    value="outline"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-xs py-2.5"
                  >
                    <BookOpen className="mr-1 h-3.5 w-3.5" />
                    Outline
                  </TabsTrigger>
                  <TabsTrigger
                    value="tutor"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent data-[state=active]:text-foreground text-xs py-2.5"
                  >
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    AI Tutor
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden">
                  <TabsContent value="outline" className="h-full overflow-y-auto p-3 m-0 data-[state=inactive]:hidden">
                    {outlineCourse ? (
                      <CourseContent
                        course={outlineCourse}
                        onSelectLesson={handleLessonSelect}
                        onSelectQuiz={handleQuizSelect}
                        completedLessons={completedLessons}
                        currentLessonId={currentLesson?.id}
                        currentQuizId={currentQuiz?.id}
                        activeSectionIndex={safeSectionIndex}
                        isSidebar
                      />
                    ) : (
                      <div className="flex min-h-[200px] items-center justify-center p-4 text-center">
                        <div>
                          <Lock className="mx-auto h-7 w-7 text-muted-foreground/50" />
                          <p className="mt-3 text-xs text-muted-foreground">Outline will appear here soon.</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="tutor" className="h-full m-0 data-[state=inactive]:hidden">
                    {isEnrolled && currentLesson ? (
                      <TutorChatSidebar
                        courseId={courseId}
                        lessonId={currentLesson.id}
                        lessonContext={{
                          title: currentLesson.title,
                          content: currentLesson.content || "",
                          keyPoints: currentLesson.keyPoints || []
                        }}
                      />
                    ) : (
                      <div className="flex min-h-[200px] items-center justify-center p-4 text-center">
                        <div>
                          <Bot className="mx-auto h-7 w-7 text-violet-400/50" />
                          <p className="mt-3 text-xs font-medium text-foreground">AI Tutor</p>
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {isEnrolled
                              ? "Select a lesson to start chatting"
                              : "Enroll to unlock AI tutor features"}
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Seek Confirmation Modal */}
        <SeekConfirmationModal
          open={seekModalOpen}
          onOpenChange={setSeekModalOpen}
          targetLessonTitle={targetSeekLesson?.title || ''}
          direction={targetSeekLesson?.direction}
          onConfirm={handleSeekConfirm}
          onCancel={handleSeekCancel}
        />
      </div>
    </div>
  )
}
