"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  File,
  Folder,
  Plus,
  Search,
  MoreVertical,
  Star,
  Clock,
  Edit3,
  Trash2,
  FileText,
  Share2,
  BookOpen,
  Code,
  Filter,
  SortAsc,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Grid,
  BookMarked,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { NewNoteDialog } from "./components/new-note-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
export type ViewMode = "grid" | "list";
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
    preview: "useState, useEffect, and custom hooks explanation with examples...",
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
    preview: "1. E-commerce platform, 2. Social media dashboard...",
    category: "personal",
    starred: false,
    lastModified: "2024-03-12T14:30:00Z",
    tags: ["projects", "ideas"]
  },
  {
    id: "3",
    title: "Array Methods Snippet",
    content: "Common array methods reference.",
    preview: "map(), filter(), reduce() examples with TypeScript...",
    category: "code",
    starred: true,
    lastModified: "2024-03-15T09:15:00Z",
    tags: ["javascript", "typescript", "arrays"]
  }
]

function NoteCard({ note, view }: { note: NoteInterface; view: ViewMode }) {
  const [showActions, setShowActions] = useState(false)

  return (
    <Card 
      className={cn(
        "group relative transition-all hover:shadow-md border border-border min-w-[280px]",
        view === "list" ? "flex items-center gap-4" : ""
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardHeader className={cn(
        "space-y-0",
        view === "list" ? "flex-1 p-4" : "pb-4"
      )}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              {note.starred && <Star className="h-4 w-4 text-primary" fill="currentColor" />}
              <h3 className="font-semibold leading-none">{note.title}</h3>
            </div>
            {note.course && (
              <p className="text-sm text-muted-foreground">
                Course: {note.course}
              </p>
            )}
            {view === "list" ? (
              <p className="text-sm text-muted-foreground line-clamp-1">{note.preview}</p>
            ) : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Star className="mr-2 h-4 w-4" />
                {note.starred ? "Unstar" : "Star"}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      {view === "grid" && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">{note.preview}</p>
          {note.tags && (
            <div className="mt-2 flex flex-wrap gap-1">
              {note.tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      )}
      <CardFooter className={cn(
        "text-sm text-muted-foreground",
        view === "list" ? "ml-auto pr-4" : ""
      )}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {new Date(note.lastModified).toLocaleDateString()}
          </div>
          <div className={cn(
            "flex items-center gap-1 transition-opacity duration-200",
            showActions ? "opacity-100" : "opacity-0"
          )}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

function NoteCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[125px] w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton className="h-4 w-[60%]" />
      </div>
    </div>
  )
}

export default function LibraryPage() {
  const [filter, setFilter] = useState<CategoryFilter>("all")
  const [search, setSearch] = useState("")
  const [view, setView] = useState<ViewMode>("grid")
  const [sort, setSort] = useState<SortOption>("recent")
  const [showNewNote, setShowNewNote] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)

  const filteredNotes = notesData
    .filter(note => {
      const matchesCategory = filter === "all" || note.category === filter;
      const matchesSearch = search.toLowerCase().trim() === "" ||
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.content.toLowerCase().includes(search.toLowerCase()) ||
        note.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));

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

  const recentNotes = [...notesData]
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    .slice(0, 3);

  const starredNotes = notesData.filter(note => note.starred);

  return (
    <div className={cn(
      "mx-auto space-y-6 pt-6",
      `transition-all duration-&lsqb;${TRANSITION_DURATION}ms&rsqb; ${TRANSITION_TIMING}`,
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
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSort("recent")}>
                    Most Recent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSort("title")}>
                    Title A-Z
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSort("course")}>
                    By Course
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setView(view === "grid" ? "list" : "grid")}
              >
                {view === "grid" ? (
                  <LayoutGrid className="h-4 w-4" />
                ) : (
                  <List className="h-4 w-4" />
                )}
              </Button>
              <Button onClick={() => setShowNewNote(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Note
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 py-2 border-b bg-muted/50">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{notesData.length} Total Notes</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>{starredNotes.length} Starred</span>
              </div>
              <div className="flex items-center gap-1">
                <BookMarked className="h-4 w-4" />
                <span>{notesData.filter(n => n.category === "course").length} Course Notes</span>
              </div>
            </div>
            <div>
              Last updated: {new Date(Math.max(...notesData.map(n => new Date(n.lastModified).getTime()))).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 bg-muted/50 border-r transition-transform duration-300 ease-in-out z-20 lg:z-0 lg:bg-transparent w-[240px] pt-16",
          sidebarCollapsed ? "-translate-x-full" : "translate-x-0",
          "lg:relative lg:translate-x-0",
          sidebarCollapsed && "lg:w-0"
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 lg:right-0"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
          <ScrollArea className="h-full py-4">
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
                    {notesData.filter(n => category.id === "all" || n.category === category.id).length}
                  </Badge>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className={cn(
          "flex-1 px-4 py-6 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "lg:px-6" : "lg:px-4"
        )}>
          {starredNotes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Starred Notes</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {starredNotes.map((note) => (
                  <NoteCard key={note.id} note={note} view="grid" />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">All Notes</h2>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <NoteCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className={cn(
                "grid gap-4",
                view === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}>
                {filteredNotes.length > 0 ? (
                  filteredNotes.map((note) => (
                    <NoteCard key={note.id} note={note} view={view} />
                  ))
                ) : (
                  <div className="col-span-full flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground/40" />
                    <h3 className="mt-4 text-lg font-semibold">No notes found</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {search
                        ? `No notes match "${search}"`
                        : "You haven't created any notes yet"}
                    </p>
                    <Button onClick={() => setShowNewNote(true)} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create a Note
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <NewNoteDialog
        open={showNewNote}
        onOpenChange={setShowNewNote}
        onSubmit={(data) => {
          // In a real app, this would be handled by a server action
          console.log("Creating new note:", data)
        }}
      />
    </div>
  )
}
