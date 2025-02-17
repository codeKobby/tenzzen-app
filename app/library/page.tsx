"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface Note {
  id: string;
  title: string;
  content: string;
  category: "starred" | "course" | "personal";
  starred: boolean;
  lastModified: string;
  course?: string;
}

export type CategoryFilter = "all" | "starred" | "course" | "personal";

const categories = [
  { id: "all", name: "All Notes", icon: <FileText className="h-4 w-4 mr-2" /> },
  { id: "starred", name: "Starred", icon: <Star className="h-4 w-4 mr-2" /> },
  { id: "course", name: "Course Notes", icon: <BookOpen className="h-4 w-4 mr-2" /> },
  { id: "personal", name: "Personal Notes", icon: <File className="h-4 w-4 mr-2" /> },
]

const notesData: Note[] = [
  {
    id: "1",
    title: "Meeting Notes",
    content: "Discussed project roadmap and assigned tasks.",
    category: "personal",
    starred: true,
    lastModified: "2024-03-10T10:00:00Z"
  },
  {
    id: "2",
    title: "React Hooks Cheatsheet",
    content: "useState, useEffect, useContext...",
    category: "course",
    starred: false,
    lastModified: "2024-03-12T14:30:00Z",
    course: "Advanced React"
  },
  {
    id: "3",
    title: "JavaScript Array Methods",
    content: "map, filter, reduce...",
    category: "course",
    starred: true,
    lastModified: "2024-03-15T09:15:00Z",
    course: "JavaScript Fundamentals"
  }
]

export default function LibraryPage() {
  const [filter, setFilter] = useState<CategoryFilter>("all")
  const [search, setSearch] = useState("")

  const NoteCard = ({ note }: { note: Note }) => (
    <Card>
      <p>{note.title}</p>
    </Card>
  )

  const filteredNotes = notesData.filter(note => {
    const matchesCategory = filter === "all" || note.category === filter;
    const matchesSearch = search.toLowerCase().trim() === "" || note.title.toLowerCase().includes(search.toLowerCase())

    return matchesCategory && matchesSearch;
  })

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar */}
          <div className="space-y-4">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Button>

            <Separator />

            <div className="space-y-1">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={filter === category.id ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => setFilter(category.id as CategoryFilter)}
                >
                  {category.icon}
                  <span>{category.name}</span>
                  <span className="ml-auto text-muted-foreground">
                    {notesData.filter(n => category.id === "all" || n.category === category.id).length}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-[400px]"
              />
            </div>

            {/* Note grid display */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
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
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create a Note
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}