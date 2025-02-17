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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface CourseDialogProps {
  course: Course | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CourseDialog({ course, open, onOpenChange }: CourseDialogProps) {
  if (!course) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <div className="relative h-[200px] sm:h-[300px] w-full shrink-0 overflow-hidden rounded-t-lg">
          <Image
            src={course.thumbnail || "/placeholders/course-thumbnail.jpg"}
            alt={course.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 500px) 100vw, 500px"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Button variant="secondary" size="lg" className="gap-2">
              <PlayCircle className="h-5 w-5" />
              Resume Course
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
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
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Lessons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{course.totalLessons ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <BookOpen className="inline h-3 w-3 mr-1" />
                  Structured Learning
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{course.completedLessons ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Target className="inline h-3 w-3 mr-1" />
                  Lessons Completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Course Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{course.rating}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Trophy className="inline h-3 w-3 mr-1" />
                  out of 5.0
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Timeline & Progress */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Course Progress</span>
                <span className="font-medium">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {course.completedLessons ?? 0} of {course.totalLessons ?? 0} lessons completed
              </p>
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