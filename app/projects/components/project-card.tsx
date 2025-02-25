import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow, isPast, format } from "date-fns"
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  GraduationCap, 
  Send,
  HourglassIcon,
  StarIcon,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Project } from "../types"

interface ProjectCardProps {
  project: Project
  onClick: () => void
  className?: string
  viewMode?: "grid" | "course-grouped"
}

export function ProjectCard({ 
  project, 
  onClick, 
  className,
  viewMode = "grid" 
}: ProjectCardProps) {
  // Determine if project is overdue
  const isOverdue = project.dueDate && isPast(new Date(project.dueDate)) && project.status !== "Submitted" && project.status !== "Graded"
  
  // Format due date for display
  const formattedDueDate = project.dueDate 
    ? format(new Date(project.dueDate), "MMM d, yyyy")
    : null

  // Calculate time remaining
  const timeRemaining = project.dueDate && !isOverdue
    ? formatDistanceToNow(new Date(project.dueDate), { addSuffix: true })
    : null

  // Get status badge config
  const getStatusConfig = () => {
    switch (project.status) {
      case "Not Started":
        return { color: "bg-muted text-muted-foreground", icon: HourglassIcon }
      case "In Progress":
        return { color: "bg-blue-500/10 text-blue-500", icon: Clock }
      case "Submitted":
        return { color: "bg-orange-500/10 text-orange-500", icon: Send }
      case "Graded":
        return { color: "bg-green-500/10 text-green-500", icon: CheckCircle }
      default:
        return { color: "bg-muted text-muted-foreground", icon: FileText }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon
  
  // Determine if we should show difficulty challenge buttons (for graded projects)
  const showChallengeButtons = project.status === "Graded" && project.feedback?.grade
  
  // For demo: Hard-code buttons based on score to show appropriate choices
  const hardButtonVisible = project.status === "Graded" && 
                            project.feedback?.grade && 
                            project.feedback.grade >= 75
  
  const easyButtonVisible = project.status === "Graded" && 
                            project.feedback?.grade && 
                            project.feedback.grade < 75

  const handleStopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <Card 
      className={cn(
        "group overflow-hidden transition-all hover:shadow-md",
        isOverdue ? "border-red-200 dark:border-red-900/40" : "",
        viewMode === "grid" ? "h-full flex flex-col" : "w-full",
        className
      )}
      onClick={onClick}
    >
      <div className="flex flex-col h-full cursor-pointer">
        {/* Card Header with Thumbnail */}
        <div className="relative">
          {project.thumbnail && (
            <div className="w-full aspect-video bg-muted relative overflow-hidden">
              <Image
                src={project.thumbnail}
                alt={project.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          )}
          
          {/* Project difficulty badge */}
          <div className="absolute top-2 left-2">
            <Badge 
              variant="secondary"
              className={cn(
                "h-5 px-2 shadow-sm",
                project.difficulty === "Beginner" && "bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600",
                project.difficulty === "Intermediate" && "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600",
                project.difficulty === "Advanced" && "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 hover:text-purple-600"
              )}
            >
              {project.difficulty}
            </Badge>
          </div>

          {/* Status badge */}
          <div className="absolute top-2 right-2">
            <Badge 
              variant="secondary"
              className={cn("h-5 px-2 shadow-sm gap-1", statusConfig.color)}
            >
              <StatusIcon className="h-3 w-3" />
              <span>{project.status}</span>
            </Badge>
          </div>
        </div>

        <CardHeader className="py-3 sm:py-4">
          <div className="space-y-1">
            <h3 className="font-medium text-base sm:text-lg leading-tight text-foreground">
              {project.title}
            </h3>
            {/* Course links */}
            <div className="flex flex-wrap gap-1 items-center text-xs sm:text-sm text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5 inline mr-1 flex-shrink-0" />
              {project.courses.map((course, i) => (
                <span key={course.id}>
                  <Link 
                    href={`/courses/${course.slug}`}
                    className="hover:text-primary hover:underline transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {course.title}
                  </Link>
                  {i < project.courses.length - 1 && ", "}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-3 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {project.description}
          </p>
          
          {/* Time indicators */}
          {(project.status === "In Progress" || project.status === "Not Started") && (
            <div className={cn(
              "mt-2 text-xs flex items-center gap-1.5",
              isOverdue ? "text-red-500" : "text-muted-foreground"
            )}>
              {isOverdue ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Overdue - was due {formattedDueDate}</span>
                </>
              ) : timeRemaining ? (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>Due {timeRemaining}</span>
                </>
              ) : null}
            </div>
          )}
          
          {/* Show grade for graded projects */}
          {project.status === "Graded" && project.feedback?.grade && (
            <div className="mt-2 flex items-center gap-1.5">
              <StarIcon className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{project.feedback.grade}%</span>
              <span className="text-xs text-muted-foreground">
                {project.feedback.grade >= 90 ? "Excellent" :
                 project.feedback.grade >= 80 ? "Great" :
                 project.feedback.grade >= 70 ? "Good" :
                 project.feedback.grade >= 60 ? "Satisfactory" : "Needs Improvement"}
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className={cn("pt-0 sm:pt-1", showChallengeButtons && "flex flex-col gap-2")}>
          {/* Primary action button */}
          <Button 
            variant={project.status === "Not Started" ? "default" : "secondary"} 
            size="sm" 
            className="w-full"
          >
            {project.status === "Not Started" ? "Start Project" :
             project.status === "In Progress" ? "Continue Project" :
             project.status === "Submitted" ? "View Submission" :
             "View Feedback"}
          </Button>
          
          {/* Challenge buttons for completed projects */}
          {showChallengeButtons && (
            <div className="flex gap-2 w-full">
              {easyButtonVisible && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-7 border-amber-200 hover:border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                  onClick={handleStopPropagation}
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Easier Challenge
                </Button>
              )}
              {hardButtonVisible && (
                <Button
                  variant="outline"
                  size="sm" 
                  className="flex-1 text-xs h-7 border-emerald-200 hover:border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  onClick={handleStopPropagation}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Harder Challenge
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </div>
    </Card>
  )
}
