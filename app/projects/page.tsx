"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Grid2X2,
  Menu,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  SlidersHorizontal as FiltersIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { CategoryPills } from "@/components/category-pills"
import { Project, ProjectFilter, ProjectViewMode, ProjectSortOption } from "./types"
import { sampleProjects } from "./data"
import { ProjectCard } from "./components/project-card"
import { ProjectDialog } from "./components/project-dialog"
import { CourseGroupedView } from "./components/course-grouped-view"
import { GenerateProjectDialog } from "./components/generate-project-dialog"
import { TRANSITION_DURATION, TRANSITION_TIMING } from "@/lib/constants"

// Project status filters for dropdown
const statusFilters: { id: ProjectFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "submitted", label: "Submitted" },
  { id: "graded", label: "Graded" }
]

// Project categories for the pills (new)
const categoryFilters = [
  { id: "all", label: "All" },
  { id: "programming", label: "Programming" },
  { id: "design", label: "Design" },
  { id: "architecture", label: "Architecture" },
  { id: "seo", label: "SEO" },
  { id: "business", label: "Business" },
  { id: "analytics", label: "Analytics" },
  { id: "marketing", label: "Marketing" },
  { id: "mobile", label: "Mobile Dev" },
]

// Difficulty filters for dropdown
const difficultyFilters = [
  { id: "all", label: "All Levels" },
  { id: "Beginner", label: "Beginner" },
  { id: "Intermediate", label: "Intermediate" },
  { id: "Advanced", label: "Advanced" }
]

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProjectFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [viewMode, setViewMode] = useState<ProjectViewMode>("grid")
  const [sortBy, setSortBy] = useState<ProjectSortOption>("deadline")
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)

  // For category pills scrolling
  const tabsRef = useRef<HTMLDivElement>(null)
  const [showScrollButtons, setShowScrollButtons] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const { user } = useAuth()

  // Handle scroll button clicks
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200
      tabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Filter and sort projects
  const filteredAndSortedProjects = sampleProjects
    .filter(project => {
      // Search filter
      const matchesSearch = search.toLowerCase().trim() === "" ||
        project.title.toLowerCase().includes(search.toLowerCase()) ||
        project.description.toLowerCase().includes(search.toLowerCase()) ||
        project.courses.some(course => course.title.toLowerCase().includes(search.toLowerCase()))

      // Status filter
      const matchesStatusFilter = statusFilter === "all" ||
        (statusFilter === "pending" && (project.status === "Not Started" || project.status === "In Progress")) ||
        (statusFilter === "submitted" && project.status === "Submitted") ||
        (statusFilter === "graded" && project.status === "Graded")

      // Category filter (simulate category matching based on project titles/descriptions)
      const matchesCategoryFilter = categoryFilter === "all" ||
        (categoryFilter === "programming" && (
          project.title.toLowerCase().includes("web") ||
          project.title.toLowerCase().includes("api") ||
          project.description.toLowerCase().includes("javascript") ||
          project.description.toLowerCase().includes("python")
        )) ||
        (categoryFilter === "design" && (
          project.title.toLowerCase().includes("design") ||
          project.title.toLowerCase().includes("ui") ||
          project.description.toLowerCase().includes("mockup") ||
          project.description.toLowerCase().includes("figma")
        )) ||
        (categoryFilter === "architecture" && (
          project.title.toLowerCase().includes("architecture") ||
          project.description.toLowerCase().includes("infrastructure") ||
          project.description.toLowerCase().includes("system design")
        )) ||
        (categoryFilter === "seo" && (
          project.title.toLowerCase().includes("seo") ||
          project.description.toLowerCase().includes("search engine") ||
          project.description.toLowerCase().includes("optimization")
        )) ||
        (categoryFilter === "business" && (
          project.title.toLowerCase().includes("business") ||
          project.description.toLowerCase().includes("startup") ||
          project.description.toLowerCase().includes("entrepreneur")
        )) ||
        (categoryFilter === "analytics" && (
          project.title.toLowerCase().includes("analytics") ||
          project.title.toLowerCase().includes("data") ||
          project.description.toLowerCase().includes("visualization") ||
          project.description.toLowerCase().includes("dashboard")
        )) ||
        (categoryFilter === "marketing" && (
          project.title.toLowerCase().includes("marketing") ||
          project.description.toLowerCase().includes("campaign") ||
          project.description.toLowerCase().includes("content")
        )) ||
        (categoryFilter === "mobile" && (
          project.title.toLowerCase().includes("mobile") ||
          project.title.toLowerCase().includes("app") ||
          project.description.toLowerCase().includes("android") ||
          project.description.toLowerCase().includes("ios")
        ))

      // Difficulty filter
      const matchesDifficulty = difficultyFilter === "all" || project.difficulty === difficultyFilter

      return matchesSearch && matchesStatusFilter && matchesDifficulty && matchesCategoryFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "deadline":
          // Sort by deadline (projects with no deadline come last)
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          } else if (a.dueDate) {
            return -1
          } else if (b.dueDate) {
            return 1
          }
          return 0

        case "title":
          // Sort alphabetically by title
          return a.title.localeCompare(b.title)

        case "recent":
          // Sort by creation date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

        default:
          return 0
      }
    })

  const hasProjects = filteredAndSortedProjects.length > 0

  return (
    <div className="h-full">
      {/* Fixed Header */}
      <div className="sticky top-16 z-10 bg-background border-b">
        <div className="mx-auto px-4 max-w-6xl">
          {/* Controls Bar */}
          <div className="h-14 flex items-center justify-between gap-4">
            {/* Left Side: Filters/Controls */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="h-10 rounded-full px-4 gap-2 flex-shrink-0">
                    <FiltersIcon className="h-4 w-4" />
                    <span className="hidden xs:inline">Filters</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[240px]">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </DropdownMenuLabel>

                  {/* Use Status Filters as the primary Chips/Pills for Projects */}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Difficulty</DropdownMenuLabel>
                  {difficultyFilters.map((f) => (
                    <DropdownMenuItem
                      key={f.id}
                      onClick={() => setDifficultyFilter(f.id)}
                      className={cn(
                        "cursor-pointer",
                        difficultyFilter === f.id && "bg-muted"
                      )}
                    >
                      {f.label}
                      {difficultyFilter === f.id && (
                        <span className="ml-auto">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Categories</DropdownMenuLabel>
                  <div className="grid grid-cols-2 gap-1 p-2">
                    {categoryFilters.map((c) => (
                      <Button
                        key={c.id}
                        variant={categoryFilter === c.id ? "secondary" : "ghost"}
                        size="sm"
                        className="justify-start text-xs h-7 px-2"
                        onClick={() => setCategoryFilter(c.id)}
                      >
                        {c.label}
                        {categoryFilter === c.id && <span className="ml-auto">✓</span>}
                      </Button>
                    ))}
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                  {(["deadline", "title", "recent"] as ProjectSortOption[]).map((option) => (
                    <DropdownMenuItem
                      key={option}
                      onClick={() => setSortBy(option)}
                      className={cn(
                        "cursor-pointer",
                        sortBy === option && "bg-muted"
                      )}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                      {sortBy === option && (
                        <span className="ml-auto">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>View Mode</DropdownMenuLabel>
                  <div className="flex gap-2 p-2 pt-0">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="flex-1"
                    >
                      <Grid2X2 className="h-4 w-4 mr-2" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "course-grouped" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("course-grouped")}
                      className="flex-1"
                    >
                      <Menu className="h-4 w-4 mr-2" />
                      Groups
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 flex justify-center max-w-[620px] mx-auto min-w-0">
              <div className="flex w-full items-center">
                <div className="relative flex-1 flex items-center">
                  <div className="absolute left-4 text-muted-foreground pointer-events-none">
                    <Search className="h-4 w-4" />
                  </div>
                  <Input
                    placeholder="Search projects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 pl-11 pr-4 rounded-l-full bg-background border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
                  />
                </div>
                <Button
                  variant="secondary"
                  className="h-10 px-5 rounded-r-full border-l-0 border border-border bg-muted hover:bg-secondary/80 flex-shrink-0"
                  onClick={() => { }}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Right Side: Primary Action */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowGenerateDialog(true)}
                className="h-10 rounded-full px-4 gap-2 font-medium"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Generate Project</span>
              </Button>
            </div>
          </div>

          {/* Status Pills: Primary navigation for Projects */}
          <div className="pb-3 px-0">
            <CategoryPills
              customCategories={statusFilters.map(sf => ({ name: sf.label, slug: sf.id }))}
              onCategoryChange={(slug) => setStatusFilter(slug as ProjectFilter)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "mx-auto space-y-6 pt-4 pb-12",
        "transition-all",
        "duration-300",
        TRANSITION_TIMING,
        "w-[95%] lg:w-[90%]"
      )}>
        {/* Header with title and create button */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground">
              Apply your learning with hands-on projects
            </p>
          </div>
        </div>

        {/* Project Content */}
        {hasProjects ? (
          <div className="space-y-8">
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
                {filteredAndSortedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => setSelectedProject(project)}
                    className="animate-in fade-in-50 duration-500"
                  />
                ))}
              </div>
            )}

            {/* Course Grouped View */}
            {viewMode === "course-grouped" && (
              <CourseGroupedView
                projects={filteredAndSortedProjects}
                onProjectClick={(project) => setSelectedProject(project)}
              />
            )}

            {/* Project Dialog for viewing details */}
            <ProjectDialog
              project={selectedProject}
              open={!!selectedProject}
              onOpenChange={(open) => !open && setSelectedProject(null)}
            />
          </div>
        ) : (
          // No projects match filters
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No projects found</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              {search
                ? `No projects match "${search}"`
                : categoryFilter !== "all"
                  ? "No projects match the selected category"
                  : "Create your first project or request a new project from your courses"}
            </p>
            <Button onClick={() => setShowGenerateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Generate Project
            </Button>
          </div>
        )}
      </div>

      {/* Generate Project Dialog */}
      <GenerateProjectDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
      />
    </div>
  )
}
