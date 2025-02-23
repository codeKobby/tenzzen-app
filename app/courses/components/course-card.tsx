"use client"

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
import { Users, Star, PlayCircle, Lock, MoreVertical, BookmarkPlus, Share2, Flag } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Course } from "../types"

interface CourseCardProps {
  course: Course
  onClick?: () => void
  className?: string
}

export function CourseCard({ course, onClick, className }: CourseCardProps) {
  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation()
    console.log(action)
  }

  return (
    <div 
      className={cn(
        "group cursor-pointer relative overflow-hidden rounded-xl",
        className
      )}
      onClick={onClick}
    >
      <div className="absolute top-2 right-2 z-[5]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
            className="h-8 w-8 text-white bg-black/40 hover:bg-black/60 transition-colors focus:ring-0 focus-visible:ring-1 focus-visible:ring-white backdrop-blur-sm"
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
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => handleAction(e, "share")}
              className="cursor-pointer"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share course
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => handleAction(e, "report")}
              className="cursor-pointer text-destructive"
            >
              <Flag className="h-4 w-4 mr-2" />
              Report content
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
        <Image
          src={course.thumbnail || "/placeholders/course-thumbnail.jpg"}
          alt={course.title}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
          <div className="absolute inset-0 bg-black/0 sm:group-hover:bg-black/20 transition-colors" />
        </div>
        {course.lastAccessed && (
          <div className="absolute top-2 left-2 text-white text-xs drop-shadow-md">
            Last accessed {course.lastAccessed}
          </div>
        )}
        {course.topics && (
          <div className="absolute bottom-1 right-2 flex items-center gap-2">
            <div className="text-white text-xs drop-shadow-lg leading-none">
              {course.topics.current}/{course.topics.total} • {course.duration}
            </div>
          </div>
        )}
        <Button
          size="sm"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-100 scale-100 sm:opacity-0 sm:scale-95 sm:group-hover:opacity-100 sm:group-hover:scale-100 transition-transform duration-200 hover:scale-105 bg-white hover:bg-white/90 text-black font-medium shadow-xl"
        >
          <PlayCircle className="h-4 w-4 mr-2" />
          {course.progress > 0 ? "Resume Course" : "Start Course"}
        </Button>
        <div className="absolute inset-x-0 bottom-0 h-[3px]">
          <div
            className="h-full bg-red-600 transition-all"
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="font-medium text-[13px] leading-[1.4] line-clamp-2">
                {course.title}
              </h3>
            </TooltipTrigger>
            <TooltipContent>
              <p>{course.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {course.sources && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-[11px] mt-1">
            <span>Sources:</span>
            <div className="flex items-center">
              {course.sources.slice(0, 3).map((source, i) => (
                <Popover key={i}>
                  <TooltipProvider>
                    <Tooltip>
                      <PopoverTrigger asChild>
                        <TooltipTrigger asChild>
                          <button
                            className={cn(
                              "relative h-4 w-4 rounded-full overflow-hidden border border-background transition-transform hover:z-10",
                              i > 0 && "-ml-1.5 hover:translate-x-0.5"
                            )}
                            aria-label={source.name}
                            onClick={(e) => e.stopPropagation()}
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
                  <PopoverContent
                    className="w-72 p-3"
                    side="top"
                    align="center"
                    sideOffset={5}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <div className="relative h-8 w-8 rounded-full overflow-hidden shrink-0">
                          <Image
                            src={source.avatar}
                            alt={source.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold leading-none">{source.name}</h4>
                          <p className="text-xs text-muted-foreground">Original content source</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>Content curated from this source with all rights reserved to the original creator. Visit their channel for more content.</p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ))}
              {course.sources.length > 3 && (
                <div className="relative h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium border border-background -ml-1.5 hover:translate-x-0.5 hover:z-10 transition-transform">
                  +{course.sources.length - 3}
                </div>
              )}
            </div>

            {course.isPublic ? (
              <>
                <div className="ml-auto flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{course.enrolledCount?.toLocaleString()}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span>{course.rating}</span>
                </div>
              </>
            ) : (
              <div className="ml-auto flex items-center gap-1 text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Private</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
