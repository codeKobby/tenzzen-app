import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, UserCircle } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Course } from "../types"

interface CourseCardProps {
  course: Course
  onClick?: () => void
  className?: string
}

export function CourseCard({ course, onClick, className }: CourseCardProps) {
  return (
    <Card 
      className={cn("overflow-hidden transition-all hover:border-primary/50 cursor-pointer", className)}
      onClick={onClick}
    >
      <div className="aspect-video relative">
        <Image
          src={course.thumbnail || "/placeholders/course-thumbnail.jpg"}
          alt={course.title}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{course.category}</Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            {course.duration}
          </div>
        </div>
        <h3 className="mt-2 text-lg font-semibold tracking-tight line-clamp-2">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {course.description}
        </p>
      </CardHeader>
      <CardContent className="grid gap-2.5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span>{course.progress}%</span>
          </div>
          <Progress value={course.progress} className="h-2" />
        </div>
        {course.totalLessons && course.completedLessons && (
          <div className="text-sm text-muted-foreground">
            {course.completedLessons} of {course.totalLessons} lessons completed
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-between border-t pt-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <UserCircle className="mr-1 h-4 w-4" />
          {course.instructor}
        </div>
        {course.lastAccessed && (
          <div className="text-sm text-muted-foreground">
            {course.lastAccessed}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}