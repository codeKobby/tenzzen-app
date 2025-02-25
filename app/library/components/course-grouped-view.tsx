"use client"

import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { NoteInterface } from "../page"
import { BookOpen, ChevronDown } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { NoteCard } from "./note-card"

interface CourseGroupedViewProps {
  notes: NoteInterface[]
  loading?: boolean
}

interface CourseGroup {
  id: string
  title: string
  notes: NoteInterface[]
}

export function CourseGroupedView({ notes, loading }: CourseGroupedViewProps) {
  // Group notes by course
  const courseGroups = notes.reduce<CourseGroup[]>((groups, note) => {
    if (!note.course) return groups

    const existingGroup = groups.find(group => group.title === note.course)
    if (existingGroup) {
      existingGroup.notes.push(note)
    } else {
      groups.push({
        id: note.course.toLowerCase().replace(/\s+/g, "-"),
        title: note.course,
        notes: [note]
      })
    }
    return groups
  }, [])

  return (
    <Accordion type="multiple" className="w-full space-y-4">
      {courseGroups.map((group) => (
        <AccordionItem
          key={group.id}
          value={group.id}
          className="border rounded-lg px-4"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">{group.title}</span>
              </div>
              <Badge variant="secondary" className="ml-2">
                {group.notes.length} {group.notes.length === 1 ? "note" : "notes"}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4 pb-4">
              {group.notes.map((note) => (
                <div key={note.id} className="relative">
                  <NoteCard note={note} view="list" />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}

      {courseGroups.length === 0 && !loading && (
        <div className="text-center text-muted-foreground py-8">
          No course notes found.
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      )}
    </Accordion>
  )
}
