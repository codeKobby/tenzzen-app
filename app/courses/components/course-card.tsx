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
  Plus, Lock, MoreVertical, BookmarkPlus, Share2, Trash2, Check
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Course } from "../types"
import { YouTubeThumbnail } from "@/components/youtube-thumbnail"
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
      // Navigate to course detail page
      console.log("Navigating to course detail page for course:", course.id);
      router.push(`/course/${course.id}`)
    }
  }

  // Helper function to format seconds into simplified duration (H:MM or MM:SS)
  const formatYouTubeDuration = (totalSeconds: number) => {
    // Ensure totalSeconds is a valid number
    if (typeof totalSeconds !== 'number' || isNaN(totalSeconds) || totalSeconds < 0) {
      totalSeconds = 0;
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    // Format with leading zeros for seconds
    const formattedSeconds = seconds.toString().padStart(2, '0');

    // If hours > 0, show hours:minutes format (H:MM)
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }

    // Otherwise show minutes:seconds format (M:SS)
    return `${minutes}:${formattedSeconds}`;
  };

  // Extract duration from either direct property or metadata
  // Format the duration to ensure it shows YouTube-style format
  const displayDuration = (() => {
    // If we have a direct estimated_duration as an interval string (HH:MM:SS), parse it
    if (typeof course.estimated_duration === 'string' && course.estimated_duration.includes(':')) {
      // Parse the interval format (HH:MM:SS) or (HH:MM:SS.MS)
      // First, remove any milliseconds part if present
      const cleanDuration = course.estimated_duration.split('.')[0];
      const parts = cleanDuration.split(':');

      if (parts.length === 3) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseInt(parts[2], 10);

        // For simplified display, we want to show just H:MM or MM:SS without seconds
        if (hours === 0) {
          // Just show minutes:seconds (without seconds)
          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
          // Show hours:minutes (without seconds)
          return `${hours}:${minutes.toString().padStart(2, '0')}`;
        }
      }
    }

    // If we have a direct estimated_duration as a number (seconds), use it directly
    if (typeof course.estimated_duration === 'number') {
      return formatYouTubeDuration(course.estimated_duration);
    }

    // Get the raw duration from various possible sources
    const rawDuration = course.duration || course.metadata?.duration;
    let totalSeconds = 0;

    // If duration is a string with 'h' or 'm', parse it
    if (typeof rawDuration === 'string') {
      if (rawDuration.includes('h') || rawDuration.includes('m')) {
        // Parse hours
        const hoursMatch = rawDuration.match(/(\d+)h/);
        const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;

        // Parse minutes
        const minutesMatch = rawDuration.match(/(\d+)m/);
        const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

        // Convert to seconds
        totalSeconds = (hours * 3600) + (minutes * 60);
      } else if (!isNaN(parseFloat(rawDuration))) {
        // If it's a numeric string, assume seconds for YouTube videos
        totalSeconds = parseFloat(rawDuration);
      }
    }
    // If it's a number, assume it's seconds (for YouTube video durations)
    else if (typeof rawDuration === 'number') {
      totalSeconds = rawDuration;
    }
    // Default fallback
    else {
      // Default to 5 minutes = 300 seconds
      totalSeconds = 300;
    }

    // Format the seconds into YouTube-style duration
    return formatYouTubeDuration(totalSeconds);
  })();

  // Format the lastAccessed date - use our utility function
  const formattedLastAccessed = formatDate(course.lastAccessed);

  // Generate default sources if none provided
  const courseSources = course.sources || course.metadata?.sources || [];

  // Calculate total lessons first (to avoid circular reference)
  const getTotalLessons = () => {
    if (typeof course.totalLessons === 'number') return course.totalLessons;
    if (Array.isArray(course.sections)) {
      return course.sections.reduce((total, section) => total + (section.lessons?.length || 0), 0);
    }
    // If we have metadata with courseItems, try to calculate from there
    if (course.metadata?.courseItems && Array.isArray(course.metadata.courseItems)) {
      return course.metadata.courseItems.reduce((total: number, item: any) => {
        if (item.type === 'section' && Array.isArray(item.lessons)) {
          return total + item.lessons.length;
        }
        return total;
      }, 0);
    }
    return 5; // Default to 5 if no data available - better than showing 0
  };

  // Calculate completed lessons (after getTotalLessons to avoid circular reference)
  const getCompletedLessons = () => {
    if (typeof course.lessonsCompleted === 'number') return course.lessonsCompleted;
    if (typeof course.completedLessons === 'number') return course.completedLessons;
    if (course.completedLessons && Array.isArray(course.completedLessons)) {
      return course.completedLessons.length;
    }
    // For public courses, calculate a reasonable value based on progress
    if (course.progress && typeof course.progress === 'number') {
      const total = getTotalLessons();
      return Math.round((course.progress / 100) * total);
    }
    return 0;
  };

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
        {course.videoId ? (
          <YouTubeThumbnail
            videoId={course.videoId}
            alt={course.title}
            className={cn(
              "transition-transform duration-300",
              selected && selectionMode && "opacity-90",
              !selectionMode && "group-hover:scale-105"
            )}
          />
        ) : (
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
        )}
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
            <div className="absolute bottom-1 left-2 flex items-center gap-2">
              <div className="text-white text-xs drop-shadow-lg leading-none">
                {displayDuration}
              </div>
            </div>
            <div className="absolute bottom-1 right-2 flex items-center gap-2">
              <div className="text-white text-xs drop-shadow-lg leading-none">
                {getCompletedLessons() || 0}/{getTotalLessons() || 0}
              </div>
            </div>
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
                                  type="button"
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

            {course.isPublic === false && (
              <div className="ml-auto flex items-center gap-1 text-muted-foreground shrink-0">
                <Lock className="h-3 w-3" />
                <span>Private</span>
              </div>
            )}
          </div>
        )}

        {/* CTA Row for explore view - hide in selection mode (category badge removed) */}
        {variant === "explore" && !selectionMode && (
          <div className="flex items-center justify-end mt-1">
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
