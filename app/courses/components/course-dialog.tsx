"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star, Users, Clock, PlayCircle } from "lucide-react"
import { Course } from "../types"
import Image from "next/image"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface CourseDialogProps {
  course: Course | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCourseDeleted?: () => void  // Add this new prop
}

export function CourseDialog({ course, open, onOpenChange, onCourseDeleted }: CourseDialogProps) {
  if (!course) return null

  // Function to handle course deletion
  const handleDelete = () => {
    if (!course || !onCourseDeleted) return;

    // Call the onCourseDeleted callback
    onCourseDeleted();

    // Close the dialog
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "w-full max-w-[90%] sm:max-w-lg mx-auto",
        "h-[90vh] sm:h-auto sm:max-h-[85vh]",
        "overflow-y-auto p-0 gap-0",
        "bg-background border rounded-lg"
      )}>
        {/* Course Image */}
        <div className="relative aspect-video w-full">
          <Image
            src={course.thumbnail || "/placeholders/course-thumbnail.jpg"}
            alt={course.title}
            fill
            className="object-cover"
          />
          <button
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-all group"
            aria-label={`Play preview for ${course.title}`}
          >
            <PlayCircle className="w-16 h-16 text-white opacity-90 group-hover:opacity-100 transition-all" />
          </button>
          {course.topics && (
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-full">
              <span className="text-sm font-medium text-foreground">Topic {course.topics.current} of {course.topics.total}</span>
            </div>
          )}
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
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm sm:text-base">{course.duration}</span>
            </div>
            {course.isPublic && (
              <>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-sm sm:text-base">
                    {course.enrolledCount?.toLocaleString() || 0} enrolled
                  </span>
                </div>
                {course.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    <span className="text-sm sm:text-base">{course.rating} rating</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Course Progress */}
          {course.topics && (
            <div className="space-y-4 text-foreground">
              <h3 className="text-lg sm:text-xl font-semibold">Current Topic</h3>
              <div className="text-sm sm:text-base opacity-80">
                {course.topics.currentTitle}
              </div>
              <div className="w-full h-2 bg-zinc-600/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
              <div className="text-sm opacity-80">
                {course.progress}% complete • {course.topics.current} of {course.topics.total} topics
              </div>
            </div>
          )}

          {/* Course Sources */}
          {course.sources && (
            <div className="space-y-4 text-foreground">
              <h3 className="text-lg sm:text-xl font-semibold">Course Sources</h3>
              <div className="flex flex-wrap gap-2">
                {course.sources.map((source, i) => (
                  <Popover key={i}>
                    <TooltipProvider>
                      <Tooltip>
                        <PopoverTrigger asChild>
                          <TooltipTrigger asChild>
                            <button
                              className="relative h-8 w-8 rounded-full overflow-hidden ring-2 ring-background hover:ring-primary transition-colors"
                              aria-label={`View details for ${source.name}`}
                            >
                              <Image
                                src={source.avatar}
                                alt={source.name}
                                fill
                                className="object-cover"
                              />
                            </button>
                          </TooltipTrigger>
                        </PopoverTrigger>
                        <TooltipContent side="top">
                          <p>{source.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <PopoverContent className="w-80 p-4" side="right" align="start">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0">
                            <Image
                              src={source.avatar}
                              alt={source.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold leading-none">{source.name}</h4>
                            <p className="text-sm text-muted-foreground/80">
                              Original content source
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">
                          <p className="font-medium text-foreground mb-1">About this source</p>
                          <p>This content was curated from tutorials and courses by {source.name}. Original content rights belong to their respective owners.</p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                This course includes content from multiple sources
              </div>
            </div>
          )}

          {/* Course Info */}
          <div className="space-y-4 text-foreground">
            <div className="grid sm:grid-cols-2 gap-4 text-sm sm:text-base">
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
            <Button className="flex-1" onClick={() => onOpenChange(false)}>
              Continue Learning
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              View Course Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
