"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Folder,
  Play,
  Clock,
  Users,
  Plus,
  Search,
  Star
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

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

const projectsData: Project[] = [
  {
    id: "1",
    title: "E-commerce Website",
    description: "Building a full-stack e-commerce website with Next.js and Shadcn-UI",
    category: "Web Development",
    difficulty: "Intermediate",
    status: "In Progress",
    language: "JavaScript",
    completionRate: 60,
    lastUpdated: "2024-03-18T12:00:00Z",
    collaborators: 3,
    stars: 12
  },
  {
    id: "2",
    title: "Machine Learning Model",
    description: "Developing a machine learning model for image classification using Python",
    category: "AI/ML",
    difficulty: "Advanced",
    status: "Not Started",
    language: "Python",
    completionRate: 0,
    lastUpdated: "2024-03-15T09:00:00Z",
    collaborators: 1,
    stars: 5
  },
  {
    id: "3",
    title: "Mobile App Design",
    description: "Designing a user interface for a mobile application using Figma",
    category: "Mobile Development",
    difficulty: "Beginner",
    status: "Completed",
    language: "Figma",
    completionRate: 100,
    lastUpdated: "2024-03-10T16:30:00Z",
    collaborators: 2,
    stars: 25
  },
]

export default function ProjectsPage() {
  const [filter, setFilter] = useState({
    category: 'all',
    difficulty: 'all',
  })
  const [search, setSearch] = useState("")

  const categories = [
    "all",
    "Web Development",
    "Mobile Development",
    "AI/ML",
  ]

  const difficulties = [
    "all",
    "Beginner",
    "Intermediate",
    "Advanced",
  ]

  const filteredProjects = projectsData.filter(project => {
    const matchesCategory = filter.category === "all" || project.category === filter.category;
    const matchesDifficulty = filter.difficulty === "all" || project.difficulty === filter.difficulty;
    const matchesSearch = search.toLowerCase().trim() === "" ||
      project.title.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase())

    return matchesSearch && matchesCategory && matchesDifficulty
  })


  const ProjectCard = ({ project }: { project: Project }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Folder className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <CardTitle>{project.title}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-0">
        <div className="flex flex-wrap gap-2">
          {project.category !== "all" && <Badge variant="secondary">{project.category}</Badge>}
          <Badge variant="secondary">{project.difficulty}</Badge>
          <Badge variant="outline">{project.language}</Badge>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="flex items-center gap-1 text-xs">
            <Progress value={project.completionRate} className="h-[0.5rem] w-16 sm:w-20" />
            <span>{project.completionRate}%</span>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Updated {new Date(project.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Button variant="link" size="icon" className="text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{project.collaborators}</span>
          </Button>
          <Button variant="link" size="icon" className="text-muted-foreground">
            <Star className="h-3 w-3" />
            <span>{project.stars}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )


  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Apply your knowledge with hands-on projects
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-[300px]">
            <Search className="absolute h-4 w-4 text-muted-foreground left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-4">
            <Select
              value={filter.category}
              onValueChange={(value) => setFilter((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filter.difficulty}
              onValueChange={(value) => setFilter((prev) => ({ ...prev, difficulty: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  )
}