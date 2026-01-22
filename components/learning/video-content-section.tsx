"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Clock,
  Film,
  PlayCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  Lightbulb,
  FileText,
  MessageSquare
} from "lucide-react"
import { YouTubeEmbed } from "@/components/youtube-embed"
import Markdown from "react-markdown"
import { NormalizedLesson, NormalizedCourse } from "@/hooks/use-normalized-course"
import { formatDurationFromSeconds } from "@/lib/utils/duration"
import { CourseOutlineModal } from "./course-outline-modal"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import { Brain } from "lucide-react"

interface VideoContentSectionProps {
  lesson: NormalizedLesson
  course: NormalizedCourse
  onComplete?: () => void
  onNext?: () => void
  onPrevious?: () => void
  hasNext: boolean
  hasPrevious: boolean
  onVideoProgress?: (progress: number) => void
  onSelectLesson?: (sectionIndex: number, lessonIndex: number, lesson: NormalizedLesson) => void
  completedLessons?: string[]
  currentLessonId?: string
}

export function VideoContentSection({
  lesson,
  course,
  onComplete,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  onVideoProgress,
  onSelectLesson,
  completedLessons = [],
  currentLessonId
}: VideoContentSectionProps) {
  const [activeTab, setActiveTab] = useState("content")
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [addingPoint, setAddingPoint] = useState<number | null>(null)

  const createSRSItem = useMutation(api.srs.createItem)

  // Map lesson to SRS format
  const handleAddToSRS = async (point: string, index: number) => {
    try {
      setAddingPoint(index)
      const now = new Date().toISOString()
      const today = now.split("T")[0]

      await createSRSItem({
        courseId: course.id as any,
        lessonId: lesson.id as any,
        front: point,
        back: `Key point from: ${lesson.title}`,
        cardType: "key_point",
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: today,
      })

      toast.success("Added to your review deck", {
        description: "You'll see this in your next review session."
      })
    } catch (err) {
      toast.error("Failed to add to review deck")
    } finally {
      setAddingPoint(null)
    }
  }

  // Extract video ID from lesson data
  const videoId = (() => {
    if (lesson.videoId) return lesson.videoId
    const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/
    if (lesson.content) {
      const contentMatch = lesson.content.match(ytRegex)
      if (contentMatch) return contentMatch[1]
    }
    return null
  })()

  const startSeconds = typeof lesson.timestampStart === "number" && Number.isFinite(lesson.timestampStart)
    ? Math.max(0, Math.floor(lesson.timestampStart))
    : 0
  const endSeconds = typeof lesson.timestampEnd === "number" && Number.isFinite(lesson.timestampEnd)
    ? Math.max(Math.floor(lesson.timestampEnd), startSeconds + 1)
    : undefined

  const rangeLabel = (() => {
    if (startSeconds !== undefined && endSeconds) {
      return `${formatDurationFromSeconds(startSeconds)} – ${formatDurationFromSeconds(endSeconds)}`
    }
    if (startSeconds) {
      return `Starts at ${formatDurationFromSeconds(startSeconds)}`
    }
    return undefined
  })()

  const durationLabel = (() => {
    if (endSeconds && endSeconds > startSeconds) {
      return formatDurationFromSeconds(endSeconds - startSeconds)
    }
    if (typeof lesson.duration === "number" && lesson.duration > 0) {
      return formatDurationFromSeconds(Math.round(lesson.duration * 60))
    }
    return undefined
  })()

  const keyPoints = Array.isArray(lesson.keyPoints)
    ? lesson.keyPoints.filter(Boolean).slice(0, 4)
    : []

  const handleVideoProgress = (progress: number) => {
    setVideoProgress(progress)
    if (progress >= 80 && !videoCompleted) {
      setVideoCompleted(true)
    }
    onVideoProgress?.(progress)
  }

  const renderLessonContent = () => {
    if (!lesson.content) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-center">
            No content available for this lesson. The video above contains the main learning material.
          </p>
        </div>
      )
    }

    return (
      <div className="prose dark:prose-invert max-w-none">
        <Markdown>{lesson.content}</Markdown>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Course Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{course?.title || 'Untitled Course'}</h1>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {course?.progress || 0}% Complete
          </Badge>
        </div>
        <CourseOutlineModal
          course={course}
          onSelectLesson={onSelectLesson}
          completedLessons={completedLessons}
          currentLessonId={currentLessonId}
          trigger={
            <Button variant="outline" size="sm">
              <Menu className="h-4 w-4 mr-2" />
              Course Outline
            </Button>
          }
        />
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Course Progress</span>
          <span>{course?.progress || 0}%</span>
        </div>
        <Progress value={course?.progress || 0} className="h-2" />
      </div>

      {/* Lesson Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Lesson</Badge>
                <span className="text-sm text-muted-foreground">Current</span>
              </div>
              <CardTitle className="text-xl">{lesson?.title || 'Untitled Lesson'}</CardTitle>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {rangeLabel && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {rangeLabel}
                  </span>
                )}
                {durationLabel && (
                  <span className="inline-flex items-center gap-1">
                    <Film className="h-4 w-4" />
                    {durationLabel}
                  </span>
                )}
              </div>
            </div>
            <Button onClick={onComplete} disabled={!videoCompleted}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Video Player */}
      {videoId ? (
        <Card>
          <CardContent className="p-0">
            <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
              <YouTubeEmbed
                videoId={videoId}
                title={lesson?.title || 'Lesson Video'}
                startTime={startSeconds}
                endTime={endSeconds}
              />
            </div>
            {videoProgress > 0 && (
              <div className="p-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span>Video Progress</span>
                  <span>{videoProgress}%</span>
                </div>
                <Progress value={videoProgress} className="mt-2 h-1" />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No video available for this lesson. Please refer to the content below.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Content</span>
          </TabsTrigger>
          <TabsTrigger value="key-points" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span>Key Points</span>
          </TabsTrigger>
          <TabsTrigger value="transcript" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Transcript</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="max-h-[600px] overflow-y-auto">
                {renderLessonContent()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="key-points" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {keyPoints.length > 0 ? (
                <div className="space-y-4">
                  {keyPoints.map((point, index) => (
                    <div key={index} className="flex items-start justify-between gap-3 group">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                          <Lightbulb className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm leading-relaxed">{point}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2"
                        disabled={addingPoint === index}
                        onClick={() => handleAddToSRS(point, index)}
                      >
                        {addingPoint === index ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <Brain className="h-4 w-4 mr-1" />
                        )}
                        <span className="text-xs">Review</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p>No key points available for this lesson</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcript" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Transcript functionality coming soon</p>
                <p className="text-sm mt-2">Full video transcripts will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={onPrevious} disabled={!hasPrevious}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Lesson
            </Button>

            <div className="text-sm text-muted-foreground">
              {hasNext ? "Continue to next lesson" : "Last lesson in course"}
            </div>

            <Button onClick={onNext} disabled={!hasNext}>
              Next Lesson
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
