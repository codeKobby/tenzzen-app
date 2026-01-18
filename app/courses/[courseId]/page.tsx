"use client"

import { useParams, usePathname } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useMutation } from "convex/react"
import { toast } from "sonner"
import {
  BookOpen,
  Camera,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileQuestion,
  FileText,
  Lock,
  StickyNote,
  Trophy,
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
import { validateCourseId } from "@/lib/utils"
import { useBreadcrumb } from "@/contexts/breadcrumb-context"

import { CourseContent } from "./components/course-content"
import { CoursePlayer } from "./components/course-player"
import { CourseResources } from "./components/course-resources"
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
      <div className="min-h-screen bg-[#0a1628] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
            <div className="h-[600px] animate-pulse rounded-2xl bg-white/5" />
            <div className="h-[600px] animate-pulse rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#0a1628] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-white/10 bg-[#0f1e35] p-10 text-center">
            <p className="text-lg font-semibold text-white">We couldn't load that course</p>
            <p className="mt-2 text-sm text-white/60">{error || "The course may have moved or been removed."}</p>
            <Button className="mt-6" onClick={() => router.push("/courses")}>
              Return to catalog
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a1628] p-4">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,900px)_1fr] lg:items-start">
          <div className="space-y-3 max-w-full">
            {/* Video Player */}
            <div className="w-full">
              <div ref={playerRef} className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
                {isEnrolled ? (
                  currentQuiz ? (
                    <div className="flex h-full items-center justify-center p-10 text-center bg-[#0f1e35]">
                      <div className="max-w-2xl w-full">
                        {/* Determine icon and color based on assessment type */}
                        {currentQuiz.type === 'project' ? (
                          <>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mb-4">
                              <Trophy className="h-8 w-8 text-purple-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">{currentQuiz.title}</h2>
                            <p className="text-white/70 mb-6">{currentQuiz.description || "Complete this capstone project to demonstrate your learning"}</p>
                            <div className="bg-white/5 rounded-lg p-6 text-left space-y-3 mb-6">
                              <h3 className="text-sm font-semibold text-purple-400">Project Requirements:</h3>
                              <p className="text-sm text-white/70 leading-relaxed">
                                {currentQuiz.description || "Detailed project requirements will be provided here."}
                              </p>
                            </div>
                            <Button className="mt-6 bg-purple-500 hover:bg-purple-600 text-white">
                              View Project Details
                            </Button>
                          </>
                        ) : currentQuiz.type === 'test' ? (
                          <>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
                              <FileText className="h-8 w-8 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">{currentQuiz.title}</h2>
                            <p className="text-white/70 mb-6">{currentQuiz.description || "Comprehensive test covering all course material"}</p>
                            {currentQuiz.isGenerated === false ? (
                              <>
                                <p className="text-blue-500/80 text-sm mb-6">
                                  This test hasn't been generated yet. Click below to create it.
                                </p>
                                <Button
                                  className="mt-6 bg-blue-500 hover:bg-blue-600 text-white"
                                  onClick={() => handleQuizSelect(sectionIndex, 0, currentQuiz)}
                                  disabled={generatingQuiz}
                                >
                                  {generatingQuiz ? "Generating..." : "Generate Test"}
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-center gap-4 text-sm text-white/60">
                                  <span className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Questions: Loading...
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Passing Score: {currentQuiz.passingScore || 70}%
                                  </span>
                                </div>
                                <Button className="mt-6 bg-blue-500 hover:bg-blue-600 text-white">
                                  Start Test
                                </Button>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4">
                              <FileQuestion className="h-8 w-8 text-amber-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">{currentQuiz.title}</h2>
                            <p className="text-white/70 mb-6">{currentQuiz.description || "Test your knowledge with this quiz"}</p>
                            {currentQuiz.isGenerated === false ? (
                              <>
                                <p className="text-amber-500/80 text-sm mb-6">
                                  This quiz hasn't been generated yet. Click below to create it.
                                </p>
                                <Button
                                  className="mt-6 bg-amber-500 hover:bg-amber-600 text-white"
                                  onClick={() => handleQuizSelect(sectionIndex, 0, currentQuiz)}
                                  disabled={generatingQuiz}
                                >
                                  {generatingQuiz ? "Generating..." : "Generate Quiz"}
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-center gap-4 text-sm text-white/60">
                                  <span className="flex items-center gap-2">
                                    <FileQuestion className="h-4 w-4" />
                                    Questions: Loading...
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Passing Score: {currentQuiz.passingScore || 70}%
                                  </span>
                                </div>
                                <Button className="mt-6 bg-amber-500 hover:bg-amber-600 text-white">
                                  Start Quiz
                                </Button>
                              </>
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
                    <div className="flex h-full items-center justify-center p-10 text-center">
                      <div>
                        <p className="text-lg font-semibold text-white">Lessons will appear here soon</p>
                        <p className="mt-2 text-sm text-white/60">
                          The curriculum is being finalized. Explore the outline to prepare.
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <button
                      className="flex size-20 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
                      onClick={handleEnroll}
                      disabled={enrolling}
                      aria-label="Play lesson"
                    >
                      <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Course Info Section */}
            {isEnrolled && (currentLesson || currentQuiz) && (
              <div className="rounded-xl border border-white/10 bg-[#0f1e35] overflow-hidden">
                {/* Linear Progress Bar */}
                <div className="h-1 w-full bg-white/10">
                  <div
                    className="h-full bg-[#3b82f6] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="p-5 space-y-4">
                  {/* Title */}
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="text-2xl font-bold text-white leading-tight flex-1 truncate">
                      {currentQuiz ? currentQuiz.title : currentLesson?.title}
                    </h1>
                    <span className="text-sm font-semibold text-white/60 flex-shrink-0">
                      {Math.round(progress)}%
                    </span>
                  </div>

                  {/* Description */}
                  {currentLesson && currentSection.description && (
                    <div>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {currentSection.description}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-between gap-4">
                    {/* Navigation Buttons - Left Side */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="border-white/20 bg-white/5 text-white hover:bg-white/10 h-9 px-4"
                        onClick={() => navigateLesson("prev")}
                        disabled={!hasPrevious}
                      >
                        <ChevronLeft className="mr-1.5 h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        className="bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white h-9 px-4"
                        onClick={() => navigateLesson("next")}
                        disabled={!hasNext}
                      >
                        Next Lesson
                        <ChevronRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>

                    {/* Utility Buttons - Right Side */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="border-white/20 bg-white/5 text-white hover:bg-white/10 h-9 px-3 text-sm"
                      >
                        <Camera className="mr-1.5 h-4 w-4" />
                        Screenshot
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white/20 bg-white/5 text-white hover:bg-white/10 h-9 px-3 text-sm"
                      >
                        <Clock className="mr-1.5 h-4 w-4" />
                        Timestamp Note
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0f1e35] sticky top-4 self-start h-[calc(100vh-32px)] flex flex-col overflow-hidden">
            <Tabs defaultValue="outline" className="flex flex-col h-full">
              <TabsList className="grid w-full grid-cols-3 border-b border-white/10 bg-[#0f1e35] p-0 rounded-t-xl flex-shrink-0 sticky top-0 z-10">
                <TabsTrigger
                  value="outline"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3b82f6] data-[state=active]:bg-transparent data-[state=active]:text-white text-xs py-2.5"
                >
                  <BookOpen className="mr-1 h-3.5 w-3.5" />
                  Outline
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3b82f6] data-[state=active]:bg-transparent data-[state=active]:text-white text-xs py-2.5"
                >
                  <StickyNote className="mr-1 h-3.5 w-3.5" />
                  My Notes
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3b82f6] data-[state=active]:bg-transparent data-[state=active]:text-white text-xs py-2.5"
                >
                  <FileText className="mr-1 h-3.5 w-3.5" />
                  Resources
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
                        <Lock className="mx-auto h-7 w-7 text-white/30" />
                        <p className="mt-3 text-xs text-white/60">Outline will appear here soon.</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="h-full overflow-y-auto p-3 m-0 data-[state=inactive]:hidden">
                  <div className="flex min-h-[200px] items-center justify-center text-center">
                    <div>
                      <StickyNote className="mx-auto h-7 w-7 text-white/30" />
                      <p className="mt-3 text-xs font-medium text-white">Timestamped note taking</p>
                      <p className="mt-1.5 text-xs text-white/60">
                        {isEnrolled
                          ? "Your notes will appear here"
                          : "Enroll to unlock note-taking features"}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="resources" className="h-full overflow-y-auto p-3 m-0 data-[state=inactive]:hidden">
                  <CourseResources course={course} />
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
  )
}
