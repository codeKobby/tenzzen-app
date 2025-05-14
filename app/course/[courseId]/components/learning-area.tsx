"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Menu, X, BookOpen, FileText, MessageSquare, Lightbulb, BarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CourseSidebar } from "./course-sidebar"
import { YouTubeEmbed } from "@/components/youtube-embed"
import { NoteEditor } from "./note-editor"
import { ResourcesPanel } from "./resources-panel"
import { cn } from "@/lib/utils"

interface LearningAreaProps {
  course: any
  courseEnrollment: any
}

export function LearningArea({ course, courseEnrollment }: LearningAreaProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("content")
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [videoProgress, setVideoProgress] = useState(0)
  const [notes, setNotes] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)

  // Log course data on mount
  useEffect(() => {
    console.log("LearningArea mounted with course:", course?.title);
    console.log("Course data:", course);
    console.log("Course enrollment data:", courseEnrollment);

    // Check if we have valid course data
    if (course) {
      console.log("Course structure:", {
        id: course.id,
        title: course.title,
        hasVideoId: !!course.videoId,
        videoId: course.videoId,
        hasSections: Array.isArray(course.sections) && course.sections.length > 0,
        sectionsCount: Array.isArray(course.sections) ? course.sections.length : 0
      });

      // Log the first section and lesson in detail if they exist
      if (course.sections?.[0]) {
        console.log("First section:", course.sections[0]);
        if (course.sections[0].lessons?.[0]) {
          console.log("First lesson:", course.sections[0].lessons[0]);
        }
      }
    }

    // Mark component as loaded
    setIsLoaded(true);
  }, [])

  // Initialize current lesson
  useEffect(() => {
    console.log("Learning area received course:", course?.title)
    console.log("Learning area received courseEnrollment:", courseEnrollment?.courseTitle)

    // Try to get sections from either course or courseEnrollment
    let sections = course?.sections || courseEnrollment?.courseData?.sections || [];

    console.log("Sections data check:", {
      fromCourse: course?.sections ? `${course.sections.length} sections` : "no sections",
      fromEnrollment: courseEnrollment?.courseData?.sections ? `${courseEnrollment.courseData.sections.length} sections` : "no sections",
      usingSource: course?.sections ? "course" : courseEnrollment?.courseData?.sections ? "enrollment" : "none"
    });

    // Create a default section if none exists
    if (!Array.isArray(sections) || sections.length === 0) {
      console.warn("No sections found, creating default section");

      // Create a default section with a lesson using the course video ID
      sections = [{
        title: "Course Content",
        lessons: [{
          id: "default-lesson",
          title: "Full Video",
          videoId: course?.videoId || "qz0aGYrrlhU", // Use course video ID or better fallback
          content: course?.description || "<p>Watch the full video to learn more.</p>"
        }]
      }];

      console.log("Created default section with video ID:", course?.videoId || "qz0aGYrrlhU");

      // Update the course object with our default section
      if (course) {
        course.sections = sections;
      }
    }

    console.log("Sections found or created:", sections.length)

    if (sections.length > 0 && sections[0].lessons?.length > 0) {
      console.log("Setting initial lesson:", sections[0].lessons[0].title)
      console.log("Initial lesson details:", {
        id: sections[0].lessons[0].id,
        title: sections[0].lessons[0].title,
        hasVideoId: !!sections[0].lessons[0].videoId,
        videoId: sections[0].lessons[0].videoId,
        hasContent: !!sections[0].lessons[0].content,
        contentLength: sections[0].lessons[0].content ? sections[0].lessons[0].content.length : 0
      });
      setCurrentLesson(sections[0].lessons[0])
    } else {
      console.warn("No lessons found in course data")
      // Create a default lesson if none exists
      const defaultLesson = {
        id: "default-lesson",
        title: "Introduction",
        content: `<h1>Welcome to ${course?.title || "this course"}</h1><p>This course doesn't have any lessons yet. Please check back later for updated content.</p>`,
        videoId: course?.videoId || "qz0aGYrrlhU" // Use better fallback
      }
      console.log("Created default lesson with video ID:", course?.videoId || "qz0aGYrrlhU");
      setCurrentLesson(defaultLesson)
    }
  }, [courseEnrollment, course])

  // Load saved notes when the lesson changes
  useEffect(() => {
    if (currentLesson?.id) {
      const savedNote = localStorage.getItem(`note-${currentLesson.id}`)
      if (savedNote) {
        setNotes(savedNote)
      } else {
        setNotes("")
      }
    }
  }, [currentLesson])

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Handle lesson selection
  const handleSelectLesson = (sectionIndex: number, lessonIndex: number) => {
    console.log("Selecting lesson:", sectionIndex, lessonIndex);

    // Try to get sections from either course or courseEnrollment
    const sections = course?.sections || courseEnrollment?.courseData?.sections || [];

    console.log("Sections for lesson selection:", {
      count: sections.length,
      hasSectionAtIndex: !!sections[sectionIndex],
      hasLessonsInSection: !!(sections[sectionIndex]?.lessons),
      lessonCount: sections[sectionIndex]?.lessons?.length || 0,
      hasLessonAtIndex: !!(sections[sectionIndex]?.lessons?.[lessonIndex])
    });

    if (
      sections[sectionIndex] &&
      sections[sectionIndex].lessons &&
      sections[sectionIndex].lessons[lessonIndex]
    ) {
      setCurrentSectionIndex(sectionIndex);
      setCurrentLessonIndex(lessonIndex);

      const selectedLesson = sections[sectionIndex].lessons[lessonIndex];
      console.log("Selected lesson:", selectedLesson.title);

      setCurrentLesson(selectedLesson);
      setVideoProgress(0); // Reset video progress
    } else {
      console.warn("Invalid lesson selection:", sectionIndex, lessonIndex);
    }
  }

  // Handle navigation between lessons
  const navigateLesson = (direction: 'next' | 'prev') => {
    // Try to get sections from either course or courseEnrollment
    const sections = course?.sections || courseEnrollment?.courseData?.sections || [];
    if (sections.length === 0) return;

    console.log("Navigating lessons:", {
      direction,
      currentSectionIndex,
      currentLessonIndex,
      sectionsCount: sections.length,
      currentSectionLessonsCount: sections[currentSectionIndex]?.lessons?.length || 0
    });

    let newSectionIndex = currentSectionIndex;
    let newLessonIndex = currentLessonIndex;

    if (direction === 'next') {
      if (newLessonIndex < sections[newSectionIndex]?.lessons?.length - 1) {
        newLessonIndex++;
      } else if (newSectionIndex < sections.length - 1) {
        newSectionIndex++;
        newLessonIndex = 0;
      }
    } else {
      if (newLessonIndex > 0) {
        newLessonIndex--;
      } else if (newSectionIndex > 0) {
        newSectionIndex--;
        newLessonIndex = sections[newSectionIndex]?.lessons?.length - 1 || 0;
      }
    }

    console.log("New lesson indices:", {
      newSectionIndex,
      newLessonIndex,
      changed: newSectionIndex !== currentSectionIndex || newLessonIndex !== currentLessonIndex
    });

    if (newSectionIndex !== currentSectionIndex || newLessonIndex !== currentLessonIndex) {
      handleSelectLesson(newSectionIndex, newLessonIndex);
    }
  }

  // Handle video progress update
  const handleVideoProgress = (progress: number) => {
    setVideoProgress(progress)
  }

  // Handle note changes
  const handleNoteChange = (value: string) => {
    setNotes(value)
    if (currentLesson?.id) {
      localStorage.setItem(`note-${currentLesson.id}`, value)
    }
  }

  // Extract video ID from lesson data
  const videoId = (() => {
    console.log("Extracting video ID for lesson:", currentLesson?.title)

    // Extract course ID from URL for logging purposes only
    const pathParts = window.location.pathname.split('/');
    const courseIdFromUrl = pathParts[pathParts.length - 1];
    console.log("Extracting video ID for course:", courseIdFromUrl);

    // Try to get it directly from the lesson
    if (currentLesson?.videoId) {
      console.log("Found video ID directly in lesson:", currentLesson.videoId)
      return currentLesson.videoId
    }

    // Try to parse from a YouTube URL in content, startTime, or other fields
    const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/

    // Check content for embed codes
    if (currentLesson?.content) {
      const contentMatch = currentLesson.content.match(ytRegex)
      if (contentMatch) {
        console.log("Found video ID in lesson content:", contentMatch[1])
        return contentMatch[1]
      }
    }

    // Check if there's a start time with a video URL
    if (currentLesson?.startTime && typeof currentLesson.startTime === 'string') {
      const startTimeMatch = currentLesson.startTime.match(ytRegex)
      if (startTimeMatch) {
        console.log("Found video ID in lesson startTime:", startTimeMatch[1])
        return startTimeMatch[1]
      }
    }

    // Try to get from course data
    if (course?.videoId) {
      console.log("Using course video ID as fallback:", course.videoId)
      return course.videoId
    }

    // Try to get from course enrollment data
    if (courseEnrollment?.courseData?.videoId) {
      console.log("Using course enrollment video ID as fallback:", courseEnrollment.courseData.videoId)
      return courseEnrollment.courseData.videoId
    }

    // Try to extract from course YouTube URL if available
    if (course?.youtubeUrl) {
      const urlMatch = course.youtubeUrl.match(ytRegex)
      if (urlMatch) {
        console.log("Extracted video ID from course YouTube URL:", urlMatch[1])
        return urlMatch[1]
      }
    }

    // Try to extract from course enrollment YouTube URL if available
    if (courseEnrollment?.courseData?.youtubeUrl) {
      const urlMatch = courseEnrollment.courseData.youtubeUrl.match(ytRegex)
      if (urlMatch) {
        console.log("Extracted video ID from course enrollment YouTube URL:", urlMatch[1])
        return urlMatch[1]
      }
    }

    // No hardcoded fallback
    console.warn("No video ID found, returning null")
    return null
  })()

  // Render lesson content with markdown
  const renderLessonContent = () => {
    if (!currentLesson?.content) {
      return (
        <div className="prose dark:prose-invert max-w-none">
          <h1>{currentLesson?.title || "Lesson Content"}</h1>
          <p>{currentLesson?.description || "No content available for this lesson."}</p>
        </div>
      )
    }

    return (
      <div className="prose dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
      </div>
    )
  }

  // Force render even with minimal data
  useEffect(() => {
    if (isLoaded && (!course || !course.title)) {
      console.log("⚠️ LEARNING AREA - No valid course data, creating minimal course");
      console.log("Current course data:", course);

      // Log the course ID from URL for debugging
      const pathParts = window.location.pathname.split('/');
      const courseIdFromUrl = pathParts[pathParts.length - 1];
      console.log("URL check - courseId from URL:", courseIdFromUrl);

      // For other courses, create a minimal course object to ensure rendering
      const minimalCourse = {
        id: "minimal-course",
        title: "Course Content",
        description: "This course is displaying minimal content due to data loading issues.",
        videoId: null, // No default video
        sections: [{
          title: "Course Content",
          lessons: [{
            id: "minimal-lesson",
            title: "Course Content",
            videoId: null, // No default video
            content: "<h1>Course Content</h1><p>There was an error loading the course content. Please try refreshing the page or return to your courses.</p>"
          }]
        }]
      };

      // Update the course reference
      if (course) {
        Object.assign(course, minimalCourse);
      }

      // Force a re-render
      setCurrentLesson(minimalCourse.sections[0].lessons[0]);
    }
  }, [isLoaded, course]);

  // Show loading state while we're still initializing
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Loading Course</h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
          <p className="text-muted-foreground">
            Please wait while we load your course content...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="h-16 border-b bg-background flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/courses')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-4 font-semibold truncate">
          {course?.title || "Loading Course..."}
        </h1>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Progress value={course?.progress || 0} className="w-24 h-2" />
            <span className="text-xs text-muted-foreground">{course?.progress || 0}%</span>
          </div>
          <Button variant="outline" size="icon" className="md:hidden" onClick={toggleSidebar}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "border-r bg-background transition-all duration-300 ease-in-out",
            sidebarOpen
              ? "w-64 opacity-100"
              : "w-0 opacity-0 -translate-x-full md:translate-x-0 md:w-0 md:opacity-0"
          )}
        >
          <CourseSidebar
            course={course}
            courseEnrollment={courseEnrollment}
            currentSectionIndex={currentSectionIndex}
            currentLessonIndex={currentLessonIndex}
            onSelectLesson={handleSelectLesson}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-4 space-y-6">
            {/* Video Player */}
            {/* Always show video player with fallback ID if needed */}
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
              <YouTubeEmbed
                videoId={videoId || "dQw4w9WgXcQ"} // Always provide a fallback
                title={currentLesson?.title || course?.title || "Course Video"}
                startTime={(() => {
                    console.log("Start time data:", {
                      lessonStartTime: currentLesson?.startTime,
                      type: typeof currentLesson?.startTime
                    });

                    // Handle different formats of startTime
                    if (typeof currentLesson?.startTime === 'number') {
                      return currentLesson.startTime;
                    } else if (typeof currentLesson?.startTime === 'string') {
                      // Try to parse string as number
                      const parsed = parseFloat(currentLesson.startTime);
                      if (!isNaN(parsed)) {
                        return parsed;
                      }

                      // Try to parse timestamp format like "1:30"
                      const timeParts = currentLesson.startTime.split(':');
                      if (timeParts.length === 2) {
                        const minutes = parseInt(timeParts[0], 10);
                        const seconds = parseInt(timeParts[1], 10);
                        if (!isNaN(minutes) && !isNaN(seconds)) {
                          return minutes * 60 + seconds;
                        }
                      }

                      // Try to parse timestamp format like "1:30:45"
                      if (timeParts.length === 3) {
                        const hours = parseInt(timeParts[0], 10);
                        const minutes = parseInt(timeParts[1], 10);
                        const seconds = parseInt(timeParts[2], 10);
                        if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
                          return hours * 3600 + minutes * 60 + seconds;
                        }
                      }
                    }

                    return 0;
                  })()}
                  endTime={(() => {
                    console.log("End time data:", {
                      lessonEndTime: currentLesson?.endTime,
                      type: typeof currentLesson?.endTime
                    });

                    // Handle different formats of endTime
                    if (typeof currentLesson?.endTime === 'number') {
                      return currentLesson.endTime;
                    } else if (typeof currentLesson?.endTime === 'string') {
                      // Try to parse string as number
                      const parsed = parseFloat(currentLesson.endTime);
                      if (!isNaN(parsed)) {
                        return parsed;
                      }

                      // Try to parse timestamp format like "1:30"
                      const timeParts = currentLesson.endTime.split(':');
                      if (timeParts.length === 2) {
                        const minutes = parseInt(timeParts[0], 10);
                        const seconds = parseInt(timeParts[1], 10);
                        if (!isNaN(minutes) && !isNaN(seconds)) {
                          return minutes * 60 + seconds;
                        }
                      }

                      // Try to parse timestamp format like "1:30:45"
                      if (timeParts.length === 3) {
                        const hours = parseInt(timeParts[0], 10);
                        const minutes = parseInt(timeParts[1], 10);
                        const seconds = parseInt(timeParts[2], 10);
                        if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
                          return hours * 3600 + minutes * 60 + seconds;
                        }
                      }
                    }

                    return undefined;
                  })()}
                  onProgressUpdate={handleVideoProgress}
                  enablePiP={true}
                  autoplay={true}
                />
              </div>
            )}

            {/* Lesson Title */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{currentLesson?.title || "Introduction"}</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateLesson('prev')}
                  disabled={currentSectionIndex === 0 && currentLessonIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateLesson('next')}
                  disabled={
                    currentSectionIndex === (courseEnrollment?.courseData?.sections?.length - 1) &&
                    currentLessonIndex === (courseEnrollment?.courseData?.sections[currentSectionIndex]?.lessons?.length - 1)
                  }
                >
                  Next
                </Button>
              </div>
            </div>

            {/* Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="content" className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>Content</span>
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>Notes</span>
                </TabsTrigger>
                <TabsTrigger value="discussion" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>Discussion</span>
                </TabsTrigger>
                <TabsTrigger value="resources" className="flex items-center gap-1">
                  <Lightbulb className="h-4 w-4" />
                  <span>Resources</span>
                </TabsTrigger>
                <TabsTrigger value="quiz" className="flex items-center gap-1">
                  <BarChart className="h-4 w-4" />
                  <span>Quiz</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="min-h-[400px]">
                <div className="border rounded-md p-6 min-h-[400px]">
                  {renderLessonContent()}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="min-h-[400px]">
                <NoteEditor value={notes} onChange={handleNoteChange} lessonId={currentLesson?.id} />
              </TabsContent>

              <TabsContent value="discussion" className="min-h-[400px]">
                <div className="h-full border rounded-md p-4 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <h3 className="font-medium">Discussion Coming Soon</h3>
                    <p className="text-sm text-muted-foreground">
                      Discussion functionality will be available in a future update.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="min-h-[400px]">
                <ResourcesPanel resources={currentLesson?.resources || []} />
              </TabsContent>

              <TabsContent value="quiz" className="min-h-[400px]">
                <div className="h-full border rounded-md p-4 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <h3 className="font-medium">Quizzes Coming Soon</h3>
                    <p className="text-sm text-muted-foreground">
                      Quiz and assessment functionality will be available in a future update.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
