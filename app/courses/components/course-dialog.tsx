"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  BookOpen,
  Target,
  Trophy,
  PlayCircle,
  Calendar,
  GraduationCap
} from "lucide-react"
import Image from "next/image"
import { Course } from "../types"
import { cn } from "@/lib/utils"

interface CourseDialogProps {
  course: Course | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CourseDialog({ course, open, onOpenChange }: CourseDialogProps) {
  if (!course) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-[600px]">
        <div className="relative w-full overflow-hidden rounded-t-lg pt-[56.25%]">
          <Image
            src={course.thumbnail || "/placeholders/course-thumbnail.jpg"}
            alt={course.title}
            fill
            className="absolute inset-0 object-cover"
            priority
            sizes="(max-width: 600px) 100vw, 600px"
          />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Button variant="secondary" size="lg" className="gap-2">
              <PlayCircle className="h-5 w-5" />
              Resume Course
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{course.category}</Badge>
            <Badge variant="outline" className="ml-auto">
              <Clock className="mr-1 h-3 w-3" />
              {course.duration}
            </Badge>
          </div>

          <DialogTitle className="text-2xl mb-2">{course.title}</DialogTitle>
          <DialogDescription className="text-base mb-4">
            {course.description}
          </DialogDescription>

          {/* Course Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border p-4">
              <div className="text-2xl font-bold">{course.totalLessons ?? 0}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Total Lessons
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border p-4">
              <div className="text-2xl font-bold">{course.progress}%</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />
                Course Progress
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border p-4 sm:col-span-1">
              <div className="text-2xl font-bold">{course.rating}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Course Rating
              </div>
            </div>
          </div>

          {/* Course Info */}
          <div className="grid gap-2 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last accessed:</span>
              <span>{course.lastAccessed || "Not started"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Instructor:</span>
              <span>{course.instructor}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4 sm:gap-0 sm:mt-0 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button className="gap-2">
            <PlayCircle className="h-4 w-4" />
            Continue Learning
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}