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
import { useSupabase } from "@/contexts/supabase-context"
import { CoursePanel } from "@/components/analysis/course-panel"
import { CoursePanelProvider } from "@/components/analysis/course-panel-context"
import { AnalysisProvider } from "@/hooks/use-analysis-context"
import { useBreadcrumb } from "@/contexts/breadcrumb-context"

export default function ExploreCourseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const courseId = typeof params.courseId === 'string' ? params.courseId : ''
  const { user } = useAuth()
  const supabase = useSupabase()
  const [activeTab, setActiveTab] = useState("overview")
  const [enrolling, setEnrolling] = useState(false)
  const { setCourseTitleForPath } = useBreadcrumb()

  // Fetch course data using the useNormalizedCourse hook
  const {
    course,
    loading,
    error,
    isEnrolled
  } = useNormalizedCourse(courseId, { includeProgress: false })

  // Handle enrollment
  const handleEnroll = async () => {
    if (!user) {
      toast.error("Please sign in to enroll in this course")
      return
    }

    if (isEnrolled) {
      toast.info("You are already enrolled in this course")
      router.push(`/courses/${courseId}`)
      return
    }

    try {
      setEnrolling(true)

      // Call the enrollment API
      const response = await fetch('/api/supabase/courses/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to enroll in course')
      }

      toast.success("Successfully enrolled in course")

      // Navigate to the course page
      router.push(`/courses/${courseId}`)
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
        id: course.video_id || '',
        title: course.title || '',
        description: course.description || '',
        thumbnail: course.thumbnail || '',
        channelName: course.metadata?.sources?.[0]?.name || '',
        channelAvatar: course.metadata?.sources?.[0]?.avatar || '',
        duration_seconds: course.duration_seconds || 0
      }

      // Create course data object
      const coursePanelDataObj = {
        title: course.title,
        description: course.description,
        videoId: course.video_id,
        image: course.thumbnail,
        metadata: {
          category: course.category || 'General',
          tags: course.tags || [],
          difficulty: course.difficulty_level || 'Beginner',
          prerequisites: [],
          objectives: [],
          overviewText: course.generated_summary || course.description || '',
          resources: [],
          duration: course.estimated_duration || '',
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
            keyPoints: []
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
