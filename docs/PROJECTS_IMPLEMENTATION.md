# Projects Implementation with shadcn

## Overview

The projects page provides a comprehensive project management interface using shadcn components.

## Key Components Used

- Card
- Button
- Select
- Input
- Badge
- Progress
- DropdownMenu
- Separator
- ScrollArea

## Implementation

```tsx
// app/(dashboard)/projects/page.tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Folder,
  Play,
  Clock,
  GitBranch,
  Star,
  Users,
  Plus,
  Search,
  Tag
} from "lucide-react"
import { ProjectCard } from "./components/project-card"
import { NewProjectDialog } from "./components/new-project-dialog"

interface Project {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  status: 'Not Started' | 'In Progress' | 'Completed'
  language: string
  completionRate: number
  lastUpdated: string
  collaborators: number
  stars: number
}

export default function ProjectsPage() {
  const [filter, setFilter] = useState({
    category: 'all',
    difficulty: 'all'
  })
  const [search, setSearch] = useState("")
  const [showNewProject, setShowNewProject] = useState(false)

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Apply your knowledge with hands-on projects
          </p>
        </div>
        <Button onClick={() => setShowNewProject(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filter.category}
          onValueChange={(value) =>
            setFilter((prev) => ({ ...prev, category: value }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="web">Web Development</SelectItem>
            <SelectItem value="mobile">Mobile Development</SelectItem>
            <SelectItem value="ai">AI/ML</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filter.difficulty}
          onValueChange={(value) =>
            setFilter((prev) => ({ ...prev, difficulty: value }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      <NewProjectDialog
        open={showNewProject}
        onOpenChange={setShowNewProject}
      />
    </div>
  )
}

// app/(dashboard)/projects/components/project-card.tsx
interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Folder className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle>{project.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {project.description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{project.category}</Badge>
          <Badge variant="secondary">{project.difficulty}</Badge>
          <Badge variant="outline">{project.language}</Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span>{project.completionRate}%</span>
          </div>
          <Progress value={project.completionRate} />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              {formatDate(project.lastUpdated)}
            </div>
            <div className="flex items-center">
              <Users className="mr-1 h-4 w-4" />
              {project.collaborators}
            </div>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Star className="mr-1 h-4 w-4" />
            {project.stars}
          </div>
        </div>

        {/* Action */}
        <Button className="w-full">
          <Play className="mr-2 h-4 w-4" />
          {project.status === "Not Started"
            ? "Start Project"
            : project.status === "In Progress"
            ? "Continue Project"
            : "View Project"}
        </Button>
      </CardContent>
    </Card>
  )
}
```

## Features

1. **Project Management**
   - Project creation
   - Status tracking
   - Progress indication
   - Collaboration info

2. **Visual Components**
   - Project cards
   - Progress bars
   - Status badges
   - Category tags

3. **Filtering System**
   - Category filters
   - Difficulty levels
   - Search functionality
   - Multiple criteria

4. **Interactive Elements**
   - Start/Continue buttons
   - Filter dropdowns
   - Search input
   - New project creation

## Usage Example

```tsx
// Using project card independently
export function ProjectsList() {
  return (
    <div className="grid gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onStart={() => startProject(project.id)}
        />
      ))}
    </div>
  )
}
```

## State Management

```tsx
// Project filters hook
export function useProjectFilters() {
  const [filters, setFilters] = useState({
    category: 'all',
    difficulty: 'all',
    search: ''
  })

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesCategory = filters.category === 'all' || 
        project.category === filters.category
      const matchesDifficulty = filters.difficulty === 'all' || 
        project.difficulty === filters.difficulty
      const matchesSearch = !filters.search || 
        project.title.toLowerCase().includes(filters.search.toLowerCase())

      return matchesCategory && matchesDifficulty && matchesSearch
    })
  }, [projects, filters])

  return {
    filters,
    setFilters,
    filteredProjects
  }
}
```

This implementation provides a comprehensive project management interface using shadcn components while maintaining consistent styling and user experience.