"use client"

import { NoteInterface } from "../page"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Star,
  Edit3,
  Trash2,
  Share2,
  BookOpen,
  Code,
  FileText,
  ExternalLink,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface NoteCardProps {
  note: NoteInterface
  view: "grid" | "list"
  onToggleStar: () => void
  onEdit: () => void
  onDelete: () => void
  onShare: () => void
}

const getCategoryIcon = (category: NoteInterface["category"]) => {
  switch (category) {
    case "course":
      return <BookOpen className="h-4 w-4" />
    case "code":
      return <Code className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

export function NoteCard({
  note,
  view,
  onToggleStar,
  onEdit,
  onDelete,
  onShare
}: NoteCardProps) {
  const router = useRouter()

  // Function to strip HTML tags for preview
  const createTextPreview = (html: string): string => {
    // Create a temporary element to parse the HTML
    const tempElement = document.createElement('div')
    tempElement.innerHTML = html

    // Get the text content
    const textContent = tempElement.textContent || tempElement.innerText || ''

    // Return a truncated version
    return textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '')
  }

  // Get preview text from content
  const previewText = note.preview || createTextPreview(note.content)

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card transition-all",
        "hover:shadow-md hover:border-primary/50",
        view === "list" ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex items-start gap-2 min-w-0 cursor-pointer"
          onClick={() => router.push(`/library/${note.id}`)}
        >
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            {getCategoryIcon(note.category)}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium leading-none tracking-tight truncate group-hover:text-primary transition-colors">
              {note.title}
            </h3>
            {note.course && (
              <p className="mt-1 text-sm text-muted-foreground truncate">
                {note.course}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-muted-foreground transition-colors",
            note.starred ? "text-yellow-500 hover:text-yellow-600" : "opacity-0 group-hover:opacity-100"
          )}
          onClick={(e) => {
            e.stopPropagation()
            onToggleStar()
          }}
        >
          <Star className="h-4 w-4" fill={note.starred ? "currentColor" : "none"} />
        </Button>
      </div>

      {/* Preview text */}
      <div
        className={cn(
          "line-clamp-3 text-sm text-muted-foreground mt-2 cursor-pointer",
          view === "list" && "md:line-clamp-2"
        )}
        onClick={() => router.push(`/library/${note.id}`)}
      >
        {previewText}
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {note.tags.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="px-1.5 py-0 text-[10px]"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className={cn(
        "absolute bottom-2 right-2 flex items-center gap-1",
        "opacity-0 group-hover:opacity-100 transition-opacity"
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/library/${note.id}`)
          }}
        >
          <ExternalLink className="h-4 w-4" />
          <span className="sr-only">Open</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          <Edit3 className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={(e) => {
            e.stopPropagation()
            onShare()
          }}
        >
          <Share2 className="h-4 w-4" />
          <span className="sr-only">Share</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>

      {/* Last modified */}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          Last modified: {new Date(note.lastModified).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

export function NoteCardSkeleton({ view }: { view: "grid" | "list" }) {
  return (
    <div className={cn(
      "rounded-lg border bg-card",
      view === "list" ? "p-3" : "p-4",
      "animate-pulse"
    )}>
      <div className="flex items-start gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-2 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="mt-3 flex gap-1">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}
