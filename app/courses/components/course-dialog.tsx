"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star, Users, Clock, PlayCircle, BookOpen } from "lucide-react"
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
      <DialogContent
        className="
          w-full max-w-[90%] sm:max-w-lg 
          mx-auto 
          h-[90vh] sm:h-auto sm:max-h-[85vh] 
          overflow-y-auto 
          p-0 gap-0 
          bg-background 
          shadow-lg 
          border border-border 
          rounded-lg
        "
      >
        {/* Course Image */}
        <div className="relative aspect-video w-full">
          <div className="absolute inset-0 flex items-center justify-center bg-card">
            <BookOpen className="w-16 h-16 text-foreground opacity-20" />
          </div>
          <button
            className="absolute inset-0 flex items-center justify-center bg-transparent hover:bg-background transition-all group"
            aria-label="Play course preview"
          >
            <PlayCircle className="w-16 h-16 text-foreground opacity-0 group-hover:opacity-100 transition-all" />
          </button>
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-full">
            <span className="text-sm font-medium text-foreground">{course.videoSource}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl leading-tight">
              {course.title}
            </DialogTitle>
            <p className="text-base sm:text-lg text-foreground opacity-80 mt-2">
              {course.description}
            </p>
          </DialogHeader>

          {/* Course Stats */}
          <div className="flex flex-wrap gap-6 text-foreground">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm sm:text-base">
                {course.enrolledCount.toLocaleString()} enrolled
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <span className="text-sm sm:text-base">{course.rating} rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm sm:text-base">{course.duration}</span>
            </div>
          </div>

          {/* Course Progress */}
          <div className="space-y-4 text-foreground">
            <h3 className="text-lg sm:text-xl font-semibold">Course Progress</h3>
            <div className="text-sm sm:text-base opacity-80">
              {course.completedLessons} of {course.totalLessons} lessons completed
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>

          {/* Course Info */}
          <div className="space-y-4 text-foreground">
            <h3 className="text-lg sm:text-xl font-semibold">Course Information</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm sm:text-base">
              <div>
                <span className="block font-medium">Instructor</span>
                <span className="opacity-80">{course.instructor}</span>
              </div>
              <div>
                <span className="block font-medium">Category</span>
                <span className="opacity-80">{course.category}</span>
              </div>
              {course.lastAccessed && (
                <div>
                  <span className="block font-medium">Last Accessed</span>
                  <span className="opacity-80">{course.lastAccessed}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row gap-3 pt-4 border-t border-border">
            <Button className="flex-1">Continue Learning</Button>
            <Button variant="outline" className="flex-1">View Course Details</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
