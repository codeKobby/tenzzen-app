"use client"

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { MoreVertical, Star, Clock, Edit3, Trash2, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { type NoteInterface } from "../page";
import { format } from "date-fns"


interface NoteCardProps {
  note: NoteInterface;
  className?: string;
}

export function NoteCard({ note, className }: NoteCardProps) {
  return (
    <Card className={cn("group relative", className)}>
      <CardHeader className="space-y-0 pb-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-base tracking-tight">
            {note.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {note.course && (
          <p className="text-xs text-muted-foreground">
            From: {note.course}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        <div className="text-sm text-muted-foreground line-clamp-3">
          {note.content}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {format(new Date(note.lastModified), "MMM d, yyyy")}
        </div>
        {note.starred && (
          <Star className="h-4 w-4 text-primary" />
        )}
      </CardFooter>
    </Card>
  )
}
