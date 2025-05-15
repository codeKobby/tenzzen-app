"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Copy,
    Download,
    BookOpen,
    FileText,
    MessageSquare,
    Lightbulb,
    ThumbsUp
} from "lucide-react"
import { YouTubeEmbed } from "@/components/youtube-embed"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import Markdown from "react-markdown"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { NormalizedLesson } from "@/hooks/use-normalized-course"

interface CoursePlayerProps {
    lesson: NormalizedLesson
    onComplete?: () => void
    onNext?: () => void
    onPrevious?: () => void
    hasNext: boolean
    hasPrevious: boolean
}

export function CoursePlayer({
    lesson,
    onComplete,
    onNext,
    onPrevious,
    hasNext,
    hasPrevious
}: CoursePlayerProps) {
    const [activeTab, setActiveTab] = useState("content")
    const [videoProgress, setVideoProgress] = useState(0)
    const [videoCompleted, setVideoCompleted] = useState(false)
    const [readingProgress, setReadingProgress] = useState(0)
    const [showCompletionPrompt, setShowCompletionPrompt] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)
    const [notes, setNotes] = useState("")

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

        // Check if there's a start time with a video URL
        if (lesson.startTime && typeof lesson.startTime === 'string') {
            const startTimeMatch = lesson.startTime.match(ytRegex)
            if (startTimeMatch) return startTimeMatch[1]
        }

        // Fallback to a default video
        return "dQw4w9WgXcQ" // Default video as fallback
    })()

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
            return <p className="text-muted-foreground">No content available for this lesson.</p>
        }

        return (
            <div className="prose dark:prose-invert max-w-none">
                <Markdown>{lesson.content || `
# ${lesson.title}

${lesson.description || 'No description available for this lesson.'}

## Key Points

- The main concepts covered in this lesson include core fundamentals
- How to implement practical examples in your own projects
- Best practices for writing clean, maintainable code

## Example Code

\`\`\`javascript
// Sample code for this lesson
function calculateExample(a, b) {
  return a * b;
}

// Usage
const result = calculateExample(5, 10);
console.log(result); // 50
\`\`\`

## Summary

This lesson covered important concepts that will be built upon in future lessons. Make sure to practice the examples before moving on to the next section.
        `}</Markdown>
            </div>
        )
    }

    // Handle note taking
    const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value)
        // In a real app, you would save notes to the server or localStorage
        localStorage.setItem(`note-${lesson.id}`, e.target.value)
    }

    // Load saved notes when the lesson changes
    useEffect(() => {
        const savedNote = localStorage.getItem(`note-${lesson.id}`)
        if (savedNote) {
            setNotes(savedNote)
        } else {
            setNotes("")
        }
    }, [lesson.id])

    // Handle marking lesson as completed
    const handleCompleteLesson = () => {
        if (onComplete) {
            onComplete()
            setShowCompletionPrompt(false)
        }
    }

    return (
        <div className="flex flex-col space-y-6">
            {/* Lesson title and navigation */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold truncate">{lesson.title}</h1>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onPrevious}
                        disabled={!hasPrevious}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onNext}
                        disabled={!hasNext}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>

            {/* Video player (if available) */}
            {videoId && (
                <div className="bg-black rounded-lg overflow-hidden">
                    <YouTubeEmbed
                        videoId={videoId}
                        title={lesson.title}
                        startTime={typeof lesson.startTime === 'number' ? lesson.startTime : 0}
                        endTime={typeof lesson.endTime === 'number' ? lesson.endTime : undefined}
                        onProgressUpdate={handleVideoProgress}
                    />
                </div>
            )}

            {/* Content tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <TabsList className="grid grid-cols-4 mb-4">
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
                </TabsList>

                <TabsContent value="content" className="min-h-[400px] flex-1">
                    <div
                        ref={contentRef}
                        className="h-full overflow-y-auto border rounded-md p-6"
                    >
                        {renderLessonContent()}
                    </div>
                </TabsContent>

                <TabsContent value="notes" className="min-h-[400px]">
                    <div className="h-full border rounded-md p-4 flex flex-col">
                        <textarea
                            className="flex-1 outline-none resize-none bg-transparent p-2"
                            placeholder="Add your notes for this lesson here..."
                            value={notes}
                            onChange={handleNoteChange}
                        />
                        <div className="flex justify-end gap-2 mt-2 border-t pt-3">
                            <Button variant="outline" size="sm" onClick={() => {
                                navigator.clipboard.writeText(notes)
                                toast.success("Notes copied to clipboard")
                            }}>
                                <Copy className="h-3.5 w-3.5 mr-1" />
                                Copy
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => {
                                const blob = new Blob([notes], { type: 'text/plain' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `notes-${lesson.title.replace(/\s+/g, '-')}.txt`
                                document.body.appendChild(a)
                                a.click()
                                document.body.removeChild(a)
                                URL.revokeObjectURL(url)
                                toast.success("Notes downloaded")
                            }}>
                                <Download className="h-3.5 w-3.5 mr-1" />
                                Download
                            </Button>
                        </div>
                    </div>
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
                    <div className="h-full border rounded-md p-4">
                        {lesson.resources && lesson.resources.length > 0 ? (
                            <div className="grid gap-3">
                                {lesson.resources.map((resource: any, i: number) => (
                                    <Card key={i}>
                                        <CardContent className="p-3 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium">{resource.title}</h4>
                                                <p className="text-xs text-muted-foreground">{resource.description}</p>
                                            </div>
                                            <Button size="sm" variant="outline" asChild>
                                                <a
                                                    href={resource.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Open
                                                </a>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center h-full flex flex-col items-center justify-center">
                                <Lightbulb className="h-12 w-12 text-muted-foreground/40 mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    No resources available for this lesson.
                                </p>
                            </div>
                        )}
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

            {/* Navigation buttons at the bottom */}
            <div className="flex justify-between mt-4 pt-4 border-t">
                <Button
                    variant="ghost"
                    onClick={onPrevious}
                    disabled={!hasPrevious}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous Lesson
                </Button>

                <Button
                    onClick={handleCompleteLesson}
                    variant="outline"
                >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                </Button>

                <Button
                    variant={hasNext ? "default" : "ghost"}
                    onClick={onNext}
                    disabled={!hasNext}
                >
                    Next Lesson
                    <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    )
}
