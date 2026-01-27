"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { useNotes } from "@/hooks/use-notes"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Clock, Plus, Save, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatDurationFromSeconds } from "@/lib/utils/duration"
import { useDebounce } from "@/hooks/use-debounce"

interface LessonNoteEditorProps {
    courseId: string
    lessonId: string
    lessonTitle: string
    currentTime: number
    onSeek: (time: number) => void
}

export function LessonNoteEditor({
    courseId,
    lessonId,
    lessonTitle,
    currentTime,
    onSeek
}: LessonNoteEditorProps) {
    const { userId, isSignedIn } = useAuth()
    const [noteContent, setNoteContent] = useState("")
    const [noteTitle, setNoteTitle] = useState("")
    const [isCreatingNote, setIsCreatingNote] = useState(false)
    const [isSavingNote, setIsSavingNote] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [editorInstance, setEditorInstance] = useState<any>(null)
    const debouncedContent = useDebounce(noteContent, 2000)
    const debouncedTitle = useDebounce(noteTitle, 2000)
    const initialLoadRef = useRef(false)
    const activeNoteIdRef = useRef<string | null>(null)

    const {
        notes: lessonNotes,
        loading: notesLoading,
        createNote,
        updateNote
    } = useNotes({
        lessonId,
        autoRefresh: false
    })

    const currentNote = lessonNotes[0] // We assume one note per lesson for now

    // Initialize state from existing note
    useEffect(() => {
        if (!notesLoading && !initialLoadRef.current) {
            if (currentNote) {
                setNoteTitle(currentNote.title)
                setNoteContent(currentNote.content)
                activeNoteIdRef.current = currentNote.id
                setIsCreatingNote(true) // We are in "editing" mode effectively
            } else {
                setNoteTitle(`Notes: ${lessonTitle}`)
                setNoteContent("")
                activeNoteIdRef.current = null
                setIsCreatingNote(false)
            }
            initialLoadRef.current = true
        }
    }, [currentNote, notesLoading, lessonTitle])

    // Reset when lesson changes
    useEffect(() => {
        initialLoadRef.current = false
        // We rely on the hook to fetch new notes for the new lessonId
    }, [lessonId])

    const handleContentChange = (content: string) => {
        setNoteContent(content)
        setHasUnsavedChanges(true)
    }

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNoteTitle(e.target.value)
        setHasUnsavedChanges(true)
    }

    // Auto-save logic
    const saveNote = useCallback(async () => {
        if (!isSignedIn || !hasUnsavedChanges || !noteTitle.trim()) return

        try {
            setIsSavingNote(true)

            if (activeNoteIdRef.current) {
                // Update existing
                await updateNote({
                    id: activeNoteIdRef.current,
                    title: noteTitle,
                    content: noteContent,
                    category: "course", // Ensure category stays correct
                    tags: currentNote?.tags
                })
            } else {
                // Create new
                const newNote = await createNote({
                    title: noteTitle,
                    content: noteContent,
                    category: "course",
                    lessonId,
                    courseId,
                    tags: ["lesson-note"]
                })
                if (newNote) {
                    // Start 116
                    // The createNote mutation returns the ID of the new note.
                    // However, our useNotes hook wrapper might return the full object or ID.
                    // Based on the error "Type 'Note' is not assignable to type 'string'", 
                    // it seems it returns a Note object.
                    // Let's safe-guard this.
                    activeNoteIdRef.current = typeof newNote === 'string' ? newNote : (newNote as any).id || (newNote as any)._id
                }
            }

            setHasUnsavedChanges(false)
            // toast.success("Note saved", { duration: 1000 }) // Optional: minimal feedback
        } catch (error) {
            console.error("Error saving note:", error)
            toast.error("Failed to auto-save note")
        } finally {
            setIsSavingNote(false)
        }
    }, [isSignedIn, hasUnsavedChanges, noteTitle, noteContent, activeNoteIdRef, updateNote, createNote, lessonId, courseId, currentNote?.tags])

    // Trigger auto-save on debounce
    useEffect(() => {
        if (initialLoadRef.current) {
            saveNote()
        }
    }, [debouncedContent, debouncedTitle, saveNote])

    // Insert Timestamp
    const insertTimestamp = () => {
        if (!editorInstance) return

        const time = Math.floor(currentTime)
        const formattedTime = formatDurationFromSeconds(time)
        // Insert a simplified HTML that Tiptap can render. 
        // We use a specific class to identify it as a seekable timestamp.
        // The data-timestamp attribute holds the seconds.
        const html = `<span data-timestamp="${time}" class="cursor-pointer text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono hover:bg-primary/20 transition-colors pointer-events-auto select-none" contenteditable="false">⏱️ ${formattedTime}</span>&nbsp;`

        editorInstance.chain().focus().insertContent(html).run()
        setHasUnsavedChanges(true)
    }

    // Handle clicks on timestamps inside the editor
    const handleEditorClick = useCallback((view: any, pos: number, event: MouseEvent) => {
        const target = event.target as HTMLElement
        // Check if the clicked element (or parent) is our timestamp span
        const timestampParams = target.closest('span[data-timestamp]')

        if (timestampParams) {
            event.preventDefault()
            const timeStr = timestampParams.getAttribute('data-timestamp')
            if (timeStr) {
                const time = parseInt(timeStr, 10)
                if (!isNaN(time)) {
                    console.log("Seeking to timestamp:", time)
                    onSeek(time)
                    return true // handled
                }
            }
        }
        return false
    }, [onSeek])

    if (!isSignedIn) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] border rounded-md p-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <h3 className="font-medium mb-2">Sign in to take notes</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Take timestamped notes and save them to your library.
                </p>
                <Button asChild>
                    <a href="/sign-in">Sign In</a>
                </Button>
            </div>
        )
    }

    if (notesLoading && !initialLoadRef.current) {
        return (
            <div className="flex items-center justify-center h-full min-h-[300px] border rounded-md">
                <p className="text-muted-foreground">Loading notes...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-card border rounded-md overflow-hidden">
            {/* Toolbar / Header */}
            <div className="p-3 border-b bg-muted/20 flex items-center justify-between gap-3">
                <Input
                    value={noteTitle}
                    onChange={handleTitleChange}
                    placeholder="Note Title"
                    className="h-8 font-medium bg-transparent border-transparent hover:border-input focus:border-input transition-colors px-2"
                />
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={insertTimestamp}
                        className="h-8 text-xs gap-1.5"
                        title="Insert current video time"
                    >
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDurationFromSeconds(currentTime)}</span>
                    </Button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <span className="text-xs text-muted-foreground w-16 text-right">
                        {isSavingNote ? "Saving..." : hasUnsavedChanges ? "Unsaved" : "Saved"}
                    </span>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-[300px] relative">
                <RichTextEditor
                    content={noteContent}
                    onChange={handleContentChange}
                    onEditorReady={setEditorInstance}
                    placeholder="Type your notes here... You can insert timestamps to mark key moments."
                    className="border-0 rounded-none h-full min-h-[300px]"
                    minHeight="100%"
                    editorProps={{
                        handleClick: handleEditorClick
                    }}
                />
            </div>
        </div>
    )
}
