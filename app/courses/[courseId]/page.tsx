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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@clerk/nextjs"
import { getUserEnrollments } from "@/lib/local-storage"
import { formatEnrollmentToCourse } from "@/lib/course-utils"
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

export default function CoursePage() {
  const { courseId } = useParams() as { courseId: string }
  const router = useRouter()
  const { userId } = useAuth()
  
  const [course, setCourse] = useState<any>(null)
  const [courseEnrollment, setCourseEnrollment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("content")
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Add console logging for debugging
  useEffect(() => {
    console.log("CourseId from params:", courseId);
  }, [courseId]);

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      if (!userId) {
        console.log("No userId available, waiting for auth");
        return;
      }

      try {
        console.log("Fetching course with ID:", courseId);
        
        // Get enrollments from localStorage
        const userEnrollments = getUserEnrollments(userId);
        console.log(`Found ${userEnrollments.length} enrollments for user:`, userEnrollments);
        
        if (userEnrollments.length === 0) {
          console.log("No enrollments found, redirecting to courses page");
          router.replace('/courses');
          return;
        }
        
        // Try to find the exact course
        let enrollment = null;
        
        // First try direct match
        enrollment = userEnrollments.find(e => e.courseId === courseId);
        
        // If not found, try formatted ID match
        if (!enrollment) {
          for (const e of userEnrollments) {
            const formattedId = `local-${e.courseTitle.replace(/\s+/g, '-').toLowerCase()}`;
            if (formattedId === courseId) {
              enrollment = e;
              break;
            }
          }
        }
        
        // If still not found, use the first enrollment
        if (!enrollment && userEnrollments.length > 0) {
          enrollment = userEnrollments[0];
          const firstCourseId = `local-${enrollment.courseTitle.replace(/\s+/g, '-').toLowerCase()}`;
          
          if (firstCourseId !== courseId) {
            console.log(`Redirecting to first available course: ${firstCourseId}`);
            router.replace(`/courses/${firstCourseId}`);
            return;
          }
        }
        
        if (!enrollment) {
          setError("Course not found in your enrollments");
          setLoading(false);
          return;
        }
        
        // We have a valid enrollment now!
        console.log("Using enrollment:", enrollment);
        
        // Store the raw enrollment data
        setCourseEnrollment(enrollment);
        
        // Format the course for display
        const formattedCourse = formatEnrollmentToCourse(enrollment);
        console.log("Formatted course:", formattedCourse);
        setCourse(formattedCourse);
        
        // Set current lesson
        const sections = enrollment.courseData.sections || [];
        if (sections.length > 0 && sections[0].lessons?.length > 0) {
          setCurrentLesson(sections[0].lessons[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading course:", error);
        setError("Failed to load course data");
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, userId, router]);

  // Navigation functions
  const navigateLesson = (direction: 'next' | 'prev') => {
    if (!courseEnrollment?.courseData?.sections) return;
    
    const sections = courseEnrollment.courseData.sections;
    let newSectionIndex = currentSectionIndex;
    let newLessonIndex = currentLessonIndex;
    
    if (direction === 'next') {
      if (newLessonIndex < sections[newSectionIndex].lessons.length - 1) {
        newLessonIndex++;
      } 
      else if (newSectionIndex < sections.length - 1) {
        newSectionIndex++;
        newLessonIndex = 0;
      }
    } else {
      if (newLessonIndex > 0) {
        newLessonIndex--;
      } 
      else if (newSectionIndex > 0) {
        newSectionIndex--;
        newLessonIndex = sections[newSectionIndex].lessons.length - 1;
      }
    }
    
    if (newSectionIndex !== currentSectionIndex || newLessonIndex !== currentLessonIndex) {
      setCurrentSectionIndex(newSectionIndex);
      setCurrentLessonIndex(newLessonIndex);
      setCurrentLesson(sections[newSectionIndex].lessons[newLessonIndex]);
    }
  };
  
  // Mark lesson complete
  const markLessonComplete = () => {
    // Add implementation here
  };

  console.log("Render state:", { loading, error, hasCourse: !!course });

  if (loading) {
    return <CoursePageSkeleton />;
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4 p-6 max-w-md">
          <h1 className="text-xl font-semibold text-foreground">Error Loading Course</h1>
          <p className="text-sm text-muted-foreground">
            {error || "This course could not be loaded. It may not exist or you don't have access to it."}
          </p>
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={() => router.push('/courses')}>
              Back to Courses
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry Loading
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* Only show condensed header when viewing a lesson */}
      {currentLesson && activeTab === "content" ? (
        <div className="bg-background border-b sticky top-0 z-10">
          <div className="container max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-lg font-medium truncate max-w-[50%]">{currentLesson.title}</h1>
            
            <div className="flex items-center gap-2">
              <Progress 
                value={course.progress} 
                className="w-36 h-2" 
              />
              <span className="text-xs font-medium">{course.progress}%</span>
            </div>
          </div>
        </div>
      ) : (
        /* Course Hero Section */
        <div className="relative bg-gradient-to-b from-black/60 to-background">
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={course.thumbnail || "/placeholders/course-thumbnail.jpg"}
              alt={course.title}
              fill
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/70" />
          </div>
          
          <div className="container relative z-10 py-8 px-4 mx-auto max-w-7xl">
            {/* Course Title & Info */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
              {/* Course Thumbnail */}
              <div className="relative aspect-video w-full md:w-2/5 lg:w-1/3 rounded-lg overflow-hidden shrink-0">
                <Image
                  src={course.thumbnail || "/placeholders/course-thumbnail.jpg"}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center hover:bg-black/40 transition-all group">
                  <PlayCircle className="w-16 h-16 text-white opacity-0 group-hover:opacity-90 transition-opacity" />
                </div>
              </div>

              {/* Course Info */}
              <div className="flex flex-col gap-4 flex-1">
                <div>
                  <Badge variant="outline" className="mb-2">
                    {course.category}
                  </Badge>
                  <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
                  <p className="text-muted-foreground mt-2">{course.description}</p>
                </div>

                {/* Course Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Course Progress</span>
                    <span className="text-sm text-muted-foreground">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>

                {/* Course Stats */}
                <div className="flex flex-wrap gap-x-6 gap-y-3 mt-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{course.topics?.total || 0} lessons</span>
                  </div>
                  {course.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{course.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {course.enrolledCount && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{course.enrolledCount.toLocaleString()} enrolled</span>
                    </div>
                  )}
                </div>

                {/* Course Sources */}
                {course.sources && course.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">Sources:</span>
                    <div className="flex -space-x-2">
                      {course.sources.map((source: any, idx: number) => (
                        <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={source.avatar} alt={source.name} />
                          <AvatarFallback>{source.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                )}

                {/* Call to Action */}
                <div className="flex gap-3 mt-4">
                  <Button size="lg" onClick={() => {
                    if (currentLesson) {
                      setActiveTab("content");
                    } else if (course) {
                      // Find first uncompleted lesson
                      const sections = courseEnrollment?.courseData?.sections || [];
                      for (let i = 0; i < sections.length; i++) {
                        for (let j = 0; j < sections[i].lessons?.length || 0; j++) {
                          if (!courseEnrollment?.completedLessons?.includes(`${i}-${j}`)) {
                            setCurrentSectionIndex(i);
                            setCurrentLessonIndex(j);
                            setCurrentLesson(sections[i].lessons[j]);
                            setActiveTab("content");
                            return;
                          }
                        }
                      }
                      // If all completed, start with first lesson
                      if (sections.length > 0 && sections[0].lessons?.length > 0) {
                        setCurrentSectionIndex(0);
                        setCurrentLessonIndex(0);
                        setCurrentLesson(sections[0].lessons[0]);
                        setActiveTab("content");
                      }
                    }
                  }}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Continue Learning
                  </Button>
                  <Button size="lg" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Notes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-6 max-w-7xl flex-1 flex flex-col">
        {activeTab === "content" && currentLesson ? (
          <div className="flex-1 flex flex-col">
            <CoursePlayer 
              lesson={currentLesson}
              onComplete={markLessonComplete}
              onNext={() => navigateLesson('next')}
              onPrevious={() => navigateLesson('prev')}
              hasNext={currentSectionIndex < (courseEnrollment?.courseData?.sections?.length - 1) || 
                      currentLessonIndex < (courseEnrollment?.courseData?.sections[currentSectionIndex]?.lessons?.length - 1)}
              hasPrevious={currentSectionIndex > 0 || currentLessonIndex > 0}
            />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex justify-start p-1 gap-1 bg-muted/40 w-full md:w-auto overflow-x-auto">
              <TabsTrigger value="content" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="whitespace-nowrap">Content</span>
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="whitespace-nowrap">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="whitespace-nowrap">Resources</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="whitespace-nowrap">Settings</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="content" className="mt-0">
                <CourseContent 
                  course={course} 
                  rawCourse={courseEnrollment?.courseData}
                  onSelectLesson={(sectionIndex, lessonIndex, lesson) => {
                    setCurrentSectionIndex(sectionIndex);
                    setCurrentLessonIndex(lessonIndex);
                    setCurrentLesson(lesson);
                    setActiveTab("content");
                  }}
                  completedLessons={courseEnrollment?.completedLessons || []}
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

      {/* Debug button */}
      <DebugButton />
    </div>
  );
}

function CoursePageSkeleton() {
  return (
    <div className="flex flex-col w-full">
      <div className="relative bg-gradient-to-b from-black to-background">
        <div className="absolute inset-0 bg-background/80" />
        
        <div className="container relative z-10 py-8 px-4 mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
            {/* Thumbnail Skeleton */}
            <Skeleton className="aspect-video w-full md:w-2/5 lg:w-1/3 rounded-lg" />

            {/* Info Skeleton */}
            <div className="flex flex-col gap-4 flex-1 w-full">
              <div>
                <Skeleton className="h-5 w-16 mb-2" />
                <Skeleton className="h-8 w-4/5 mb-3" />
                <Skeleton className="h-4 w-full max-w-lg" />
                <Skeleton className="h-4 w-full max-w-sm mt-2" />
              </div>

              {/* Progress Skeleton */}
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>

              {/* Stats Skeleton */}
              <div className="flex flex-wrap gap-4 mt-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>

              {/* CTA Skeleton */}
              <div className="flex gap-3 mt-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Skeleton className="h-10 w-full max-w-md mb-6" />
        
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-10 w-full rounded-md" />
              <div className="pl-6">
                {Array(3).fill(0).map((_, j) => (
                  <Skeleton key={`${i}-${j}`} className="h-12 w-full my-2 rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}