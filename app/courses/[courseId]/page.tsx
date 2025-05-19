"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useRouter } from "@/hooks/use-router-with-loader"
import { Button } from "@/components/ui/button"
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
  Menu,
  X,
  ChevronRight,
  CheckCircle,
  Info,
  Download
} from "lucide-react"
import { cn, validateCourseId } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@clerk/nextjs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// Import required components
import { CourseContent } from "./components/course-content"
import { CourseOverview } from "./components/course-overview"
import { CourseResources } from "./components/course-resources"
import { CourseSettings } from "./components/course-settings"
import { CoursePlayer } from "./components/course-player"

// Import hooks for normalized course structure
import { useNormalizedCourse, NormalizedLesson, NormalizedSection } from "@/hooks/use-normalized-course"
import { useCourseProgressUpdate } from "@/hooks/use-course-progress-update"

export default function CoursePage() {
  const params = useParams();
  const courseId = typeof params.courseId === 'string' ? params.courseId : '';
  const router = useRouter();
  const { userId, isSignedIn } = useAuth();

  // Validate courseId format before proceeding
  useEffect(() => {
    const validation = validateCourseId(courseId);
    if (!validation.isValid) {
      console.error(`Invalid course ID: ${validation.error}`);
      toast.error('Invalid course ID', {
        description: validation.error || 'The course ID is invalid. Redirecting to courses page.'
      });
      // Redirect to courses page
      router.push('/courses');
      return;
    }
  }, [courseId, router]);
  const [currentSection, setCurrentSection] = useState<NormalizedSection | null>(null);
  const [currentLesson, setCurrentLesson] = useState<NormalizedLesson | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [enrolling, setEnrolling] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    if (course) {
      if (course.sections && course.sections.length > 0) {
        const firstSection = course.sections[0];
        setCurrentSection(firstSection);

        if (firstSection.lessons && firstSection.lessons.length > 0) {
          setCurrentLesson(firstSection.lessons[0]);
          setCurrentSectionIndex(0);
          setCurrentLessonIndex(0);
        } else {
          // Section has no lessons
          setCurrentLesson(null);
        }
      } else {
        // Course has no sections, create a default section
        console.log('Course has no sections, using default section');
        const defaultSection = {
          id: 'default-section',
          title: 'Course Content',
          description: 'This course has no sections yet.',
          orderIndex: 0,
          lessons: [{
            id: 'default-lesson',
            title: 'Introduction',
            content: 'This course has no lessons yet.',
            videoTimestamp: 0,
            duration: 0,
            orderIndex: 0,
            completed: false
          }]
        };

        setCurrentSection(defaultSection);
        setCurrentLesson(defaultSection.lessons[0]);
        setCurrentSectionIndex(0);
        setCurrentLessonIndex(0);

        // Update the course object to include the default section
        if (!course.sections || course.sections.length === 0) {
          course.sections = [defaultSection];
        }
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

  // Calculate total lessons and completed lessons
  const totalLessons = course?.total_lessons || course?.sections?.reduce((acc, section) =>
    acc + section.lessons.length, 0) || 0;
  const completedLessonsCount = completedLessons?.length || 0;

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="flex flex-col md:flex-row gap-6 mt-6">
            <Skeleton className="h-[600px] w-full md:w-1/3" />
            <Skeleton className="h-[600px] w-full md:w-2/3" />
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
          <Button onClick={() => router.push('/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  // Not enrolled state
  if (!isEnrolled) {
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
            </div>
          </div>
        </div>

        {/* Enrollment CTA */}
        <div className="container mx-auto px-4 py-12 max-w-7xl flex-1 flex flex-col items-center justify-center">
          <div className="text-center max-w-2xl">
            <h2 className="text-3xl font-bold mb-4">Enroll to Start Learning</h2>
            <p className="text-muted-foreground mb-8">
              You need to enroll in this course to access the learning materials and track your progress.
            </p>
            <Button
              size="lg"
              onClick={handleEnroll}
              disabled={enrolling}
              className="px-8"
            >
              {enrolling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Enroll Now
            </Button>
          </div>
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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/courses')}
                className="hidden md:flex"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back to Courses
              </Button>

              {/* Mobile menu button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold">Course Content</h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Progress value={progress} className="h-2 flex-1" />
                      <span className="text-sm font-medium">{progress}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {completedLessonsCount} of {totalLessons} lessons completed
                    </p>
                  </div>
                  <div className="p-0 overflow-y-auto max-h-[calc(100vh-150px)]">
                    <CourseContent
                      course={course}
                      onSelectLesson={(sectionIndex, lessonIndex, lesson) => {
                        setCurrentSectionIndex(sectionIndex);
                        setCurrentLessonIndex(lessonIndex);
                        setCurrentSection(course.sections[sectionIndex]);
                        setCurrentLesson(lesson);
                        setMobileMenuOpen(false);
                      }}
                      completedLessons={completedLessons || []}
                      isSidebar={true}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <div>
                <h1 className="text-xl md:text-2xl font-bold">{course.title}</h1>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>{currentSection?.title}</span>
                  {currentLesson && (
                    <>
                      <ChevronRight className="h-3 w-3 mx-1" />
                      <span>{currentLesson.title}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden md:flex">
                <Clock className="h-3 w-3 mr-1" />
                {completedLessonsCount}/{totalLessons} lessons
              </Badge>
              <Badge variant="outline" className={cn(
                "hidden md:flex",
                progress === 100 ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : ""
              )}>
                {progress === 100 ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <PlayCircle className="h-3 w-3 mr-1" />
                )}
                {progress}% complete
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Course Content Sidebar - Desktop */}
        <div className={cn(
          "hidden md:block border-r bg-background w-[320px] overflow-y-auto transition-all duration-300",
          !sidebarOpen && "w-0 opacity-0"
        )}>
          <div className="p-4 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Course Content</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                title="Hide sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {completedLessonsCount} of {totalLessons} lessons completed
            </p>
          </div>
          <div className="p-0 overflow-y-auto">
            <CourseContent
              course={course}
              onSelectLesson={(sectionIndex, lessonIndex, lesson) => {
                setCurrentSectionIndex(sectionIndex);
                setCurrentLessonIndex(lessonIndex);
                setCurrentSection(course.sections[sectionIndex]);
                setCurrentLesson(lesson);
              }}
              completedLessons={completedLessons || []}
              isSidebar={true}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Sidebar toggle button - when sidebar is closed */}
          {!sidebarOpen && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="fixed left-4 top-24 z-20 hidden md:flex"
              title="Show course content"
            >
              <Menu className="h-4 w-4 mr-1" />
              <span>Content</span>
            </Button>
          )}

          {/* Course Player */}
          <div className="p-4 md:p-6 max-w-5xl mx-auto">
            {currentLesson ? (
              <CoursePlayer
                lesson={currentLesson}
                onComplete={markLessonComplete}
                onNext={() => navigateLesson('next')}
                onPrevious={() => navigateLesson('prev')}
                hasNext={currentSectionIndex < (course.sections.length - 1) ||
                  currentLessonIndex < (currentSection?.lessons.length - 1)}
                hasPrevious={currentSectionIndex > 0 || currentLessonIndex > 0}
              />
            ) : (
              <div className="text-center py-12">
                <h2 className="text-xl font-bold mb-2">No Lesson Selected</h2>
                <p className="text-muted-foreground mb-6">
                  Please select a lesson from the course content to begin learning.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

