"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { NewNoteDialog } from "./components/new-note-dialog"
import { NoteCard, NoteCardSkeleton } from "./components/note-card"
import { CourseGroupedView } from "./components/course-grouped-view"
import { FiltersHeader } from "./components/filters-header"
import { ViewMode } from "./components/view-switcher"
import { useNotes } from "@/hooks/use-notes"
import { Note, CategoryFilter, SortOption, CreateNoteInput } from "@/types/notes"
import { toast } from "sonner"
import { useAuth } from "@clerk/nextjs"

export interface NoteInterface extends Note {
  lastModified: string;
  preview?: string;
}

// Helper function to convert view mode to card view
const getCardView = (view: ViewMode): "grid" | "list" => {
  return view === "course" ? "list" : view;
}

export default function LibraryPage() {
  const { isSignedIn } = useAuth()
  const [view, setView] = useState<ViewMode>("grid")
  const [showNewNote, setShowNewNote] = useState(false)
  const [editingNote, setEditingNote] = useState<NoteInterface | null>(null)

  // Use the notes hook to fetch and manage notes
  const {
    notes: apiNotes,
    loading,
    error,
    filter,
    setFilter,
    sort,
    setSort,
    search,
    setSearch,
    createNote,
    updateNote,
    deleteNote,
    toggleStar
  } = useNotes({
    autoRefresh: true
  })

  // Convert API notes to NoteInterface format
  const notes: NoteInterface[] = apiNotes.map(note => ({
    ...note,
    lastModified: note.updatedAt,
    preview: createTextPreview(note.content)
  }))

  // Function to create a text preview from HTML content
  function createTextPreview(html: string): string {
    // Create a temporary element to parse the HTML
    if (typeof document !== 'undefined') {
      const tempElement = document.createElement('div')
      tempElement.innerHTML = html

      // Get the text content
      const textContent = tempElement.textContent || tempElement.innerText || ''

      // Return a truncated version
      return textContent.substring(0, 150) + (textContent.length > 150 ? '...' : '')
    }
    return ''
  }

  // Category counts
  const categoryCounts: Record<CategoryFilter, number> = {
    all: notes.length,
    starred: notes.filter(note => note.starred).length,
    course: notes.filter(n => n.category === "course").length,
    personal: notes.filter(n => n.category === "personal").length,
    code: notes.filter(n => n.category === "code").length,
  };

  // Handle toggling star status
  const handleToggleStar = async (note: NoteInterface) => {
    await toggleStar(note.id, !note.starred)
  }

  // Handle deleting note
  const handleDeleteNote = async (note: NoteInterface) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(note.id)
    }
  }

  // Handle editing note
  const handleEditNote = (note: NoteInterface) => {
    setEditingNote(note)
    setShowNewNote(true)
  }

  // Handle sharing note
  const handleShareNote = (note: NoteInterface) => {
    // In a real implementation, this would generate a shareable link or open a sharing dialog
    toast.info('Sharing functionality coming soon')
  }

  // Handle creating or updating a note
  const handleCreateNote = async (formData: any): Promise<void> => {
    try {
      if (editingNote) {
        // Update existing note
        await updateNote({
          id: editingNote.id,
          title: formData.title,
          content: formData.content,
          category: formData.category as any,
          tags: formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()) : []
        })
        toast.success('Note updated successfully')
      } else {
        // Create new note
        await createNote({
          title: formData.title,
          content: formData.content,
          category: formData.category as any,
          tags: formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()) : []
        })
        toast.success('Note created successfully')
      }
      setEditingNote(null)
      setShowNewNote(false)
    } catch (err) {
      console.error('Error saving note:', err)
      toast.error('Failed to save note')
    }
  }

  return (
    <div className="h-full">
      {/* Fixed Header */}
      <FiltersHeader
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        sort={sort}
        onSortChange={setSort}
        view={view}
        onViewChange={setView}
        categoryCounts={categoryCounts}
      />

      {/* Main Content */}
      <main className="mx-auto w-[95%] lg:w-[90%] pt-4 pb-12">
        <div className="space-y-6">
          {loading ? (
            <div className={cn(
              "grid gap-6",
              view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              {[...Array(6)].map((_, i) => (
                <NoteCardSkeleton key={i} view={getCardView(view)} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">Error loading notes</h3>
              <p className="text-muted-foreground mb-4">
                {error}
              </p>
              <Button onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          ) : !isSignedIn ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">Sign in to view your notes</h3>
              <p className="text-muted-foreground mb-4">
                You need to sign in to create and view your notes
              </p>
              <Button asChild>
                <a href="/sign-in">Sign In</a>
              </Button>
            </div>
          ) : notes.length > 0 ? (
            view === "course" ? (
              <CourseGroupedView
                notes={notes}
                onToggleStar={handleToggleStar}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                onShare={handleShareNote}
              />
            ) : (
              <div className={cn(
                "grid gap-4",
                view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}>
                {notes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    view={getCardView(view)}
                    onToggleStar={() => handleToggleStar(note)}
                    onEdit={() => handleEditNote(note)}
                    onDelete={() => handleDeleteNote(note)}
                    onShare={() => handleShareNote(note)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No notes found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? `No notes match your search "${search}"` : "You have no notes in this category yet"}
              </p>
              <Button onClick={() => {
                setEditingNote(null);
                setShowNewNote(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Create a note
              </Button>
            </div>
          )}
        </div>
      </main>

      <NewNoteDialog
        open={showNewNote}
        onOpenChange={setShowNewNote}
        onCreateNote={handleCreateNote}
        editingNote={editingNote}
      />

      {/* Mobile FAB for creating new note */}
      <Button
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-10 md:hidden"
        onClick={() => {
          setEditingNote(null);
          setShowNewNote(true);
        }}
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">New note</span>
      </Button>
    </div>
  )
}
