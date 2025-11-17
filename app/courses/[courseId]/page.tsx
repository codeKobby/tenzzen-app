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
    // Projects don't need generation, just display them
    if (assessment.type === 'project') {
      setCurrentQuiz(assessment)
      setSectionIndex(newSectionIndex)
      scrollPlayerIntoView()
      return
    }

    // Check if this is a placeholder quiz/test that needs to be generated
    if (assessment.isGenerated === false) {
      const assessmentType = assessment.type === 'test' ? 'test' : 'quiz'
      const numQuestions = assessment.type === 'test' ? 15 : 5 // Tests have more questions

      // Trigger quiz/test generation
      setGeneratingQuiz(true)
      toast.info(`Generating ${assessmentType}...`, {
        description: "This may take a few moments"
      })

      try {
        // Get the first lesson of the module to generate quiz from
        const moduleSection = sections[newSectionIndex]
        const firstLesson = moduleSection?.lessons?.[0]

        if (!firstLesson) {
          toast.error(`Cannot generate ${assessmentType}`, {
            description: "No lessons found in this module"
          })
          setGeneratingQuiz(false)
          return
        }

        // Import generateQuiz action dynamically
        const { generateQuiz } = await import("@/actions/generateQuiz")

        const result = await generateQuiz(
          firstLesson.id as Id<"lessons">,
          {
            userId: userId as string,
            numQuestions: numQuestions,
            difficulty: "mixed"
          }
        )

        if (result.success && result.quizId) {
          toast.success(`${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} generated!`, {
            description: `You can now take the ${assessmentType}`
          })
          // Refresh the page to load the new quiz
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
      return
    }

    // Normal quiz selection for already generated quizzes
    setCurrentQuiz(assessment)
    setSectionIndex(newSectionIndex)
    scrollPlayerIntoView()
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

  const handleVideoEnd = () => {
    // Check if current section has a quiz/assessment after this lesson
    const currentSection = sections[safeSectionIndex]
    const hasQuiz = currentSection?.assessments && currentSection.assessments.length > 0

    // If there's a quiz after this lesson, don't auto-advance
    // You can customize this logic based on when quizzes appear
    if (hasQuiz && safeLessonIndex === (currentSection?.lessons?.length || 0) - 1) {
      toast.info("Quiz available", {
        description: "Complete the quiz before moving to the next section"
      })
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
                      videoOnly={true}
                      onVideoEnd={handleVideoEnd}
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
                  {currentLesson && (
                    <div>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {currentLesson.description || "Dive into the fundamental principles that underpin great user interface design. This lesson covers hierarchy, contrast, repetition, and alignment."}
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
    </div>
  )
}
