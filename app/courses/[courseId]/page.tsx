"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Clock,
  FileText,
  LayoutGrid,
  PlayCircle,
  Settings,
  Star,
  Users,
  Loader2,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@clerk/nextjs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

// Import required components
import { CourseContent } from "./components/course-content"
import { CourseOverview } from "./components/course-overview"
import { CourseResources } from "./components/course-resources"
import { CourseSettings } from "./components/course-settings"
import { CoursePlayer } from "./components/course-player"
import { DebugButton } from "./components/debug-button"

// Import hooks for normalized course structure
import { useNormalizedCourse, NormalizedLesson, NormalizedSection } from "@/hooks/use-normalized-course"
import { useCourseProgressUpdate } from "@/hooks/use-course-progress-update"

export default function CoursePage() {
  const params = useParams();
  const courseId = typeof params.courseId === 'string' ? params.courseId : '';
  const router = useRouter();
  const { userId, isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState("content");
  const [currentSection, setCurrentSection] = useState<NormalizedSection | null>(null);
  const [currentLesson, setCurrentLesson] = useState<NormalizedLesson | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [enrolling, setEnrolling] = useState(false);

  // Fetch course data using the normalized course hook
  const {
    course,
    loading,
    error,
    isEnrolled,
    progress,
    completedLessons
  } = useNormalizedCourse(courseId, { includeProgress: true });

  // Progress update hook
  const { updateProgress, loading: updatingProgress } = useCourseProgressUpdate();

  // Set initial lesson when course loads
  useEffect(() => {
    if (course && course.sections.length > 0) {
      const firstSection = course.sections[0];
      setCurrentSection(firstSection);

      if (firstSection.lessons.length > 0) {
        setCurrentLesson(firstSection.lessons[0]);
        setCurrentSectionIndex(0);
        setCurrentLessonIndex(0);
      }
    }
  }, [course]);

  // Navigation functions
  const navigateLesson = (direction: 'next' | 'prev') => {
    if (!course || !currentSection) return;

    if (direction === 'next') {
      // If there are more lessons in the current section
      if (currentLessonIndex < currentSection.lessons.length - 1) {
        setCurrentLessonIndex(currentLessonIndex + 1);
        setCurrentLesson(currentSection.lessons[currentLessonIndex + 1]);
      }
      // Move to the next section
      else if (currentSectionIndex < course.sections.length - 1) {
        const nextSection = course.sections[currentSectionIndex + 1];
        setCurrentSectionIndex(currentSectionIndex + 1);
        setCurrentSection(nextSection);

        if (nextSection.lessons.length > 0) {
          setCurrentLessonIndex(0);
          setCurrentLesson(nextSection.lessons[0]);
        }
      }
    } else if (direction === 'prev') {
      // If we're not at the first lesson of the current section
      if (currentLessonIndex > 0) {
        setCurrentLessonIndex(currentLessonIndex - 1);
        setCurrentLesson(currentSection.lessons[currentLessonIndex - 1]);
      }
      // Move to the previous section
      else if (currentSectionIndex > 0) {
        const prevSection = course.sections[currentSectionIndex - 1];
        setCurrentSectionIndex(currentSectionIndex - 1);
        setCurrentSection(prevSection);

        if (prevSection.lessons.length > 0) {
          setCurrentLessonIndex(prevSection.lessons.length - 1);
          setCurrentLesson(prevSection.lessons[prevSection.lessons.length - 1]);
        }
      }
    }
  };

  // Mark lesson as complete
  const markLessonComplete = async () => {
    if (!course || !currentLesson || !isEnrolled) return;

    try {
      const result = await updateProgress({
        courseId: course.id,
        lessonId: currentLesson.id,
        sectionIndex: currentSectionIndex,
        lessonIndex: currentLessonIndex,
        completed: true
      });

      if (result && result.success) {
        toast.success('Progress updated');

        // Auto-navigate to next lesson if available
        navigateLesson('next');
      }
    } catch (err) {
      toast.error('Failed to update progress');
      console.error('Error updating progress:', err);
    }
  };

  // Handle enrollment
  const handleEnroll = async () => {
    if (!isSignedIn) {
      // Redirect to sign in
      router.push(`/sign-in?redirect=/courses/${courseId}`);
      return;
    }

    if (enrolling) return;

    setEnrolling(true);
    try {
      const response = await fetch('/api/supabase/courses/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enroll');
      }

      const data = await response.json();

      if (data.success) {
        toast.success(data.newEnrollment ? 'Successfully enrolled in course' : 'Already enrolled in this course');
        // Refresh the page to update enrollment status
        window.location.reload();
      }
    } catch (err) {
      toast.error('Failed to enroll in course');
      console.error('Error enrolling in course:', err);
    } finally {
      setEnrolling(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-[400px] w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error || "We couldn't find the course you're looking for."}
          </p>
          <Button onClick={() => router.push('/explore')}>
            Explore Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Course Header */}
      <div className="bg-muted/40 border-b">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/courses')}
                className="mb-2"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back to Courses
              </Button>
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <p className="text-muted-foreground">{course.description?.substring(0, 100)}{course.description && course.description.length > 100 ? '...' : ''}</p>
            </div>

            {!isEnrolled && (
              <Button
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {enrolling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Enroll in Course
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-6 max-w-7xl flex-1 flex flex-col">
        {activeTab === "content" && currentLesson ? (
          <div className="flex-1 flex flex-col">
            <CoursePlayer
              lesson={currentLesson}
              onComplete={markLessonComplete}
              onNext={() => navigateLesson('next')}
              onPrevious={() => navigateLesson('prev')}
              hasNext={currentSectionIndex < (course.sections.length - 1) ||
                currentLessonIndex < (currentSection?.lessons.length - 1)}
              hasPrevious={currentSectionIndex > 0 || currentLessonIndex > 0}
            />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="content" className="mt-0">
                <CourseContent
                  course={course}
                  onSelectLesson={(sectionIndex, lessonIndex, lesson) => {
                    setCurrentSectionIndex(sectionIndex);
                    setCurrentLessonIndex(lessonIndex);
                    setCurrentSection(course.sections[sectionIndex]);
                    setCurrentLesson(lesson);
                    setActiveTab("content");
                  }}
                  completedLessons={completedLessons || []}
                />
              </TabsContent>

              <TabsContent value="overview" className="mt-0">
                <CourseOverview course={course} />
              </TabsContent>

              <TabsContent value="resources" className="mt-0">
                <CourseResources course={course} />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <CourseSettings course={course} />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}

