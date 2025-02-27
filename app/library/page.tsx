"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  File,
  Plus,
  Search,
  MoreHorizontal,
  Star,
  Clock,
  Edit3,
  Trash2,
  FileText,
  Share2,
  BookOpen,
  Code,
  Filter,
  MenuIcon,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  FolderOpen,
  SlidersHorizontal,
} from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { NewNoteDialog } from "./components/new-note-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ViewSwitcher, ViewMode } from "./components/view-switcher"
import { NoteCard, NoteCardSkeleton } from "./components/note-card"
import { CourseGroupedView } from "./components/course-grouped-view"
import { TRANSITION_DURATION, TRANSITION_TIMING } from "@/lib/constants"

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

const categories = [
  { id: "all", name: "All Notes", icon: <FileText className="h-4 w-4" /> },
  { id: "starred", name: "Starred", icon: <Star className="h-4 w-4" /> },
  { id: "course", name: "Course Notes", icon: <BookOpen className="h-4 w-4" /> },
  { id: "personal", name: "Personal Notes", icon: <File className="h-4 w-4" /> },
  { id: "code", name: "Code Snippets", icon: <Code className="h-4 w-4" /> },
]

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
  },
  {
    id: "4",
    title: "Next.js Data Fetching",
    content: "Various patterns for fetching data in Next.js applications.",
    preview: "Overview of React Server Components, client components, route handlers, and caching strategies in Next.js 14.",
    category: "course",
    starred: false,
    lastModified: "2024-03-18T15:45:00Z",
    course: "Advanced React",
    tags: ["nextjs", "react", "server-components"]
  },
  {
    id: "5",
    title: "CSS Grid Layouts",
    content: "Common CSS Grid patterns for responsive layouts.",
    preview: "Comprehensive examples of grid-template-areas, grid-template-columns, and responsive grid designs with media queries.",
    category: "course",
    starred: false,
    lastModified: "2024-03-20T11:20:00Z",
    course: "Frontend Mastery",
    tags: ["css", "grid", "responsive"]
  },
  {
    id: "6",
    title: "Authentication Flow Ideas",
    content: "Authentication strategies for web applications.",
    preview: "Comparison of JWT, session-based auth, OAuth, and passwordless authentication methods with security considerations.",
    category: "personal",
    starred: true,
    lastModified: "2024-03-22T16:30:00Z",
    tags: ["auth", "security", "jwt"]
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingNote, setEditingNote] = useState<NoteInterface | null>(null)
  const [notes, setNotes] = useState<NoteInterface[]>(notesData)

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
      const matchesCategory = filter === "all" || note.category === filter;
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

  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    .slice(0, 3);

  const starredNotes = notes.filter(note => note.starred);

  const handleToggleStar = (note: NoteInterface) => {
    setNotes(notes.map(n =>
      n.id === note.id ? { ...n, starred: !n.starred } : n
    ));
  };

  const handleDeleteNote = (note: NoteInterface) => {
    setNotes(notes.filter(n => n.id !== note.id));
  };

  const handleEditNote = (note: NoteInterface) => {
    setEditingNote(note);
    setShowNewNote(true);
  };

  const handleShareNote = (note: NoteInterface) => {
    // In a real app, this would open a share dialog
    console.log("Sharing note:", note.title);
  };

  interface NoteFormData {
    title: string;
    content: string;
    category: NoteInterface['category'];
    course?: string;
    tags?: string;
  }

  const handleCreateNote = (data: NoteFormData) => {
    if (editingNote) {
      // Update existing note
      setNotes(notes.map(note =>
        note.id === editingNote.id
          ? {
            ...editingNote,
            title: data.title,
            content: data.content,
            category: data.category,
            course: data.course,
            lastModified: new Date().toISOString(),
            tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : []
          }
          : note
      ));
      setEditingNote(null);
    } else {
      // Create new note
      const newNote: NoteInterface = {
        id: `note-${Date.now()}`,
        title: data.title,
        content: data.content,
        category: data.category,
        course: data.course,
        preview: data.content.substring(0, 150) + (data.content.length > 150 ? '...' : ''),
        starred: false,
        lastModified: new Date().toISOString(),
        tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : []
      };
      setNotes([newNote, ...notes]);
    }
  };

  const getUniqueCoursesCount = () => {
    const courses = new Set(notes
      .filter(note => note.category === "course" && note.course)
      .map(note => note.course));
    return courses.size;
  };

  return (
    <div className={cn(
      "mx-auto space-y-6 pt-6",
      `transition-all duration-[${TRANSITION_DURATION}ms] ${TRANSITION_TIMING}`,
      "w-[95%] lg:w-[90%]"
    )}>
      {/* Header Section */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="border-b">
          <div className="flex h-16 items-center px-4 gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>

            <h1 className="text-lg font-semibold hidden md:block">Library</h1>

            <div className="flex items-center gap-4 flex-1 justify-between">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search notes, tags, courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <SlidersHorizontal className="h-4 w-4" />
                      <span className="hidden sm:inline">Sort</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px]">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className={cn(sort === "recent" && "bg-accent")}
                      onClick={() => setSort("recent")}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Most Recent
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={cn(sort === "title" && "bg-accent")}
                      onClick={() => setSort("title")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Title A-Z
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={cn(sort === "course" && "bg-accent")}
                      onClick={() => setSort("course")}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      By Course
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <ViewSwitcher
                  currentView={view}
                  onViewChange={(newView: ViewMode) => setView(newView)}
                />

                <Button onClick={() => {
                  setEditingNote(null);
                  setShowNewNote(true);
                }} className="hidden sm:flex">
                  <Plus className="mr-2 h-4 w-4" />
                  New Note
                </Button>

                <Button
                  size="icon"
                  onClick={() => {
                    setEditingNote(null);
                    setShowNewNote(true);
                  }}
                  className="sm:hidden"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 py-2 border-b bg-muted/50">
          <div className="flex flex-wrap items-center justify-between gap-y-2 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{notes.length} Notes</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>{starredNotes.length} Starred</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{notes.filter(n => n.category === "course").length} Course Notes</span>
              </div>
              <div className="flex items-center gap-1">
                <BookMarked className="h-4 w-4" />
                <span>{getUniqueCoursesCount()} Courses</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              Updated: {new Date(Math.max(...notes.map(n => new Date(n.lastModified).getTime()))).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 bg-background border-r transition-all duration-300 ease-in-out z-20 lg:z-0 w-[240px] pt-16",
          sidebarCollapsed ? "-translate-x-full" : "translate-x-0",
          "lg:sticky lg:top-0 lg:translate-x-0 lg:h-[calc(100vh-4rem)]",
          sidebarCollapsed && "lg:w-0 lg:opacity-0"
        )}>
          <div className="flex items-center justify-between px-4 py-2">
            <h2 className="font-semibold">Categories</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden"
              onClick={() => setSidebarCollapsed(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100%-3rem)] pb-4">
            <div className="space-y-1 px-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={filter === category.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2 transition-colors duration-200",
                    filter === category.id && "bg-primary/10 font-medium"
                  )}
                  onClick={() => setFilter(category.id as CategoryFilter)}
                >
                  {category.icon}
                  <span>{category.name}</span>
                  <Badge
                    variant="secondary"
                    className="ml-auto"
                  >
                    {notes.filter(n => category.id === "all" || n.category === category.id).length}
                  </Badge>
                </Button>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="px-4">
              <h3 className="mb-2 text-sm font-medium">Courses</h3>
              <div className="space-y-1">
                {Array.from(new Set(notes
                  .filter(note => note.category === "course" && note.course)
                  .map(note => note.course)
                )).map(course => (
                  <Button
                    key={course}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start pl-6 text-sm h-8"
                    onClick={() => {
                      setFilter("course");
                      setSearch(course || "");
                    }}
                  >
                    <FolderOpen className="mr-2 h-3 w-3" />
                    {course}
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="my-4" />

            <div className="px-4">
              <h3 className="mb-2 text-sm font-medium">Popular Tags</h3>
              <div className="flex flex-wrap gap-1">
                {Array.from(new Set(
                  notes.flatMap(note => note.tags || [])
                )).slice(0, 10).map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => setSearch(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Overlay when sidebar is open on mobile */}
        {!sidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black/30 z-10 lg:hidden"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Main Content */}
        <main className={cn(
          "flex-1 min-w-0",
          `transition-all duration-[${TRANSITION_DURATION}ms] ${TRANSITION_TIMING}`,
          !sidebarCollapsed && "lg:pl-6"
        )}>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Notes</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="starred">Starred</TabsTrigger>
              {filter === "course" && (
                <TabsTrigger value="byCourse">By Course</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {loading ? (
                <div className={cn(
                  "grid gap-4",
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
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              {view === "course" ? (
                <CourseGroupedView
                  notes={recentNotes}
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
                  {recentNotes.map(note => (
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
              )}
            </TabsContent>

            <TabsContent value="starred" className="space-y-4">
              {starredNotes.length > 0 ? (
              view === "course" ? (
                <CourseGroupedView
                  notes={starredNotes}
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
                  {starredNotes.map(note => (
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
                  <Star className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">No starred notes</h3>
                  <p className="text-muted-foreground">
                    Star notes to see them here for quick access
                  </p>
                </div>
              )}
            </TabsContent>

            {view === "course" && (
              <TabsContent value="byCourse" className="space-y-6">
                <CourseGroupedView
                  notes={filteredNotes.filter(n => n.category === "course")}
                  onToggleStar={handleToggleStar}
                  onEdit={handleEditNote}
                  onDelete={handleDeleteNote}
                  onShare={handleShareNote}
                />
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>

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
