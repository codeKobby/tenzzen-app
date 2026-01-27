"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Clock,
    Copy,
    Download,
    BookOpen,
    FileText,
    Film,
    MessageSquare,
    Lightbulb,
    ThumbsUp,
    Save,
    Plus
} from "lucide-react"
import { YouTubeEmbed } from "@/components/youtube-embed"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import Markdown from "react-markdown"
import { Progress } from "@/components/ui/progress"
import { NormalizedLesson } from "@/hooks/use-normalized-course"
import { LessonNoteEditor } from "./lesson-note-editor"
import { useAuth } from "@clerk/nextjs"
import { formatDurationFromSeconds } from "@/lib/utils/duration"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

export function CoursePlayer({
    lesson,
    courseId,
    videoOnly = false,
    onComplete,
    onNext,
    onPrevious,
    hasNext = false,
    hasPrevious = false,
    onVideoEnd,
    onSeekBeyondLesson
}: CoursePlayerProps) {
    const [activeTab, setActiveTab] = useState("content")
    const [videoProgress, setVideoProgress] = useState(0)
    const [videoCompleted, setVideoCompleted] = useState(false)
    const [readingProgress, setReadingProgress] = useState(0)
    const [showCompletionPrompt, setShowCompletionPrompt] = useState(false)
    const [currentTime, setCurrentTime] = useState(0) // Track current video time
    const contentRef = useRef<HTMLDivElement>(null)

    // Auth & Data Fetching
    const { userId, isSignedIn } = useAuth()
    const userProgress = useQuery(
        api.userProgress.getUserProgress,
        userId ? { courseId: courseId as Id<"courses"> } : "skip"
    )
    const updateUserProgress = useMutation(api.userProgress.updateUserProgress)

    // Handle time updates from the video player
    const handleTimeUpdate = (time: number) => {
        setCurrentTime(time) // Update local state for notes

        if (!userId || !courseId) return

        // Persist playback using stable lesson id instead of ambiguous numeric index
        updateUserProgress({
            courseId: courseId as Id<"courses">,
            lastPlaybackTime: {
                lessonId: lesson.id as any,
                time: Math.round(time)
            }
        })
    }

    // Handle seeking video from notes
    const handleSeek = (time: number) => {
        setResumeStartTime(time)
        // Note: setting resumeStartTime triggers YouTubeEmbed to reload/seek
        // In a more advanced implementation, we might expose a seekTo method on YouTubeEmbed
    }

    // Extract video ID from lesson data
    const videoId = (() => {
        // Try to get it directly from the lesson
        if (lesson.videoId) return lesson.videoId

        // Try to parse from a YouTube URL in content, startTime, or other fields
        const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/

        // Check content for embed codes
        if (lesson.content) {
            const contentMatch = lesson.content.match(ytRegex)
            if (contentMatch) return contentMatch[1]
        }

        // No video ID found
        return null
    })()

    // Stable resume start time: apply once per lesson to avoid reload loops
    const [resumeStartTime, setResumeStartTime] = useState<number>(() => {
        if (typeof lesson.timestampStart === "number" && Number.isFinite(lesson.timestampStart)) {
            return Math.max(0, Math.floor(lesson.timestampStart))
        }
        return 0
    })
    const appliedResumeRef = useRef<string | null>(null) // tracks lesson.id when resume was applied

    // Reset baseline when lesson changes
    useEffect(() => {
        appliedResumeRef.current = null
        const baseline = (typeof lesson.timestampStart === "number" && Number.isFinite(lesson.timestampStart))
            ? Math.max(0, Math.floor(lesson.timestampStart))
            : 0
        setResumeStartTime(baseline)
    }, [lesson.id])

    // If we have saved progress for this lesson and haven't applied it yet, set once
    useEffect(() => {
        if (!userProgress?.lastPlaybackTime) return
        if (appliedResumeRef.current === lesson.id) return
        // Compare by stable lesson id to avoid collisions from per-section numeric indexes
        if (userProgress.lastPlaybackTime.lessonId !== lesson.id) return
        const savedTime = Math.max(0, Math.floor(userProgress.lastPlaybackTime.time))
        // Avoid overriding the lesson's canonical start with tiny/zero saved times which cause a snap-to-start
        const canonicalStart = (typeof lesson.timestampStart === "number" && Number.isFinite(lesson.timestampStart)) ? Math.max(0, Math.floor(lesson.timestampStart)) : 0
        const meaningfulThreshold = canonicalStart + 2 // require at least 2s beyond the canonical start
        console.log(`[CoursePlayer] Candidate resume for lesson ${lesson.orderIndex}: saved=${savedTime}s canonicalStart=${canonicalStart}s threshold=${meaningfulThreshold}s`)

        if (savedTime <= meaningfulThreshold) {
            // Not meaningful progress — don't override the lesson's start time
            console.log(`[CoursePlayer] Ignoring saved resume time (${savedTime}s) because it's <= threshold (${meaningfulThreshold}s)`)
            appliedResumeRef.current = lesson.id
            return
        }

        console.log(`[CoursePlayer] Resuming lesson ${lesson.orderIndex} from saved time: ${savedTime}s`)
        setResumeStartTime(prev => (prev !== savedTime ? savedTime : prev))
        appliedResumeRef.current = lesson.id
    }, [userProgress?.lastPlaybackTime, lesson.orderIndex, lesson.id])

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

    // Handle scrolling in content area to track reading progress
    useEffect(() => {
        const trackReadingProgress = () => {
            if (!contentRef.current) return

            const { scrollTop, scrollHeight, clientHeight } = contentRef.current
            const totalScrollable = scrollHeight - clientHeight

            if (totalScrollable <= 0) {
                // Content fits without scrolling, consider it "read"
                setReadingProgress(100)
                return
            }

            const progress = Math.min(100, Math.round((scrollTop / totalScrollable) * 100))
            setReadingProgress(progress)

            // Consider it read if scrolled to 80% or more
            if (progress >= 80 && !videoId) {
                setVideoCompleted(true)
                setShowCompletionPrompt(true)
            }
        }

        const contentElement = contentRef.current
        if (contentElement) {
            contentElement.addEventListener('scroll', trackReadingProgress)
            // Initialize progress
            trackReadingProgress()
        }

        return () => {
            if (contentElement) {
                contentElement.removeEventListener('scroll', trackReadingProgress)
            }
        }
    }, [lesson, videoId])

    // Track when video has been watched enough to mark complete
    const handleVideoProgress = (progress: number) => {
        setVideoProgress(progress)

        // Consider video completed if watched 80% or more
        if (progress >= 80 && !videoCompleted) {
            setVideoCompleted(true)
            setShowCompletionPrompt(true)
        }
    }

    // Generate lesson content with markdown support
    const renderLessonContent = () => {
        if (!lesson.content) {
            return (
                <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-muted-foreground text-center">
                        No content available for this lesson. The video above contains the main learning material.
                    </p>
                </div>
            );
        }

        return (
            <div className="prose dark:prose-invert max-w-none">
                <Markdown>{lesson.content}</Markdown>
            </div>
        )
    }







    // Handle marking lesson as completed
    const handleCompleteLesson = () => {
        if (onComplete) {
            onComplete()
            setShowCompletionPrompt(false)
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Video player (if available) */}
            <div className="relative w-full">
                {videoId ? (
                    <YouTubeEmbed
                        videoId={videoId}
                        startTime={resumeStartTime}
                        endTime={endSeconds}
                        autoplay
                        onProgressUpdate={handleVideoProgress}
                        onVideoEnd={onVideoEnd}
                        onSeekBeyondLesson={onSeekBeyondLesson}
                        onTimeUpdate={handleTimeUpdate} // <-- Pass the handler
                    />
                ) : (
                    <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center">
                        <p className="text-muted-foreground text-center p-4">
                            No video available for this lesson. Please refer to the content below.
                        </p>
                    </div>
                )}

            </div>

            {/* Only show tabs and other content if not videoOnly mode */}
            {!videoOnly && (
                <>
                    {/* Content tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                        <TabsList className="grid grid-cols-3 mb-4">
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
                        </TabsList>

                        <TabsContent value="content" className="min-h-[400px] flex-1">
                            <div
                                ref={contentRef}
                                className="h-full max-h-[500px] overflow-y-auto border rounded-md p-4 md:p-6 bg-card"
                            >
                                {renderLessonContent()}
                            </div>
                        </TabsContent>

                        <TabsContent value="notes" className="min-h-[400px]">
                            <div className="h-full border rounded-md overflow-hidden bg-card">
                                <LessonNoteEditor
                                    courseId={courseId}
                                    lessonId={lesson.id}
                                    lessonTitle={lesson.title}
                                    currentTime={currentTime}
                                    onSeek={handleSeek}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="discussion" className="min-h-[400px]">
                            <div className="h-full max-h-[500px] border rounded-md p-4 flex items-center justify-center bg-card">
                                <div className="text-center">
                                    <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                                    <h3 className="font-medium">Discussion Coming Soon</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Discussion functionality will be available in a future update.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Completion prompt */}
                    {showCompletionPrompt && (
                        <Card className="mt-6 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/20">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 dark:bg-green-900/40 rounded-full p-2">
                                        <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">Ready to mark as completed?</h4>
                                        <p className="text-sm text-muted-foreground">
                                            You've made great progress on this lesson.
                                        </p>
                                    </div>
                                </div>
                                <Button onClick={handleCompleteLesson}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark Complete
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Progress indicators */}
                    <div className="flex flex-col gap-2">
                        {videoId && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground whitespace-nowrap w-24">Video</span>
                                <Progress value={videoProgress} className="flex-1" />
                                <span className="text-sm text-muted-foreground whitespace-nowrap w-10">{videoProgress}%</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground whitespace-nowrap w-24">Reading</span>
                            <Progress value={readingProgress} className="flex-1" />
                            <span className="text-sm text-muted-foreground whitespace-nowrap w-10">{readingProgress}%</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
