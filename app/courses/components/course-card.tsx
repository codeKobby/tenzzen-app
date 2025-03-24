"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Users, Star, Plus, Lock, MoreVertical, BookmarkPlus, Share2, Trash2, Check
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Course } from "../types"
import { formatDate } from "@/lib/course-utils"
import { useState, useRef, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { deleteUserEnrollment } from "@/lib/local-storage"
import { useAuth } from "@clerk/nextjs"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'm'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

interface CourseCardProps {
  course: Course
  onClick?: () => void
  className?: string
  variant?: "explore" | "default"
  selected?: boolean
  onSelect?: (courseId: string, selected: boolean) => void
  selectionMode?: boolean
  onLongPress?: (courseId: string) => void
}

export function CourseCard({
  course,
  onClick,
  className,
  variant = "default",
  selected = false,
  onSelect,
  selectionMode = false,
  onLongPress
}: CourseCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { userId } = useAuth()
  const router = useRouter()

  // Long press handling for mobile
  const [pressStartTime, setPressStartTime] = useState<number | null>(null)
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const touchPositionRef = useRef<{ x: number, y: number } | null>(null)
  const LONG_PRESS_DURATION = 500 // 500ms for long press detection
  const TOUCH_MOVE_THRESHOLD = 10 // 10px threshold for touch move detection

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onLongPress) return

    // Save touch start position
    touchPositionRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }

    // Record start time of press
    const startTime = Date.now()
    setPressStartTime(startTime)

    // Set timeout for long press detection
    pressTimeoutRef.current = setTimeout(() => {
      onLongPress(course.id)
    }, LONG_PRESS_DURATION)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    // Check if touch moved beyond threshold to cancel long press
    if (!touchPositionRef.current || !pressTimeoutRef.current) return

    const touch = e.touches[0]
    const diffX = Math.abs(touch.clientX - touchPositionRef.current.x)
    const diffY = Math.abs(touch.clientY - touchPositionRef.current.y)

    if (diffX > TOUCH_MOVE_THRESHOLD || diffY > TOUCH_MOVE_THRESHOLD) {
      // Cancel long press if user moves finger beyond threshold
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current)
        pressTimeoutRef.current = null
      }
    }
  }

  const handleTouchEnd = () => {
    // Clear timeout and refs when touch ends
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current)
      pressTimeoutRef.current = null
    }

    setPressStartTime(null)
    touchPositionRef.current = null
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current)
      }
    }
  }, [])

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation()

    if (action === "delete") {
      // Open delete confirmation dialog
      setIsDeleteDialogOpen(true)
      return
    }

    console.log(action)
  }

  const handleDelete = () => {
    if (!userId) return

    try {
      // Delete enrollment from localStorage
      deleteUserEnrollment(userId, course.id)

      // Show success toast
      toast.success("Course removed successfully", {
        description: "The course has been removed from your library"
      })

      // If this component is used in a list, we may want to trigger a refresh
      // This could be passed as a prop from the parent component
      // For now, we'll just refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      toast.error("Failed to remove course", {
        description: "Please try again later"
      })
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // If in selection mode, toggle selection instead of normal click
    if (selectionMode && onSelect) {
      e.preventDefault()
      e.stopPropagation()
      onSelect(course.id, !selected)
    } else if (onClick) {
      onClick()
    } else {
      // Navigate to course detail page if no onClick is provided
      // Make sure we're navigating to the correct courseId format
      console.log("Navigating to course:", course.id);
      router.push(`/courses/${course.id}`)
    }
  }

  // Extract duration from either direct property or metadata
  // Format the duration to ensure it shows hours/minutes format
  const displayDuration = (() => {
    const rawDuration = course.duration || course.metadata?.duration;

    // If duration already has a proper format with 'h' or 'm', use it
    if (typeof rawDuration === 'string' &&
      (rawDuration.includes('h') || rawDuration.includes('m'))) {
      return rawDuration;
    }

    // If it's a number, assume minutes and format appropriately
    if (typeof rawDuration === 'number') {
      if (rawDuration >= 60) {
        const hours = Math.floor(rawDuration / 60);
        const minutes = rawDuration % 60;
        return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
      } else {
        return `${rawDuration}m`;
      }
    }

    // Default fallback if no proper duration format is available
    return course.duration || '1h 30m';
  })();

  // Format the lastAccessed date - use our utility function
  const formattedLastAccessed = formatDate(course.lastAccessed);

  // Generate default sources if none provided
  const courseSources = course.sources || course.metadata?.sources || [];

  return (
    <div
      className={cn(
        "group cursor-pointer relative overflow-hidden", // No border or rounded-xl here
        selectionMode && "ring-1 ring-inset ring-primary/20",
        selected && selectionMode && "ring-2 ring-primary bg-primary/5",
        className
      )}
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Selection Checkbox - shown in selection mode */}
      {selectionMode && (
        <div className="absolute top-2 left-2 z-20 bg-background/80 backdrop-blur-sm rounded-md p-0.5 shadow-sm">
          <Checkbox
            checked={selected}
            className="h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            onCheckedChange={(checked) => onSelect && onSelect(course.id, !!checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Selected checkmark - appears when selected */}
      {selected && selectionMode && (
        <div className="absolute inset-0 bg-primary/5 z-10 pointer-events-none"></div>
      )}

      <div className="relative aspect-video overflow-hidden rounded-xl"> {/* Added rounded-xl here instead */}
        <Image
          src={course.image || course.thumbnail || "/placeholders/course-thumbnail.jpg"}
          alt={course.title}
          fill
          className={cn(
            "object-cover transition-transform duration-300",
            selected && selectionMode && "opacity-90",
            !selectionMode && "group-hover:scale-105"
          )}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </div>

        {variant === "default" && !selectionMode && (
          <>
            {course.lastAccessed && course.progress && course.progress > 0 && (
              <div className="absolute top-2 left-2 text-white text-xs drop-shadow-md">
                Last accessed {formattedLastAccessed}
              </div>
            )}
            {course.topics && (
              <div className="absolute bottom-1 right-2 flex items-center gap-2">
                <div className="text-white text-xs drop-shadow-lg leading-none">
                  {course.topics.current}/{course.topics.total} • {displayDuration}
                </div>
              </div>
            )}
          </>
        )}

        {/* Progress bar */}
        {variant === "default" && (
          <div className="absolute inset-x-0 bottom-0 h-[3px]">
            <div
              className="h-full bg-red-600 transition-all"
              style={{ width: `${course.progress || 0}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3">
        {/* Title and More Actions Row */}
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className={cn(
                    "font-medium text-[13px] leading-[1.4]",
                    "min-h-[2.8em]", // Force 2 lines height
                    "line-clamp-2"
                  )}>
                    {course.title}
                  </h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{course.title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* More Actions Button - only show when not in selection mode */}
          {!selectionMode && (
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem
                    onClick={(e) => handleAction(e, "save")}
                    className="cursor-pointer"
                  >
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                    Save to playlist
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => handleAction(e, "share")}
                    className="cursor-pointer"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share course
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {course.isEnrolled && (
                    <DropdownMenuItem
                      onClick={(e) => handleAction(e, "delete")}
                      className="cursor-pointer bg-destructive/10 hover:bg-destructive/20 text-destructive font-medium"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete course
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Sources and Stats Row - hide in selection mode */}
        {!selectionMode && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-[11px]">
            {courseSources.length > 0 && (
              <>
                <span className="shrink-0">Sources:</span>
                <div className="flex items-center shrink-0">
                  <Popover>
                    <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center">
                        {courseSources.slice(0, 2).map((source, i) => (
                          <TooltipProvider key={`${course.id}-source-${i}`}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className={cn(
                                    "relative h-4 w-4 rounded-full overflow-hidden border border-background transition-transform hover:z-10",
                                    i > 0 && "-ml-1.5 hover:translate-x-0.5"
                                  )}
                                  aria-label={source.name}
                                >
                                  <Image
                                    src={source.avatar}
                                    alt={source.name}
                                    fill
                                    className="object-cover"
                                  />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>{source.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        {courseSources.length > 2 && (
                          <div className="relative h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium border border-background -ml-1.5 hover:translate-x-0.5 hover:z-10 transition-transform">
                            +{courseSources.length - 2}
                          </div>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-72 p-3"
                      side="top"
                      align="center"
                      sideOffset={5}
                    >
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium leading-none">All Sources</h4>
                        <div className="space-y-3">
                          {courseSources.map((source: any, i: number) => (
                            <div key={`${course.id}-source-popover-${i}`} className="flex items-center gap-3">
                              <div className="relative h-8 w-8 rounded-full overflow-hidden shrink-0">
                                <Image
                                  src={source.avatar}
                                  alt={source.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <h5 className="text-sm font-medium leading-none">{source.name}</h5>
                                <p className="text-xs text-muted-foreground mt-1">Original content source</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            {course.isPublic !== false ? (
              <>
                <div className="ml-auto flex items-center gap-1 shrink-0 min-w-0">
                  <Users className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {formatNumber(course.enrollmentCount || course.enrolledCount || 0)}
                  </span>
                </div>
                <span className="shrink-0">•</span>
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="h-3 w-3 text-yellow-500 shrink-0" />
                  <span>{(course.rating || course.averageRating || 0).toFixed(1)}</span>
                </div>
              </>
            ) : (
              <div className="ml-auto flex items-center gap-1 text-muted-foreground shrink-0">
                <Lock className="h-3 w-3" />
                <span>Private</span>
              </div>
            )}
          </div>
        )}

        {/* Category and CTA Row for explore view - hide in selection mode */}
        {variant === "explore" && !selectionMode && (
          <div className="flex items-center justify-between mt-1">
            <Badge variant="secondary" className="text-[10px] px-2 py-0 h-4 font-normal">
              {course.category}
            </Badge>
            <Button
              size="sm"
              variant="default"
              className={cn(
                "h-7 px-3 text-xs font-medium",
                "shadow-sm hover:scale-105 transition-transform"
              )}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Course
            </Button>
          </div>
        )}

        {/* Show progress bar or completion stats in selection mode */}
        {selectionMode && course.isEnrolled && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full",
                  course.progress === 100
                    ? "bg-green-600"
                    : course.progress > 0
                      ? "bg-red-600"
                      : "bg-muted-foreground/30"
                )}
                style={{ width: `${course.progress || 5}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {course.progress}%
            </span>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this course?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{course.title}" from your courses.
              Your progress will be lost and you'll need to re-enroll if you want to access it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
                setIsDeleteDialogOpen(false)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
