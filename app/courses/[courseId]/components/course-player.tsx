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
import { RichTextEditor } from "@/components/rich-text-editor"
import { useAuth } from "@clerk/nextjs"
import { useNotes } from "@/hooks/use-notes"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDurationFromSeconds } from "@/lib/utils/duration"

interface CoursePlayerProps {
    lesson: NormalizedLesson
    videoOnly?: boolean
    onComplete?: () => void
    onNext?: () => void
    onPrevious?: () => void
    hasNext?: boolean
    hasPrevious?: boolean
    onVideoEnd?: () => void
}

export function CoursePlayer({
    lesson,
    videoOnly = false,
    onComplete,
    onNext,
    onPrevious,
    hasNext = false,
    hasPrevious = false,
    onVideoEnd
}: CoursePlayerProps) {
    const [activeTab, setActiveTab] = useState("content")
    const [videoProgress, setVideoProgress] = useState(0)
    const [videoCompleted, setVideoCompleted] = useState(false)
    const [readingProgress, setReadingProgress] = useState(0)
    const [showCompletionPrompt, setShowCompletionPrompt] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)

    // Auth
    const { userId, isSignedIn } = useAuth()

    // Notes state
    const [noteContent, setNoteContent] = useState("")
    const [noteTitle, setNoteTitle] = useState("")
    const [isCreatingNote, setIsCreatingNote] = useState(false)
    const [isSavingNote, setIsSavingNote] = useState(false)
    const [showNewNoteForm, setShowNewNoteForm] = useState(false)

    // Use the notes hook to fetch and manage notes for this lesson
    const {
        notes: lessonNotes,
        loading: notesLoading,
        createNote,
        updateNote
    } = useNotes({
        lessonId: lesson.id,
        autoRefresh: false
    })

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

    // Handle note content change
    const handleNoteContentChange = (content: string) => {
        setNoteContent(content)
    }

    // Handle creating a new note
    const handleCreateNote = async () => {
        if (!isSignedIn) {
            toast.error("Please sign in to save notes")
            return
        }

        if (!noteTitle.trim()) {
            toast.error("Please enter a note title")
            return
        }

        try {
            setIsSavingNote(true)

            const newNote = await createNote({
                title: noteTitle,
                content: noteContent,
                category: "course",
                lessonId: lesson.id,
                courseId: lesson.courseId,
                tags: ["lesson-note"]
            })

            if (newNote) {
                toast.success("Note saved successfully")
                setShowNewNoteForm(false)
                setNoteTitle("")
                setNoteContent("")
            }
        } catch (error) {
            console.error("Error creating note:", error)
            toast.error("Failed to save note")
        } finally {
            setIsSavingNote(false)
        }
    }

    // Load saved notes when the lesson changes
    useEffect(() => {
        // Initialize with empty content for new notes
        setNoteContent("")
        setNoteTitle(`Notes: ${lesson.title}`)
    }, [lesson.id, lesson.title])

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
            {videoId ? (
                <div className="bg-black w-full h-full">
                    <YouTubeEmbed
                        videoId={videoId}
                        title={lesson.title}
                        startTime={startSeconds}
                        endTime={endSeconds}
                        autoplay={true}
                        onProgressUpdate={handleVideoProgress}
                        onVideoEnd={onVideoEnd}
                    />
                </div>
            ) : (
                <div className="bg-muted/30 w-full h-full flex items-center justify-center p-6">
                    <p className="text-muted-foreground text-center">
                        No video available for this lesson. Please refer to the content below.
                    </p>
                </div>
            )}

            {/* Only show tabs and other content if not videoOnly mode */}
            {!videoOnly && (
                <>
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
                                className="h-full max-h-[500px] overflow-y-auto border rounded-md p-4 md:p-6 bg-card"
                            >
                                {renderLessonContent()}
                            </div>
                        </TabsContent>

                        <TabsContent value="notes" className="min-h-[400px]">
                            <div className="h-full max-h-[500px] border rounded-md p-4 flex flex-col bg-card">
                                {!isSignedIn ? (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
                                        <h3 className="font-medium mb-2">Sign in to take notes</h3>
                                        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                                            Sign in to create and save notes for this lesson. Your notes will be accessible from your library.
                                        </p>
                                        <Button asChild>
                                            <a href="/sign-in">Sign In</a>
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        {showNewNoteForm ? (
                                            <div className="flex flex-col h-full">
                                                <div className="mb-4">
                                                    <Label htmlFor="note-title">Note Title</Label>
                                                    <Input
                                                        id="note-title"
                                                        value={noteTitle}
                                                        onChange={(e) => setNoteTitle(e.target.value)}
                                                        placeholder="Enter a title for your note"
                                                        className="mb-2"
                                                    />
                                                </div>
                                                <div className="flex-1 min-h-[300px]">
                                                    <RichTextEditor
                                                        content={noteContent}
                                                        onChange={handleNoteContentChange}
                                                        placeholder="Write your notes for this lesson here..."
                                                        minHeight="300px"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 mt-4">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setShowNewNoteForm(false)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={handleCreateNote}
                                                        disabled={isSavingNote || !noteTitle.trim()}
                                                    >
                                                        {isSavingNote ? (
                                                            <>Saving...</>
                                                        ) : (
                                                            <>
                                                                <Save className="h-4 w-4 mr-1" />
                                                                Save Note
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {notesLoading ? (
                                                    <div className="flex items-center justify-center h-full">
                                                        <p className="text-muted-foreground">Loading notes...</p>
                                                    </div>
                                                ) : lessonNotes.length > 0 ? (
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <h3 className="font-medium">Your Notes for This Lesson</h3>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setShowNewNoteForm(true)}
                                                            >
                                                                <Plus className="h-4 w-4 mr-1" />
                                                                New Note
                                                            </Button>
                                                        </div>
                                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                                            {lessonNotes.map((note) => (
                                                                <Card key={note.id} className="overflow-hidden">
                                                                    <CardContent className="p-4">
                                                                        <h4 className="font-medium mb-2">{note.title}</h4>
                                                                        <div
                                                                            className="prose dark:prose-invert max-w-none text-sm line-clamp-3"
                                                                            dangerouslySetInnerHTML={{ __html: note.content }}
                                                                        />
                                                                        <div className="flex justify-end mt-2">
                                                                            <Button
                                                                                variant="link"
                                                                                size="sm"
                                                                                asChild
                                                                                className="h-8 px-2"
                                                                            >
                                                                                <a href={`/library/${note.id}`} target="_blank">
                                                                                    View Full Note
                                                                                </a>
                                                                            </Button>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full">
                                                        <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
                                                        <h3 className="font-medium mb-2">No Notes Yet</h3>
                                                        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                                                            You haven't created any notes for this lesson yet. Create your first note to keep track of important information.
                                                        </p>
                                                        <Button onClick={() => setShowNewNoteForm(true)}>
                                                            <Plus className="h-4 w-4 mr-1" />
                                                            Create Note
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
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

                        <TabsContent value="resources" className="min-h-[400px]">
                            <div className="h-full max-h-[500px] border rounded-md p-4 overflow-y-auto bg-card">
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
                        <Button variant="ghost" onClick={onPrevious} disabled={!hasPrevious}>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Previous Lesson
                        </Button>

                        <Button variant={hasNext ? "default" : "ghost"} onClick={onNext} disabled={!hasNext}>
                            Next Lesson
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
