"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useNormalizedCourse } from "@/hooks/use-normalized-course"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { CoursePanel } from "@/components/analysis/course-panel"
import { CoursePanelProvider } from "@/components/analysis/course-panel-context"
import { AnalysisProvider } from "@/hooks/use-analysis-context"
import { useBreadcrumb } from "@/contexts/breadcrumb-context"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

export default function ExploreCourseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const courseIdStr = typeof params.courseId === 'string' ? params.courseId : ''
  const courseId = courseIdStr as Id<"courses">
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [enrolling, setEnrolling] = useState(false)
  const { setCourseTitleForPath } = useBreadcrumb()

  // Convex mutation for enrollment
  const enroll = useMutation(api.enrollments.enrollInCourse)

  // Fetch course data using the useNormalizedCourse hook
  const {
    course,
    loading,
    error,
    isEnrolled
  } = useNormalizedCourse(courseIdStr, { includeProgress: false })

  // Handle enrollment
  const handleEnroll = async () => {
    if (!user) {
      toast.error("Please sign in to enroll in this course")
      return
    }

    if (isEnrolled) {
      toast.info("You are already enrolled in this course")
      router.push(`/courses/${courseIdStr}`)
      return
    }

    try {
      setEnrolling(true)

      // Call the Convex enrollment mutation
      await enroll({
        userId: user.id,
        courseId: courseId
      })

      toast.success("Successfully enrolled in course")

      // Navigate to the course page
      router.push(`/courses/${courseIdStr}`)
    } catch (error) {
      console.error('Error enrolling in course:', error)
      toast.error("Failed to enroll in course")
    } finally {
      setEnrolling(false)
    }
  }

  // Handle back button click
  const handleBack = () => {
    router.back()
  }

  // Convert the normalized course to the format expected by CoursePanel
  const [coursePanelData, setCoursePanelData] = useState<any>(null)
  const [videoData, setVideoData] = useState<any>(null)

  useEffect(() => {
    if (course) {
      // Set the course title in the breadcrumb context
      if (course.title && pathname) {
        setCourseTitleForPath(pathname, course.title)
      }

      // Create video data object
      const videoDataObj = {
        id: course.videoId || '',
        title: course.title || '',
        description: course.description || '',
        thumbnail: course.thumbnail || '',
        channelName: course.metadata?.sources?.[0]?.name || '',
        channelAvatar: course.metadata?.sources?.[0]?.avatar || '',
        duration_seconds: course.duration_seconds || 0
      }

      // Create course data object
      const coursePanelDataObj = {
        _id: course.id,
        title: course.title,
        description: course.description,
        videoId: course.videoId,
        image: course.thumbnail,
        metadata: {
          category: course.category || 'General',
          tags: course.tags || [],
          difficulty: course.difficultyLevel || 'Beginner',
          prerequisites: [],
          objectives: [],
          overviewText: course.generatedSummary || course.description || '',
          resources: [],
          duration: course.estimatedDuration || '',
          sources: course.metadata?.sources || []
        },
        courseItems: []
      }

      // Convert sections to courseItems
      if (course.sections && Array.isArray(course.sections)) {
        coursePanelDataObj.courseItems = course.sections.map(section => ({
          type: 'section',
          title: section.title,
          description: section.description || '',
          lessons: section.lessons.map(lesson => ({
            title: lesson.title,
            description: lesson.description || '',
            duration: lesson.duration ? `${lesson.duration} min` : undefined,
            keyPoints: [],
            timestampStart: lesson.timestampStart,
            timestampEnd: lesson.timestampEnd,
          }))
        }))
      }

      setVideoData(videoDataObj)
      setCoursePanelData(coursePanelDataObj)
    }
  }, [course])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading course details...</p>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-xl font-bold mb-2">Course Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The course you're looking for doesn't exist or you don't have permission to view it.
          {error && <span className="block text-xs mt-2 text-destructive">{error}</span>}
        </p>
        <Button onClick={handleBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Explore
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-6">
      {/* Enrollment Banner for non-enrolled users */}
      {!isEnrolled && (
        <div className="mb-6 p-6 bg-primary/5 border border-primary/10 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-2xl font-bold">Interested in this course?</h2>
            <p className="text-muted-foreground">Enroll now to save it to your library and track your progress.</p>
          </div>
          <Button
            size="lg"
            onClick={handleEnroll}
            disabled={enrolling}
            className="w-full md:w-auto min-w-[160px] h-12 rounded-full font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105"
          >
            {enrolling ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enrolling...
              </>
            ) : (
              "Enroll Now"
            )}
          </Button>
        </div>
      )}

      {/* Course Panel with required context providers */}
      <div className="bg-background border rounded-lg shadow-sm">
        <AnalysisProvider initialContent={videoData}>
          <CoursePanelProvider courseData={coursePanelData}>
            {coursePanelData && videoData && <CoursePanel />}
          </CoursePanelProvider>
        </AnalysisProvider>
      </div>
    </div>
  )
}

