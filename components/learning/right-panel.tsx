"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  FileText,
  Lightbulb,
  Info,
  Plus,
  Save,
  Users,
  BookOpen,
  Target,
  Shield,
  Award,
  CheckCircle2
} from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { useNotes } from "@/hooks/use-notes"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { NormalizedCourse, NormalizedLesson } from "@/hooks/use-normalized-course"
import { CourseResources } from "@/app/courses/[courseId]/components/course-resources"

interface RightPanelProps {
  course: NormalizedCourse
  currentLesson?: NormalizedLesson
  progress: number
  completedLessons: string[]
  totalLessons: number
  isEnrolled: boolean
  onEnroll?: () => void
  enrolling?: boolean
}

export function RightPanel({
  course,
  currentLesson,
  progress,
  completedLessons,
  totalLessons,
  isEnrolled,
  onEnroll,
  enrolling = false
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState("notes")
  const [noteContent, setNoteContent] = useState("")
  const [noteTitle, setNoteTitle] = useState("")
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [showNewNoteForm, setShowNewNoteForm] = useState(false)

  const { userId, isSignedIn } = useAuth()

  // Use the notes hook for the current lesson
  const {
    notes: lessonNotes,
    loading: notesLoading,
    createNote,
    updateNote
  } = useNotes({
    lessonId: currentLesson?.id,
    autoRefresh: false
  })

  const metadata = course?.metadata || {}
  const learningHighlights = (metadata.objectives?.filter(Boolean) || []).slice(0, 4)
  const resourceCount = metadata.resources?.length || 0
  const instructorProfile = {
    name: metadata.instructor?.name || metadata.instructorName || "Tenzzen Course Team",
    title: metadata.instructor?.title || metadata.instructorTitle || "Program Directors",
    avatar: metadata.instructor?.avatar || metadata.instructorAvatar || course?.thumbnail,
    bio: metadata.instructor?.bio || metadata.instructorBio || "Our learning strategists curate the best playlists, transcripts, and assignments so you can focus on mastering the craft without context switching."
  }

  const courseIncludes = [
    {
      icon: BookOpen,
      title: "Guided video lessons",
      description: totalLessons ? `${totalLessons} curated lessons` : "Playlist-backed path",
    },
    {
      icon: Lightbulb,
      title: "Downloadable resources",
      description: resourceCount ? `${resourceCount} project files & transcripts` : "Worksheets & transcripts",
    },
    {
      icon: FileText,
      title: "Structured assignments",
      description: metadata.prerequisites?.[0] || "Reflection prompts per module",
    },
    {
      icon: Award,
      title: "Completion certificate",
      description: "Shareable learning record",
    },
  ]

  const handleNoteContentChange = (content: string) => {
    setNoteContent(content)
  }

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
        lessonId: currentLesson?.id,
        courseId: course.id,
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

  // Initialize note title when lesson changes
  useState(() => {
    if (currentLesson) {
      setNoteTitle(`Notes: ${currentLesson.title}`)
    }
  })

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card className="border-0 shadow-xl">
        <CardContent className="space-y-5 p-6">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Access</p>
            <h3 className="text-xl font-semibold">
              {isEnrolled ? "Ready when you are" : "Start learning today"}
            </h3>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-200 p-4">
            <p className="text-sm text-muted-foreground">Progress</p>
            <div className="mt-2 flex items-center gap-3">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-sm font-semibold">{progress}%</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {completedLessons.length} of {totalLessons || "-"} lessons complete
            </p>
          </div>
          <Button
            className="w-full"
            onClick={isEnrolled ? undefined : onEnroll}
            disabled={enrolling}
          >
            {enrolling && <CheckCircle2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEnrolled ? "Continue Learning" : "Start learning"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Includes transcripts, inline notes, and a completion certificate.
          </p>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Card className="border-0 shadow-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
            <TabsTrigger value="resources" className="text-xs">Resources</TabsTrigger>
            <TabsTrigger value="info" className="text-xs">Course Info</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-4">
            <div className="space-y-4">
              {!isSignedIn ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <h4 className="font-medium mb-1">Sign in to take notes</h4>
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    Sign in to create and save notes for this lesson.
                  </p>
                  <Button size="sm" asChild>
                    <a href="/sign-in">Sign In</a>
                  </Button>
                </div>
              ) : showNewNoteForm ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="note-title" className="text-xs">Note Title</Label>
                    <Input
                      id="note-title"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="Enter a title for your note"
                      className="mt-1"
                    />
                  </div>
                  <div className="min-h-[200px]">
                    <RichTextEditor
                      content={noteContent}
                      onChange={handleNoteContentChange}
                      placeholder="Write your notes for this lesson here..."
                      minHeight="200px"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewNoteForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateNote}
                      disabled={isSavingNote || !noteTitle.trim()}
                    >
                      {isSavingNote ? "Saving..." : "Save Note"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm">Your Notes</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewNoteForm(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      New
                    </Button>
                  </div>
                  {notesLoading ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-muted-foreground">Loading notes...</p>
                    </div>
                  ) : lessonNotes.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {lessonNotes.map((note) => (
                        <Card key={note.id} className="overflow-hidden">
                          <CardContent className="p-3">
                            <h5 className="font-medium text-xs mb-1">{note.title}</h5>
                            <div
                              className="prose dark:prose-invert max-w-none text-xs line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: note.content }}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        No notes yet. Create your first note for this lesson.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="mt-4">
            <CourseResources course={course} />
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <div className="space-y-4">
              {/* Learning Highlights */}
              {learningHighlights.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3">What you'll learn</h4>
                  <div className="space-y-2">
                    {learningHighlights.map((highlight: string, index: number) => (
                      <div key={`${highlight}-${index}`} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">{highlight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Course Includes */}
              <div>
                <h4 className="font-medium text-sm mb-3">This course includes</h4>
                <div className="space-y-3">
                  {courseIncludes.map(({ icon: Icon, title, description }) => (
                    <div key={title} className="flex items-start gap-2">
                      <Icon className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium">{title}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructor */}
              <div>
                <h4 className="font-medium text-sm mb-3">Instructor</h4>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {instructorProfile.avatar ? (
                      <AvatarImage src={instructorProfile.avatar} alt={instructorProfile.name} />
                    ) : (
                      <AvatarFallback className="text-xs">
                        {instructorProfile.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-xs font-medium">{instructorProfile.name}</p>
                    <p className="text-xs text-muted-foreground">{instructorProfile.title}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{instructorProfile.bio}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
