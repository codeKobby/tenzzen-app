import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PlayCircle, Clock, ShieldCheck, ThumbsUp, GitFork } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDurationHumanReadable } from "@/lib/utils/duration"

interface CourseCardProps {
  id: string
  title: string
  instructor: {
    name: string
    avatar: string
  }
  progress?: number
  duration?: string
  duration_seconds?: number
  totalLessons?: number
  total_lessons?: number
  completedLessons?: number
  trustScore?: number
  upvoteCount?: number
  isForked?: boolean
}

export function CourseCard({
  title,
  instructor,
  progress,
  duration,
  duration_seconds,
  totalLessons,
  total_lessons,
  completedLessons,
  trustScore,
  upvoteCount,
  isForked
}: CourseCardProps) {
  const isEnrolled = typeof progress === 'number';

  return (
    <Card className="p-4 transition-all hover:border-primary/50 flex flex-col h-full justify-between gap-4">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1">
            <h3 className="font-semibold tracking-tight line-clamp-2 leading-tight">
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={instructor.avatar} />
                <AvatarFallback>{instructor.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground line-clamp-1">
                {instructor.name}
              </span>
            </div>
          </div>
          {isForked && (
            <Badge variant="outline" className="h-6 shrink-0 gap-1" title="Forked from another course">
              <GitFork className="h-3 w-3" />
            </Badge>
          )}
          {isEnrolled && (
            <Badge variant="secondary" className="h-6 shrink-0">
              {completedLessons}/{total_lessons || totalLessons || 0} Lessons
            </Badge>
          )}
        </div>

        {!isEnrolled && (trustScore || upvoteCount !== undefined) && (
          <div className="flex items-center gap-2 flex-wrap">
            {trustScore !== undefined && (
              <Badge variant={trustScore > 80 ? "default" : "secondary"} className="gap-1 px-1.5 h-6">
                <ShieldCheck className="h-3 w-3" />
                {Math.round(trustScore)}% Trust
              </Badge>
            )}
            {upvoteCount !== undefined && (
              <Badge variant="outline" className="gap-1 px-1.5 h-6">
                <ThumbsUp className="h-3 w-3" />
                {upvoteCount}
              </Badge>
            )}
          </div>
        )}

        {isEnrolled && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress!)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto pt-2">
        <div className="flex items-center gap-1.5">
          <PlayCircle className="h-4 w-4" />
          <span>{isEnrolled ? "Resume" : "Start Course"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span>
            {duration_seconds
              ? formatDurationHumanReadable(duration_seconds)
              : duration || "Unknown duration"}
          </span>
        </div>
      </div>
    </Card>
  )
}