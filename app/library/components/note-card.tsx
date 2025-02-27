"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { NoteInterface } from "../page"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Clock,
  Edit3,
  MoreVertical,
  Star,
  Trash2,
  Share2,
  FileText,
  BookOpen,
  Code,
  File,
} from "lucide-react"

interface NoteCardProps {
  note: NoteInterface;
  view: "grid" | "list";
  onEdit?: (note: NoteInterface) => void;
  onDelete?: (note: NoteInterface) => void;
  onToggleStar?: (note: NoteInterface) => void;
  onShare?: (note: NoteInterface) => void;
}

const categoryIcons = {
  starred: <Star className="h-4 w-4" />,
  course: <BookOpen className="h-4 w-4" />,
  personal: <File className="h-4 w-4" />,
  code: <Code className="h-4 w-4" />,
};

export function NoteCard({
  note,
  view,
  onEdit,
  onDelete,
  onToggleStar,
  onShare
}: NoteCardProps) {
  const [showActions, setShowActions] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    // If it's today, show time
    const isToday = new Date().toDateString() === date.toDateString();
    if (isToday) {
      return `Today at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
    }

    // If it's within the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (date > oneWeekAgo) {
      return date.toLocaleDateString(undefined, { weekday: 'long' });
    }

    // Otherwise just the date
    return date.toLocaleDateString();
  };

  return (
    <Card
      className={cn(
        "group relative transition-all hover:shadow-md border-border min-w-[280px] overflow-hidden",
        view === "list" ? "flex" : ""
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Category indicator color strip */}
      <div
        className={cn(
          "absolute top-0 h-full w-1",
          note.category === "course" ? "bg-blue-500" :
            note.category === "code" ? "bg-amber-500" :
              note.category === "personal" ? "bg-emerald-500" :
                "bg-primary"
        )}
      />

      <CardHeader className={cn(
        "space-y-0 pl-6",
        view === "list" ? "flex-1 p-4 pr-6" : "pb-2"
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              {note.starred && <Star className="h-4 w-4 text-primary fill-primary" />}
              <h3 className="font-medium leading-none">{note.title}</h3>
            </div>
            {note.course && (
              <div className="flex items-center text-sm text-muted-foreground">
                <BookOpen className="h-3 w-3 mr-1" />
                {note.course}
              </div>
            )}
          </div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => onToggleStar?.(note)}
            >
              <Star
                className={cn("h-4 w-4", note.starred && "fill-primary text-primary")}
              />
              <span className="sr-only">Toggle star</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuItem onClick={() => onEdit?.(note)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit Note
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare?.(note)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Note
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStar?.(note)}>
                  <Star className={cn("mr-2 h-4 w-4", note.starred && "fill-primary")} />
                  {note.starred ? "Unstar" : "Star"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete?.(note)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {(view === "grid" || note.preview) && (
        <CardContent className={cn(
          "pl-6",
          view === "list" ? "py-2" : "pt-0 pb-3"
        )}>
          {note.preview && (
            <p className={cn(
              "text-sm text-muted-foreground",
              view === "grid" ? "line-clamp-2" : "line-clamp-1"
            )}>
              {note.preview}
            </p>
          )}

          {note.tags && view === "grid" && (
            <div className="mt-2 flex flex-wrap gap-1">
              {note.tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs px-1.5 py-0 h-5"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      )}

      <CardFooter className={cn(
        "text-xs text-muted-foreground pl-6",
        view === "list" ? "ml-auto p-4" : "pt-0"
      )}>
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          {formatDate(note.lastModified)}
        </div>
      </CardFooter>

      {/* Category icon badge */}
      <div className="absolute top-0 right-0 p-1">
        <div className="bg-muted/80 rounded p-1">
          {categoryIcons[note.category]}
        </div>
      </div>
    </Card>
  )
}

export function NoteCardSkeleton({ view = "grid" }: { view?: "grid" | "list" }) {
  return (
    <Card className={cn(
      "animate-pulse",
      view === "list" ? "flex items-center" : ""
    )}>
      <div className="absolute top-0 h-full w-1 bg-muted-foreground/20" />
      <CardHeader className={cn(
        "space-y-2 pl-6",
        view === "list" ? "flex-1 p-4" : ""
      )}>
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
        <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
      </CardHeader>

      {view === "grid" && (
        <CardContent className="pl-6 pt-0">
          <div className="h-8 bg-muted-foreground/20 rounded w-full" />
          <div className="mt-2 flex gap-1">
            <div className="h-4 bg-muted-foreground/20 rounded w-12" />
            <div className="h-4 bg-muted-foreground/20 rounded w-16" />
          </div>
        </CardContent>
      )}

      <CardFooter className={cn(
        "pl-6",
        view === "list" ? "ml-auto p-4" : "pt-0"
      )}>
        <div className="h-3 bg-muted-foreground/20 rounded w-24" />
      </CardFooter>
    </Card>
  )
}
