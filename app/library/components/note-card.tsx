"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreVertical,
  Star,
  Clock,
  Edit3,
  Trash2,
  Share2,
  BookOpen,
  ExternalLink,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { NoteInterface } from "../page"

export type ViewMode = "grid" | "list"

export interface NoteCardProps {
  note: NoteInterface
  view: ViewMode
}

export function NoteCard({ note, view }: NoteCardProps) {
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <Link 
                  href={`/courses/${note.course.toLowerCase().replace(/\s+/g, "-")}`} 
                  className="hover:text-primary hover:underline inline-flex items-center gap-1"
                >
                  {note.course}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
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
