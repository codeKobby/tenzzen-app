"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Search, SlidersHorizontal, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { NewNoteDialog } from "./components/new-note-dialog"
import { NoteCard, NoteCardSkeleton } from "./components/note-card"
import { CourseGroupedView } from "./components/course-grouped-view"
import { ViewSwitcher, ViewMode } from "./components/view-switcher"
import { CategoryPills } from "@/components/category-pills"
import { Note, CategoryFilter, SortOption, CreateNoteInput } from "@/types/notes"
import { useNotes } from "@/hooks/use-notes"
import { toast } from "sonner"
import { useAuth } from "@clerk/nextjs"
import { AnimatePresence, motion } from "framer-motion"
import { useMaterials } from "@/hooks/use-materials"
import { MaterialCard } from "./components/material-card"
import { AddMaterialDialog } from "./components/add-material-dialog"
import { AudioPlayerDialog } from "./components/audio-player-dialog"
import { UploadCloud, Brain, LayoutGrid, List } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [view, setView] = useState<ViewMode>("grid")
  const [showNewNote, setShowNewNote] = useState(false)
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [activeTab, setActiveTab] = useState<"notes" | "materials">("notes")
  const [editingNote, setEditingNote] = useState<NoteInterface | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [localSearch, setLocalSearch] = useState("")

  // Read filter from URL
  const currentCategory = (searchParams.get('category') || 'all') as CategoryFilter

  // Sort options
  const sortOptions = [
    { id: "recent", label: "Most Recent" },
    { id: "title", label: "Title A-Z" },
    { id: "course", label: "By Course" },
  ] as const
  const [sortBy, setSortBy] = useState<"recent" | "title" | "course">("recent")

  // Use the notes hook to fetch and manage notes
  const {
    notes: apiNotes,
    loading: notesLoading,
    error: notesError,
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
    initialFilter: currentCategory,
    autoRefresh: true
  })

  // Use materials hook
  const {
    materials,
    loading: materialsLoading,
    deleteMaterial,
    recordStudy,
    generateAudioOverview,
  } = useMaterials()

  const [playAudioMaterial, setPlayAudioMaterial] = useState<{ id: string, script: string, title: string } | null>(null)

  const handleAudioAction = async (material: any) => {
    if (material.audioScript) {
      setPlayAudioMaterial({
        id: material._id,
        script: material.audioScript,
        title: material.title
      })
    } else {
      toast.info("Generating audio overview...", {
        description: "Check back in a minute. The script is being written by AI.",
        duration: 4000
      })
      try {
        await generateAudioOverview(material._id)
        // Ideally we'd optimize the cache update but the subscription will handle it
      } catch (e) {
        toast.error("Failed to start generation")
      }
    }
  }

  // Sync filter with URL parameter
  useEffect(() => {
    if (currentCategory !== filter) {
      setFilter(currentCategory)
    }
  }, [currentCategory, filter, setFilter])

  // Handle category change via URL
  const handleCategoryChange = useCallback((category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category === 'all') {
      params.delete('category')
    } else {
      params.set('category', category)
    }
    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname
    window.history.pushState(null, '', newUrl)
    setFilter(category as CategoryFilter)
  }, [pathname, searchParams, setFilter])

  // Convert API notes to NoteInterface format
  const notes: NoteInterface[] = apiNotes.map(note => ({
    ...note,
    lastModified: note.updatedAt,
    preview: createTextPreview(note.content)
  }))

  // Function to create a text preview from HTML content
  function createTextPreview(html: string): string {
    if (typeof document !== 'undefined') {
      const tempElement = document.createElement('div')
      tempElement.innerHTML = html
      const textContent = tempElement.textContent || tempElement.innerText || ''
      return textContent.substring(0, 150) + (textContent.length > 150 ? '...' : '')
    }
    return ''
  }

  // Category counts for pills
  const noteCategories = [
    { name: "Starred", slug: "starred", courseCount: notes.filter(n => n.starred).length },
    { name: "Course Notes", slug: "course", courseCount: notes.filter(n => n.category === "course").length },
    { name: "Personal Notes", slug: "personal", courseCount: notes.filter(n => n.category === "personal").length },
    { name: "Code Snippets", slug: "code", courseCount: notes.filter(n => n.category === "code").length },
  ].filter(c => c.courseCount > 0)

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
    toast.info('Sharing functionality coming soon')
  }

  // Handle creating or updating a note
  const handleCreateNote = async (formData: any): Promise<void> => {
    try {
      if (editingNote) {
        await updateNote({
          id: editingNote.id,
          title: formData.title,
          content: formData.content,
          category: formData.category as any,
          tags: formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()) : []
        })
        toast.success('Note updated successfully')
      } else {
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

  // Handle search close
  const handleSearchClose = () => {
    setShowSearch(false)
    setLocalSearch("")
    setSearch("")
  }

  return (
    <div className="min-h-screen relative bg-background/50">
      {/* Background Patterns */}
      <div className="pattern-dots opacity-40 fixed inset-0 z-0 pointer-events-none" />
      <div className="background-gradient fixed inset-0 z-0 pointer-events-none" />

      <div className="relative z-10 h-full">
        {/* Sticky Header - Matches Explore/Courses */}
        <div className="sticky top-16 z-10 bg-background border-b">
          <div className="mx-auto px-4 max-w-6xl">
            {/* Tab Selection */}
            <div className="flex items-center gap-1 border-b mb-0 p-0">
              <button
                onClick={() => setActiveTab("notes")}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors relative",
                  activeTab === "notes" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Notes
                {activeTab === "notes" && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("materials")}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors relative",
                  activeTab === "materials" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Materials
                <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">New</span>
                {activeTab === "materials" && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>

            {/* Controls Bar */}
            <div className="h-14 flex items-center justify-between gap-4">
              {/* Left Side: Filters/Controls */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="h-10 rounded-full px-4 gap-2 flex-shrink-0">
                      <SlidersHorizontal className="h-4 w-4" />
                      <span className="hidden xs:inline">Filters</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {sortOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.id}
                        onClick={() => {
                          setSortBy(option.id)
                          setSort(option.id === "title" ? "alphabetical" : option.id === "course" ? "category" : "recent")
                        }}
                        className={cn("flex items-center justify-between", sortBy === option.id && "bg-muted")}
                      >
                        {option.label}
                        {sortBy === option.id && <span className="ml-2">✓</span>}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>View Mode</DropdownMenuLabel>
                    <div className="px-2 py-1.5 flex gap-2">
                      <ViewSwitcher currentView={view} onViewChange={setView} />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Center: Search Bar */}
              <div className="flex-1 flex justify-center max-w-[620px] mx-auto min-w-0">
                <div className="flex w-full items-center">
                  <div className="relative flex-1 flex items-center">
                    <div className="absolute left-4 text-muted-foreground pointer-events-none">
                      <Search className="h-4 w-4" />
                    </div>
                    <Input
                      placeholder="Search notes..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full h-10 pl-11 pr-4 rounded-l-full bg-background border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    className="h-10 px-5 rounded-r-full border-l-0 border border-border bg-muted hover:bg-secondary/80 flex-shrink-0"
                    onClick={() => { }} // Search is handled by onChange, but this button adds to the aesthetic
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Right Side: Primary Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddMaterial(true)}
                  className="h-10 rounded-full px-4 gap-2 font-medium border-dashed"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload</span>
                </Button>
                <Button
                  onClick={() => {
                    setEditingNote(null)
                    setShowNewNote(true)
                  }}
                  className="h-10 rounded-full px-4 gap-2 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Note</span>
                </Button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="pb-3">
              <CategoryPills
                customCategories={noteCategories}
                showRecommended={false}
                onCategoryChange={handleCategoryChange}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="mx-auto w-[95%] lg:w-[90%] pt-4 pb-12">
          <div className="space-y-6">
            {activeTab === "notes" ? (
              // --- NOTES VIEW ---
              notesLoading ? (
                <div className={cn(
                  "grid gap-6",
                  view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                )}>
                  {[...Array(6)].map((_, i) => (
                    <NoteCardSkeleton key={i} view={getCardView(view)} />
                  ))}
                </div>
              ) : notesError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">Error loading notes</h3>
                  <p className="text-muted-foreground mb-4">{notesError}</p>
                  <Button onClick={() => window.location.reload()}>Try again</Button>
                </div>
              ) : !isSignedIn ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">Sign in to view your notes</h3>
                  <p className="text-muted-foreground mb-4">You need to sign in to create and view your notes</p>
                  <Button asChild><a href="/sign-in">Sign In</a></Button>
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
                  <Button onClick={() => { setEditingNote(null); setShowNewNote(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create a note
                  </Button>
                </div>
              )
            ) : (
              // --- MATERIALS VIEW ---
              materialsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 rounded-xl bg-card animate-pulse border" />
                  ))}
                </div>
              ) : materials.length > 0 ? (
                <div className={cn(
                  "grid gap-6",
                  view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                )}>
                  {materials.map(material => (
                    <MaterialCard
                      key={material._id}
                      material={material}
                      view={getCardView(view)}
                      onDelete={() => deleteMaterial(material._id)}
                      onStudy={() => recordStudy(material._id)}
                      onAudioAction={() => handleAudioAction(material)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">No materials yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Upload PDFs, URLs, or documents to build your personal knowledge base.
                  </p>
                  <Button onClick={() => setShowAddMaterial(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload your first material
                  </Button>
                </div>
              )
            )}
          </div>
        </main>

        <NewNoteDialog
          open={showNewNote}
          onOpenChange={setShowNewNote}
          onCreateNote={handleCreateNote}
          editingNote={editingNote}
        />

        <AddMaterialDialog
          open={showAddMaterial}
          onOpenChange={setShowAddMaterial}
        />

        <AudioPlayerDialog
          open={!!playAudioMaterial}
          onOpenChange={(v) => !v && setPlayAudioMaterial(null)}
          script={playAudioMaterial?.script || ""}
          title={playAudioMaterial?.title || ""}
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
    </div>
  )
}
