import { useState } from "react"
import { ChevronDown, ChevronRight, Clock, FileText, GraduationCap, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Project } from "../types"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, isPast } from "date-fns"

interface CourseGroupItem {
  courseId: string
  courseTitle: string
  projects: Project[]
}

interface CourseGroupedViewProps {
  projects: Project[]
  onProjectClick: (project: Project) => void
}

export function CourseGroupedView({
  projects,
  onProjectClick,
}: CourseGroupedViewProps) {
  // Create a map of course groups
  const courseGroups: CourseGroupItem[] = projects.reduce((acc: CourseGroupItem[], project) => {
    // Each project can belong to multiple courses
    project.courses.forEach(course => {
      const existingGroup = acc.find(group => group.courseId === course.id)
      
      if (existingGroup) {
        // Add project to existing group if not already included
        if (!existingGroup.projects.find(p => p.id === project.id)) {
          existingGroup.projects.push(project)
        }
      } else {
        // Create a new course group
        acc.push({
          courseId: course.id,
          courseTitle: course.title,
          projects: [project]
        })
      }
    })
    
    return acc
  }, [])

  // Sort course groups alphabetically by course title
  courseGroups.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle))

  // State to track which course group is expanded (only one at a time)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(
    courseGroups.length > 0 ? courseGroups[0].courseId : null
  );

  // Toggle expanded state for a group
  const toggleGroup = (courseId: string) => {
    setExpandedGroup(prev => prev === courseId ? null : courseId)
  }

  // Get status badge config
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Started":
        return "bg-muted text-muted-foreground"
      case "In Progress":
        return "bg-blue-500/10 text-blue-500"
      case "Submitted":
        return "bg-orange-500/10 text-orange-500"
      case "Graded":
        return "bg-green-500/10 text-green-500"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-500/10 text-green-500"
      case "Intermediate":
        return "bg-blue-500/10 text-blue-500"
      case "Advanced":
        return "bg-purple-500/10 text-purple-500"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (courseGroups.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No projects found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {courseGroups.map(group => (
        <div key={group.courseId} className="border border-border rounded-lg overflow-hidden">
          {/* Course Header - Clickable to expand/collapse */}
          <div 
            className="bg-muted/50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted transition-colors"
            onClick={() => toggleGroup(group.courseId)}
          >
            <h3 className="font-medium flex items-center">
              {expandedGroup === group.courseId ? 
                <ChevronDown className="h-4 w-4 mr-2" /> : 
                <ChevronRight className="h-4 w-4 mr-2" />}
              {group.courseTitle}
              <span className="ml-2 text-xs text-muted-foreground">
                ({group.projects.length} {group.projects.length === 1 ? 'project' : 'projects'})
              </span>
            </h3>
          </div>
          
          {/* Projects List - Collapsible */}
          <div className={cn(
            "transition-all duration-200 grid gap-px bg-border",
            expandedGroup === group.courseId ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}>
            <div className="overflow-hidden">
              {/* List view of projects with separators */}
              <ul className="divide-y divide-border">
                {group.projects.map((project, index) => {
                  // Calculate time info
                  const isOverdue = project.dueDate && 
                    isPast(new Date(project.dueDate)) && 
                    project.status !== "Submitted" && 
                    project.status !== "Graded";
                    
                  const timeRemaining = project.dueDate && !isOverdue
                    ? formatDistanceToNow(new Date(project.dueDate), { addSuffix: true })
                    : null;
                    
                  return (
                    <li 
                      key={project.id} 
                      className="bg-background hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={() => onProjectClick(project)}
                    >
                      <div className="px-4 py-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-grow min-w-0">
                            <h4 className="font-medium text-base mb-1">{project.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                              {project.description}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 items-center">
                              <Badge 
                                variant="secondary"
                                className={cn("h-5 px-2 gap-1", getStatusColor(project.status))}
                              >
                                {project.status}
                              </Badge>
                              
                              <Badge 
                                variant="secondary"
                                className={cn("h-5 px-2", getDifficultyColor(project.difficulty))}
                              >
                                {project.difficulty}
                              </Badge>
                              
                              {project.status === "Graded" && project.feedback?.grade && (
                                <Badge variant="outline" className="h-5 gap-1">
                                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                  <span>{project.feedback.grade}%</span>
                                </Badge>
                              )}
                              
                              {(project.status === "In Progress" || project.status === "Not Started") && project.dueDate && (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "h-5 gap-1", 
                                    isOverdue ? "text-red-500" : "text-muted-foreground"
                                  )}
                                >
                                  <Clock className="h-3 w-3" />
                                  <span>{isOverdue ? "Overdue" : timeRemaining}</span>
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className="shrink-0"
                          >
                            {project.status === "Not Started" ? "Start" :
                             project.status === "In Progress" ? "Continue" :
                             project.status === "Submitted" ? "View" :
                             "Feedback"}
                          </Button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
