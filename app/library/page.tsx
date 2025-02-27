"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { NewNoteDialog } from "./components/new-note-dialog"
import { NoteCard, NoteCardSkeleton } from "./components/note-card"
import { CourseGroupedView } from "./components/course-grouped-view"
import { FiltersHeader } from "./components/filters-header"
import { ViewMode } from "./components/view-switcher"

export interface NoteInterface {
  id: string;
  title: string;
  content: string;
  category: "starred" | "course" | "personal" | "code";
  starred: boolean;
  lastModified: string;
  course?: string;
  tags?: string[];
  preview?: string;
}

export type CategoryFilter = "all" | "starred" | "course" | "personal" | "code";
export type SortOption = "recent" | "title" | "course";

// Example data - in a real app this would come from an API
const notesData: NoteInterface[] = [
  {
    id: "1",
    title: "React Hooks Overview",
    content: "Comprehensive guide to React Hooks.",
    preview: "useState, useEffect, and custom hooks explanation with examples showing how to manage component state, side effects, and create reusable hook patterns for clean, maintainable code.",
    category: "course",
    starred: true,
    lastModified: "2024-03-10T10:00:00Z",
    course: "Advanced React",
    tags: ["react", "hooks", "frontend"]
  },
  {
    id: "2",
    title: "Project Ideas",
    content: "List of potential project ideas.",
    preview: "1. E-commerce platform, 2. Social media dashboard, 3. Personal finance tracker with visualization, 4. AI-powered content recommendation system.",
    category: "personal",
    starred: false,
    lastModified: "2024-03-12T14:30:00Z",
    tags: ["projects", "ideas"]
  },
  {
    id: "3",
    title: "Array Methods Snippet",
    content: "Common array methods reference.",
    preview: "map(), filter(), reduce(), find(), some(), every() examples with TypeScript type annotations and performance considerations.",
    category: "code",
    starred: true,
    lastModified: "2024-03-15T09:15:00Z",
    tags: ["javascript", "typescript", "arrays"]
  }
];

const getCardView = (view: ViewMode): "grid" | "list" => {
  return view === "course" ? "list" : view;
}

export default function LibraryPage() {
  const [filter, setFilter] = useState<CategoryFilter>("all")
  const [search, setSearch] = useState("")
  const [view, setView] = useState<ViewMode>("grid")
  const [sort, setSort] = useState<SortOption>("recent")
  const [showNewNote, setShowNewNote] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingNote, setEditingNote] = useState<NoteInterface | null>(null)
  const [notes, setNotes] = useState<NoteInterface[]>(notesData)

  // Category counts
  const categoryCounts: Record<CategoryFilter, number> = {
    all: notes.length,
    starred: notes.filter(note => note.starred).length,
    course: notes.filter(n => n.category === "course").length,
    personal: notes.filter(n => n.category === "personal").length,
    code: notes.filter(n => n.category === "code").length,
  };

  // Simulate loading state
  useEffect(() => {
    if (search !== "") {
      setLoading(true)
      const timer = setTimeout(() => {
        setLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [search])

  const filteredNotes = notes
    .filter(note => {
      const matchesCategory = filter === "all" || note.category === filter ||
        (filter === "starred" && note.starred);
      const matchesSearch = search.toLowerCase().trim() === "" ||
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.content.toLowerCase().includes(search.toLowerCase()) ||
        note.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase())) ||
        note.course?.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sort) {
        case "title":
          return a.title.localeCompare(b.title);
        case "course":
          return (a.course || "").localeCompare(b.course || "");
        default:
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      }
    });

  const handleToggleStar = (note: NoteInterface) => {
    setNotes(prevNotes => prevNotes.map(n =>
      n.id === note.id ? { ...n, starred: !n.starred } : n
    ));
  };

  const handleDeleteNote = (note: NoteInterface) => {
    setNotes(prevNotes => prevNotes.filter(n => n.id !== note.id));
  };

  const handleEditNote = (note: NoteInterface) => {
    setEditingNote(note);
    setShowNewNote(true);
  };

  const handleShareNote = (note: NoteInterface) => {
    // In a real app, this would open a share dialog
    console.log("Sharing note:", note.title);
  };

  interface CreateNoteFormData {
    title: string;
    content: string;
    category: NoteInterface['category'];
    course?: string;
    tags?: string;
  }

  const handleCreateNote = (formData: CreateNoteFormData): void => {
    if (editingNote) {
      // Update existing note
      const updatedNote: NoteInterface = {
        ...editingNote,
        title: formData.title,
        content: formData.content,
        category: formData.category,
        course: formData.course,
        lastModified: new Date().toISOString(),
        tags: formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()) : []
      };
      setNotes(prevNotes => prevNotes.map(note =>
        note.id === editingNote.id ? updatedNote : note
      ));
      setEditingNote(null);
    } else {
      // Create new note
      const newNote: NoteInterface = {
        id: `note-${Date.now()}`,
        title: formData.title,
        content: formData.content,
        category: formData.category,
        course: formData.course,
        preview: formData.content.substring(0, 150) + (formData.content.length > 150 ? '...' : ''),
        starred: false,
        lastModified: new Date().toISOString(),
        tags: formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()) : []
      };
      setNotes(prevNotes => [newNote, ...prevNotes]);
    }
    setShowNewNote(false);
  };

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
          ) : filteredNotes.length > 0 ? (
            view === "course" ? (
              <CourseGroupedView
                notes={filteredNotes}
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
                {filteredNotes.map(note => (
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
