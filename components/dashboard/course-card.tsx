import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PlayCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDurationFromSeconds, formatDurationHumanReadable } from "@/lib/utils/duration"

interface CourseCardProps {
  id: string
  title: string
  instructor: {
    name: string
    avatar: string
  }
  progress: number
  duration?: string
  duration_seconds?: number
  totalLessons?: number
  total_lessons?: number
  completedLessons: number
}

export function CourseCard({
  title,
  instructor,
  progress,
  duration,
  totalLessons,
  completedLessons
}: CourseCardProps) {
  return (
    <Card className="p-4 transition-all hover:border-primary/50">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <h3 className="font-semibold tracking-tight line-clamp-2">
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={instructor.avatar} />
                <AvatarFallback>{instructor.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {instructor.name}
              </span>
            </div>
          </div>
          <Badge variant="secondary" className="h-6 shrink-0">
            {completedLessons}/{total_lessons || totalLessons || 0} Lessons
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <PlayCircle className="h-4 w-4" />
            <span>Resume</span>
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
      </div>
    </Card>
  )
}